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
exports.onJobCreate = exports.onJobStatusUpdate = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const enum_1 = require("../utils/enum");
/**
 * Call this after a job status update to refresh client & professional profile stats.
 */
const onJobStatusUpdate = (job) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        // Update client profile
        const clientProfile = yield prisma_1.default.profile.findFirst({ where: { userId: job.clientId } });
        if (clientProfile) {
            yield prisma_1.default.profile.update({
                where: { id: clientProfile.id },
                data: {
                    totalJobs: yield prisma_1.default.job.count({ where: { clientId: job.clientId } }),
                    totalJobsPending: yield prisma_1.default.job.count({ where: { clientId: job.clientId, status: enum_1.JobStatus.PENDING } }),
                    totalJobsOngoing: yield prisma_1.default.job.count({ where: { clientId: job.clientId, status: enum_1.JobStatus.ONGOING } }),
                    totalJobsDeclined: yield prisma_1.default.job.count({ where: { clientId: job.clientId, status: enum_1.JobStatus.DECLINED } }),
                    totalJobsCompleted: yield prisma_1.default.job.count({ where: { clientId: job.clientId, status: enum_1.JobStatus.COMPLETED } }),
                    totalJobsApproved: yield prisma_1.default.job.count({ where: { clientId: job.clientId, status: enum_1.JobStatus.APPROVED } }),
                    totalJobsCanceled: yield prisma_1.default.job.count({ where: { clientId: job.clientId, status: enum_1.JobStatus.CANCELLED } }),
                    totalDisputes: yield prisma_1.default.job.count({ where: { clientId: job.clientId, status: enum_1.JobStatus.DISPUTED } }),
                }
            });
        }
        // Update professional profile
        const professionalProfile = yield prisma_1.default.profile.findFirst({ where: { userId: job.professionalId } });
        const professional = yield prisma_1.default.professional.findFirst({ where: { profile: { userId: job.professionalId } } });
        if (professionalProfile) {
            yield prisma_1.default.profile.update({
                where: { id: professionalProfile.id },
                data: {
                    totalJobs: yield prisma_1.default.job.count({ where: { professionalId: job.professionalId } }),
                    totalJobsPending: yield prisma_1.default.job.count({ where: { professionalId: job.professionalId, status: enum_1.JobStatus.PENDING } }),
                    totalJobsOngoing: yield prisma_1.default.job.count({ where: { professionalId: job.professionalId, status: enum_1.JobStatus.ONGOING } }),
                    totalJobsDeclined: yield prisma_1.default.job.count({ where: { professionalId: job.professionalId, status: enum_1.JobStatus.DECLINED } }),
                    totalJobsCompleted: yield prisma_1.default.job.count({ where: { professionalId: job.professionalId, status: enum_1.JobStatus.COMPLETED } }),
                    totalJobsApproved: yield prisma_1.default.job.count({ where: { professionalId: job.professionalId, status: enum_1.JobStatus.APPROVED } }),
                    totalJobsCanceled: yield prisma_1.default.job.count({ where: { professionalId: job.professionalId, status: enum_1.JobStatus.CANCELLED } }),
                    totalDisputes: yield prisma_1.default.job.count({ where: { professionalId: job.professionalId, status: enum_1.JobStatus.DISPUTED } }),
                }
            });
        }
        if (professional) {
            const approvedSum = yield prisma_1.default.job.aggregate({ where: { professionalId: job.professionalId, status: enum_1.JobStatus.APPROVED }, _sum: { workmanship: true } });
            const completedSum = yield prisma_1.default.job.aggregate({ where: { professionalId: job.professionalId, status: enum_1.JobStatus.COMPLETED }, _sum: { workmanship: true } });
            const pendingSum = yield prisma_1.default.job.aggregate({ where: { professionalId: job.professionalId, status: enum_1.JobStatus.PENDING }, _sum: { workmanship: true } });
            const declinedSum = yield prisma_1.default.job.aggregate({ where: { professionalId: job.professionalId, status: enum_1.JobStatus.DECLINED }, _sum: { workmanship: true } });
            yield prisma_1.default.professional.update({
                where: { id: professional.id },
                data: {
                    totalEarning: Number((_a = approvedSum._sum.workmanship) !== null && _a !== void 0 ? _a : 0),
                    completedAmount: Number((_b = completedSum._sum.workmanship) !== null && _b !== void 0 ? _b : 0),
                    pendingAmount: Number((_c = pendingSum._sum.workmanship) !== null && _c !== void 0 ? _c : 0),
                    rejectedAmount: Number((_d = declinedSum._sum.workmanship) !== null && _d !== void 0 ? _d : 0),
                }
            });
        }
    }
    catch (error) {
        console.log('jobHook error:', error);
    }
});
exports.onJobStatusUpdate = onJobStatusUpdate;
/**
 * Call this after a job creation to refresh client & professional profile stats.
 */
const onJobCreate = (job) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const clientProfile = yield prisma_1.default.profile.findFirst({ where: { userId: job.clientId } });
        if (clientProfile) {
            yield prisma_1.default.profile.update({
                where: { id: clientProfile.id },
                data: {
                    totalJobs: yield prisma_1.default.job.count({ where: { clientId: job.clientId } }),
                    totalJobsPending: yield prisma_1.default.job.count({ where: { clientId: job.clientId, status: enum_1.JobStatus.PENDING } }),
                }
            });
        }
        const professionalProfile = yield prisma_1.default.profile.findFirst({ where: { userId: job.professionalId } });
        const professional = yield prisma_1.default.professional.findFirst({ where: { profile: { userId: job.professionalId } } });
        if (professionalProfile) {
            yield prisma_1.default.profile.update({
                where: { id: professionalProfile.id },
                data: {
                    totalJobs: yield prisma_1.default.job.count({ where: { professionalId: job.professionalId } }),
                    totalJobsPending: yield prisma_1.default.job.count({ where: { professionalId: job.professionalId, status: enum_1.JobStatus.PENDING } }),
                }
            });
        }
        if (professional) {
            const pendingSum = yield prisma_1.default.job.aggregate({ where: { professionalId: job.professionalId, status: enum_1.JobStatus.PENDING }, _sum: { workmanship: true } });
            yield prisma_1.default.professional.update({
                where: { id: professional.id },
                data: {
                    pendingAmount: Number((_a = pendingSum._sum.workmanship) !== null && _a !== void 0 ? _a : 0),
                }
            });
        }
    }
    catch (error) {
        console.log('jobHook error:', error);
    }
});
exports.onJobCreate = onJobCreate;
