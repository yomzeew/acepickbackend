import { Request, Response } from "express"
import { successResponse, errorResponse, handleResponse, randomId } from "../utils/modules"
import prisma from "../config/prisma";
import { Accounts, CommissionScope, EntryCategory, JobMode, JobStatus, PayStatus, TransactionStatus, TransactionType, UserRole, ActivityStatus } from "../utils/enum"
import { sendEmail } from "../services/gmail";
import { jobResponseEmail, jobCreatedEmail, jobDisputeEmail, invoiceGeneratedEmail, invoiceUpdatedEmail, completeJobEmail, approveJobEmail, disputedJobEmail, jobUpdatedEmail, jobCancelledEmail } from "../utils/messages";
import { jobStatusQuerySchema } from "../validation/query";
import { jobCostingSchema, jobCostingUpdateSchema, jobPostSchema, jobUpdateSchema, paymentSchema } from "../validation/body";
import { jobIdParamSchema } from "../validation/param";
import { NotificationService } from "../services/notification";
import { NotificationType } from "../utils/enum";
import { getIO } from '../chat';
import { Emit } from "../utils/events";
import { LedgerService } from "../services/ledgerService";
import { CommissionService } from "../services/CommissionService";
import { onJobStatusUpdate, onJobCreate } from "../hooks/jobHook";

export const testApi = async (req: Request, res: Response) => {
    return successResponse(res, "success", "Your Api is working!")
}

const jobIncludeForRole = (role: string) => {
    if (role === UserRole.PROFESSIONAL) {
        return {
            client: {
                select: { id: true, email: true, phone: true, fcmToken: true, profile: { select: { id: true, firstName: true, lastName: true, avatar: true } } }
            },
            materials: true,
        }
    }
    return {
        professional: {
            select: {
                id: true, email: true, phone: true, fcmToken: true,
                profile: { select: { id: true, firstName: true, lastName: true, avatar: true, professional: { select: { id: true } } } }
            }
        },
        materials: true,
    }
};

export const getJobs = async (req: Request, res: Response) => {
    let { id, role } = req.user;

    const result = jobStatusQuerySchema.safeParse(req.query);

    if (!result.success) {
        return res.status(400).json({ error: "Invalid query", issues: result.error.format() });
    }

    let whereCondition: { [key: string]: any; } = role === UserRole.CLIENT ? { clientId: id } : { professionalId: id };

    if (result.data.status && result.data.status !== "all") {
        whereCondition = { ...whereCondition, status: result.data.status as any }
    }

    try {
        const jobs = await prisma.job.findMany({
            where: whereCondition,
            include: jobIncludeForRole(role),
            orderBy: { createdAt: 'desc' }
        })

        return successResponse(res, "success", jobs)
    } catch (error) {
        return errorResponse(res, "error", error)
    }
}

export const getJobStat = async (req: Request, res: Response) => {
    let { id, role } = req.user;

    try {
        // Placeholder — stats are computed via profile fields updated by jobHook
    } catch (error) {
        return errorResponse(res, "error", error);
    }
}


export const getLatestJob = async (req: Request, res: Response) => {
    let { id, role } = req.user;

    let whereCondition: { [key: string]: any; } = role === UserRole.CLIENT ? { clientId: id } : { professionalId: id };

    try {
        const job = await prisma.job.findFirst({
            where: {
                ...whereCondition,
                status: JobStatus.PENDING as any,
                accepted: false
            },
            orderBy: { createdAt: 'desc' },
            include: { materials: true }
        })

        if (!job) {
            return handleResponse(res, 404, false, 'No job found');
        }

        return successResponse(res, "success", job)
    } catch (error) {
        return errorResponse(res, "error", error)
    }
}


export const getJobById = async (req: Request, res: Response) => {
    let { id } = req.params;

    try {
        const jobs = await prisma.job.findUnique({
            where: { id: Number(id) },
            include: { materials: true }
        })

        return successResponse(res, "success", jobs)
    } catch (error: any) {
        return errorResponse(res, 'error', error.message);
    }
}


