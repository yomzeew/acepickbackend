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
exports.deleteExperience = exports.updateExperience = exports.addExperience = exports.getExperiences = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const modules_1 = require("../utils/modules");
const body_1 = require("../validation/body");
const getExperiences = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    try {
        const profile = yield prisma_1.default.profile.findFirst({ where: { userId: id } });
        if (!profile) {
            return (0, modules_1.handleResponse)(res, 404, false, 'Profile not found');
        }
        const experiences = yield prisma_1.default.experience.findMany({
            where: { profileId: profile.id },
            orderBy: { createdAt: 'desc' }
        });
        return (0, modules_1.successResponse)(res, 'success', experiences);
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', error);
    }
});
exports.getExperiences = getExperiences;
const addExperience = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    const result = body_1.experienceSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({
            status: false,
            message: 'Validation error',
            errors: result.error.flatten().fieldErrors,
        });
    }
    const { postHeld, workPlace, startDate, endDate, isCurrent, description } = result.data;
    try {
        const profile = yield prisma_1.default.profile.findFirst({ where: { userId: id } });
        if (!profile) {
            return (0, modules_1.handleResponse)(res, 404, false, 'Profile not found');
        }
        const experience = yield prisma_1.default.experience.create({
            data: {
                postHeld,
                workPlace,
                startDate,
                endDate,
                isCurrent,
                description,
                profileId: profile.id
            }
        });
        return (0, modules_1.successResponse)(res, 'success', experience);
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', error);
    }
});
exports.addExperience = addExperience;
const updateExperience = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id) {
        return (0, modules_1.handleResponse)(res, 400, false, 'Provide an id');
    }
    const result = body_1.updateExperienceSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({
            status: false,
            message: 'Validation error',
            errors: result.error.flatten().fieldErrors,
        });
    }
    try {
        const updated = yield prisma_1.default.experience.update({
            where: { id: Number(id) },
            data: result.data
        });
        return (0, modules_1.successResponse)(res, 'success', updated);
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', error);
    }
});
exports.updateExperience = updateExperience;
const deleteExperience = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id) {
        return (0, modules_1.handleResponse)(res, 400, false, 'Provide an id');
    }
    try {
        yield prisma_1.default.experience.delete({
            where: { id: Number(id) }
        });
        return (0, modules_1.successResponse)(res, 'success', { message: 'Experience deleted successfully' });
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', error);
    }
});
exports.deleteExperience = deleteExperience;
