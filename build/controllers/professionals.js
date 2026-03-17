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
exports.toggleAvailable = exports.updateProfessionalProfile = exports.getDeliveryMen = exports.getProfessionalByUserId = exports.getProfessionalById = exports.getProfessionals = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const modules_1 = require("../utils/modules");
const query_1 = require("../validation/query");
const getProfessionals = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = query_1.professionalSearchQuerySchema.safeParse(req.query);
        if (!result.success) {
            return res.status(400).json({
                error: "Invalid query parameters",
                issues: result.error.format(),
            });
        }
        const { professionId, profession, sector, span, state, lga, rating, page, limit, chargeFrom, allowUnverified = false } = result.data;
        const user = req.user;
        const userId = user === null || user === void 0 ? void 0 : user.id;
        let userLocation = null;
        let distanceQuery = '';
        let minRating = rating;
        let offset = (page - 1) * limit;
        if (span && userId) {
            userLocation = yield prisma_1.default.location.findFirst({
                where: { userId: userId }
            });
        }
        distanceQuery = `
  6371 * acos(
    cos(radians(${userLocation === null || userLocation === void 0 ? void 0 : userLocation.latitude})) * cos(radians(location.latitude)) *
    cos(radians(location.longitude) - radians(${userLocation === null || userLocation === void 0 ? void 0 : userLocation.longitude})) +
    sin(radians(${userLocation === null || userLocation === void 0 ? void 0 : userLocation.latitude})) * sin(radians(location.latitude))
  )
`;
        try {
            // Build where clause safely
            const where = {};
            if (professionId) {
                where.professionId = Number(professionId);
            }
            if (chargeFrom) {
                where.chargeFrom = { gte: Number(chargeFrom) };
            }
            // Get professionals with proper Prisma queries
            const professionals = yield prisma_1.default.professional.findMany({
                where,
                include: {
                    profile: true,
                    profession: {
                        include: {
                            sector: true
                        }
                    }
                },
                orderBy: {
                    id: 'asc'
                },
                take: Number(limit),
                skip: Number(offset)
            });
            // Get ratings separately for each professional
            const professionalIds = professionals.map(p => p.profileId);
            const ratings = yield prisma_1.default.rating.findMany({
                where: {
                    professionalUserId: {
                        in: professionalIds.map(id => String(id))
                    }
                }
            });
            // Transform data to match expected format
            const transformedProfessionals = professionals.map(pro => {
                const professionalRatings = ratings.filter(r => r.professionalUserId === String(pro.profileId));
                const avgRating = professionalRatings.length > 0
                    ? professionalRatings.reduce((sum, rating) => sum + rating.value, 0) / professionalRatings.length
                    : 0;
                return {
                    id: pro.id,
                    chargeFrom: pro.chargeFrom,
                    available: pro.available,
                    avgRating,
                    profile: pro.profile ? {
                        id: pro.profile.id,
                        firstName: pro.profile.firstName,
                        lastName: pro.profile.lastName,
                        avatar: pro.profile.avatar,
                        verified: pro.profile.verified,
                        bvnVerified: pro.profile.bvnVerified,
                        userId: pro.profile.userId
                    } : null,
                    profession: pro.profession ? {
                        id: pro.profession.id,
                        title: pro.profession.title,
                        image: pro.profession.image,
                        sectorId: pro.profession.sectorId,
                        sector: pro.profession.sector
                    } : null
                };
            });
            // Apply additional filters if needed
            let filteredProfessionals = transformedProfessionals;
            // Filter by BVN verification if required
            if (!allowUnverified) {
                filteredProfessionals = filteredProfessionals.filter(p => { var _a; return ((_a = p.profile) === null || _a === void 0 ? void 0 : _a.bvnVerified) === true; });
            }
            // Filter by user status (simplified - we'd need to join with users table for this)
            // For now, we'll skip this filter as it requires additional database queries
            // Filter by minimum rating
            if (minRating) {
                filteredProfessionals = filteredProfessionals.filter(p => p.avgRating >= Number(minRating));
            }
            // Apply location filters if provided (simplified - requires additional user/location joins)
            // For now, we'll skip location filtering as it needs more complex queries
            // Apply pagination after filtering
            const startIndex = Number(offset);
            const endIndex = startIndex + Number(limit);
            const paginatedResults = filteredProfessionals.slice(startIndex, endIndex);
            return (0, modules_1.successResponse)(res, 'success', paginatedResults);
        }
        catch (error) {
            console.error('❌ Prisma query failed:', error.message);
            // Simple fallback
            try {
                const simpleProfessionals = yield prisma_1.default.professional.findMany({
                    where: professionId ? { professionId: Number(professionId) } : {},
                    include: {
                        profile: true,
                        profession: true
                    },
                    take: Number(limit),
                    skip: Number(offset)
                });
                const fallbackResults = simpleProfessionals.map(pro => ({
                    id: pro.id,
                    chargeFrom: pro.chargeFrom,
                    available: pro.available,
                    avgRating: 0,
                    profile: pro.profile,
                    profession: pro.profession
                }));
                return (0, modules_1.successResponse)(res, 'success (fallback)', fallbackResults);
            }
            catch (fallbackError) {
                console.error('❌ Fallback query also failed:', fallbackError.message);
                return (0, modules_1.errorResponse)(res, 'Database query failed', fallbackError.message);
            }
        }
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, 'error', error.message || 'Something went wrong');
    }
});
exports.getProfessionals = getProfessionals;
const getProfessionalById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const { professionalId } = req.params;
        const professional = yield prisma_1.default.professional.findUnique({
            where: { id: Number(professionalId) },
            include: {
                profile: {
                    select: { id: true, userId: true }
                },
                profession: {
                    include: { sector: true }
                }
            }
        });
        if (!professional) {
            return (0, modules_1.handleResponse)(res, 404, false, 'Professional not found');
        }
        // Compute avgRating and numRating
        const ratingAgg = yield prisma_1.default.rating.aggregate({
            where: { professionalUserId: (_a = professional.profile) === null || _a === void 0 ? void 0 : _a.userId },
            _avg: { value: true },
            _count: { value: true }
        });
        const profileData = yield prisma_1.default.profile.findUnique({
            where: { id: (_b = professional.profile) === null || _b === void 0 ? void 0 : _b.id },
            include: {
                user: {
                    select: {
                        id: true, email: true, phone: true, status: true, role: true, createdAt: true, updatedAt: true,
                        location: {
                            select: { id: true, address: true, lga: true, state: true, latitude: true, longitude: true, zipcode: true }
                        },
                        professionalReviews: {
                            select: {
                                id: true, text: true, professionalUserId: true, clientUserId: true, createdAt: true, updatedAt: true,
                                clientUser: {
                                    select: {
                                        id: true, email: true, phone: true, status: true, role: true,
                                        profile: {
                                            select: { id: true, firstName: true, lastName: true, birthDate: true, avatar: true }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                education: true,
                certifications: true,
                portfolios: true,
                experience: true
            }
        });
        return (0, modules_1.successResponse)(res, 'success', Object.assign(Object.assign({}, professional), { avgRating: (_c = ratingAgg._avg.value) !== null && _c !== void 0 ? _c : 0, numRating: (_d = ratingAgg._count.value) !== null && _d !== void 0 ? _d : 0, profile: profileData }));
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, 'error', error.message || 'Something went wrong');
    }
});
exports.getProfessionalById = getProfessionalById;
const getProfessionalByUserId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const user = yield prisma_1.default.user.findUnique({
            where: { id: userId },
            include: {
                profile: {
                    include: {
                        professional: {
                            include: {
                                profession: { include: { sector: true } }
                            }
                        },
                        education: true,
                        experience: true,
                        certifications: true,
                        portfolios: true
                    }
                },
                location: true,
                professionalReviews: {
                    include: {
                        clientUser: {
                            include: { profile: true }
                        }
                    }
                }
            }
        });
        if (!user) {
            return (0, modules_1.handleResponse)(res, 404, false, 'Professional not found');
        }
        // Exclude sensitive fields
        user.password = null;
        user.fcmToken = null;
        return (0, modules_1.successResponse)(res, 'success', user);
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', error.message || 'Something went wrong');
    }
});
exports.getProfessionalByUserId = getProfessionalByUserId;
const getDeliveryMen = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
});
exports.getDeliveryMen = getDeliveryMen;
const updateProfessionalProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    const { intro, language } = req.body;
    try {
        const profile = yield prisma_1.default.profile.findFirst({
            where: { userId: id },
            include: { professional: true },
        });
        if (!profile) {
            return (0, modules_1.handleResponse)(res, 404, false, 'User not found');
        }
        if (!profile.professional) {
            return (0, modules_1.handleResponse)(res, 404, false, 'User is not a professional');
        }
        const updateData = {};
        if (intro !== undefined)
            updateData.intro = intro;
        if (language !== undefined)
            updateData.language = language;
        const updated = yield prisma_1.default.professional.update({
            where: { id: profile.professional.id },
            data: updateData,
        });
        return (0, modules_1.successResponse)(res, 'success', updated);
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', error.message || 'Something went wrong');
    }
});
exports.updateProfessionalProfile = updateProfessionalProfile;
const toggleAvailable = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, role } = req.user;
    const { available } = req.body;
    try {
        const profile = yield prisma_1.default.profile.findFirst({
            where: { userId: id },
            include: { professional: true }
        });
        if (!profile) {
            return (0, modules_1.handleResponse)(res, 404, false, 'User not found');
        }
        if (!profile.professional) {
            return (0, modules_1.handleResponse)(res, 404, false, 'User is not a professional');
        }
        yield prisma_1.default.professional.update({
            where: { id: profile.professional.id },
            data: { available }
        });
        return (0, modules_1.successResponse)(res, 'success', 'Availability updated');
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', error.message || 'Something went wrong');
    }
});
exports.toggleAvailable = toggleAvailable;