export const createJobOrder = async (req: Request, res: Response) => {
    const { id } = req.user;

    const result = jobPostSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            error: "Invalid input",
            issues: result.error.format(),
        });
    }

    const validatedData = result.data;

    const professional = await prisma.user.findUnique({
        where: { id: validatedData.professionalId },
        include: { profile: true }
    })

    if (!professional) {
        return handleResponse(res, 404, false, 'User not found');
    }

    if (professional.role !== UserRole.PROFESSIONAL) {
        return handleResponse(res, 401, false, 'User is not a professional')
    };

    const client = await prisma.user.findUnique({
        where: { id },
        include: { profile: true }
    })

    const job = await prisma.job.create({
        data: {
            title: validatedData.title,
            description: validatedData.description,
            fullAddress: validatedData.address,
            numOfJobs: validatedData.numOfJobs || 1,
            mode: (validatedData.mode || JobMode.PHYSICAL) as any,
            professionalId: validatedData.professionalId,
            clientId: id,
            // Additional fields from frontend
            ...(validatedData.categoryId && { categoryId: validatedData.categoryId }),
            startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
            deadline: validatedData.deadline ? new Date(validatedData.deadline) : null,
            budgetMin: validatedData.budgetMin,
            budgetMax: validatedData.budgetMax,
            priority: validatedData.priority || "NORMAL",
            state: validatedData.state,
            lga: validatedData.lga,
        }
    })

    // Handle skillsRequired if provided
    if (validatedData.skillsRequired && validatedData.skillsRequired.length > 0) {
        // Find skill IDs by names
        const skills = await prisma.skill.findMany({
            where: {
                name: {
                    in: validatedData.skillsRequired
                }
            }
        });

        // Create job-skill relationships
        await (prisma as any).jobSkill.createMany({
            data: skills.map(skill => ({
                jobId: job.id,
                skillId: skill.id
            }))
        });
    }

    if (professional.profile) {
        await prisma.profile.update({
            where: { id: professional.profile.id },
            data: { totalJobsPending: (professional.profile.totalJobsPending || 0) + 1 }
        });
    }

    if (client?.profile) {
        await prisma.profile.update({
            where: { id: client.profile.id },
            data: { totalJobsPending: (client.profile.totalJobsPending || 0) + 1 }
        });
    }

    const jobData = { ...job, professional, client };

    const emailResponse = await sendEmail(
        professional.email,
        jobCreatedEmail(jobData).title,
        jobCreatedEmail(jobData).body,
        professional.profile?.firstName + ' ' + professional.profile?.lastName
    )

    await NotificationService.create({
        userId: professional.id,
        type: NotificationType.JOB,
        title: 'New Job Request',
        message: `You have a new job request: ${job.title}`,
        data: { jobId: job.id },
    });

    let onlineUser = await prisma.onlineUser.findFirst({
        where: { userId: validatedData.professionalId }
    })

    const io = getIO();

    if (onlineUser?.isOnline) {
        io.to(onlineUser.socketId).emit(Emit.JOB_CREATED, { text: 'This a new Job', data: job });
    }

    await prisma.activity.create({
        data: {
            userId: id,
            action: `${client?.profile?.firstName} ${client?.profile?.lastName} has created a new Job #${job.id}`,
            type: 'Job Created',
            status: ActivityStatus.ACT_SUCCESS
        }
    })

    onJobCreate({ clientId: id, professionalId: validatedData.professionalId }).catch(console.error);

    return successResponse(res, "Successful", { jobResponse: job, emailSendId: emailResponse.success });
}

export const updateJob = async (req: Request, res: Response) => {
    try {
        const result = jobUpdateSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                error: "Invalid route parameter",
                issues: result.error.format(),
            });
        }

        const job = await prisma.job.findUnique({
            where: { id: result.data.jobId },
            include: {
                professional: { include: { profile: true } },
                client: { include: { profile: true } }
            }
        });

        if (!job) {
            return handleResponse(res, 404, false, "Job not found");
        }

        if (job.accepted) {
            return handleResponse(res, 404, false, "Job already accepted");
        }

        const updatedJob = await prisma.job.update({
            where: { id: job.id },
            data: result.data as any
        });

        const emailToSend = await jobUpdatedEmail({ ...updatedJob, professional: job.professional, client: job.client });

        await sendEmail(
            job.professional.email,
            emailToSend.title,
            emailToSend.body,
            job.professional.profile?.firstName || 'Professional'
        )

        await NotificationService.create({
            userId: job.professionalId,
            type: NotificationType.JOB,
            title: 'Job Updated',
            message: `Job "${job.title}" has been updated`,
            data: { jobId: job.id },
        });

        let onlineUser = await prisma.onlineUser.findFirst({
            where: { userId: job.professionalId }
        })

        const io = getIO();

        if (onlineUser?.isOnline) {
            io.to(onlineUser.socketId).emit(Emit.JOB_UPDATED, { text: 'Your job has been updated', data: updatedJob });
        }

        return successResponse(res, "Successful", { job: updatedJob });
    } catch (error) {
        return errorResponse(res, 'error', "Error updating job");
    }
}

