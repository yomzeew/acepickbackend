import prisma from '../config/prisma';
import { JobStatus } from '../utils/enum';

/**
 * Call this after a job status update to refresh client & professional profile stats.
 */
export const onJobStatusUpdate = async (job: { clientId: string; professionalId: string }) => {
    try {
        // Update client profile
        const clientProfile = await prisma.profile.findFirst({ where: { userId: job.clientId } });

        if (clientProfile) {
            await prisma.profile.update({
                where: { id: clientProfile.id },
                data: {
                    totalJobs: await prisma.job.count({ where: { clientId: job.clientId } }),
                    totalJobsPending: await prisma.job.count({ where: { clientId: job.clientId, status: JobStatus.PENDING as any } }),
                    totalJobsOngoing: await prisma.job.count({ where: { clientId: job.clientId, status: JobStatus.ONGOING as any } }),
                    totalJobsDeclined: await prisma.job.count({ where: { clientId: job.clientId, status: JobStatus.REJECTED as any } }),
                    totalJobsCompleted: await prisma.job.count({ where: { clientId: job.clientId, status: JobStatus.COMPLETED as any } }),
                    totalJobsApproved: await prisma.job.count({ where: { clientId: job.clientId, status: JobStatus.APPROVED as any } }),
                    totalJobsCanceled: await prisma.job.count({ where: { clientId: job.clientId, status: JobStatus.CANCELLED as any } }),
                    totalDisputes: await prisma.job.count({ where: { clientId: job.clientId, status: JobStatus.DISPUTED as any } }),
                }
            });
        }

        // Update professional profile
        const professionalProfile = await prisma.profile.findFirst({ where: { userId: job.professionalId } });
        const professional = await prisma.professional.findFirst({ where: { profile: { userId: job.professionalId } } });

        if (professionalProfile) {
            await prisma.profile.update({
                where: { id: professionalProfile.id },
                data: {
                    totalJobs: await prisma.job.count({ where: { professionalId: job.professionalId } }),
                    totalJobsPending: await prisma.job.count({ where: { professionalId: job.professionalId, status: JobStatus.PENDING as any } }),
                    totalJobsOngoing: await prisma.job.count({ where: { professionalId: job.professionalId, status: JobStatus.ONGOING as any } }),
                    totalJobsDeclined: await prisma.job.count({ where: { professionalId: job.professionalId, status: JobStatus.REJECTED as any } }),
                    totalJobsCompleted: await prisma.job.count({ where: { professionalId: job.professionalId, status: JobStatus.COMPLETED as any } }),
                    totalJobsApproved: await prisma.job.count({ where: { professionalId: job.professionalId, status: JobStatus.APPROVED as any } }),
                    totalJobsCanceled: await prisma.job.count({ where: { professionalId: job.professionalId, status: JobStatus.CANCELLED as any } }),
                    totalDisputes: await prisma.job.count({ where: { professionalId: job.professionalId, status: JobStatus.DISPUTED as any } }),
                }
            });
        }

        if (professional) {
            const approvedSum = await prisma.job.aggregate({ where: { professionalId: job.professionalId, status: JobStatus.APPROVED as any }, _sum: { workmanship: true } });
            const completedSum = await prisma.job.aggregate({ where: { professionalId: job.professionalId, status: JobStatus.COMPLETED as any }, _sum: { workmanship: true } });
            const pendingSum = await prisma.job.aggregate({ where: { professionalId: job.professionalId, status: JobStatus.PENDING as any }, _sum: { workmanship: true } });
            const declinedSum = await prisma.job.aggregate({ where: { professionalId: job.professionalId, status: JobStatus.REJECTED as any }, _sum: { workmanship: true } });

            await prisma.professional.update({
                where: { id: professional.id },
                data: {
                    totalEarning: Number(approvedSum._sum.workmanship ?? 0),
                    completedAmount: Number(completedSum._sum.workmanship ?? 0),
                    pendingAmount: Number(pendingSum._sum.workmanship ?? 0),
                    rejectedAmount: Number(declinedSum._sum.workmanship ?? 0),
                }
            });
        }
    } catch (error) {
        console.log('jobHook error:', error);
    }
}

/**
 * Call this after a job creation to refresh client & professional profile stats.
 */
export const onJobCreate = async (job: { clientId: string; professionalId: string }) => {
    try {
        const clientProfile = await prisma.profile.findFirst({ where: { userId: job.clientId } });

        if (clientProfile) {
            await prisma.profile.update({
                where: { id: clientProfile.id },
                data: {
                    totalJobs: await prisma.job.count({ where: { clientId: job.clientId } }),
                    totalJobsPending: await prisma.job.count({ where: { clientId: job.clientId, status: JobStatus.PENDING as any } }),
                }
            });
        }

        const professionalProfile = await prisma.profile.findFirst({ where: { userId: job.professionalId } });
        const professional = await prisma.professional.findFirst({ where: { profile: { userId: job.professionalId } } });

        if (professionalProfile) {
            await prisma.profile.update({
                where: { id: professionalProfile.id },
                data: {
                    totalJobs: await prisma.job.count({ where: { professionalId: job.professionalId } }),
                    totalJobsPending: await prisma.job.count({ where: { professionalId: job.professionalId, status: JobStatus.PENDING as any } }),
                }
            });
        }

        if (professional) {
            const pendingSum = await prisma.job.aggregate({ where: { professionalId: job.professionalId, status: JobStatus.PENDING as any }, _sum: { workmanship: true } });

            await prisma.professional.update({
                where: { id: professional.id },
                data: {
                    pendingAmount: Number(pendingSum._sum.workmanship ?? 0),
                }
            });
        }
    } catch (error) {
        console.log('jobHook error:', error);
    }
}