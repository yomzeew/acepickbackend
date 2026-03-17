import { z } from "zod";
import { JobStatus, OrderStatus, ProductTransactionStatus, TransactionStatus, UserRole } from "../utils/enum";

export const jobStatusQuerySchema = z.object({
    status: z.enum(['all', ...Object.values(JobStatus)]).optional(),
});


export const professionalSearchQuerySchema = z.object({
    professionId: z.coerce.number().int().positive("Profession ID must be a positive integer").optional(),
    profession: z.string().optional(),
    sector: z.string().optional(),
    span: z.coerce.number().int().positive("Span must be a positive integer").optional(),
    state: z.string().optional(),
    lga: z.string().optional(),
    rating: z.coerce.number().int().min(0).max(5).optional(),
    chargeFrom: z.coerce.number().int().min(0).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    allowUnverified: z.enum(['true', 'false']).transform((val) => val === 'true').optional(),
    // sortBy: z.enum(['rating', 'chargeFrom', 'available']).optional(),
    // sortOrder: z.enum(['asc', 'desc']).optional(),
});


export const getProductSchema = z.object({
    approved: z.enum(["true", "false"]).transform((val) => val === "true").optional(),
    categoryId: z.coerce.number().optional(),
    locationId: z.coerce.number().optional(),
    category: z.string().optional(),
    state: z.string().optional(),
    lga: z.string().optional(),
    search: z.string().optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).default(10),
    orderBy: z.enum(['createdAt', 'price', 'name']).optional(),
    orderDir: z.enum(['asc', 'desc']).optional(),
});



export const boughtProductSchema = z.object({
    status: z.enum(['all', ...Object.values(ProductTransactionStatus)]).optional(),
});


export const getOrdersSchema = z.object({
    status: z.enum(['all', ...Object.values(OrderStatus)]).optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).default(10)
})

export const getUsersQuerySchema = z.object({
    search: z.string().optional(),
    professionId: z.coerce.number().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().default(10),
    role: z.nativeEnum(UserRole).optional(),
});

export const isRatedSchema = z.object({
    jobId: z.coerce.number().int().min(1).optional(),
    orderId: z.coerce.number().int().min(1).optional(),
}).refine(
    (data) => (data.jobId ? !data.orderId : !!data.orderId),
    {
        message: "Either jobId or orderId must be provided, but not both",
        path: ["jobId"],
    }
)

export const activitySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    search: z.string().optional(),
    type: z.string().optional(),
    status: z.enum(['all', 'success', 'failed', 'pending']).optional(),
});

export const getTransactionSchema = z.object({
    status: z.enum(['all', ...Object.values(TransactionStatus)]).optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).default(10)
})
