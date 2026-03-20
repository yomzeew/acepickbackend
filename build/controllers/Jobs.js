"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveDispute = exports.disputeJob = exports.approveJob = exports.completeJob = exports.viewInvoice = exports.updateInvoice = exports.generateInvoice = exports.respondToJob = exports.cancelJob = exports.updateJob = exports.createJobOrder = exports.getJobById = exports.getLatestJob = exports.getJobStat = exports.getJobs = exports.testApi = void 0;
const modules_1 = require("../utils/modules");
const prisma_1 = __importDefault(require("../config/prisma"));
const enum_1 = require("../utils/enum");
const gmail_1 = require("../services/gmail");
const messages_1 = require("../utils/messages");
const query_1 = require("../validation/query");
const body_1 = require("../validation/body");
const param_1 = require("../validation/param");
const notification_1 = require("../services/notification");
const enum_2 = require("../utils/enum");
const chat_1 = require("../chat");
const events_1 = require("../utils/events");
const ledgerService_1 = require("../services/ledgerService");
const CommissionService_1 = require("../services/CommissionService");
const jobHook_1 = require("../hooks/jobHook");
const testApi = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    return (0, modules_1.successResponse)(res, "success", "Your Api is working!");
});
exports.testApi = testApi;
const jobIncludeForRole = (role) => {
    if (role === enum_1.UserRole.PROFESSIONAL) {
        return {
            client: {
                select: { id: true, email: true, phone: true, fcmToken: true, profile: { select: { id: true, firstName: true, lastName: true, avatar: true } } }
            },
            materials: true,
        };
    }
    return {
        professional: {
            select: {
                id: true, email: true, phone: true, fcmToken: true,
                profile: { select: { id: true, firstName: true, lastName: true, avatar: true, professional: { select: { id: true } } } }
            }
        },
        materials: true,
    };
};
const getJobs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { id, role } = req.user;
    const result = query_1.jobStatusQuerySchema.safeParse(req.query);
    if (!result.success) {
        return res.status(400).json({ error: "Invalid query", issues: result.error.format() });
    }
    let whereCondition = role === enum_1.UserRole.CLIENT ? { clientId: id } : { professionalId: id };
    if (result.data.status && result.data.status !== "all") {
        whereCondition = Object.assign(Object.assign({}, whereCondition), { status: result.data.status });
    }
    try {
        const jobs = yield prisma_1.default.job.findMany({
            where: whereCondition,
            include: jobIncludeForRole(role),
            orderBy: { createdAt: 'desc' }
        });
        return (0, modules_1.successResponse)(res, "success", jobs);
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, "error", error);
    }
});
exports.getJobs = getJobs;
const getJobStat = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { id, role } = req.user;
    try {
        // Placeholder — stats are computed via profile fields updated by jobHook
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, "error", error);
    }
});
exports.getJobStat = getJobStat;
const getLatestJob = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { id, role } = req.user;
    let whereCondition = role === enum_1.UserRole.CLIENT ? { clientId: id } : { professionalId: id };
    try {
        const job = yield prisma_1.default.job.findFirst({
            where: Object.assign(Object.assign({}, whereCondition), { status: enum_1.JobStatus.PENDING, accepted: false }),
            orderBy: { createdAt: 'desc' },
            include: { materials: true }
        });
        if (!job) {
            return (0, modules_1.handleResponse)(res, 404, false, 'No job found');
        }
        return (0, modules_1.successResponse)(res, "success", job);
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, "error", error);
    }
});
exports.getLatestJob = getLatestJob;
const getJobById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { id } = req.params;
    try {
        const jobs = yield prisma_1.default.job.findUnique({
            where: { id: Number(id) },
            include: { materials: true }
        });
        return (0, modules_1.successResponse)(res, "success", jobs);
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', error.message);
    }
});
exports.getJobById = getJobById;
const createJobOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const { id } = req.user;
    const result = body_1.jobPostSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({
            error: "Invalid input",
            issues: result.error.format(),
        });
    }
    const validatedData = result.data;
    const professional = yield prisma_1.default.user.findUnique({
        where: { id: validatedData.professionalId },
        include: { profile: true }
    });
    if (!professional) {
        return (0, modules_1.handleResponse)(res, 404, false, 'User not found');
    }
    if (professional.role !== enum_1.UserRole.PROFESSIONAL) {
        return (0, modules_1.handleResponse)(res, 401, false, 'User is not a professional');
    }
    ;
    const client = yield prisma_1.default.user.findUnique({
        where: { id },
        include: { profile: true }
    });
    const job = yield prisma_1.default.job.create({
        data: Object.assign(Object.assign({ title: validatedData.title, description: validatedData.description, fullAddress: validatedData.address, numOfJobs: validatedData.numOfJobs || 1, mode: (validatedData.mode || enum_1.JobMode.PHYSICAL), professionalId: validatedData.professionalId, clientId: id }, (validatedData.categoryId && { categoryId: validatedData.categoryId })), { startDate: validatedData.startDate ? new Date(validatedData.startDate) : null, deadline: validatedData.deadline ? new Date(validatedData.deadline) : null, budgetMin: validatedData.budgetMin, budgetMax: validatedData.budgetMax, priority: validatedData.priority || "NORMAL", state: validatedData.state, lga: validatedData.lga })
    });
    // Handle skillsRequired if provided
    if (validatedData.skillsRequired && validatedData.skillsRequired.length > 0) {
        // Find skill IDs by names
        const skills = yield prisma_1.default.skill.findMany({
            where: {
                name: {
                    in: validatedData.skillsRequired
                }
            }
        });
        // Create job-skill relationships
        yield prisma_1.default.jobSkill.createMany({
            data: skills.map(skill => ({
                jobId: job.id,
                skillId: skill.id
            }))
        });
    }
    if (professional.profile) {
        yield prisma_1.default.profile.update({
            where: { id: professional.profile.id },
            data: { totalJobsPending: (professional.profile.totalJobsPending || 0) + 1 }
        });
    }
    if (client === null || client === void 0 ? void 0 : client.profile) {
        yield prisma_1.default.profile.update({
            where: { id: client.profile.id },
            data: { totalJobsPending: (client.profile.totalJobsPending || 0) + 1 }
        });
    }
    const jobData = Object.assign(Object.assign({}, job), { professional, client });
    const emailResponse = yield (0, gmail_1.sendEmail)(professional.email, (0, messages_1.jobCreatedEmail)(jobData).title, (0, messages_1.jobCreatedEmail)(jobData).body, ((_a = professional.profile) === null || _a === void 0 ? void 0 : _a.firstName) + ' ' + ((_b = professional.profile) === null || _b === void 0 ? void 0 : _b.lastName));
    yield notification_1.NotificationService.create({
        userId: professional.id,
        type: enum_2.NotificationType.JOB,
        title: 'New Job Request',
        message: `You have a new job request: ${job.title}`,
        data: { jobId: job.id },
    });
    let onlineUser = yield prisma_1.default.onlineUser.findFirst({
        where: { userId: validatedData.professionalId }
    });
    const io = (0, chat_1.getIO)();
    if (onlineUser === null || onlineUser === void 0 ? void 0 : onlineUser.isOnline) {
        io.to(onlineUser.socketId).emit(events_1.Emit.JOB_CREATED, { text: 'This a new Job', data: job });
    }
    yield prisma_1.default.activity.create({
        data: {
            userId: id,
            action: `${(_c = client === null || client === void 0 ? void 0 : client.profile) === null || _c === void 0 ? void 0 : _c.firstName} ${(_d = client === null || client === void 0 ? void 0 : client.profile) === null || _d === void 0 ? void 0 : _d.lastName} has created a new Job #${job.id}`,
            type: 'Job Created',
            status: enum_1.ActivityStatus.ACT_SUCCESS
        }
    });
    (0, jobHook_1.onJobCreate)({ clientId: id, professionalId: validatedData.professionalId }).catch(console.error);
    return (0, modules_1.successResponse)(res, "Successful", { jobResponse: job, emailSendId: emailResponse.success });
});
exports.createJobOrder = createJobOrder;
const updateJob = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const result = body_1.jobUpdateSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                error: "Invalid route parameter",
                issues: result.error.format(),
            });
        }
        const job = yield prisma_1.default.job.findUnique({
            where: { id: result.data.jobId },
            include: {
                professional: { include: { profile: true } },
                client: { include: { profile: true } }
            }
        });
        if (!job) {
            return (0, modules_1.handleResponse)(res, 404, false, "Job not found");
        }
        if (job.accepted) {
            return (0, modules_1.handleResponse)(res, 404, false, "Job already accepted");
        }
        const updatedJob = yield prisma_1.default.job.update({
            where: { id: job.id },
            data: result.data
        });
        const emailToSend = yield (0, messages_1.jobUpdatedEmail)(Object.assign(Object.assign({}, updatedJob), { professional: job.professional, client: job.client }));
        yield (0, gmail_1.sendEmail)(job.professional.email, emailToSend.title, emailToSend.body, ((_a = job.professional.profile) === null || _a === void 0 ? void 0 : _a.firstName) || 'Professional');
        yield notification_1.NotificationService.create({
            userId: job.professionalId,
            type: enum_2.NotificationType.JOB,
            title: 'Job Updated',
            message: `Job "${job.title}" has been updated`,
            data: { jobId: job.id },
        });
        let onlineUser = yield prisma_1.default.onlineUser.findFirst({
            where: { userId: job.professionalId }
        });
        const io = (0, chat_1.getIO)();
        if (onlineUser === null || onlineUser === void 0 ? void 0 : onlineUser.isOnline) {
            io.to(onlineUser.socketId).emit(events_1.Emit.JOB_UPDATED, { text: 'Your job has been updated', data: updatedJob });
        }
        return (0, modules_1.successResponse)(res, "Successful", { job: updatedJob });
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', "Error updating job");
    }
});
exports.updateJob = updateJob;
const cancelJob = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { jobId } = req.params;
    try {
        const job = yield prisma_1.default.job.findUnique({
            where: { id: Number(jobId) },
            include: {
                client: { include: { profile: true } },
                professional: { include: { profile: true } }
            }
        });
        if (!job) {
            return (0, modules_1.errorResponse)(res, 'error', "Job not found");
        }
        yield prisma_1.default.job.update({
            where: { id: job.id },
            data: { status: enum_1.JobStatus.CANCELLED }
        });
        const emailToSend = yield (0, messages_1.jobCancelledEmail)(Object.assign({}, job));
        yield (0, gmail_1.sendEmail)(job.professional.email, emailToSend.title, emailToSend.body, ((_a = job.professional.profile) === null || _a === void 0 ? void 0 : _a.firstName) || 'Professional');
        yield notification_1.NotificationService.create({
            userId: job.professionalId,
            type: enum_2.NotificationType.JOB,
            title: 'Job Cancelled',
            message: `Job "${job.title}" has been cancelled by the client`,
            data: { jobId: job.id },
        });
        let onlineUser = yield prisma_1.default.onlineUser.findFirst({
            where: { userId: job.professionalId }
        });
        const io = (0, chat_1.getIO)();
        if (onlineUser === null || onlineUser === void 0 ? void 0 : onlineUser.isOnline) {
            io.to(onlineUser.socketId).emit(events_1.Emit.JOB_CANCELLED, { text: 'Your job has been cancelled by client', data: job });
        }
        (0, jobHook_1.onJobStatusUpdate)({ clientId: job.clientId, professionalId: job.professionalId }).catch(console.error);
        return (0, modules_1.successResponse)(res, 'success', "Job cancelled successfully");
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', "Error cancelling job");
    }
});
exports.cancelJob = cancelJob;
const respondToJob = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const { id, role } = req.user;
    const result = param_1.jobIdParamSchema.safeParse(req.params);
    if (!result.success) {
        return res.status(400).json({
            error: "Invalid route parameter",
            issues: result.error.format(),
        });
    }
    const jobId = parseInt(result.data.jobId, 10);
    const { accepted } = req.body;
    try {
        const job = yield prisma_1.default.job.findUnique({ where: { id: jobId } });
        if (!job) {
            return (0, modules_1.handleResponse)(res, 404, false, 'Job not found');
        }
        if (id !== job.professionalId) {
            return (0, modules_1.handleResponse)(res, 400, false, 'You are not authorized to perform this action');
        }
        const newStatus = accepted ? enum_1.JobStatus.PENDING : enum_1.JobStatus.REJECTED;
        yield prisma_1.default.job.update({
            where: { id: job.id },
            data: { accepted, status: newStatus }
        });
        const professional = yield prisma_1.default.user.findUnique({
            where: { id: job.professionalId },
            include: { profile: true }
        });
        const client = yield prisma_1.default.user.findUnique({
            where: { id: job.clientId },
            include: { profile: true }
        });
        const jobData = Object.assign(Object.assign({}, job), { client, professional });
        const emailResponse = yield (0, gmail_1.sendEmail)(client.email, (0, messages_1.jobResponseEmail)(jobData).title, (0, messages_1.jobResponseEmail)(jobData).body, ((_a = client.profile) === null || _a === void 0 ? void 0 : _a.firstName) + ' ' + ((_b = client.profile) === null || _b === void 0 ? void 0 : _b.lastName));
        yield notification_1.NotificationService.create({
            userId: job.clientId,
            type: enum_2.NotificationType.JOB,
            title: accepted ? 'Job Accepted' : 'Job Rejected',
            message: `Your job has been ${accepted ? 'accepted' : 'rejected'} by ${(_c = professional === null || professional === void 0 ? void 0 : professional.profile) === null || _c === void 0 ? void 0 : _c.firstName} ${(_d = professional === null || professional === void 0 ? void 0 : professional.profile) === null || _d === void 0 ? void 0 : _d.lastName}`,
            data: { jobId: job.id, accepted },
        });
        let onlineUser = yield prisma_1.default.onlineUser.findFirst({
            where: { userId: job.professionalId }
        });
        const io = (0, chat_1.getIO)();
        if (onlineUser === null || onlineUser === void 0 ? void 0 : onlineUser.isOnline) {
            io.to(onlineUser.socketId).emit(events_1.Emit.JOB_RESPONSE, { text: `$Your Job has been ${accepted ? 'accepted' : 'rejected'}`, data: job });
        }
        (0, jobHook_1.onJobStatusUpdate)({ clientId: job.clientId, professionalId: job.professionalId }).catch(console.error);
        return (0, modules_1.successResponse)(res, 'success', { message: 'Job respsonse updated', emailSendstatus: Boolean(emailResponse.messageId) });
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', error);
    }
});
exports.respondToJob = respondToJob;
const generateInvoice = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const result = body_1.jobCostingSchema.safeParse(req.body);
    const { id, role } = req.user;
    if (!result.success) {
        return res.status(400).json({
            error: "Invalid input",
            issues: result.error.format(),
        });
    }
    const { jobId, durationUnit, durationValue, workmanship, materials } = result.data;
    try {
        const job = yield prisma_1.default.job.findUnique({
            where: { id: jobId },
            include: {
                client: { include: { profile: true } },
                professional: { include: { profile: true } }
            }
        });
        if (!job) {
            return (0, modules_1.handleResponse)(res, 404, false, 'Job not found');
        }
        if (id !== job.professionalId) {
            return (0, modules_1.handleResponse)(res, 400, false, 'You are not authorized to perform this action');
        }
        if (job.workmanship) {
            return (0, modules_1.handleResponse)(res, 400, false, 'Invoice already generated');
        }
        if (materials) {
            const materialsCost = materials.reduce((acc, mat) => acc + mat.price * mat.quantity, 0);
            yield prisma_1.default.job.update({
                where: { id: job.id },
                data: { durationUnit, durationValue, workmanship, isMaterial: true, materialsCost }
            });
            yield prisma_1.default.material.createMany({
                data: materials.map((mat) => (Object.assign(Object.assign({}, mat), { subTotal: mat.price * mat.quantity, jobId })))
            });
            const emailTosend = (0, messages_1.invoiceGeneratedEmail)(Object.assign({}, job));
            const emailResponse = yield (0, gmail_1.sendEmail)(job.client.email, emailTosend.title, emailTosend.body, ((_a = job.client.profile) === null || _a === void 0 ? void 0 : _a.firstName) + ' ' + ((_b = job.client.profile) === null || _b === void 0 ? void 0 : _b.lastName));
            yield notification_1.NotificationService.create({
                userId: job.clientId,
                type: enum_2.NotificationType.JOB,
                title: 'Invoice Generated',
                message: `An invoice has been generated for your job: ${job.title}`,
                data: { jobId: job.id },
            });
            let onlineUser = yield prisma_1.default.onlineUser.findFirst({ where: { userId: job.clientId } });
            const io = (0, chat_1.getIO)();
            if (onlineUser === null || onlineUser === void 0 ? void 0 : onlineUser.isOnline) {
                io.to(onlineUser.socketId).emit(events_1.Emit.INVOICE_GENERATED, { text: `An invoice has been generated`, data: { job, materials } });
            }
            return (0, modules_1.successResponse)(res, 'success', { message: 'Invoice generated' });
        }
        yield prisma_1.default.job.update({
            where: { id: job.id },
            data: { durationUnit, durationValue, workmanship }
        });
        return (0, modules_1.successResponse)(res, 'success', { message: 'Job updated' });
    }
    catch (err) {
        return (0, modules_1.errorResponse)(res, 'error', err.message);
    }
});
exports.generateInvoice = generateInvoice;
const updateInvoice = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { jobId } = req.params;
    const result = body_1.jobCostingUpdateSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({
            error: "Invalid input",
            issues: result.error.format(),
        });
    }
    const { durationUnit, durationValue, workmanship, materials } = result.data;
    const job = yield prisma_1.default.job.findUnique({
        where: { id: Number(jobId) },
        include: {
            client: { include: { profile: true } },
            professional: { include: { profile: true } }
        }
    });
    if (!job) {
        return (0, modules_1.handleResponse)(res, 404, false, 'Job not found');
    }
    if (job.payStatus === enum_1.PayStatus.PAID) {
        return (0, modules_1.handleResponse)(res, 404, false, 'Job has already been paid');
    }
    yield prisma_1.default.job.update({
        where: { id: job.id },
        data: { durationUnit, durationValue, workmanship }
    });
    if (materials && materials.length > 0) {
        const newMaterials = materials.filter((material) => !material.id);
        if (newMaterials.length > 0) {
            yield prisma_1.default.material.createMany({
                data: newMaterials.map((material) => (Object.assign(Object.assign({}, material), { subTotal: material.price * material.quantity, jobId: Number(jobId) })))
            });
        }
        const updatePromises = [];
        for (const mat of materials) {
            if (mat.id) {
                updatePromises.push(prisma_1.default.material.update({
                    where: { id: mat.id },
                    data: Object.assign(Object.assign({}, mat), { subTotal: mat.price * mat.quantity, jobId: Number(jobId) })
                }));
            }
        }
        yield Promise.all(updatePromises);
        const allMaterials = yield prisma_1.default.material.findMany({ where: { jobId: Number(jobId) } });
        const materialsCost = allMaterials.reduce((acc, mat) => acc + Number(mat.price) * Number(mat.quantity), 0);
        yield prisma_1.default.job.update({
            where: { id: job.id },
            data: { isMaterial: true, materialsCost }
        });
    }
    const updatedJob = yield prisma_1.default.job.findUnique({
        where: { id: job.id },
        include: { materials: true, client: { include: { profile: true } }, professional: { include: { profile: true } } }
    });
    const emailTosend = (0, messages_1.invoiceUpdatedEmail)(updatedJob);
    yield (0, gmail_1.sendEmail)(job.client.email, emailTosend.title, emailTosend.body, (((_a = job.client.profile) === null || _a === void 0 ? void 0 : _a.firstName) || '') + ' ' + (((_b = job.client.profile) === null || _b === void 0 ? void 0 : _b.lastName) || '') || 'User');
    yield notification_1.NotificationService.create({
        userId: job.clientId,
        type: enum_2.NotificationType.JOB,
        title: 'Invoice Updated',
        message: `An invoice has been updated for your job: ${job.title}`,
        data: { jobId: job.id },
    });
    let onlineUser = yield prisma_1.default.onlineUser.findFirst({ where: { userId: job.clientId } });
    const io = (0, chat_1.getIO)();
    if (onlineUser === null || onlineUser === void 0 ? void 0 : onlineUser.isOnline) {
        io.to(onlineUser.socketId).emit(events_1.Emit.INVOICE_UPDATED, { text: `An invoice has been updated`, data: { job: updatedJob } });
    }
    return (0, modules_1.successResponse)(res, 'success', { message: 'Job updated successfully', job: updatedJob });
});
exports.updateInvoice = updateInvoice;
const viewInvoice = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    const { jobId } = req.params;
    try {
        const invoice = yield prisma_1.default.job.findUnique({
            where: { id: Number(jobId) },
            select: {
                id: true, title: true, description: true, status: true, workmanship: true, materialsCost: true, createdAt: true, updatedAt: true,
                materials: true,
            }
        });
        return (0, modules_1.successResponse)(res, 'success', invoice);
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', error.message);
    }
});
exports.viewInvoice = viewInvoice;
const completeJob = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    const { jobId } = req.params;
    try {
        const job = yield prisma_1.default.job.findFirst({
            where: { id: Number(jobId), status: enum_1.JobStatus.ONGOING },
            include: {
                professional: { include: { profile: true } },
                client: { include: { profile: true } }
            }
        });
        if (!job) {
            return (0, modules_1.handleResponse)(res, 404, false, 'Job does not exist / Job already completed');
        }
        if (job.status !== enum_1.JobStatus.ONGOING) {
            return (0, modules_1.handleResponse)(res, 400, false, `You cannot complete a/an ${job.status} job`);
        }
        if (job.professionalId !== req.user.id) {
            return (0, modules_1.handleResponse)(res, 403, false, 'You are not authorized to complete this job');
        }
        yield prisma_1.default.job.update({ where: { id: job.id }, data: { status: enum_1.JobStatus.COMPLETED } });
        if (job.professional.profile) {
            yield prisma_1.default.profile.update({
                where: { id: job.professional.profile.id },
                data: { totalJobsCompleted: (job.professional.profile.totalJobsCompleted || 0) + 1 }
            });
        }
        if (job.client.profile) {
            yield prisma_1.default.profile.update({
                where: { id: job.client.profile.id },
                data: { totalJobsCompleted: (job.client.profile.totalJobsCompleted || 0) + 1 }
            });
        }
        const emailTosend = (0, messages_1.completeJobEmail)(Object.assign({}, job));
        const emailResponse = yield (0, gmail_1.sendEmail)(job.client.email, emailTosend.title, emailTosend.body, ((_a = job.client.profile) === null || _a === void 0 ? void 0 : _a.firstName) + ' ' + ((_b = job.client.profile) === null || _b === void 0 ? void 0 : _b.lastName));
        yield notification_1.NotificationService.create({
            userId: job.clientId,
            type: enum_2.NotificationType.JOB,
            title: 'Job Completed',
            message: `Your job "${job.title}" has been completed by ${(_c = job.professional.profile) === null || _c === void 0 ? void 0 : _c.firstName} ${(_d = job.professional.profile) === null || _d === void 0 ? void 0 : _d.lastName}`,
            data: { jobId: job.id },
        });
        let onlineUser = yield prisma_1.default.onlineUser.findFirst({ where: { userId: job.clientId } });
        const io = (0, chat_1.getIO)();
        if (onlineUser === null || onlineUser === void 0 ? void 0 : onlineUser.isOnline) {
            io.to(onlineUser.socketId).emit(events_1.Emit.JOB_COMPLETED, { text: `Your job has completed`, data: { job } });
        }
        yield prisma_1.default.activity.create({
            data: {
                userId: job.professional.id,
                action: `${(_e = job.professional.profile) === null || _e === void 0 ? void 0 : _e.firstName} ${(_f = job.professional.profile) === null || _f === void 0 ? void 0 : _f.lastName} has completed Job #${job.id}`,
                type: 'Job Completion',
                status: enum_1.ActivityStatus.ACT_SUCCESS
            }
        });
        (0, jobHook_1.onJobStatusUpdate)({ clientId: job.clientId, professionalId: job.professionalId }).catch(console.error);
        return (0, modules_1.successResponse)(res, 'success', { message: 'Job completed sucessfully', emailSendStatus: emailResponse.success });
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', error.message);
    }
});
exports.completeJob = completeJob;
const approveJob = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    const { jobId } = req.params;
    try {
        const job = yield prisma_1.default.job.findUnique({
            where: { id: Number(jobId) },
            include: {
                professional: { include: { profile: true, wallet: true } },
                client: { include: { profile: true } }
            }
        });
        if (!job) {
            return (0, modules_1.handleResponse)(res, 404, false, 'Job does not exist');
        }
        if (job.status !== enum_1.JobStatus.COMPLETED) {
            return (0, modules_1.handleResponse)(res, 404, false, `You cannot approve a/an ${job.status} job`);
        }
        yield prisma_1.default.job.update({
            where: { id: job.id },
            data: { status: enum_1.JobStatus.APPROVED, approved: true }
        });
        if (job.professional.profile) {
            yield prisma_1.default.profile.update({
                where: { id: job.professional.profile.id },
                data: { totalJobsApproved: (job.professional.profile.totalJobsApproved || 0) + 1 }
            });
        }
        if (job.client.profile) {
            yield prisma_1.default.profile.update({
                where: { id: job.client.profile.id },
                data: { totalJobsApproved: (job.client.profile.totalJobsApproved || 0) + 1 }
            });
        }
        if (job.professional.wallet) {
            let amount = Number(job.workmanship) + Number(job.materialsCost);
            const commission = yield CommissionService_1.CommissionService.calculateCommission(Number(job.workmanship), enum_1.CommissionScope.JOB);
            amount = amount - commission;
            let prevBal = Number(job.professional.wallet.currentBalance) || 0;
            let newBal = prevBal + amount;
            yield prisma_1.default.wallet.update({
                where: { id: job.professional.wallet.id },
                data: { previousBalance: prevBal, currentBalance: newBal }
            });
            const transaction = yield prisma_1.default.transaction.create({
                data: {
                    userId: job.professional.id,
                    amount: amount,
                    reference: (0, modules_1.randomId)(12),
                    status: enum_1.TransactionStatus.PENDING,
                    currency: 'NGN',
                    timestamp: new Date(),
                    description: 'wallet deposit',
                    jobId: job.id,
                    productTransactionId: null,
                    type: enum_1.TransactionType.CREDIT,
                }
            });
            yield ledgerService_1.LedgerService.createEntry([
                {
                    transactionId: transaction.id,
                    userId: transaction.userId,
                    amount: Number(transaction.amount) + commission,
                    type: enum_1.TransactionType.DEBIT,
                    account: enum_1.Accounts.PLATFORM_ESCROW,
                    category: enum_1.EntryCategory.JOB
                },
                {
                    transactionId: transaction.id,
                    userId: transaction.userId,
                    amount: Number(transaction.amount),
                    type: enum_1.TransactionType.CREDIT,
                    account: enum_1.Accounts.PROFESSIONAL_WALLET,
                    category: enum_1.EntryCategory.JOB
                },
                {
                    transactionId: transaction.id,
                    userId: null,
                    amount: commission,
                    type: enum_1.TransactionType.CREDIT,
                    account: enum_1.Accounts.PLATFORM_REVENUE,
                    category: enum_1.EntryCategory.JOB
                }
            ]);
        }
        const emailTosend = (0, messages_1.approveJobEmail)(Object.assign({}, job));
        yield (0, gmail_1.sendEmail)(job.professional.email, emailTosend.title, emailTosend.body, ((_a = job.professional.profile) === null || _a === void 0 ? void 0 : _a.firstName) + ' ' + ((_b = job.professional.profile) === null || _b === void 0 ? void 0 : _b.lastName));
        yield notification_1.NotificationService.create({
            userId: job.professionalId,
            type: enum_2.NotificationType.JOB,
            title: 'Job Approved',
            message: `Your job "${job.title}" has been approved by ${(_c = job.client.profile) === null || _c === void 0 ? void 0 : _c.firstName} ${(_d = job.client.profile) === null || _d === void 0 ? void 0 : _d.lastName}`,
            data: { jobId: job.id },
        });
        let onlineUser = yield prisma_1.default.onlineUser.findFirst({ where: { userId: job.professionalId } });
        const io = (0, chat_1.getIO)();
        if (onlineUser === null || onlineUser === void 0 ? void 0 : onlineUser.isOnline) {
            io.to(onlineUser.socketId).emit(events_1.Emit.JOB_APPROVED, { text: `Your job has approved`, data: { job } });
        }
        yield prisma_1.default.activity.create({
            data: {
                userId: job.client.id,
                action: `${(_e = job.client.profile) === null || _e === void 0 ? void 0 : _e.firstName} ${(_f = job.client.profile) === null || _f === void 0 ? void 0 : _f.lastName} has approved Job #${job.id}`,
                type: 'Job Approval',
                status: enum_1.ActivityStatus.ACT_SUCCESS
            }
        });
        (0, jobHook_1.onJobStatusUpdate)({ clientId: job.clientId, professionalId: job.professionalId }).catch(console.error);
        return (0, modules_1.successResponse)(res, 'success', { message: 'Job approved sucessfully' });
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', error.message);
    }
});
exports.approveJob = approveJob;
const disputeJob = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    const jobId = req.params.jobId;
    const { reason, description } = req.body;
    try {
        const job = yield prisma_1.default.job.findFirst({
            where: { id: Number(jobId), status: enum_1.JobStatus.COMPLETED },
            include: {
                professional: { include: { profile: true } },
                client: { include: { profile: true } }
            }
        });
        if (!job) {
            return (0, modules_1.handleResponse)(res, 404, false, 'Job does not exist');
        }
        if (job.status !== enum_1.JobStatus.COMPLETED) {
            return (0, modules_1.handleResponse)(res, 404, false, `You cannot dispute a/an ${job.status} job`);
        }
        yield prisma_1.default.job.update({ where: { id: job.id }, data: { status: enum_1.JobStatus.DISPUTED } });
        if (job.professional.profile) {
            yield prisma_1.default.profile.update({
                where: { id: job.professional.profile.id },
                data: { totalDisputes: (job.professional.profile.totalDisputes || 0) + 1 }
            });
        }
        if (job.client.profile) {
            yield prisma_1.default.profile.update({
                where: { id: job.client.profile.id },
                data: { totalDisputes: (job.client.profile.totalDisputes || 0) + 1 }
            });
        }
        const dispute = yield prisma_1.default.dispute.create({
            data: {
                reason,
                description,
                jobId: Number(jobId),
                reporterId: job.professionalId,
                partnerId: job.clientId,
            }
        });
        const emailTosend = (0, messages_1.disputedJobEmail)(Object.assign({}, job), dispute);
        const emailResponse = yield (0, gmail_1.sendEmail)(job.professional.email, emailTosend.title, emailTosend.body, ((_a = job.professional.profile) === null || _a === void 0 ? void 0 : _a.firstName) + ' ' + ((_b = job.professional.profile) === null || _b === void 0 ? void 0 : _b.lastName));
        yield notification_1.NotificationService.create({
            userId: job.professionalId,
            type: enum_2.NotificationType.JOB,
            title: 'Job Disputed',
            message: `Your job "${job.title}" has been disputed by ${(_c = job.client.profile) === null || _c === void 0 ? void 0 : _c.firstName} ${(_d = job.client.profile) === null || _d === void 0 ? void 0 : _d.lastName}`,
            data: { jobId: job.id },
        });
        let onlineUser = yield prisma_1.default.onlineUser.findFirst({ where: { userId: job.professionalId } });
        const io = (0, chat_1.getIO)();
        if (onlineUser === null || onlineUser === void 0 ? void 0 : onlineUser.isOnline) {
            io.to(onlineUser.socketId).emit(events_1.Emit.JOB_DISPUTED, { text: `Your job has been disputed`, data: { job } });
        }
        yield prisma_1.default.activity.create({
            data: {
                userId: job.client.id,
                action: `${(_e = job.client.profile) === null || _e === void 0 ? void 0 : _e.firstName} ${(_f = job.client.profile) === null || _f === void 0 ? void 0 : _f.lastName} has created a dispute on job #${job.id}`,
                type: 'Dispute',
                status: enum_1.ActivityStatus.ACT_SUCCESS
            }
        });
        (0, jobHook_1.onJobStatusUpdate)({ clientId: job.clientId, professionalId: job.professionalId }).catch(console.error);
        return (0, modules_1.successResponse)(res, 'success', { dispute, emailSendStatus: emailResponse.success });
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', error.message);
    }
});
exports.disputeJob = disputeJob;
const resolveDispute = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const { jobId } = req.params;
    const { resolution, reason } = req.body; // resolution: 'release' | 'refund'
    if (!resolution || !['release', 'refund'].includes(resolution)) {
        return (0, modules_1.handleResponse)(res, 400, false, "Resolution must be 'release' or 'refund'");
    }
    try {
        const job = yield prisma_1.default.job.findFirst({
            where: { id: Number(jobId), status: enum_1.JobStatus.DISPUTED },
            include: {
                professional: { include: { profile: true, wallet: true } },
                client: { include: { profile: true, wallet: true } },
                disputes: { orderBy: { createdAt: 'desc' }, take: 1 },
            }
        });
        if (!job) {
            return (0, modules_1.handleResponse)(res, 404, false, 'Disputed job not found');
        }
        const dispute = job.disputes[0];
        if (!dispute) {
            return (0, modules_1.handleResponse)(res, 404, false, 'No dispute found for this job');
        }
        const totalAmount = Number((_a = job.workmanship) !== null && _a !== void 0 ? _a : 0) + Number((_b = job.materialsCost) !== null && _b !== void 0 ? _b : 0);
        if (resolution === 'release') {
            // Release funds to professional (same as approveJob flow)
            const commission = yield CommissionService_1.CommissionService.calculateCommission(Number((_c = job.workmanship) !== null && _c !== void 0 ? _c : 0), enum_1.CommissionScope.JOB);
            const netAmount = totalAmount - commission;
            if (job.professional.wallet) {
                const prevBal = Number(job.professional.wallet.currentBalance);
                const newBal = prevBal + netAmount;
                yield prisma_1.default.wallet.update({
                    where: { id: job.professional.wallet.id },
                    data: { previousBalance: prevBal, currentBalance: newBal }
                });
                const tx = yield prisma_1.default.transaction.create({
                    data: {
                        amount: netAmount,
                        type: enum_1.TransactionType.CREDIT,
                        status: enum_1.TransactionStatus.SUCCESS,
                        currency: 'NGN',
                        description: 'wallet deposit',
                        reference: `DSP-REL-${(0, modules_1.randomId)(12)}`,
                        jobId: job.id,
                        userId: job.professionalId,
                    }
                });
                const ledgerEntries = [
                    { transactionId: tx.id, userId: job.professionalId, amount: totalAmount, type: enum_1.TransactionType.DEBIT, account: enum_1.Accounts.PLATFORM_ESCROW, category: enum_1.EntryCategory.JOB },
                    { transactionId: tx.id, userId: job.professionalId, amount: netAmount, type: enum_1.TransactionType.CREDIT, account: enum_1.Accounts.PROFESSIONAL_WALLET, category: enum_1.EntryCategory.JOB },
                ];
                if (commission > 0) {
                    ledgerEntries.push({ transactionId: tx.id, userId: null, amount: commission, type: enum_1.TransactionType.CREDIT, account: enum_1.Accounts.PLATFORM_REVENUE, category: enum_1.EntryCategory.JOB });
                }
                yield ledgerService_1.LedgerService.createEntry(ledgerEntries);
            }
            yield prisma_1.default.job.update({
                where: { id: job.id },
                data: { status: enum_1.JobStatus.APPROVED, approved: true, payStatus: enum_1.PayStatus.RELEASED }
            });
        }
        else {
            // Refund to client wallet
            if (job.client.wallet) {
                const prevBal = Number(job.client.wallet.currentBalance);
                const newBal = prevBal + totalAmount;
                yield prisma_1.default.wallet.update({
                    where: { id: job.client.wallet.id },
                    data: { previousBalance: prevBal, currentBalance: newBal }
                });
                const tx = yield prisma_1.default.transaction.create({
                    data: {
                        amount: totalAmount,
                        type: enum_1.TransactionType.CREDIT,
                        status: enum_1.TransactionStatus.SUCCESS,
                        currency: 'NGN',
                        description: 'dispute refund',
                        reference: `DSP-REF-${(0, modules_1.randomId)(12)}`,
                        jobId: job.id,
                        userId: job.clientId,
                    }
                });
                yield ledgerService_1.LedgerService.createEntry([
                    { transactionId: tx.id, userId: job.clientId, amount: totalAmount, type: enum_1.TransactionType.DEBIT, account: enum_1.Accounts.PLATFORM_ESCROW, category: enum_1.EntryCategory.JOB },
                    { transactionId: tx.id, userId: job.clientId, amount: totalAmount, type: enum_1.TransactionType.CREDIT, account: enum_1.Accounts.USER_WALLET, category: enum_1.EntryCategory.JOB },
                ]);
            }
            yield prisma_1.default.job.update({
                where: { id: job.id },
                data: { status: enum_1.JobStatus.CANCELLED, payStatus: enum_1.PayStatus.REFUNDED }
            });
        }
        // Update the dispute record
        yield prisma_1.default.dispute.update({
            where: { id: dispute.id },
            data: { status: 'resolved', resolution: reason || resolution }
        });
        // Notify both parties
        const io = (0, chat_1.getIO)();
        const proOnline = yield prisma_1.default.onlineUser.findFirst({ where: { userId: job.professionalId } });
        if (proOnline === null || proOnline === void 0 ? void 0 : proOnline.isOnline) {
            io.to(proOnline.socketId).emit(events_1.Emit.DISPUTE_RESOLVED, {
                text: `Dispute on "${job.title}" resolved: ${resolution}`,
                data: { job, resolution }
            });
        }
        const clientOnline = yield prisma_1.default.onlineUser.findFirst({ where: { userId: job.clientId } });
        if (clientOnline === null || clientOnline === void 0 ? void 0 : clientOnline.isOnline) {
            io.to(clientOnline.socketId).emit(events_1.Emit.DISPUTE_RESOLVED, {
                text: `Dispute on "${job.title}" resolved: ${resolution}`,
                data: { job, resolution }
            });
        }
        yield notification_1.NotificationService.create({
            userId: job.professionalId,
            type: enum_2.NotificationType.JOB,
            title: 'Dispute Resolved',
            message: `The dispute on "${job.title}" has been resolved (${resolution}).`,
            data: { jobId: job.id, resolution },
        });
        yield notification_1.NotificationService.create({
            userId: job.clientId,
            type: enum_2.NotificationType.JOB,
            title: 'Dispute Resolved',
            message: `The dispute on "${job.title}" has been resolved (${resolution}).`,
            data: { jobId: job.id, resolution },
        });
        yield prisma_1.default.activity.create({
            data: {
                userId: req.user.id,
                action: `Dispute on Job #${job.id} resolved: ${resolution}`,
                type: 'Dispute Resolution',
                status: enum_1.ActivityStatus.ACT_SUCCESS
            }
        });
        return (0, modules_1.successResponse)(res, 'success', { message: `Dispute resolved: ${resolution}` });
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', error.message);
    }
});
exports.resolveDispute = resolveDispute;
