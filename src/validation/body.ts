import { z } from "zod";
import { CommissionType, CommissionScope, JobMode, OTPReason, RiderStatus, UserRole, VehicleType } from "../utils/enum"; // adjust the path
import { VerificationType } from "../utils/enum";


const otpBaseSchema = z.object({
    type: z.nativeEnum(VerificationType),
    reason: z.nativeEnum(OTPReason),
    email: z.string().email("Invalid email").optional(),
    phone: z.string().min(1, "Phone is required").optional(),
});

// Conditional logic based on type
export const otpRequestSchema = otpBaseSchema.superRefine((data, ctx) => {
    if ((data.type === VerificationType.EMAIL || data.type === VerificationType.BOTH) && !data.email) {
        ctx.addIssue({
            path: ["email"],
            code: z.ZodIssueCode.custom,
            message: "Email is required when type is 'email' or 'both'",
        });
    }

    if ((data.type === VerificationType.SMS || data.type === VerificationType.BOTH) && !data.phone) {
        ctx.addIssue({
            path: ["phone"],
            code: z.ZodIssueCode.custom,
            message: "Phone is required when type is 'phone' or 'both'",
        });
    }
});


const smsCodeSchema = z.object({
    phone: z.string().min(1, "Phone is required"),
    code: z.string().length(4, "Code must be exactly 4 characters"),
});

const emailCodeSchema = z.object({
    email: z.string().email("Invalid email"),
    code: z.string().length(4, "Code must be exactly 4 characters"),
});

export const verifyOTPSchema = z.object({
    smsCode: smsCodeSchema.nullable().optional(),
    emailCode: emailCodeSchema.nullable().optional(),
}).refine((data) => data.smsCode || data.emailCode, {
    message: "At least one of smsCode or emailCode must be provided",
});


