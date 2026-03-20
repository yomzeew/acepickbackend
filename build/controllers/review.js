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
exports.deleteReview = exports.getReviewsForUser = exports.getMyReviews = exports.editReview = exports.giveReview = void 0;
const body_1 = require("../validation/body");
const prisma_1 = __importDefault(require("../config/prisma"));
const enum_1 = require("../utils/enum");
const modules_1 = require("../utils/modules");
const zod_1 = require("zod");
const giveReview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.user;
        const result = body_1.addReviewSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                message: "Invalid data",
                error: result.error.format()
            });
        }
        const { review, jobId, orderId } = result.data;
        let user;
        let job;
        let order;
        if (jobId) {
            const existingReview = yield prisma_1.default.review.findFirst({
                where: { jobId, clientUserId: id }
            });
            if (existingReview) {
                return (0, modules_1.handleResponse)(res, 400, false, 'You have already reviewed this job');
            }
            job = yield prisma_1.default.job.findUnique({
                where: { id: jobId },
                include: { professional: true }
            });
            if (!job) {
                return (0, modules_1.handleResponse)(res, 404, false, "Job not found");
            }
            if (job.status !== enum_1.JobStatus.APPROVED) {
                return (0, modules_1.handleResponse)(res, 400, false, "You can only review approved jobs");
            }
            if (job.clientId != id) {
                return (0, modules_1.handleResponse)(res, 403, false, "You are not authorized to review this job");
            }
            user = job.professional;
        }
        if (orderId) {
            const existingReview = yield prisma_1.default.review.findFirst({
                where: { orderId, clientUserId: id }
            });
            if (existingReview) {
                return (0, modules_1.handleResponse)(res, 400, false, 'You have already reviewed this order');
            }
            order = yield prisma_1.default.order.findUnique({
                where: { id: orderId },
                include: {
                    rider: true,
                    productTransaction: true
                }
            });
            if (!order) {
                return (0, modules_1.handleResponse)(res, 404, false, "Order not found");
            }
            if (order.status !== enum_1.OrderStatus.CONFIRM_DELIVERY) {
                return (0, modules_1.handleResponse)(res, 400, false, "You can only review orders that have been confirmed as delivered");
            }
            if (order.productTransaction.buyerId != id) {
                return (0, modules_1.handleResponse)(res, 403, false, "You are not authorized to review this order");
            }
            user = order.rider;
        }
        if (!user) {
            return (0, modules_1.handleResponse)(res, 404, false, "User not found");
        }
        if (!(user.role === enum_1.UserRole.PROFESSIONAL || user.role === enum_1.UserRole.DELIVERY)) {
            return (0, modules_1.handleResponse)(res, 400, false, "User is neither a professional nor delivery");
        }
        const reviewObj = yield prisma_1.default.review.create({
            data: Object.assign(Object.assign({ text: review, professionalUserId: user.id, clientUserId: id }, (user.role === enum_1.UserRole.DELIVERY ? { orderId } : {})), (user.role === enum_1.UserRole.PROFESSIONAL ? { jobId } : {}))
        });
        return (0, modules_1.successResponse)(res, 'success', { reviewObj });
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, 'error', "Internal server error");
    }
});
exports.giveReview = giveReview;
const editReview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { reviewId } = req.params;
        const { id } = req.user;
        const result = zod_1.z.object({
            review: zod_1.z.string().min(1)
        }).safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                message: "Invalid data",
                error: result.error.format()
            });
        }
        const { review } = result.data;
        const reviewObj = yield prisma_1.default.review.findUnique({ where: { id: BigInt(reviewId) } });
        if (!reviewObj) {
            return (0, modules_1.errorResponse)(res, 'error', "Review not found");
        }
        if (reviewObj.clientUserId !== id) {
            return (0, modules_1.errorResponse)(res, 'error', "You are not authorized to edit this review");
        }
        const updated = yield prisma_1.default.review.update({
            where: { id: BigInt(reviewId) },
            data: { text: review }
        });
        return (0, modules_1.successResponse)(res, 'success', { reviewObj: updated });
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, 'error', "Internal server error");
    }
});
exports.editReview = editReview;
// Get reviews received by the authenticated user (as a professional/delivery)
const getMyReviews = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.user;
        const reviews = yield prisma_1.default.review.findMany({
            where: { professionalUserId: id },
            include: {
                clientUser: {
                    include: {
                        profile: { select: { firstName: true, lastName: true, avatar: true } }
                    }
                },
                job: { select: { id: true, title: true, description: true } },
                order: { select: { id: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        // For each review, fetch the associated rating (same job/order + client)
        const reviewsWithRatings = yield Promise.all(reviews.map((review) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            const rating = yield prisma_1.default.rating.findFirst({
                where: Object.assign(Object.assign({ professionalUserId: id, clientUserId: review.clientUserId }, (review.jobId ? { jobId: review.jobId } : {})), (review.orderId ? { orderId: review.orderId } : {})),
            });
            return {
                id: review.id.toString(),
                text: review.text,
                rating: (_a = rating === null || rating === void 0 ? void 0 : rating.value) !== null && _a !== void 0 ? _a : null,
                createdAt: review.createdAt,
                jobTitle: (_c = (_b = review.job) === null || _b === void 0 ? void 0 : _b.title) !== null && _c !== void 0 ? _c : null,
                jobId: review.jobId,
                orderId: review.orderId,
                reviewer: ((_d = review.clientUser) === null || _d === void 0 ? void 0 : _d.profile) ? {
                    firstName: review.clientUser.profile.firstName,
                    lastName: review.clientUser.profile.lastName,
                    avatar: review.clientUser.profile.avatar,
                } : null,
            };
        })));
        // Calculate stats
        const ratingsOnly = reviewsWithRatings.filter(r => r.rating !== null).map(r => r.rating);
        const averageRating = ratingsOnly.length > 0
            ? ratingsOnly.reduce((a, b) => a + b, 0) / ratingsOnly.length
            : 0;
        return (0, modules_1.successResponse)(res, 'success', {
            reviews: reviewsWithRatings,
            total: reviewsWithRatings.length,
            averageRating: Math.round(averageRating * 10) / 10,
        });
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, 'error', "Internal server error");
    }
});
exports.getMyReviews = getMyReviews;
// Get reviews received by a specific user (public)
const getReviewsForUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const reviews = yield prisma_1.default.review.findMany({
            where: { professionalUserId: userId },
            include: {
                clientUser: {
                    include: {
                        profile: { select: { firstName: true, lastName: true, avatar: true } }
                    }
                },
                job: { select: { id: true, title: true, description: true } },
                order: { select: { id: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        const reviewsWithRatings = yield Promise.all(reviews.map((review) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            const rating = yield prisma_1.default.rating.findFirst({
                where: Object.assign(Object.assign({ professionalUserId: userId, clientUserId: review.clientUserId }, (review.jobId ? { jobId: review.jobId } : {})), (review.orderId ? { orderId: review.orderId } : {})),
            });
            return {
                id: review.id.toString(),
                text: review.text,
                rating: (_a = rating === null || rating === void 0 ? void 0 : rating.value) !== null && _a !== void 0 ? _a : null,
                createdAt: review.createdAt,
                jobTitle: (_c = (_b = review.job) === null || _b === void 0 ? void 0 : _b.title) !== null && _c !== void 0 ? _c : null,
                jobId: review.jobId,
                orderId: review.orderId,
                reviewer: ((_d = review.clientUser) === null || _d === void 0 ? void 0 : _d.profile) ? {
                    firstName: review.clientUser.profile.firstName,
                    lastName: review.clientUser.profile.lastName,
                    avatar: review.clientUser.profile.avatar,
                } : null,
            };
        })));
        const ratingsOnly = reviewsWithRatings.filter(r => r.rating !== null).map(r => r.rating);
        const averageRating = ratingsOnly.length > 0
            ? ratingsOnly.reduce((a, b) => a + b, 0) / ratingsOnly.length
            : 0;
        return (0, modules_1.successResponse)(res, 'success', {
            reviews: reviewsWithRatings,
            total: reviewsWithRatings.length,
            averageRating: Math.round(averageRating * 10) / 10,
        });
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, 'error', "Internal server error");
    }
});
exports.getReviewsForUser = getReviewsForUser;
const deleteReview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { reviewId } = req.params;
        const { id } = req.user;
        const reviewObj = yield prisma_1.default.review.findUnique({ where: { id: BigInt(reviewId) } });
        if (!reviewObj) {
            return (0, modules_1.errorResponse)(res, 'error', "Review not found");
        }
        if (reviewObj.clientUserId !== id) {
            return (0, modules_1.errorResponse)(res, 'error', "You are not authorized to delete this review");
        }
        yield prisma_1.default.review.delete({ where: { id: BigInt(reviewId) } });
        return (0, modules_1.successResponse)(res, 'success', { message: "Review deleted successfully" });
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, 'error', "Internal server error");
    }
});
exports.deleteReview = deleteReview;
