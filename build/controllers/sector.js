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
exports.deleteSector = exports.updateSector = exports.createSector = exports.getSectorsMetrics = exports.getSectors = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const modules_1 = require("../utils/modules");
const getSectors = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sectors = yield prisma_1.default.sector.findMany({
            orderBy: { title: 'asc' },
        });
        return (0, modules_1.successResponse)(res, 'success', sectors);
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', error);
    }
});
exports.getSectors = getSectors;
const getSectorsMetrics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { id } = req.params;
    try {
        let sectors = yield prisma_1.default.sector.findMany();
        const results = yield Promise.all(sectors.map((sector) => __awaiter(void 0, void 0, void 0, function* () {
            const numOfProf = yield prisma_1.default.professional.count({
                where: {
                    profession: {
                        sectorId: sector.id,
                    },
                },
            });
            const numOfJobs = yield prisma_1.default.job.count({
                where: {
                    professional: {
                        profile: {
                            professional: {
                                profession: {
                                    sectorId: sector.id,
                                },
                            },
                        },
                    },
                },
            });
            return Object.assign(Object.assign({}, sector), { numOfProf,
                numOfJobs });
        })));
        return (0, modules_1.successResponse)(res, "success", results);
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, "error", error);
    }
});
exports.getSectorsMetrics = getSectorsMetrics;
const createSector = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, image } = req.body;
    if (!title || !image) {
        return (0, modules_1.handleResponse)(res, 400, false, 'Please provide all fields');
    }
    try {
        const sector = yield prisma_1.default.sector.create({ data: { title, image } });
        return (0, modules_1.successResponse)(res, 'success', sector);
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', error);
    }
});
exports.createSector = createSector;
const updateSector = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { id } = req.params;
    if (!req.body) {
        return (0, modules_1.handleResponse)(res, 400, false, "Please provide at least one field to update");
    }
    try {
        let sector = yield prisma_1.default.sector.update({
            where: { id: Number(id) },
            data: req.body
        });
        return (0, modules_1.successResponse)(res, "success", sector);
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, "error", error);
    }
});
exports.updateSector = updateSector;
const deleteSector = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { id } = req.params;
    try {
        yield prisma_1.default.sector.delete({ where: { id: Number(id) } });
        return (0, modules_1.successResponse)(res, "success", {});
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, "error", error);
    }
});
exports.deleteSector = deleteSector;