export const registrationSchema = z.object({
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Phone number is too short"),
    password: z.string().min(4, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(4, "Confirm Password is required"),
    agreed: z.literal(true, {
        errorMap: () => ({ message: "You must agree to the terms and conditions" }),
    }),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    lga: z.string().min(1, "LGA is required"),
    state: z.string().min(1, "State is required"),
    address: z.string().min(1, "Address is required"),
    avatar: z.string().url("Avatar must be a valid URL").optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});


export const registrationProfSchema = z.object({
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Phone number is too short"),
    password: z.string().min(4, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(4, "Confirm Password is required"),
    agreed: z.literal(true, {
        errorMap: () => ({ message: "You must agree to the terms and conditions" }),
    }),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    lga: z.string().min(1, "LGA is required"),
    state: z.string().min(1, "State is required"),
    address: z.string().min(1, "Address is required"),
    professionId: z.number().int().positive("Professional ID must be a positive integer"),
    avatar: z.string().url("Avatar must be a valid URL").optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});



// Director schema
const directorSchema = z.object({
    firstName: z.string().min(1, "Director's first name is required"),
    lastName: z.string().min(1, "Director's last name is required"),
    email: z.string().email("Director's email is invalid"),
    phone: z.string().min(10, "Director's phone is required"),
    address: z.string().min(1, "Director's address is required"),
    state: z.string().min(1, "Director's state is required"),
    lga: z.string().min(1, "Director's LGA is required"),
})
// Cooperation schema
const cooperationSchema = z.object({
    avatar: z.string().url("Invalid avatar URL"),
    nameOfOrg: z.string().min(1, "Organization name is required"),
    phone: z.string().min(10, "Organization phone is required"),
    address: z.string().min(1, "Organization address is required"),
    state: z.string().min(1, "Organization state is required"),
    lga: z.string().min(1, "Organization LGA is required"),
    regNum: z.string().min(1, "Registration number is required"),
    professionId: z.number().int().positive("Profession ID must be a positive integer"),
    noOfEmployees: z.number().int().positive("Number of employees must be a positive integer"),
    director: directorSchema,
});

// Main user registration schema
export const registerCoporateSchema = z.object({
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Phone number is required"),
    password: z.string().min(4, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(4, "Confirm Password is required"),
    // role: z.literal("corperate", {
    //     errorMap: () => ({ message: "Role must be 'corperate'" }),
    // }),
    agreed: z.literal(true, {
        errorMap: () => ({ message: "You must agree to the terms and conditions" }),
    }),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    position: z.string().min(1, "Position is required"),
    cooperation: cooperationSchema,
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});


export const riderSchema = z.object({
    vehicleType: z.nativeEnum(VehicleType).optional().default(VehicleType.BIKE),
    licenseNumber: z.string().min(1, "License number is required"),
})

export const updateRiderSchema = z.object({
    vehicleType: z.nativeEnum(VehicleType).optional(),
    licenseNumber: z.string().min(1, "License number is required").optional(),
    status: z.nativeEnum(RiderStatus).optional(),
})

export const registerRiderSchema = z.object({
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Phone number is required"),
    password: z.string().min(4, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(4, "Confirm Password is required"),
    avatar: z.string().url("Avatar must be a valid URL").optional(),
    agreed: z.literal(true, {
        errorMap: () => ({ message: "You must agree to the terms and conditions" }),
    }),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    lga: z.string().min(1, "LGA is required"),
    state: z.string().min(1, "State is required"),
    address: z.string().min(1, "Address is required"),
    rider: riderSchema,
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});



export const updateUserProfileSchema = z.object({
    contact: z
        .object({
            email: z
                .string()
                .email('Invalid email address')
                .optional(),

            phone: z
                .string()
                .min(7, 'Phone number is too short')
                .optional(),
        })
        .optional(),

    bio: z
        .object({
            firstName: z.string().optional(),
            lastName: z.string().optional(),
            gender: z.enum(['male', 'female', 'other']).optional(),
            birthDate: z
                .coerce
                .date()
                .optional(),

            avatar: z.string().optional(),
        })
        .optional(),

    location: z
        .object({
            address: z.string().optional(),
            city: z.string().optional(),
            state: z.string().optional(),
            country: z.string().optional(),
        })
        .optional(),
});




export const jobPostSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    address: z.string().min(1, "Address is required"),
    numOfJobs: z.number().int().positive("Number of jobs must be a positive integer").optional(),
    professionalId: z.union([z.string().uuid("Professional ID must be a valid UUID"), z.string().min(1)]),
    mode: z.nativeEnum(JobMode).optional(),
    // Additional optional fields from frontend
    categoryId: z.string().optional(),
    startDate: z.string().datetime().optional(),
    deadline: z.string().datetime().optional(),
    budgetMin: z.number().positive("Minimum budget must be positive").optional(),
    budgetMax: z.number().positive("Maximum budget must be positive").optional(),
    priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
    state: z.string().optional(),
    lga: z.string().optional(),
    skillsRequired: z.array(z.string()).optional(),
});

export const jobUpdateSchema = z.object({
    jobId: z.number().int().positive("Job ID must be a positive integer").optional(),
    title: z.string().min(1, "Title is required").optional(),
    description: z.string().min(1, "Description is required").optional(),
    address: z.string().min(1, "Address is required").optional(),
    numOfJobs: z.number().int().positive("Number of jobs must be a positive integer").optional(),
    mode: z.nativeEnum(JobMode).optional(),
});

// Define the schema for a single Material
const materialSchema = z.object({
    description: z.string().min(1, "Description is required"),
    quantity: z.number().int().positive("Quantity must be a positive integer"),
    unit: z.string().max(20).optional().or(z.literal("").transform(() => undefined)),
    price: z.number().int().positive("Price must be a positive integer"),
});

const materialUpdateSchema = z.object({
    id: z.number().int().positive().optional(),
    description: z.string().min(1, "Description is required"),
    quantity: z.number().int().positive("Quantity must be a positive integer"),
    unit: z.string().max(20).optional().or(z.literal("").transform(() => undefined)),
    price: z.number().int().positive("Price must be a positive integer"),
});

// Full request body schema with optional `materials`
export const jobCostingSchema = z.object({
    jobId: z.number().int().positive("Job ID must be a positive integer"),
    durationUnit: z.string().min(1, "Duration unit is required"),
    durationValue: z.number().int().positive("Duration value must be a positive integer"),
    workmanship: z.number().int().nonnegative("Workmanship must be a non-negative integer"),
    materials: z.array(materialSchema).optional(),
});

export const jobCostingUpdateSchema = z.object({
    durationUnit: z.string().min(1, "Duration unit is required").optional(),
    durationValue: z.number().int().positive("Duration value must be a positive integer").optional(),
    workmanship: z.number().int().nonnegative("Workmanship must be a non-negative integer").optional(),
    materials: z.array(materialUpdateSchema).optional(),
});


// export const paymentSchema = z.object({
//     amount: z.number().positive("Amount must be a positive number"),
//     paidFor: z.string().min(1, "paidFor is required"),
//     pin: z.string().length(4, "PIN must be exactly 4 characters"),
//     jobId: z.number().int().positive("Job ID must be a positive integer"),
// });

export const storeLocationSchema = z.object({
    address: z.string(),
    lga: z.string().optional(),
    state: z.string().optional(),
    latitude: z.number(),
    longitude: z.number(),
    zipcode: z.number().int().optional(),
});


export const updateLocationSchema = z.object({
    address: z.string().optional(),
    lga: z.string().optional(),
    state: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    zipcode: z.number().int().optional(),
});

export const bankDetailsSchema = z.object({
    accountName: z.string().min(1, 'Account name is required'),
    bank: z.string().min(1, 'Bank is required'),
    bankCode: z.string().min(1, 'Bank code is required'),
    accountNumber: z
        .string()
        .regex(/^\d{10}$/, 'Account number must be exactly 10 digits'),
});

export const resolveBankSchema = z.object({
    bankCode: z.string().min(1, 'Bank code is required'),
    accountNumber: z
        .string()
        .regex(/^\d{10}$/, 'Account number must be exactly 10 digits'),
})


export const paymentSchema = z.object({
    amount: z.number().positive('Amount must be a positive number'),
    pin: z.string().regex(/^\d{4}$/, 'PIN must be exactly 4 digits'),
    reason: z.string().min(1, 'Reason is required'),
    jobId: z.number().int().positive("Job ID must be a positive integer"),
});


export const productPaymentSchema = z.object({
    amount: z.number().positive('Amount must be a positive number'),
    pin: z.string().regex(/^\d{4}$/, 'PIN must be exactly 4 digits'),
    reason: z.string().min(1, 'Reason is required').optional(),
    productTransactionId: z.number().int().positive("Job ID must be a positive integer"),
});


export const withdrawSchema = z.object({
    amount: z
        .number({
            required_error: 'Amount is required',
            invalid_type_error: 'Amount must be a number',
        })
        .positive('Amount must be greater than zero'),

    recipientCode: z
        .string()
        .min(1, 'Recipient code is required'),

    pin: z
        .string()
        .min(4, 'PIN must be at least 4 digits'),

    reason: z
        .string()
        .optional()
        .default('Withdrawal'),
});



export const pinResetSchema = z
    .object({
        newPin: z.string().regex(/^\d{4}$/, 'PIN must be exactly 4 digits'),
        oldPin: z.string().regex(/^\d{4}$/, 'Confirm PIN must be exactly 4 digits'),
    })
// .refine((data) => data.newPin === data.newPinconfirm, {
//     message: "PINs do not match",
//     path: ['newPinconfirm'], // Error will show under `newPinconfirm`
// });

export const pinForgotSchema = z
    .object({
        newPin: z.string().regex(/^\d{4}$/, 'PIN must be exactly 4 digits'),
        newPinConfirm: z.string().regex(/^\d{4}$/, 'Confirm PIN must be exactly 4 digits'),
    })
    .refine((data) => data.newPin === data.newPinConfirm, {
        message: "PINs do not match",
        path: ['newPinconfirm'], // Error will show under `newPinconfirm`
    });


export const educationSchema = z.object({
    school: z.string().min(1, 'School is required'),
    degreeType: z.string().min(1, 'Degree type is required'),
    course: z.string().min(1, 'Course is required'),
    startDate: z
        .coerce
        .date({ required_error: 'Start date is required', invalid_type_error: 'Start date must be a valid date' }),

    gradDate: z
        .coerce
        .date({ invalid_type_error: 'Graduation date must be a valid date' })
        .optional(),
    isCurrent: z.boolean().optional(),
}).refine(
    (data) => {
        // If gradDate is provided, isCurrent must be undefined or false
        if (data.gradDate) {
            return data.isCurrent !== true; // Must be false or undefined
        }
        return true;
    },
    {
        message: 'isCurrent must be false or not set if gradDate is provided',
        path: ['isCurrent'], // Attach error to the isCurrent field
    }
);



export const updateEducationSchema = z.object({
    school: z
        .string()
        .min(1, 'School is required')
        .optional()
        .refine(val => val === undefined || val.trim().length > 0, {
            message: 'School cannot be empty',
        }),

    degreeType: z
        .string()
        .min(1, 'Degree type is required')
        .optional()
        .refine(val => val === undefined || val.trim().length > 0, {
            message: 'Degree type cannot be empty',
        }),

    course: z
        .string()
        .min(1, 'Course is required')
        .optional()
        .refine(val => val === undefined || val.trim().length > 0, {
            message: 'Course cannot be empty',
        }),

    startDate: z
        .coerce
        .date({
            required_error: 'Start date is required',

            invalid_type_error: 'Start date must be a valid date'
        }).optional(),

    gradDate: z
        .coerce
        .date({ invalid_type_error: 'Graduation date must be a valid date' })
        .optional()
        .nullable(),

    isCurrent: z.boolean().optional(),
}).refine(
    (data) => {
        // If gradDate is provided (not null/undefined), isCurrent must not be true
        if (data.gradDate) {
            return data.isCurrent !== true;
        }
        return true;
    },
    {
        message: 'isCurrent must be false or not set if gradDate is provided',
        path: ['isCurrent'],
    }
);


export const certificationSchema = z.object({
    title: z.string().min(1, 'Title is required'),

    filePath: z.string(),

    companyIssue: z.string().min(1, 'Issuing company is required'),

    date: z.coerce.date({ invalid_type_error: 'Date must be a valid date' }),

    // profileId: z
    //     .number({
    //         required_error: 'Profile ID is required',
    //         invalid_type_error: 'Profile ID must be a number',
    //     })
    //     .int('Profile ID must be an integer'),
});



export const updateCertificationSchema = z.object({
    title: z.string().min(1, 'Title is required').optional(),

    filePath: z.string().optional(),

    companyIssue: z.string().min(1, 'Issuing company is required').optional(),

    date: z.coerce.date({ invalid_type_error: 'Date must be a valid date' }).optional(),
});




export const experienceSchema = z.object({
    postHeld: z.string().min(1, 'Post held is required'),

    workPlace: z.string().min(1, 'Workplace is required'),

    startDate: z
        .coerce
        .date({ required_error: 'Start date is required', invalid_type_error: 'Start date must be a valid date' }),

    endDate: z
        .coerce
        .date({ invalid_type_error: 'End date must be a valid date' })
        .optional(),

    isCurrent: z
        .boolean()
        .optional(),

    description: z
        .string()
        .optional(),

    // profileId: z
    //     .number({
    //         required_error: 'Profile ID is required',
    //         invalid_type_error: 'Profile ID must be a number',
    //     })
    //     .int('Profile ID must be an integer'),
});


export const updateExperienceSchema = z.object({
    postHeld: z
        .string()
        .min(1, 'Post held cannot be empty')
        .optional()
        .describe('The job title or position held by the individual.'),

    workPlace: z
        .string()
        .min(1, 'Workplace cannot be empty')
        .optional()
        .describe('The company or organization where the job was held.'),

    startDate: z
        .coerce
        .date({ required_error: 'Start date is required', invalid_type_error: 'Start date must be a valid date' })
        .optional()
        .describe('The date when the job started (ISO string).'),

    endDate: z
        .coerce
        .date({ invalid_type_error: 'End date must be a valid date' })
        .optional()
        .describe('The date when the job ended (optional if still current).'),

    isCurrent: z
        .boolean()
        .optional()
        .describe('Whether the job is currently held.'),

    description: z
        .string()
        .optional()
        .describe('A summary or description of the responsibilities and achievements.'),

    // profileId: z
    //     .number()
    //     .int('Profile ID must be an integer')
    //     .optional()
    //     .describe('ID of the profile this experience is associated with.'),
});


export const portfolioSchema = z.object({
    title: z
        .string()
        .min(1, 'Title is required')
        .describe('The title of the portfolio project.'),

    description: z
        .string()
        .min(1, 'Description is required')
        .describe('A detailed description of the project.'),

    duration: z
        .string()
        .min(1, 'Duration is required')
        .max(50, 'Duration must not exceed 50 characters')
        .describe('The duration of the project (e.g. "3 months").'),

    date: z
        .coerce
        .date()
        .describe('The date the project was completed.'),

    file: z
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


export const updatePortfolioSchema = z.object({
    title: z
        .string()
        .min(1, 'Title cannot be empty')
        .optional()
        .describe('The title of the portfolio project.'),

    description: z
        .string()
        .min(1, 'Description cannot be empty')
        .optional()
        .describe('A detailed description of the project.'),

    duration: z
        .string()
        .min(1, 'Duration cannot be empty')
        .max(50, 'Duration must not exceed 50 characters')
        .optional()
        .describe('The duration of the project (e.g. "3 months").'),

    date: z
        .coerce
        .date()
        .optional()
        .describe('The date the project was completed.'),

    file: z
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

export const createProductSchema = z.object({
    name: z
        .string()
        .min(1, 'Product name is required'),

    description: z
        .string()
        .min(1, 'Product description is required')
        .optional(),

    images: z
        .array(
            z.string().min(1, 'Image path cannot be empty')
        )
        .optional()
        .default([]),

    categoryId: z
        .number({
            required_error: 'Category ID is required',
            invalid_type_error: 'Category ID must be a number',
        }),

    quantity: z
        .number({
            required_error: 'Quantity is required',
            invalid_type_error: 'Quantity must be a number',
        })
        .int('Quantity must be an integer')
        .nonnegative('Quantity cannot be negative'),

    price: z
        .number({
            required_error: 'Price is required',
            invalid_type_error: 'Price must be a number',
        })
        .positive('Price must be greater than zero'),

    discount: z
        .number()
        .min(0, 'Discount cannot be negative')
        .max(100, 'Discount cannot be more than 100%')
        .optional(),

    weightPerUnit: z
        .number()
        .positive('Weight must be positive')
        .optional(),

    locationId: z
        .number({
            invalid_type_error: 'Location ID must be a number',
        })
        .optional(),

    state: z.string().optional(),
    lga: z.string().optional(),
    address: z.string().optional(),
});

export const updateProductSchema = z.object({
    name: z.
        string()
        .min(1, 'Product name is required')
        .optional(),


    description: z.
        string()
        .min(1, 'Product description is required')
        .optional(),


    categoryId: z.
        number({
            required_error: 'Category ID is required',
            invalid_type_error: 'Category ID must be a number',
        })
        .optional(),


    quantity: z
        .number({
            required_error: 'Quantity is required',
            invalid_type_error: 'Quantity must be a number',
        })
        .int('Quantity must be an integer')
        .nonnegative('Quantity cannot be negative')
        .optional(),


    price: z
        .number({
            required_error: 'Price is required',
            invalid_type_error: 'Price must be a number',
        })
        .positive('Price must be greater than zero')
        .optional(),


    discount: z
        .number()
        .min(0, 'Discount cannot be negative')
        .max(100, 'Discount cannot be more than 100%')
        .optional(),


    locationId: z
        .number({
            required_error: 'Location ID is required',
            invalid_type_error: 'Location ID must be a number',
        })
        .optional(),
})



export const initPaymentSchema = z
    .object({
        amount: z
            .number({
                required_error: 'Amount is required',
                invalid_type_error: 'Amount must be a number',
            })
            .positive('Amount must be greater than zero'),

        description: z.preprocess(
            (val) => (typeof val === 'string' ? val.toLowerCase() : val),
            z.enum(['job payment', 'product payment', 'product_order payment', 'wallet topup'], {
                errorMap: () => ({
                    message:
                        'Description must be one of: "Job Payment", "Product Payment", "Product_Order Payment", or "Wallet Topup"',
                }),
            })
        ),

        jobId: z
            .number({
                invalid_type_error: 'jobId must be a number',
            })
            .int('jobId must be an integer')
            .positive('jobId must be a positive number')
            .optional(),

        productTransactionId: z
            .number({
                invalid_type_error: 'productTransactionId must be a number',
            })
            .int('productTransactionId must be an integer')
            .positive('productTransactionId must be a positive number')
            .optional(),
    })

    // Validate jobId for job payment
    .refine(
        (data) => {
            if (data.description !== 'job payment') return true;
            return typeof data.jobId === 'number' && data.jobId > 0;
        },
        {
            message:
                'jobId must be a positive integer for "Job Payment", and must be null or omitted otherwise',
            path: ['jobId'],
        }
    )

    // Validate jobId for wallet topup
    .refine(
        (data) => {
            if (data.description !== 'wallet topup') return true;
            return data.jobId === undefined || data.jobId === null;
        },
        {
            message: 'jobId must be null or omitted for "Wallet Topup"',
            path: ['jobId'],
        }
    )

    // Validate productTransactionId for product payment
    .refine(
        (data) => {
            if (data.description !== 'product payment') return true;
            return typeof data.productTransactionId === 'number' && data.productTransactionId > 0;
        },
        {
            message:
                'productTransactionId must be a positive integer for "Product Payment", and must be null or omitted otherwise',
            path: ['productTransactionId'],
        }
    )

    // Validate productTransactionId for product_job payment
    .refine(
        (data) => {
            if (data.description !== 'product_order payment') return true;
            return typeof data.productTransactionId === 'number' && data.productTransactionId > 0;
        },
        {
            message:
                'productTransactionId must be a positive integer for "Product_Order Payment", and must be null or omitted otherwise',
            path: ['productTransactionId'],
        }
    )

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


export const selectProductSchema = z.object({
    productId: z
        .number({
            required_error: 'productId is required',
            invalid_type_error: 'productId must be a number',
        })
        .int('productId must be an integer')
        .positive('productId must be a positive number'),

    quantity: z
        .number({
            invalid_type_error: 'quantity must be a number',
        })
        .int('quantity must be an integer')
        .positive('quantity must be a positive number')
        .default(1),

    orderMethod: z.enum(['delivery', 'self_pickup']).optional()
});


export const restockProductSchema = z.object({
    productId: z
        .number({
            required_error: 'productId is required',
            invalid_type_error: 'productId must be a number',
        })
        .int('productId must be an integer')
        .positive('productId must be a positive number'),

    quantity: z
        .number({
            required_error: 'quantity is required',
            invalid_type_error: 'quantity must be a number',
        })
        .int('quantity must be an integer')
        .positive('quantity must be a positive number')
});


export const productTransactionIdSchema = z.object({
    productTransactionId: z
        .number({
            required_error: 'productTransactionId is required',
            invalid_type_error: 'productTransactionId must be a number',
        })
        .int('productTransactionId must be an integer')
        .positive('productTransactionId must be a positive number'),
});


export const deliverySchema = z.object({
    productTransactionId: z.number().positive().min(1, 'Product transaction ID is required'),
    locationId: z.number().positive().optional().nullable(),
    receiverLat: z.number().nullable().optional(),
    receiverLong: z.number().nullable().optional(),
    address: z.string().optional().nullable(),
    vehicleType: z.nativeEnum(VehicleType).default(VehicleType.BIKE),
}).refine((data) => {
    if (data.locationId) {
        return (
            (data.receiverLat === null || data.receiverLat === undefined) &&
            (data.receiverLong === null || data.receiverLong === undefined) &&
            (data.address === null || data.address === undefined)
        );
    } else {
        return (
            typeof data.receiverLat === 'number' &&
            typeof data.receiverLong === 'number'
        );
    }
}, {
    message: 'If locationId is provided, receiverLat, receiverLong, and address must be null or undefined. Otherwise, receiverLat and receiverLong are required.',
    path: ['locationId'],
});

export const addRatingSchema = z.object({
    rating: z.number().min(1).max(5),
    jobId: z.number().int().min(1).optional(),
    orderId: z.number().int().min(1).optional(),
}).refine(
    (data) => (data.jobId ? !data.orderId : !!data.orderId),
    {
        message: "Either jobId or orderId must be provided, but not both.",
        path: ["jobId"],
    }
);

export const addReviewSchema = z.object({
    review: z.string(),
    jobId: z.number().int().min(1).optional(),
    orderId: z.number().int().min(1).optional()
}).refine(
    (data) => (data.jobId ? !data.orderId : !!data.orderId),
    {
        message: "Either jobId or orderId must be provided, but not both",
        path: ["jobId"],
    }
)


export const commissionSchema = z.object({
    name: z.string().min(1, "Name is required"),

    rate: z
        .number()
        .min(0, "Rate must be >= 0")
        .max(1, "Rate must be <= 1")
        .nullable()
        .optional(),

    type: z.nativeEnum(CommissionType).default(CommissionType.PERCENTAGE),

    fixedAmount: z
        .number()
        .min(0, "Fixed amount must be >= 0")
        .nullable()
        .optional(),

    minAmount: z
        .number()
        .min(0, "Minimum amount must be >= 0")
        .nullable()
        .optional(),

    appliesTo: z.nativeEnum(CommissionScope),

    active: z.boolean().optional().default(true),

    effectiveFrom: z.coerce.date().nullable().optional(),

    effectiveTo: z.coerce.date().nullable().optional(),
}).refine(
    (data) =>
        data.type === CommissionType.PERCENTAGE ? data.rate != null : true,
    {
        message: "Rate is required when type is PERCENTAGE",
        path: ["rate"],
    }
)
    .refine(
        (data) =>
            data.type === CommissionType.FIXED ? data.fixedAmount != null : true,
        {
            message: "Fixed amount is required when type is FIXED",
            path: ["fixedAmount"],
        }
    );


export const updateCommissionSchema = z
    .object({
        name: z.string().min(1, "Name is required").optional(),

        rate: z
            .number()
            .min(0, "Rate must be >= 0")
            .max(1, "Rate must be <= 1")
            .nullable()
            .optional(),

        type: z
            .nativeEnum(CommissionType)
            .default(CommissionType.PERCENTAGE)
            .optional(),

        fixedAmount: z
            .number()
            .min(0, "Fixed amount must be >= 0")
            .nullable()
            .optional(),

        appliesTo: z.nativeEnum(CommissionScope).optional(),

        active: z.boolean().optional().default(true),

        effectiveFrom: z.coerce.date().nullable().optional(),

        effectiveTo: z.coerce.date().nullable().optional(),
    })
    .refine(
        (data) =>
            data.type === CommissionType.PERCENTAGE ? data.rate != null : true,
        {
            message: "Rate is required when type is PERCENTAGE",
            path: ["rate"],
        }
    )
    .refine(
        (data) =>
            data.type === CommissionType.FIXED ? data.fixedAmount != null : true,
        {
            message: "Fixed amount is required when type is FIXED",
            path: ["fixedAmount"],
        }
    )
    .refine(
        (data) => Object.keys(data).length > 0,
        {
            message: "At least one field must be provided",
            path: [],
        }
    );


export const disputeSchema = z.object({
    reason: z
        .string({ required_error: "Reason is required" })
        .min(1, "Reason cannot be empty"),

    description: z
        .string({ required_error: "Description is required" })
        .min(1, "Description cannot be empty"),

    // status: z
    //     .nativeEnum(DisputeStatus)
    //     .default(DisputeStatus.PENDING),

    url: z
        .string()
        .url("Invalid URL format")
        .optional()
        .or(z.literal("").transform(() => undefined)),

    jobId: z
        .number()
        .int("Job ID must be an integer")
        .optional(),

    productTransactionId: z
        .number()
        .int("Product Transaction ID must be an integer")
        .optional(),

    // reporterId: z
    //     .string()
    //     .uuid("Reporter ID must be a valid UUID")
    //     .optional(),

    partnerId: z
        .string()
        .uuid("Partner ID must be a valid UUID")
        .optional(),
}).refine(
    (data) => data.jobId || data.productTransactionId,
    {
        message: "Either jobId or productTransactionId must be provided",
        path: ["jobId"],
    }
);

export const returnRequestSchema = z.object({
    reason: z
        .string({ required_error: "Reason is required" })
        .min(1, "Reason cannot be empty"),

    description: z
        .string({ required_error: "Description is required" })
        .min(5, "Description must be at least 5 characters"),

    evidence: z
        .string()
        .url("Evidence must be a valid URL")
        .optional()
        .or(z.literal("").transform(() => undefined)),

    productTransactionId: z
        .number({ required_error: "Product transaction ID is required" })
        .int("Product transaction ID must be an integer")
        .positive("Product transaction ID must be positive"),
});

export const sellerRejectSchema = z.object({
    reason: z
        .string({ required_error: "Reason is required" })
        .min(1, "Please provide a reason for rejection"),
});
