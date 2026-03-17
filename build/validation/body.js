"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disputeSchema = exports.updateCommissionSchema = exports.commissionSchema = exports.addReviewSchema = exports.addRatingSchema = exports.deliverySchema = exports.productTransactionIdSchema = exports.restockProductSchema = exports.selectProductSchema = exports.initPaymentSchema = exports.updateProductSchema = exports.createProductSchema = exports.updatePortfolioSchema = exports.portfolioSchema = exports.updateExperienceSchema = exports.experienceSchema = exports.updateCertificationSchema = exports.certificationSchema = exports.updateEducationSchema = exports.educationSchema = exports.pinForgotSchema = exports.pinResetSchema = exports.withdrawSchema = exports.productPaymentSchema = exports.paymentSchema = exports.resolveBankSchema = exports.bankDetailsSchema = exports.updateLocationSchema = exports.storeLocationSchema = exports.jobCostingUpdateSchema = exports.jobCostingSchema = exports.jobUpdateSchema = exports.jobPostSchema = exports.updateUserProfileSchema = exports.registerRiderSchema = exports.updateRiderSchema = exports.riderSchema = exports.registerCoporateSchema = exports.registrationProfSchema = exports.registrationSchema = exports.verifyOTPSchema = exports.otpRequestSchema = void 0;
const zod_1 = require("zod");
const enum_1 = require("../utils/enum"); // adjust the path
const enum_2 = require("../utils/enum");
const otpBaseSchema = zod_1.z.object({
    type: zod_1.z.nativeEnum(enum_2.VerificationType),
    reason: zod_1.z.nativeEnum(enum_1.OTPReason),
    email: zod_1.z.string().email("Invalid email").optional(),
    phone: zod_1.z.string().min(1, "Phone is required").optional(),
});
// Conditional logic based on type
exports.otpRequestSchema = otpBaseSchema.superRefine((data, ctx) => {
    if ((data.type === enum_2.VerificationType.EMAIL || data.type === enum_2.VerificationType.BOTH) && !data.email) {
        ctx.addIssue({
            path: ["email"],
            code: zod_1.z.ZodIssueCode.custom,
            message: "Email is required when type is 'email' or 'both'",
        });
    }
    if ((data.type === enum_2.VerificationType.SMS || data.type === enum_2.VerificationType.BOTH) && !data.phone) {
        ctx.addIssue({
            path: ["phone"],
            code: zod_1.z.ZodIssueCode.custom,
            message: "Phone is required when type is 'phone' or 'both'",
        });
    }
});
const smsCodeSchema = zod_1.z.object({
    phone: zod_1.z.string().min(1, "Phone is required"),
    code: zod_1.z.string().length(4, "Code must be exactly 4 characters"),
});
const emailCodeSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email"),
    code: zod_1.z.string().length(4, "Code must be exactly 4 characters"),
});
exports.verifyOTPSchema = zod_1.z.object({
    smsCode: smsCodeSchema.nullable().optional(),
    emailCode: emailCodeSchema.nullable().optional(),
}).refine((data) => data.smsCode || data.emailCode, {
    message: "At least one of smsCode or emailCode must be provided",
});
exports.registrationSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
    phone: zod_1.z.string().min(10, "Phone number is too short"),
    password: zod_1.z.string().min(4, "Password must be at least 6 characters"),
    confirmPassword: zod_1.z.string().min(4, "Confirm Password is required"),
    agreed: zod_1.z.literal(true, {
        errorMap: () => ({ message: "You must agree to the terms and conditions" }),
    }),
    firstName: zod_1.z.string().min(1, "First name is required"),
    lastName: zod_1.z.string().min(1, "Last name is required"),
    lga: zod_1.z.string().min(1, "LGA is required"),
    state: zod_1.z.string().min(1, "State is required"),
    address: zod_1.z.string().min(1, "Address is required"),
    avatar: zod_1.z.string().url("Avatar must be a valid URL").optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});
exports.registrationProfSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
    phone: zod_1.z.string().min(10, "Phone number is too short"),
    password: zod_1.z.string().min(4, "Password must be at least 6 characters"),
    confirmPassword: zod_1.z.string().min(4, "Confirm Password is required"),
    agreed: zod_1.z.literal(true, {
        errorMap: () => ({ message: "You must agree to the terms and conditions" }),
    }),
    firstName: zod_1.z.string().min(1, "First name is required"),
    lastName: zod_1.z.string().min(1, "Last name is required"),
    lga: zod_1.z.string().min(1, "LGA is required"),
    state: zod_1.z.string().min(1, "State is required"),
    address: zod_1.z.string().min(1, "Address is required"),
    professionId: zod_1.z.number().int().positive("Professional ID must be a positive integer"),
    avatar: zod_1.z.string().url("Avatar must be a valid URL").optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});