export const cancelJob = async (req: Request, res: Response) => {
    const { jobId } = req.params;

    try {
        const job = await prisma.job.findUnique({
            where: { id: Number(jobId) },
            include: {
                client: { include: { profile: true } },
                professional: { include: { profile: true } }
            }
        });

        if (!job) {
            return errorResponse(res, 'error', "Job not found");
        }

        await prisma.job.update({
            where: { id: job.id },
            data: { status: JobStatus.CANCELLED as any }
        });

        const emailToSend = await jobCancelledEmail({ ...job });

        await sendEmail(
            job.professional.email,
            emailToSend.title,
            emailToSend.body,
            job.professional.profile?.firstName || 'Professional'
        )

        await NotificationService.create({
            userId: job.professionalId,
            type: NotificationType.JOB,
            title: 'Job Cancelled',
            message: `Job "${job.title}" has been cancelled by the client`,
            data: { jobId: job.id },
        });

        let onlineUser = await prisma.onlineUser.findFirst({
            where: { userId: job.professionalId }
        })

        const io = getIO();

        if (onlineUser?.isOnline) {
            io.to(onlineUser.socketId).emit(Emit.JOB_CANCELLED, { text: 'Your job has been cancelled by client', data: job });
        }

        onJobStatusUpdate({ clientId: job.clientId, professionalId: job.professionalId }).catch(console.error);

        return successResponse(res, 'success', "Job cancelled successfully")

    } catch (error) {
        return errorResponse(res, 'error', "Error cancelling job");
    }
}

export const respondToJob = async (req: Request, res: Response) => {
    const { id, role } = req.user;

    const result = jobIdParamSchema.safeParse(req.params);

    if (!result.success) {
        return res.status(400).json({
            error: "Invalid route parameter",
            issues: result.error.format(),
        });
    }

    const jobId = parseInt(result.data.jobId, 10);

    const { accepted } = req.body;

    try {
        const job = await prisma.job.findUnique({ where: { id: jobId } });

        if (!job) {
            return handleResponse(res, 404, false, 'Job not found')
        }

        if (id !== job.professionalId) {
            return handleResponse(res, 400, false, 'You are not authorized to perform this action')
        }

        const newStatus = accepted ? JobStatus.PENDING : JobStatus.REJECTED;

        await prisma.job.update({
            where: { id: job.id },
            data: { accepted, status: newStatus as any }
        });

        const professional = await prisma.user.findUnique({
            where: { id: job.professionalId },
            include: { profile: true }
        })

        const client = await prisma.user.findUnique({
            where: { id: job.clientId },
            include: { profile: true }
        })

        const jobData = { ...job, client, professional };

        const emailResponse = await sendEmail(
            client!.email,
            jobResponseEmail(jobData).title,
            jobResponseEmail(jobData).body,
            client!.profile?.firstName + ' ' + client!.profile?.lastName
        )

        await NotificationService.create({
            userId: job.clientId,
            type: NotificationType.JOB,
            title: accepted ? 'Job Accepted' : 'Job Rejected',
            message: `Your job has been ${accepted ? 'accepted' : 'rejected'} by ${professional?.profile?.firstName} ${professional?.profile?.lastName}`,
            data: { jobId: job.id, accepted },
        });

        let onlineUser = await prisma.onlineUser.findFirst({
            where: { userId: job.professionalId }
        })

        const io = getIO();

        if (onlineUser?.isOnline) {
            io.to(onlineUser.socketId).emit(Emit.JOB_RESPONSE, { text: `$Your Job has been ${accepted ? 'accepted' : 'rejected'}`, data: job });
        }

        onJobStatusUpdate({ clientId: job.clientId, professionalId: job.professionalId }).catch(console.error);

        return successResponse(res, 'success', { message: 'Job respsonse updated', emailSendstatus: Boolean(emailResponse.messageId) })
    } catch (error) {
        return errorResponse(res, 'error', error)
    }
}


