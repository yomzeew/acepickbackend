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
exports.deleteEducation = exports.updateEducation = exports.addEducation = exports.getEducation = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const modules_1 = require("../utils/modules");
const body_1 = require("../validation/body");
const getEducation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    console.log(req.user);
    try {
        const profile = yield prisma_1.default.profile.findFirst({ where: { userId: id } });
        if (!profile) {
            return (0, modules_1.handleResponse)(res, 404, false, 'Profile not found');
        }
        const education = yield prisma_1.default.education.findMany({
            where: { profileId: profile.id },
            orderBy: { createdAt: 'desc' }
        });
        if (!education) {
            return (0, modules_1.handleResponse)(res, 404, false, 'Education not found');
        }
        return (0, modules_1.successResponse)(res, 'success', education);
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', error);
    }
});
exports.getEducation = getEducation;
const addEducation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    const result = body_1.educationSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({
            status: false,
            message: 'Validation error',
            errors: result.error.flatten().fieldErrors,
        });
    }
    const { school, degreeType, course, startDate, gradDate, isCurrent } = req.body;
    try {
        const profile = yield prisma_1.default.profile.findFirst({ where: { userId: id } });
        if (!profile) {
            return (0, modules_1.handleResponse)(res, 404, false, 'Profile not found');
        }
        const education = yield prisma_1.default.education.create({
            data: {
                school,
                degreeType,
                course,
                startDate,
                gradDate,
                isCurrent,
                profileId: profile.id
            }
        });
        return (0, modules_1.successResponse)(res, 'success', education);
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', error);
    }
});
exports.addEducation = addEducation;
const updateEducation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    //const { userId } = req.user;
    if (!id) {
        return (0, modules_1.handleResponse)(res, 400, false, 'Provide an id');
    }
    try {
        const result = body_1.updateEducationSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                status: false,
                message: 'Validation error',
                errors: result.error.flatten().fieldErrors,
            });
        }
        const updated = yield prisma_1.default.education.update({
            where: { id: Number(id) },
            data: result.data
        });
        return (0, modules_1.successResponse)(res, 'success', updated);
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', error.message || error);
    }
});
exports.updateEducation = updateEducation;
const deleteEducation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //const { userId } = req.user;
    const { id } = req.params;
    if (!id) {
        return (0, modules_1.handleResponse)(res, 400, false, 'Provide an id');
    }
    try {
        const deleted = yield prisma_1.default.education.delete({
            where: { id: Number(id) }
        });
        return (0, modules_1.successResponse)(res, 'success', deleted);
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', error.message || error);
    }
});
exports.deleteEducation = deleteEducation;
