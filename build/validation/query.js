"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransactionSchema = exports.activitySchema = exports.isRatedSchema = exports.getUsersQuerySchema = exports.getOrdersSchema = exports.boughtProductSchema = exports.getProductSchema = exports.professionalSearchQuerySchema = exports.jobStatusQuerySchema = void 0;
const zod_1 = require("zod");
const enum_1 = require("../utils/enum");
exports.jobStatusQuerySchema = zod_1.z.object({
    status: zod_1.z.enum(['all', ...Object.values(enum_1.JobStatus)]).optional(),
});
exports.professionalSearchQuerySchema = zod_1.z.object({
    professionId: zod_1.z.coerce.number().int().positive("Profession ID must be a positive integer").optional(),
    profession: zod_1.z.string().optional(),
    sector: zod_1.z.string().optional(),
    span: zod_1.z.coerce.number().int().positive("Span must be a positive integer").optional(),
    state: zod_1.z.string().optional(),
    lga: zod_1.z.string().optional(),
    rating: zod_1.z.coerce.number().int().min(0).max(5).optional(),
    chargeFrom: zod_1.z.coerce.number().int().min(0).optional(),
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(10),
    allowUnverified: zod_1.z.enum(['true', 'false']).transform((val) => val === 'true').optional(),
    // sortBy: z.enum(['rating', 'chargeFrom', 'available']).optional(),
    // sortOrder: z.enum(['asc', 'desc']).optional(),
});
exports.getProductSchema = zod_1.z.object({
    approved: zod_1.z.enum(["true", "false"]).transform((val) => val === "true").optional(),
    categoryId: zod_1.z.coerce.number().optional(),
    locationId: zod_1.z.coerce.number().optional(),
    category: zod_1.z.string().optional(),
    state: zod_1.z.string().optional(),
    lga: zod_1.z.string().optional(),
    search: zod_1.z.string().optional(),
    minPrice: zod_1.z.coerce.number().min(0).optional(),
    maxPrice: zod_1.z.coerce.number().min(0).optional(),
    page: zod_1.z.coerce.number().min(1).default(1),
    limit: zod_1.z.coerce.number().min(1).default(10),
    orderBy: zod_1.z.enum(['createdAt', 'price', 'name']).optional(),
    orderDir: zod_1.z.enum(['asc', 'desc']).optional(),
});
exports.boughtProductSchema = zod_1.z.object({
    status: zod_1.z.enum(['all', ...Object.values(enum_1.ProductTransactionStatus)]).optional(),
});
exports.getOrdersSchema = zod_1.z.object({
    status: zod_1.z.enum(['all', ...Object.values(enum_1.OrderStatus)]).optional(),
    page: zod_1.z.coerce.number().min(1).default(1),
    limit: zod_1.z.coerce.number().min(1).default(10)
});
exports.getUsersQuerySchema = zod_1.z.object({
    search: zod_1.z.string().optional(),
    professionId: zod_1.z.coerce.number().optional(),
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().default(10),
    role: zod_1.z.nativeEnum(enum_1.UserRole).optional(),
});
exports.isRatedSchema = zod_1.z.object({
    jobId: zod_1.z.coerce.number().int().min(1).optional(),
    orderId: zod_1.z.coerce.number().int().min(1).optional(),
}).refine((data) => (data.jobId ? !data.orderId : !!data.orderId), {
    message: "Either jobId or orderId must be provided, but not both",
    path: ["jobId"],
});
exports.activitySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(10),
    search: zod_1.z.string().optional(),
    type: zod_1.z.string().optional(),
    status: zod_1.z.enum(['all', 'success', 'failed', 'pending']).optional(),
});
exports.getTransactionSchema = zod_1.z.object({
    status: zod_1.z.enum(['all', ...Object.values(enum_1.TransactionStatus)]).optional(),
    page: zod_1.z.coerce.number().min(1).default(1),
    limit: zod_1.z.coerce.number().min(1).default(10)
});