export const generateInvoice = async (req: Request, res: Response) => {
    const result = jobCostingSchema.safeParse(req.body);

    const { id, role } = req.user;

    if (!result.success) {
        return res.status(400).json({
            error: "Invalid input",
            issues: result.error.format(),
        });
    }

    const { jobId, durationUnit, durationValue, workmanship, materials } = result.data;

    try {
        const job = await prisma.job.findUnique({
            where: { id: jobId },
            include: {
                client: { include: { profile: true } },
                professional: { include: { profile: true } }
            }
        });

        if (!job) {
            return handleResponse(res, 404, false, 'Job not found');
        }

        if (id !== job.professionalId) {
            return handleResponse(res, 400, false, 'You are not authorized to perform this action')
        }

        if (job.workmanship) {
            return handleResponse(res, 400, false, 'Invoice already generated');
        }

        if (materials) {
            const materialsCost = materials.reduce((acc: number, mat: any) => acc + mat.price * mat.quantity, 0);

            await prisma.job.update({
                where: { id: job.id },
                data: { durationUnit, durationValue, workmanship, isMaterial: true, materialsCost }
            });

            await prisma.material.createMany({
                data: materials.map((mat: any) => ({
                    ...mat,
                    subTotal: mat.price * mat.quantity,
                    jobId,
                }))
            });

            const emailTosend = invoiceGeneratedEmail({ ...job });

            const emailResponse = await sendEmail(
                job.client.email,
                emailTosend.title,
                emailTosend.body,
                job.client.profile?.firstName + ' ' + job.client.profile?.lastName
            )

            await NotificationService.create({
                userId: job.clientId,
                type: NotificationType.JOB,
                title: 'Invoice Generated',
                message: `An invoice has been generated for your job: ${job.title}`,
                data: { jobId: job.id },
            });

            let onlineUser = await prisma.onlineUser.findFirst({ where: { userId: job.clientId } })

            const io = getIO();

            if (onlineUser?.isOnline) {
                io.to(onlineUser.socketId).emit(Emit.INVOICE_GENERATED, { text: `An invoice has been generated`, data: { job, materials } });
            }

            return successResponse(res, 'success', { message: 'Invoice generated' })
        }

        await prisma.job.update({
            where: { id: job.id },
            data: { durationUnit, durationValue, workmanship }
        });

        return successResponse(res, 'success', { message: 'Job updated' })
    } catch (err: any) {
        return errorResponse(res, 'error', err.message)
    }
}

export const updateInvoice = async (req: Request, res: Response) => {
    const { jobId } = req.params;

    const result = jobCostingUpdateSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            error: "Invalid input",
            issues: result.error.format(),
        });
    }

    const { durationUnit, durationValue, workmanship, materials } = result.data;

    const job = await prisma.job.findUnique({
        where: { id: Number(jobId) },
        include: {
            client: { include: { profile: true } },
            professional: { include: { profile: true } }
        }
    });

    if (!job) {
        return handleResponse(res, 404, false, 'Job not found')
    }

    if (job.payStatus === PayStatus.PAID) {
        return handleResponse(res, 404, false, 'Job has already been paid')
    }

    await prisma.job.update({
        where: { id: job.id },
        data: { durationUnit, durationValue, workmanship }
    });

    if (materials && materials.length > 0) {
        const newMaterials = materials.filter((material: any) => !material.id);

        if (newMaterials.length > 0) {
            await prisma.material.createMany({
                data: newMaterials.map((material: any) => ({
                    ...material,
                    subTotal: material.price * material.quantity,
                    jobId: Number(jobId),
                }))
            });
        }

        const updatePromises = [];
        for (const mat of materials) {
            if (mat.id) {
                updatePromises.push(
                    prisma.material.update({
                        where: { id: mat.id },
                        data: {
                            ...mat,
                            subTotal: mat.price * mat.quantity,
                            jobId: Number(jobId),
                        }
                    })
                );
            }
        }
        await Promise.all(updatePromises);

        const allMaterials = await prisma.material.findMany({ where: { jobId: Number(jobId) } });

        const materialsCost = allMaterials.reduce((acc: number, mat: any) => acc + Number(mat.price) * Number(mat.quantity), 0);

        await prisma.job.update({
            where: { id: job.id },
            data: { isMaterial: true, materialsCost }
        });
    }

    const updatedJob = await prisma.job.findUnique({
        where: { id: job.id },
        include: { materials: true, client: { include: { profile: true } }, professional: { include: { profile: true } } }
    });

    const emailTosend = invoiceUpdatedEmail(updatedJob);

    await sendEmail(
        job.client.email,
        emailTosend.title,
        emailTosend.body,
        (job.client.profile?.firstName || '') + ' ' + (job.client.profile?.lastName || '') || 'User'
    )

    await NotificationService.create({
        userId: job.clientId,
        type: NotificationType.JOB,
        title: 'Invoice Updated',
        message: `An invoice has been updated for your job: ${job.title}`,
        data: { jobId: job.id },
    });

    let onlineUser = await prisma.onlineUser.findFirst({ where: { userId: job.clientId } })

    const io = getIO();

    if (onlineUser?.isOnline) {
        io.to(onlineUser.socketId).emit(Emit.INVOICE_UPDATED, { text: `An invoice has been updated`, data: { job: updatedJob } });
    }

    return successResponse(res, 'success', { message: 'Job updated successfully', job: updatedJob });
}

