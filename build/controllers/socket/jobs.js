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
exports.emitLatestJob = void 0;
const enum_1 = require("../../utils/enum");
const prisma_1 = __importDefault(require("../../config/prisma"));
const emitLatestJob = (io, socket) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, role } = socket.user;
    if (role === enum_1.UserRole.PROFESSIONAL) {
        try {
            const job = yield prisma_1.default.job.findFirst({
                where: {
                    professionalId: id,
                    status: enum_1.JobStatus.PENDING,
                    accepted: false
                },
                orderBy: { createdAt: 'desc' },
                include: { materials: true }
            });
            if (job) {
                io.to(socket.id).emit('JOB_LATEST', { text: 'You have a pending job', data: job });
            }
        }
        catch (error) {
            console.log(error);
        }
    }
});
exports.emitLatestJob = emitLatestJob;
