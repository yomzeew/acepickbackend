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
exports.deleteDeliveryPricing = exports.updateDeliveryPricing = exports.createDeliveryPricing = exports.getDeliveryPricingById = exports.getDeliveryPricingList = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const modules_1 = require("../../utils/modules");
const zod_1 = require("zod");
const vehicleTypes = ['bike', 'car', 'truck', 'keke', 'bus'];
const createPricingSchema = zod_1.z.object({
    vehicleType: zod_1.z.enum(vehicleTypes),
    baseCost: zod_1.z.number().min(0, 'Base cost must be >= 0'),
    costPerKm: zod_1.z.number().min(0, 'Cost per km must be >= 0'),
    costPerKg: zod_1.z.number().min(0, 'Cost per kg must be >= 0').optional().default(0),
});
const updatePricingSchema = zod_1.z.object({
    baseCost: zod_1.z.number().min(0, 'Base cost must be >= 0').optional(),
    costPerKm: zod_1.z.number().min(0, 'Cost per km must be >= 0').optional(),
    costPerKg: zod_1.z.number().min(0, 'Cost per kg must be >= 0').optional(),
});
const getDeliveryPricingList = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pricing = yield prisma_1.default.deliveryPricing.findMany({
            orderBy: { vehicleType: 'asc' },
        });
        return (0, modules_1.successResponse)(res, 'success', pricing);
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, 'error', 'An error occurred');
    }
});
exports.getDeliveryPricingList = getDeliveryPricingList;
const getDeliveryPricingById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const pricing = yield prisma_1.default.deliveryPricing.findUnique({ where: { id: Number(id) } });
        if (!pricing) {
            return (0, modules_1.errorResponse)(res, 'error', 'Delivery pricing not found');
        }
        return (0, modules_1.successResponse)(res, 'success', pricing);
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, 'error', 'An error occurred');
    }
});
exports.getDeliveryPricingById = getDeliveryPricingById;
const createDeliveryPricing = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = createPricingSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({ message: result.error.issues[0].message });
        }
        const existing = yield prisma_1.default.deliveryPricing.findFirst({
            where: { vehicleType: result.data.vehicleType },
        });
        if (existing) {
            return res.status(400).json({ message: `Pricing for ${result.data.vehicleType} already exists. Use update instead.` });
        }
        const pricing = yield prisma_1.default.deliveryPricing.create({
            data: {
                vehicleType: result.data.vehicleType,
                baseCost: result.data.baseCost,
                costPerKm: result.data.costPerKm,
                costPerKg: result.data.costPerKg,
            },
        });
        return (0, modules_1.successResponse)(res, 'Delivery pricing created successfully', pricing);
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, 'error', 'An error occurred');
    }
});
exports.createDeliveryPricing = createDeliveryPricing;
const updateDeliveryPricing = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = updatePricingSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({ message: result.error.issues[0].message });
        }
        const existing = yield prisma_1.default.deliveryPricing.findUnique({ where: { id: Number(id) } });
        if (!existing) {
            return (0, modules_1.errorResponse)(res, 'error', 'Delivery pricing not found');
        }
        const updated = yield prisma_1.default.deliveryPricing.update({
            where: { id: Number(id) },
            data: result.data,
        });
        return (0, modules_1.successResponse)(res, 'Delivery pricing updated successfully', updated);
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, 'error', 'An error occurred');
    }
});
exports.updateDeliveryPricing = updateDeliveryPricing;
const deleteDeliveryPricing = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const existing = yield prisma_1.default.deliveryPricing.findUnique({ where: { id: Number(id) } });
        if (!existing) {
            return (0, modules_1.errorResponse)(res, 'error', 'Delivery pricing not found');
        }
        yield prisma_1.default.deliveryPricing.delete({ where: { id: Number(id) } });
        return (0, modules_1.successResponse)(res, 'Delivery pricing deleted successfully', null);
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, 'error', 'An error occurred');
    }
});
exports.deleteDeliveryPricing = deleteDeliveryPricing;