export const viewInvoice = async (req: Request, res: Response) => {
    const { id } = req.user;
    const { jobId } = req.params;

    try {
        const invoice = await prisma.job.findUnique({
            where: { id: Number(jobId) },
            select: {
                id: true, title: true, description: true, status: true, workmanship: true, materialsCost: true, createdAt: true, updatedAt: true,
                materials: true,
            }
        })

        return successResponse(res, 'success', invoice);
    } catch (error: any) {
        return errorResponse(res, 'error', error.message);
    }
}



export const completeJob = async (req: Request, res: Response) => {
    const { jobId } = req.params;

    try {
        const job = await prisma.job.findFirst({
            where: { id: Number(jobId), status: JobStatus.ONGOING as any },
            include: {
                professional: { include: { profile: true } },
                client: { include: { profile: true } }
            }
        })

        if (!job) {
            return handleResponse(res, 404, false, 'Job does not exist / Job already completed');
        }

        if (job.status !== JobStatus.ONGOING) {
            return handleResponse(res, 400, false, `You cannot complete a/an ${job.status} job`)
        }

        if (job.professionalId !== req.user.id) {
            return handleResponse(res, 403, false, 'You are not authorized to complete this job');
        }

        await prisma.job.update({ where: { id: job.id }, data: { status: JobStatus.COMPLETED as any } });

        if (job.professional.profile) {
            await prisma.profile.update({
                where: { id: job.professional.profile.id },
                data: { totalJobsCompleted: (job.professional.profile.totalJobsCompleted || 0) + 1 }
            });
        }

        if (job.client.profile) {
            await prisma.profile.update({
                where: { id: job.client.profile.id },
                data: { totalJobsCompleted: (job.client.profile.totalJobsCompleted || 0) + 1 }
            });
        }

        const emailTosend = completeJobEmail({ ...job });

        const emailResponse = await sendEmail(
            job.client.email,
            emailTosend.title,
            emailTosend.body,
            job.client.profile?.firstName + ' ' + job.client.profile?.lastName
        )

        await NotificationService.create({
            userId: job.clientId,
            type: NotificationType.JOB,
            title: 'Job Completed',
            message: `Your job "${job.title}" has been completed by ${job.professional.profile?.firstName} ${job.professional.profile?.lastName}`,
            data: { jobId: job.id },
        });

        let onlineUser = await prisma.onlineUser.findFirst({ where: { userId: job.clientId } })

        const io = getIO();

        if (onlineUser?.isOnline) {
            io.to(onlineUser.socketId).emit(Emit.JOB_COMPLETED, { text: `Your job has completed`, data: { job } });
        }

        await prisma.activity.create({
            data: {
                userId: job.professional.id,
                action: `${job.professional.profile?.firstName} ${job.professional.profile?.lastName} has completed Job #${job.id}`,
                type: 'Job Completion',
                status: ActivityStatus.ACT_SUCCESS
            }
        })

        onJobStatusUpdate({ clientId: job.clientId, professionalId: job.professionalId }).catch(console.error);

        return successResponse(res, 'success', { message: 'Job completed sucessfully', emailSendStatus: emailResponse.success })
    } catch (error: any) {
        return errorResponse(res, 'error', error.message)
    }
}