// Director schema
const directorSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1, "Director's first name is required"),
    lastName: zod_1.z.string().min(1, "Director's last name is required"),
    email: zod_1.z.string().email("Director's email is invalid"),
    phone: zod_1.z.string().min(10, "Director's phone is required"),
    address: zod_1.z.string().min(1, "Director's address is required"),
    state: zod_1.z.string().min(1, "Director's state is required"),
    lga: zod_1.z.string().min(1, "Director's LGA is required"),
});
// Cooperation schema
const cooperationSchema = zod_1.z.object({
    avatar: zod_1.z.string().url("Invalid avatar URL"),
    nameOfOrg: zod_1.z.string().min(1, "Organization name is required"),
    phone: zod_1.z.string().min(10, "Organization phone is required"),
    address: zod_1.z.string().min(1, "Organization address is required"),
    state: zod_1.z.string().min(1, "Organization state is required"),
    lga: zod_1.z.string().min(1, "Organization LGA is required"),
    regNum: zod_1.z.string().min(1, "Registration number is required"),
    professionId: zod_1.z.number().int().positive("Profession ID must be a positive integer"),
    noOfEmployees: zod_1.z.number().int().positive("Number of employees must be a positive integer"),
    director: directorSchema,
});
// Main user registration schema
exports.registerCoporateSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
    phone: zod_1.z.string().min(10, "Phone number is required"),
    password: zod_1.z.string().min(4, "Password must be at least 6 characters"),
    confirmPassword: zod_1.z.string().min(4, "Confirm Password is required"),
    // role: z.literal("corperate", {
    //     errorMap: () => ({ message: "Role must be 'corperate'" }),
    // }),
    agreed: zod_1.z.literal(true, {
        errorMap: () => ({ message: "You must agree to the terms and conditions" }),
    }),
    firstName: zod_1.z.string().min(1, "First name is required"),
    lastName: zod_1.z.string().min(1, "Last name is required"),
    position: zod_1.z.string().min(1, "Position is required"),
    cooperation: cooperationSchema,
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});
exports.riderSchema = zod_1.z.object({
    vehicleType: zod_1.z.nativeEnum(enum_1.VehicleType).optional().default(enum_1.VehicleType.BIKE),
    licenseNumber: zod_1.z.string().min(1, "License number is required"),
});
exports.updateRiderSchema = zod_1.z.object({
    vehicleType: zod_1.z.nativeEnum(enum_1.VehicleType).optional(),
    licenseNumber: zod_1.z.string().min(1, "License number is required").optional(),
    status: zod_1.z.nativeEnum(enum_1.RiderStatus).optional(),
});
exports.registerRiderSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
    phone: zod_1.z.string().min(10, "Phone number is required"),
    password: zod_1.z.string().min(4, "Password must be at least 6 characters"),
    confirmPassword: zod_1.z.string().min(4, "Confirm Password is required"),
    avatar: zod_1.z.string().url("Avatar must be a valid URL").optional(),
    agreed: zod_1.z.literal(true, {
        errorMap: () => ({ message: "You must agree to the terms and conditions" }),
    }),
    firstName: zod_1.z.string().min(1, "First name is required"),
    lastName: zod_1.z.string().min(1, "Last name is required"),
    lga: zod_1.z.string().min(1, "LGA is required"),
    state: zod_1.z.string().min(1, "State is required"),
    address: zod_1.z.string().min(1, "Address is required"),
    rider: exports.riderSchema,
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});
exports.updateUserProfileSchema = zod_1.z.object({
    contact: zod_1.z
        .object({
        email: zod_1.z
            .string()
            .email('Invalid email address')
            .optional(),
        phone: zod_1.z
            .string()
            .min(7, 'Phone number is too short')
            .optional(),
    })
        .optional(),
    bio: zod_1.z
        .object({
        firstName: zod_1.z.string().optional(),
        lastName: zod_1.z.string().optional(),
        gender: zod_1.z.enum(['male', 'female', 'other']).optional(),
        birthDate: zod_1.z
            .coerce
            .date()
            .optional(),
        avatar: zod_1.z.string().optional(),
    })
        .optional(),
    location: zod_1.z
        .object({
        address: zod_1.z.string().optional(),
        city: zod_1.z.string().optional(),
        state: zod_1.z.string().optional(),
        country: zod_1.z.string().optional(),
    })
        .optional(),
});
exports.jobPostSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, "Title is required"),
    description: zod_1.z.string().min(1, "Description is required"),
    address: zod_1.z.string().min(1, "Address is required"),
    numOfJobs: zod_1.z.number().int().positive("Number of jobs must be a positive integer").optional(),
    professionalId: zod_1.z.union([zod_1.z.string().uuid("Professional ID must be a valid UUID"), zod_1.z.string().min(1)]),
    mode: zod_1.z.nativeEnum(enum_1.JobMode).optional(),
    // Additional optional fields from frontend
    categoryId: zod_1.z.string().optional(),
    startDate: zod_1.z.string().datetime().optional(),
    deadline: zod_1.z.string().datetime().optional(),
    budgetMin: zod_1.z.number().positive("Minimum budget must be positive").optional(),
    budgetMax: zod_1.z.number().positive("Maximum budget must be positive").optional(),
    priority: zod_1.z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
    state: zod_1.z.string().optional(),
    lga: zod_1.z.string().optional(),
    skillsRequired: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.jobUpdateSchema = zod_1.z.object({
    jobId: zod_1.z.number().int().positive("Job ID must be a positive integer").optional(),
    title: zod_1.z.string().min(1, "Title is required").optional(),
    description: zod_1.z.string().min(1, "Description is required").optional(),
    address: zod_1.z.string().min(1, "Address is required").optional(),
    numOfJobs: zod_1.z.number().int().positive("Number of jobs must be a positive integer").optional(),
    mode: zod_1.z.nativeEnum(enum_1.JobMode).optional(),
});
// Define the schema for a single Material
const materialSchema = zod_1.z.object({
    description: zod_1.z.string().min(1, "Description is required"),
    quantity: zod_1.z.number().int().positive("Quantity must be a positive integer"),
    unit: zod_1.z.string().max(20).optional().or(zod_1.z.literal("").transform(() => undefined)),
    price: zod_1.z.number().int().positive("Price must be a positive integer"),
});
const materialUpdateSchema = zod_1.z.object({
    id: zod_1.z.number().int().positive().optional(),
    description: zod_1.z.string().min(1, "Description is required"),
    quantity: zod_1.z.number().int().positive("Quantity must be a positive integer"),
    unit: zod_1.z.string().max(20).optional().or(zod_1.z.literal("").transform(() => undefined)),
    price: zod_1.z.number().int().positive("Price must be a positive integer"),
});
// Full request body schema with optional `materials`
exports.jobCostingSchema = zod_1.z.object({
    jobId: zod_1.z.number().int().positive("Job ID must be a positive integer"),
    durationUnit: zod_1.z.string().min(1, "Duration unit is required"),
    durationValue: zod_1.z.number().int().positive("Duration value must be a positive integer"),
    workmanship: zod_1.z.number().int().nonnegative("Workmanship must be a non-negative integer"),
    materials: zod_1.z.array(materialSchema).optional(),
});
exports.jobCostingUpdateSchema = zod_1.z.object({
    durationUnit: zod_1.z.string().min(1, "Duration unit is required").optional(),
    durationValue: zod_1.z.number().int().positive("Duration value must be a positive integer").optional(),
    workmanship: zod_1.z.number().int().nonnegative("Workmanship must be a non-negative integer").optional(),
    materials: zod_1.z.array(materialUpdateSchema).optional(),
});
// export const paymentSchema = z.object({
//     amount: z.number().positive("Amount must be a positive number"),
//     paidFor: z.string().min(1, "paidFor is required"),
//     pin: z.string().length(4, "PIN must be exactly 4 characters"),
//     jobId: z.number().int().positive("Job ID must be a positive integer"),
// });
exports.storeLocationSchema = zod_1.z.object({
    address: zod_1.z.string(),
    lga: zod_1.z.string().optional(),
    state: zod_1.z.string().optional(),
    latitude: zod_1.z.number(),
    longitude: zod_1.z.number(),
    zipcode: zod_1.z.number().int().optional(),
});
exports.updateLocationSchema = zod_1.z.object({
    address: zod_1.z.string().optional(),
    lga: zod_1.z.string().optional(),
    state: zod_1.z.string().optional(),
    latitude: zod_1.z.number().optional(),
    longitude: zod_1.z.number().optional(),
    zipcode: zod_1.z.number().int().optional(),
});
exports.bankDetailsSchema = zod_1.z.object({
    accountName: zod_1.z.string().min(1, 'Account name is required'),
    bank: zod_1.z.string().min(1, 'Bank is required'),
    bankCode: zod_1.z.string().min(1, 'Bank code is required'),
    accountNumber: zod_1.z
        .string()
        .regex(/^\d{10}$/, 'Account number must be exactly 10 digits'),
});
exports.resolveBankSchema = zod_1.z.object({
    bankCode: zod_1.z.string().min(1, 'Bank code is required'),
    accountNumber: zod_1.z
        .string()
        .regex(/^\d{10}$/, 'Account number must be exactly 10 digits'),
});
exports.paymentSchema = zod_1.z.object({
    amount: zod_1.z.number().positive('Amount must be a positive number'),
    pin: zod_1.z.string().regex(/^\d{4}$/, 'PIN must be exactly 4 digits'),
    reason: zod_1.z.string().min(1, 'Reason is required'),
    jobId: zod_1.z.number().int().positive("Job ID must be a positive integer"),
});
exports.productPaymentSchema = zod_1.z.object({
    amount: zod_1.z.number().positive('Amount must be a positive number'),
    pin: zod_1.z.string().regex(/^\d{4}$/, 'PIN must be exactly 4 digits'),
    reason: zod_1.z.string().min(1, 'Reason is required').optional(),
    productTransactionId: zod_1.z.number().int().positive("Job ID must be a positive integer"),
});
exports.withdrawSchema = zod_1.z.object({
    amount: zod_1.z
        .number({
        required_error: 'Amount is required',
        invalid_type_error: 'Amount must be a number',
    })
        .positive('Amount must be greater than zero'),
    recipientCode: zod_1.z
        .string()
        .min(1, 'Recipient code is required'),
    pin: zod_1.z
        .string()
        .min(4, 'PIN must be at least 4 digits'),
    reason: zod_1.z
        .string()
        .optional()
        .default('Withdrawal'),
});
exports.pinResetSchema = zod_1.z
    .object({
    newPin: zod_1.z.string().regex(/^\d{4}$/, 'PIN must be exactly 4 digits'),
    oldPin: zod_1.z.string().regex(/^\d{4}$/, 'Confirm PIN must be exactly 4 digits'),
});
// .refine((data) => data.newPin === data.newPinconfirm, {
//     message: "PINs do not match",
//     path: ['newPinconfirm'], // Error will show under `newPinconfirm`
// });
exports.pinForgotSchema = zod_1.z
    .object({
    newPin: zod_1.z.string().regex(/^\d{4}$/, 'PIN must be exactly 4 digits'),
    newPinConfirm: zod_1.z.string().regex(/^\d{4}$/, 'Confirm PIN must be exactly 4 digits'),
})
    .refine((data) => data.newPin === data.newPinConfirm, {
    message: "PINs do not match",
    path: ['newPinconfirm'], // Error will show under `newPinconfirm`
});
exports.educationSchema = zod_1.z.object({
    school: zod_1.z.string().min(1, 'School is required'),
    degreeType: zod_1.z.string().min(1, 'Degree type is required'),
    course: zod_1.z.string().min(1, 'Course is required'),
    startDate: zod_1.z
        .coerce
        .date({ required_error: 'Start date is required', invalid_type_error: 'Start date must be a valid date' }),
    gradDate: zod_1.z
        .coerce
        .date({ invalid_type_error: 'Graduation date must be a valid date' })
        .optional(),
    isCurrent: zod_1.z.boolean().optional(),
}).refine((data) => {
    // If gradDate is provided, isCurrent must be undefined or false
    if (data.gradDate) {
        return data.isCurrent !== true; // Must be false or undefined
    }
    return true;
}, {
    message: 'isCurrent must be false or not set if gradDate is provided',
    path: ['isCurrent'], // Attach error to the isCurrent field
});
exports.updateEducationSchema = zod_1.z.object({
    school: zod_1.z
        .string()
        .min(1, 'School is required')
        .optional()
        .refine(val => val === undefined || val.trim().length > 0, {
        message: 'School cannot be empty',
    }),
    degreeType: zod_1.z
        .string()
        .min(1, 'Degree type is required')
        .optional()
        .refine(val => val === undefined || val.trim().length > 0, {
        message: 'Degree type cannot be empty',
    }),
    course: zod_1.z
        .string()
        .min(1, 'Course is required')
        .optional()
        .refine(val => val === undefined || val.trim().length > 0, {
        message: 'Course cannot be empty',
    }),
    startDate: zod_1.z
        .coerce
        .date({
        required_error: 'Start date is required',
        invalid_type_error: 'Start date must be a valid date'
    }).optional(),
    gradDate: zod_1.z
        .coerce
        .date({ invalid_type_error: 'Graduation date must be a valid date' })
        .optional()
        .nullable(),
    isCurrent: zod_1.z.boolean().optional(),
}).refine((data) => {
    // If gradDate is provided (not null/undefined), isCurrent must not be true
    if (data.gradDate) {
        return data.isCurrent !== true;
    }
    return true;
}, {
    message: 'isCurrent must be false or not set if gradDate is provided',
    path: ['isCurrent'],
});
exports.certificationSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required'),
    filePath: zod_1.z.string(),
    companyIssue: zod_1.z.string().min(1, 'Issuing company is required'),
    date: zod_1.z.coerce.date({ invalid_type_error: 'Date must be a valid date' }),
    // profileId: z
    //     .number({
    //         required_error: 'Profile ID is required',
    //         invalid_type_error: 'Profile ID must be a number',
    //     })
    //     .int('Profile ID must be an integer'),
});
exports.updateCertificationSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required').optional(),
    filePath: zod_1.z.string().optional(),
    companyIssue: zod_1.z.string().min(1, 'Issuing company is required').optional(),
    date: zod_1.z.coerce.date({ invalid_type_error: 'Date must be a valid date' }).optional(),
});
exports.experienceSchema = zod_1.z.object({
    postHeld: zod_1.z.string().min(1, 'Post held is required'),
    workPlace: zod_1.z.string().min(1, 'Workplace is required'),
    startDate: zod_1.z
        .coerce
        .date({ required_error: 'Start date is required', invalid_type_error: 'Start date must be a valid date' }),
    endDate: zod_1.z
        .coerce
        .date({ invalid_type_error: 'End date must be a valid date' })
        .optional(),
    isCurrent: zod_1.z
        .boolean()
        .optional(),
    description: zod_1.z
        .string()
        .optional(),
    // profileId: z
    //     .number({
    //         required_error: 'Profile ID is required',
    //         invalid_type_error: 'Profile ID must be a number',
    //     })
    //     .int('Profile ID must be an integer'),
});
exports.updateExperienceSchema = zod_1.z.object({
    postHeld: zod_1.z
        .string()
        .min(1, 'Post held cannot be empty')
        .optional()
        .describe('The job title or position held by the individual.'),
    workPlace: zod_1.z
        .string()
        .min(1, 'Workplace cannot be empty')
        .optional()
        .describe('The company or organization where the job was held.'),
    startDate: zod_1.z
        .coerce
        .date({ required_error: 'Start date is required', invalid_type_error: 'Start date must be a valid date' })
        .optional()
        .describe('The date when the job started (ISO string).'),
    endDate: zod_1.z
        .coerce
        .date({ invalid_type_error: 'End date must be a valid date' })
        .optional()
        .describe('The date when the job ended (optional if still current).'),
    isCurrent: zod_1.z
        .boolean()
        .optional()
        .describe('Whether the job is currently held.'),
    description: zod_1.z
        .string()
        .optional()
        .describe('A summary or description of the responsibilities and achievements.'),
    // profileId: z
    //     .number()
    //     .int('Profile ID must be an integer')
    //     .optional()
    //     .describe('ID of the profile this experience is associated with.'),
});
exports.portfolioSchema = zod_1.z.object({
    title: zod_1.z
        .string()
        .min(1, 'Title is required')
        .describe('The title of the portfolio project.'),
    description: zod_1.z
        .string()
        .min(1, 'Description is required')
        .describe('A detailed description of the project.'),
    duration: zod_1.z
        .string()
        .min(1, 'Duration is required')
        .max(50, 'Duration must not exceed 50 characters')
        .describe('The duration of the project (e.g. "3 months").'),
    date: zod_1.z
        .coerce
        .date()
        .describe('The date the project was completed.'),
    file: zod_1.z
        .string()
        .max(500, 'File path must not exceed 500 characters')
        .optional()
        .describe('An optional file path or URL for the project.'),
    // profileId: z
    //     .number({
    //         required_error: 'Profile ID is required',
    //         invalid_type_error: 'Profile ID must be a number',
    //     })
    //     .int('Profile ID must be an integer')
    //     .describe('ID of the profile this portfolio item is associated with.'),
});
exports.updatePortfolioSchema = zod_1.z.object({
    title: zod_1.z
        .string()
        .min(1, 'Title cannot be empty')
        .optional()
        .describe('The title of the portfolio project.'),
    description: zod_1.z
        .string()
        .min(1, 'Description cannot be empty')
        .optional()
        .describe('A detailed description of the project.'),
    duration: zod_1.z
        .string()
        .min(1, 'Duration cannot be empty')
        .max(50, 'Duration must not exceed 50 characters')
        .optional()
        .describe('The duration of the project (e.g. "3 months").'),
    date: zod_1.z
        .coerce
        .date()
        .optional()
        .describe('The date the project was completed.'),
    file: zod_1.z
        .string()
        .max(500, 'File path must not exceed 500 characters')
        .optional()
        .describe('An optional file path or URL for the project.'),
    // profileId: z
    //     .number()
    //     .int('Profile ID must be an integer')
    //     .optional()
    //     .describe('ID of the profile this portfolio item is associated with.'),
});
exports.createProductSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(1, 'Product name is required'),
    description: zod_1.z
        .string()
        .min(1, 'Product description is required')
        .optional(),
    images: zod_1.z
        .array(zod_1.z.string().min(1, 'Image path cannot be empty'))
        .optional()
        .default([]),
    categoryId: zod_1.z
        .number({
        required_error: 'Category ID is required',
        invalid_type_error: 'Category ID must be a number',
    }),
    quantity: zod_1.z
        .number({
        required_error: 'Quantity is required',
        invalid_type_error: 'Quantity must be a number',
    })
        .int('Quantity must be an integer')
        .nonnegative('Quantity cannot be negative'),
    price: zod_1.z
        .number({
        required_error: 'Price is required',
        invalid_type_error: 'Price must be a number',
    })
        .positive('Price must be greater than zero'),
    discount: zod_1.z
        .number()
        .min(0, 'Discount cannot be negative')
        .max(100, 'Discount cannot be more than 100%')
        .optional(),
    weightPerUnit: zod_1.z
        .number()
        .positive('Weight must be positive')
        .optional(),
    locationId: zod_1.z
        .number({
        invalid_type_error: 'Location ID must be a number',
    })
        .optional(),
    state: zod_1.z.string().optional(),
    lga: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
});
exports.updateProductSchema = zod_1.z.object({
    name: zod_1.z.
        string()
        .min(1, 'Product name is required')
        .optional(),
    description: zod_1.z.
        string()
        .min(1, 'Product description is required')
        .optional(),
    categoryId: zod_1.z.
        number({
        required_error: 'Category ID is required',
        invalid_type_error: 'Category ID must be a number',
    })
        .optional(),
    quantity: zod_1.z
        .number({
        required_error: 'Quantity is required',
        invalid_type_error: 'Quantity must be a number',
    })
        .int('Quantity must be an integer')
        .nonnegative('Quantity cannot be negative')
        .optional(),
    price: zod_1.z
        .number({
        required_error: 'Price is required',
        invalid_type_error: 'Price must be a number',
    })
        .positive('Price must be greater than zero')
        .optional(),
    discount: zod_1.z
        .number()
        .min(0, 'Discount cannot be negative')
        .max(100, 'Discount cannot be more than 100%')
        .optional(),
    locationId: zod_1.z
        .number({
        required_error: 'Location ID is required',
        invalid_type_error: 'Location ID must be a number',
    })
        .optional(),
});
exports.initPaymentSchema = zod_1.z
    .object({
    amount: zod_1.z
        .number({
        required_error: 'Amount is required',
        invalid_type_error: 'Amount must be a number',
    })
        .positive('Amount must be greater than zero'),
    description: zod_1.z.preprocess((val) => (typeof val === 'string' ? val.toLowerCase() : val), zod_1.z.enum(['job payment', 'product payment', 'product_order payment', 'wallet topup'], {
        errorMap: () => ({
            message: 'Description must be one of: "Job Payment", "Product Payment", "Product_Order Payment", or "Wallet Topup"',
        }),
    })),
    jobId: zod_1.z
        .number({
        invalid_type_error: 'jobId must be a number',
    })
        .int('jobId must be an integer')
        .positive('jobId must be a positive number')
        .optional(),
    productTransactionId: zod_1.z
        .number({
        invalid_type_error: 'productTransactionId must be a number',
    })
        .int('productTransactionId must be an integer')
        .positive('productTransactionId must be a positive number')
        .optional(),
})
    // Validate jobId for job payment
    .refine((data) => {
    if (data.description !== 'job payment')
        return true;
    return typeof data.jobId === 'number' && data.jobId > 0;
}, {
    message: 'jobId must be a positive integer for "Job Payment", and must be null or omitted otherwise',
    path: ['jobId'],
})
    // Validate jobId for wallet topup
    .refine((data) => {
    if (data.description !== 'wallet topup')
        return true;
    return data.jobId === undefined || data.jobId === null;
}, {
    message: 'jobId must be null or omitted for "Wallet Topup"',
    path: ['jobId'],
})
    // Validate productTransactionId for product payment
    .refine((data) => {
    if (data.description !== 'product payment')
        return true;
    return typeof data.productTransactionId === 'number' && data.productTransactionId > 0;
}, {
    message: 'productTransactionId must be a positive integer for "Product Payment", and must be null or omitted otherwise',
    path: ['productTransactionId'],
})
    // Validate productTransactionId for product_job payment
    .refine((data) => {
    if (data.description !== 'product_order payment')
        return true;
    return typeof data.productTransactionId === 'number' && data.productTransactionId > 0;
}, {
    message: 'productTransactionId must be a positive integer for "Product_Order Payment", and must be null or omitted otherwise',
    path: ['productTransactionId'],
});
// Validate jobId for product_job payment
// .refine(
//     (data) => {
//         if (data.description !== 'product_job payment') return true;
//         return typeof data.jobId === 'number' && data.jobId > 0;
//     },
//     {
//         message:
//             'jobId must be a positive integer for "Product_Job Payment", and must be null or omitted otherwise',
//         path: ['jobId'],
//     }
// );
exports.selectProductSchema = zod_1.z.object({
    productId: zod_1.z
        .number({
        required_error: 'productId is required',
        invalid_type_error: 'productId must be a number',
    })
        .int('productId must be an integer')
        .positive('productId must be a positive number'),
    quantity: zod_1.z
        .number({
        invalid_type_error: 'quantity must be a number',
    })
        .int('quantity must be an integer')
        .positive('quantity must be a positive number')
        .default(1),
    orderMethod: zod_1.z.enum(['delivery', 'self_pickup']).optional()
});
exports.restockProductSchema = zod_1.z.object({
    productId: zod_1.z
        .number({
        required_error: 'productId is required',
        invalid_type_error: 'productId must be a number',
    })
        .int('productId must be an integer')
        .positive('productId must be a positive number'),
    quantity: zod_1.z
        .number({
        required_error: 'quantity is required',
        invalid_type_error: 'quantity must be a number',
    })
        .int('quantity must be an integer')
        .positive('quantity must be a positive number')
});
exports.productTransactionIdSchema = zod_1.z.object({
    productTransactionId: zod_1.z
        .number({
        required_error: 'productTransactionId is required',
        invalid_type_error: 'productTransactionId must be a number',
    })
        .int('productTransactionId must be an integer')
        .positive('productTransactionId must be a positive number'),
});
exports.deliverySchema = zod_1.z.object({
    productTransactionId: zod_1.z.number().positive().min(1, 'Product transaction ID is required'),
    locationId: zod_1.z.number().positive().optional().nullable(),
    receiverLat: zod_1.z.number().nullable().optional(),
    receiverLong: zod_1.z.number().nullable().optional(),
    address: zod_1.z.string().optional().nullable(),
    vehicleType: zod_1.z.nativeEnum(enum_1.VehicleType).default(enum_1.VehicleType.BIKE),
}).refine((data) => {
    if (data.locationId) {
        return ((data.receiverLat === null || data.receiverLat === undefined) &&
            (data.receiverLong === null || data.receiverLong === undefined) &&
            (data.address === null || data.address === undefined));
    }
    else {
        return (typeof data.receiverLat === 'number' &&
            typeof data.receiverLong === 'number');
    }
}, {
    message: 'If locationId is provided, receiverLat, receiverLong, and address must be null or undefined. Otherwise, receiverLat and receiverLong are required.',
    path: ['locationId'],
});
exports.addRatingSchema = zod_1.z.object({
    rating: zod_1.z.number().min(1).max(5),
    jobId: zod_1.z.number().int().min(1).optional(),
    orderId: zod_1.z.number().int().min(1).optional(),
}).refine((data) => (data.jobId ? !data.orderId : !!data.orderId), {
    message: "Either jobId or orderId must be provided, but not both.",
    path: ["jobId"],
});
exports.addReviewSchema = zod_1.z.object({
    review: zod_1.z.string(),
    jobId: zod_1.z.number().int().min(1).optional(),
    orderId: zod_1.z.number().int().min(1).optional()
}).refine((data) => (data.jobId ? !data.orderId : !!data.orderId), {
    message: "Either jobId or orderId must be provided, but not both",
    path: ["jobId"],
});
exports.commissionSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name is required"),
    rate: zod_1.z
        .number()
        .min(0, "Rate must be >= 0")
        .max(1, "Rate must be <= 1")
        .nullable()
        .optional(),
    type: zod_1.z.nativeEnum(enum_1.CommissionType).default(enum_1.CommissionType.PERCENTAGE),
    fixedAmount: zod_1.z
        .number()
        .min(0, "Fixed amount must be >= 0")
        .nullable()
        .optional(),
    minAmount: zod_1.z
        .number()
        .min(0, "Minimum amount must be >= 0")
        .nullable()
        .optional(),
    appliesTo: zod_1.z.nativeEnum(enum_1.CommissionScope),
    active: zod_1.z.boolean().optional().default(true),
    effectiveFrom: zod_1.z.coerce.date().nullable().optional(),
    effectiveTo: zod_1.z.coerce.date().nullable().optional(),
}).refine((data) => data.type === enum_1.CommissionType.PERCENTAGE ? data.rate != null : true, {
    message: "Rate is required when type is PERCENTAGE",
    path: ["rate"],
})
    .refine((data) => data.type === enum_1.CommissionType.FIXED ? data.fixedAmount != null : true, {
    message: "Fixed amount is required when type is FIXED",
    path: ["fixedAmount"],
});
exports.updateCommissionSchema = zod_1.z
    .object({
    name: zod_1.z.string().min(1, "Name is required").optional(),
    rate: zod_1.z
        .number()
        .min(0, "Rate must be >= 0")
        .max(1, "Rate must be <= 1")
        .nullable()
        .optional(),
    type: zod_1.z
        .nativeEnum(enum_1.CommissionType)
        .default(enum_1.CommissionType.PERCENTAGE)
        .optional(),
    fixedAmount: zod_1.z
        .number()
        .min(0, "Fixed amount must be >= 0")
        .nullable()
        .optional(),
    appliesTo: zod_1.z.nativeEnum(enum_1.CommissionScope).optional(),
    active: zod_1.z.boolean().optional().default(true),
    effectiveFrom: zod_1.z.coerce.date().nullable().optional(),
    effectiveTo: zod_1.z.coerce.date().nullable().optional(),
})
    .refine((data) => data.type === enum_1.CommissionType.PERCENTAGE ? data.rate != null : true, {
    message: "Rate is required when type is PERCENTAGE",
    path: ["rate"],
})
    .refine((data) => data.type === enum_1.CommissionType.FIXED ? data.fixedAmount != null : true, {
    message: "Fixed amount is required when type is FIXED",
    path: ["fixedAmount"],
})
    .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
    path: [],
});
exports.disputeSchema = zod_1.z.object({
    reason: zod_1.z
        .string({ required_error: "Reason is required" })
        .min(1, "Reason cannot be empty"),
    description: zod_1.z
        .string({ required_error: "Description is required" })
        .min(1, "Description cannot be empty"),
    // status: z
    //     .nativeEnum(DisputeStatus)
    //     .default(DisputeStatus.PENDING),
    url: zod_1.z
        .string()
        .url("Invalid URL format")
        .optional()
        .or(zod_1.z.literal("").transform(() => undefined)),
    jobId: zod_1.z
        .number()
        .int("Job ID must be an integer")
        .optional(),
    productTransactionId: zod_1.z
        .number()
        .int("Product Transaction ID must be an integer")
        .optional(),
    // reporterId: z
    //     .string()
    //     .uuid("Reporter ID must be a valid UUID")
    //     .optional(),
    partnerId: zod_1.z
        .string()
        .uuid("Partner ID must be a valid UUID")
        .optional(),
}).refine((data) => data.jobId || data.productTransactionId, {
    message: "Either jobId or productTransactionId must be provided",
    path: ["jobId"],
});
