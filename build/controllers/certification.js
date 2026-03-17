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
exports.deleteCertificate = exports.updateCertificate = exports.addCertificate = exports.getCertificates = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const modules_1 = require("../utils/modules");
const body_1 = require("../validation/body");
const getCertificates = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    try {
        const profile = yield prisma_1.default.profile.findFirst({ where: { userId: id } });
        if (!profile) {
            return (0, modules_1.handleResponse)(res, 404, false, 'Profile not found');
        }
        const certificates = yield prisma_1.default.certification.findMany({
            where: { profileId: profile.id },
            orderBy: { createdAt: 'desc' },
        });
        return (0, modules_1.successResponse)(res, 'success', certificates);
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', error);
    }
});
exports.getCertificates = getCertificates;
const addCertificate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    const result = body_1.certificationSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({
            status: false,
            message: 'Validation error',
            errors: result.error.flatten().fieldErrors,
        });
    }
    const { title, filePath, companyIssue, date } = result.data;
    try {
        const profile = yield prisma_1.default.profile.findFirst({ where: { userId: id } });
        if (!profile) {
            return (0, modules_1.handleResponse)(res, 404, false, 'Profile not found');
        }
        const certificate = yield prisma_1.default.certification.create({
            data: {
                title,
                filePath,
                companyIssue,
                date,
                profileId: profile.id
            }
        });
        return (0, modules_1.successResponse)(res, 'success', certificate);
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', error);
    }
});
exports.addCertificate = addCertificate;
const updateCertificate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    //const { userId } = req.user;
    if (!id) {
        return (0, modules_1.handleResponse)(res, 400, false, 'Provide an id');
    }
    const result = body_1.updateCertificationSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({
            status: false,
            message: 'Validation error',
            errors: result.error.flatten().fieldErrors,
        });
    }
    try {
        const updated = yield prisma_1.default.certification.update({
            where: { id: Number(id) },
            data: result.data
        });
        return (0, modules_1.successResponse)(res, 'success', updated);
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', error);
    }
});
exports.updateCertificate = updateCertificate;
const deleteCertificate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id) {
        return (0, modules_1.handleResponse)(res, 400, false, 'Provide an id');
    }
    try {
        yield prisma_1.default.certification.delete({
            where: { id: Number(id) }
        });
        return (0, modules_1.successResponse)(res, 'success', { message: 'Certificate deleted successfully' });
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', error);
    }
});
exports.deleteCertificate = deleteCertificate;