export const approveJob = async (req: Request, res: Response) => {
    const { jobId } = req.params;

    try {
        const job = await prisma.job.findUnique({
            where: { id: Number(jobId) },
            include: {
                professional: { include: { profile: true, wallet: true } },
                client: { include: { profile: true } }
            }
        })

        if (!job) {
            return handleResponse(res, 404, false, 'Job does not exist');
        }

        if (job.status !== JobStatus.COMPLETED) {
            return handleResponse(res, 404, false, `You cannot approve a/an ${job.status} job`)
        }

        await prisma.job.update({
            where: { id: job.id },
            data: { status: JobStatus.APPROVED as any, approved: true }
        });

        if (job.professional.profile) {
            await prisma.profile.update({
                where: { id: job.professional.profile.id },
                data: { totalJobsApproved: (job.professional.profile.totalJobsApproved || 0) + 1 }
            });
        }

        if (job.client.profile) {
            await prisma.profile.update({
                where: { id: job.client.profile.id },
                data: { totalJobsApproved: (job.client.profile.totalJobsApproved || 0) + 1 }
            });
        }

        if (job.professional.wallet) {
            let amount = Number(job.workmanship) + Number(job.materialsCost);

            const commission = await CommissionService.calculateCommission(Number(job.workmanship), CommissionScope.JOB);

            amount = amount - commission;

            let prevBal = Number(job.professional.wallet.currentBalance) || 0;
            let newBal = prevBal + amount;

            await prisma.wallet.update({
                where: { id: job.professional.wallet.id },
                data: { previousBalance: prevBal, currentBalance: newBal }
            });

            const transaction = await prisma.transaction.create({
                data: {
                    userId: job.professional.id,
                    amount: amount,
                    reference: randomId(12),
                    status: TransactionStatus.PENDING as any,
                    currency: 'NGN',
                    timestamp: new Date(),
                    description: 'wallet deposit',
                    jobId: job.id,
                    productTransactionId: null,
                    type: TransactionType.CREDIT as any,
                }
            })

            await LedgerService.createEntry([
                {
                    transactionId: transaction.id,
                    userId: transaction.userId,
                    amount: Number(transaction.amount) + commission,
                    type: TransactionType.DEBIT,
                    account: Accounts.PLATFORM_ESCROW,
                    category: EntryCategory.JOB
                },
                {
                    transactionId: transaction.id,
                    userId: transaction.userId,
                    amount: Number(transaction.amount),
                    type: TransactionType.CREDIT,
                    account: Accounts.PROFESSIONAL_WALLET,
                    category: EntryCategory.JOB
                },
                {
                    transactionId: transaction.id,
                    userId: null,
                    amount: commission,
                    type: TransactionType.CREDIT,
                    account: Accounts.PLATFORM_REVENUE,
                    category: EntryCategory.JOB
                }
            ])
        }

        const emailTosend = approveJobEmail({ ...job });

        await sendEmail(
            job.professional.email,
            emailTosend.title,
            emailTosend.body,
            job.professional.profile?.firstName + ' ' + job.professional.profile?.lastName
        )

        await NotificationService.create({
            userId: job.professionalId,
            type: NotificationType.JOB,
            title: 'Job Approved',
            message: `Your job "${job.title}" has been approved by ${job.client.profile?.firstName} ${job.client.profile?.lastName}`,
            data: { jobId: job.id },
        });

        let onlineUser = await prisma.onlineUser.findFirst({ where: { userId: job.professionalId } })

        const io = getIO();

        if (onlineUser?.isOnline) {
            io.to(onlineUser.socketId).emit(Emit.JOB_APPROVED, { text: `Your job has approved`, data: { job } });
        }

        await prisma.activity.create({
            data: {
                userId: job.client.id,
                action: `${job.client.profile?.firstName} ${job.client.profile?.lastName} has approved Job #${job.id}`,
                type: 'Job Approval',
                status: ActivityStatus.ACT_SUCCESS
            }
        })

        onJobStatusUpdate({ clientId: job.clientId, professionalId: job.professionalId }).catch(console.error);

        return successResponse(res, 'success', { message: 'Job approved sucessfully' })
    } catch (error: any) {
        return errorResponse(res, 'error', error.message)
    }
}

export const disputeJob = async (req: Request, res: Response) => {
    const jobId = req.params.jobId;

    const { reason, description } = req.body;

    try {
        const job = await prisma.job.findFirst({
            where: { id: Number(jobId), status: JobStatus.COMPLETED as any },
            include: {
                professional: { include: { profile: true } },
                client: { include: { profile: true } }
            }
        })

        if (!job) {
            return handleResponse(res, 404, false, 'Job does not exist');
        }

        if (job.status !== JobStatus.COMPLETED) {
            return handleResponse(res, 404, false, `You cannot dispute a/an ${job.status} job`)
        }

        await prisma.job.update({ where: { id: job.id }, data: { status: JobStatus.DISPUTED as any } });

        if (job.professional.profile) {
            await prisma.profile.update({
                where: { id: job.professional.profile.id },
                data: { totalDisputes: (job.professional.profile.totalDisputes || 0) + 1 }
            });
        }

        if (job.client.profile) {
            await prisma.profile.update({
                where: { id: job.client.profile.id },
                data: { totalDisputes: (job.client.profile.totalDisputes || 0) + 1 }
            });
        }

        const dispute = await prisma.dispute.create({
            data: {
                reason,
                description,
                jobId: Number(jobId),
                reporterId: job.professionalId,
                partnerId: job.clientId,
            }
        })

        const emailTosend = disputedJobEmail({ ...job }, dispute);

        const emailResponse = await sendEmail(
            job.professional.email,
            emailTosend.title,
            emailTosend.body,
            job.professional.profile?.firstName + ' ' + job.professional.profile?.lastName
        )

        await NotificationService.create({
            userId: job.professionalId,
            type: NotificationType.JOB,
            title: 'Job Disputed',
            message: `Your job "${job.title}" has been disputed by ${job.client.profile?.firstName} ${job.client.profile?.lastName}`,
            data: { jobId: job.id },
        });

        let onlineUser = await prisma.onlineUser.findFirst({ where: { userId: job.professionalId } })

        const io = getIO();

        if (onlineUser?.isOnline) {
            io.to(onlineUser.socketId).emit(Emit.JOB_DISPUTED, { text: `Your job has been disputed`, data: { job } });
        }

        await prisma.activity.create({
            data: {
                userId: job.client.id,
                action: `${job.client.profile?.firstName} ${job.client.profile?.lastName} has created a dispute on job #${job.id}`,
                type: 'Dispute',
                status: ActivityStatus.ACT_SUCCESS
            }
        })

        onJobStatusUpdate({ clientId: job.clientId, professionalId: job.professionalId }).catch(console.error);

        return successResponse(res, 'success', { dispute, emailSendStatus: emailResponse.success })
    } catch (error: any) {
        return errorResponse(res, 'error', error.message)
    }
}


export const resolveDispute = async (req: Request, res: Response) => {
    const { jobId } = req.params;
    const { resolution, reason } = req.body; // resolution: 'release' | 'refund'

    if (!resolution || !['release', 'refund'].includes(resolution)) {
        return handleResponse(res, 400, false, "Resolution must be 'release' or 'refund'");
    }

    try {
        const job = await prisma.job.findFirst({
            where: { id: Number(jobId), status: JobStatus.DISPUTED as any },
            include: {
                professional: { include: { profile: true, wallet: true } },
                client: { include: { profile: true, wallet: true } },
                disputes: { orderBy: { createdAt: 'desc' }, take: 1 },
            }
        });

        if (!job) {
            return handleResponse(res, 404, false, 'Disputed job not found');
        }

        const dispute = job.disputes[0];
        if (!dispute) {
            return handleResponse(res, 404, false, 'No dispute found for this job');
        }

        const totalAmount = Number(job.workmanship ?? 0) + Number(job.materialsCost ?? 0);

        if (resolution === 'release') {
            // Release funds to professional (same as approveJob flow)
            const commission = await CommissionService.calculateCommission(Number(job.workmanship ?? 0), CommissionScope.JOB);
            const netAmount = totalAmount - commission;

            if (job.professional.wallet) {
                const prevBal = Number(job.professional.wallet.currentBalance);
                const newBal = prevBal + netAmount;

                await prisma.wallet.update({
                    where: { id: job.professional.wallet.id },
                    data: { previousBalance: prevBal, currentBalance: newBal }
                });

                const tx = await prisma.transaction.create({
                    data: {
                        amount: netAmount,
                        type: TransactionType.CREDIT,
                        status: TransactionStatus.SUCCESS,
                        currency: 'NGN',
                        description: 'wallet deposit',
                        reference: `DSP-REL-${randomId(12)}`,
                        jobId: job.id,
                        userId: job.professionalId,
                    } as any
                });

                const ledgerEntries: any[] = [
                    { transactionId: tx.id, userId: job.professionalId, amount: totalAmount, type: TransactionType.DEBIT, account: Accounts.PLATFORM_ESCROW, category: EntryCategory.JOB },
                    { transactionId: tx.id, userId: job.professionalId, amount: netAmount, type: TransactionType.CREDIT, account: Accounts.PROFESSIONAL_WALLET, category: EntryCategory.JOB },
                ];
                if (commission > 0) {
                    ledgerEntries.push({ transactionId: tx.id, userId: null, amount: commission, type: TransactionType.CREDIT, account: Accounts.PLATFORM_REVENUE, category: EntryCategory.JOB });
                }
                await LedgerService.createEntry(ledgerEntries);
            }

            await prisma.job.update({
                where: { id: job.id },
                data: { status: JobStatus.APPROVED as any, approved: true, payStatus: PayStatus.RELEASED as any }
            });

        } else {
            // Refund to client wallet
            if (job.client.wallet) {
                const prevBal = Number(job.client.wallet.currentBalance);
                const newBal = prevBal + totalAmount;

                await prisma.wallet.update({
                    where: { id: job.client.wallet.id },
                    data: { previousBalance: prevBal, currentBalance: newBal }
                });

                const tx = await prisma.transaction.create({
                    data: {
                        amount: totalAmount,
                        type: TransactionType.CREDIT,
                        status: TransactionStatus.SUCCESS,
                        currency: 'NGN',
                        description: 'dispute refund',
                        reference: `DSP-REF-${randomId(12)}`,
                        jobId: job.id,
                        userId: job.clientId,
                    } as any
                });

                await LedgerService.createEntry([
                    { transactionId: tx.id, userId: job.clientId, amount: totalAmount, type: TransactionType.DEBIT, account: Accounts.PLATFORM_ESCROW, category: EntryCategory.JOB },
                    { transactionId: tx.id, userId: job.clientId, amount: totalAmount, type: TransactionType.CREDIT, account: Accounts.USER_WALLET, category: EntryCategory.JOB },
                ]);
            }

            await prisma.job.update({
                where: { id: job.id },
                data: { status: JobStatus.CANCELLED as any, payStatus: PayStatus.REFUNDED as any }
            });
        }

        // Update the dispute record
        await prisma.dispute.update({
            where: { id: dispute.id },
            data: { status: 'resolved', resolution: reason || resolution } as any
        });

        // Notify both parties
        const io = getIO();

        const proOnline = await prisma.onlineUser.findFirst({ where: { userId: job.professionalId } });
        if (proOnline?.isOnline) {
            io.to(proOnline.socketId).emit(Emit.DISPUTE_RESOLVED, {
                text: `Dispute on "${job.title}" resolved: ${resolution}`,
                data: { job, resolution }
            });
        }

        const clientOnline = await prisma.onlineUser.findFirst({ where: { userId: job.clientId } });
        if (clientOnline?.isOnline) {
            io.to(clientOnline.socketId).emit(Emit.DISPUTE_RESOLVED, {
                text: `Dispute on "${job.title}" resolved: ${resolution}`,
                data: { job, resolution }
            });
        }

        await NotificationService.create({
            userId: job.professionalId,
            type: NotificationType.JOB,
            title: 'Dispute Resolved',
            message: `The dispute on "${job.title}" has been resolved (${resolution}).`,
            data: { jobId: job.id, resolution },
        });

        await NotificationService.create({
            userId: job.clientId,
            type: NotificationType.JOB,
            title: 'Dispute Resolved',
            message: `The dispute on "${job.title}" has been resolved (${resolution}).`,
            data: { jobId: job.id, resolution },
        });

        await prisma.activity.create({
            data: {
                userId: req.user.id,
                action: `Dispute on Job #${job.id} resolved: ${resolution}`,
                type: 'Dispute Resolution',
                status: ActivityStatus.ACT_SUCCESS
            }
        });

        return successResponse(res, 'success', { message: `Dispute resolved: ${resolution}` });
    } catch (error: any) {
        return errorResponse(res, 'error', error.message);
    }
}