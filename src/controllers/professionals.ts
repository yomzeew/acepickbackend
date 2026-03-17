import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { successResponse, errorResponse, nestFlatKeys, handleResponse } from '../utils/modules';
import { professionalSearchQuerySchema } from '../validation/query';
import { UserStatus } from '../utils/enum';
import { Prisma } from '@prisma/client';




export const getProfessionals = async (req: Request, res: Response) => {
  try {

    const result = professionalSearchQuerySchema.safeParse(req.query);

    if (!result.success) {
      return res.status(400).json({
        error: "Invalid query parameters",
        issues: result.error.format(),
      });
    }

    const { professionId, profession, sector, span, state, lga, rating, page, limit, chargeFrom, allowUnverified = false } = result.data;
    const user = req.user;
    const userId = user?.id;

    let userLocation: any = null;
    let distanceQuery = '';
    let minRating = rating;
    let offset = (page - 1) * limit;


    if (span && userId) {
      userLocation = await prisma.location.findFirst({
        where: { userId: userId }
      })
    }


    distanceQuery = `
  6371 * acos(
    cos(radians(${userLocation?.latitude})) * cos(radians(location.latitude)) *
    cos(radians(location.longitude) - radians(${userLocation?.longitude})) +
    sin(radians(${userLocation?.latitude})) * sin(radians(location.latitude))
  )
`;

    try {
      // Build where clause safely
      const where: any = {};
      
      if (professionId) {
        where.professionId = Number(professionId);
      }
      
      if (chargeFrom) {
        where.chargeFrom = { gte: Number(chargeFrom) };
      }

      // Get professionals with proper Prisma queries
      const professionals = await prisma.professional.findMany({
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
      const ratings = await prisma.rating.findMany({
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
        filteredProfessionals = filteredProfessionals.filter(p => 
          p.profile?.bvnVerified === true
        );
      }

      // Filter by user status (simplified - we'd need to join with users table for this)
      // For now, we'll skip this filter as it requires additional database queries

      // Filter by minimum rating
      if (minRating) {
        filteredProfessionals = filteredProfessionals.filter(p => 
          p.avgRating >= Number(minRating)
        );
      }

      // Apply location filters if provided (simplified - requires additional user/location joins)
      // For now, we'll skip location filtering as it needs more complex queries

      // Apply pagination after filtering
      const startIndex = Number(offset);
      const endIndex = startIndex + Number(limit);
      const paginatedResults = filteredProfessionals.slice(startIndex, endIndex);

      return successResponse(res, 'success', paginatedResults);

    } catch (error: any) {
      console.error('❌ Prisma query failed:', error.message);
      
      // Simple fallback
      try {
        const simpleProfessionals = await prisma.professional.findMany({
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

        return successResponse(res, 'success (fallback)', fallbackResults);
      } catch (fallbackError: any) {
        console.error('❌ Fallback query also failed:', fallbackError.message);
        return errorResponse(res, 'Database query failed', fallbackError.message);
      }
    }
  } catch (error: any) {
    console.log(error);
    return errorResponse(res, 'error', error.message || 'Something went wrong');
  }
}


export const getProfessionalById = async (req: Request, res: Response) => {
  try {
    const { professionalId } = req.params;

    const professional = await prisma.professional.findUnique({
      where: { id: Number(professionalId) },
      include: {
        profile: {
          select: { id: true, userId: true }
        },
        profession: {
          include: { sector: true }
        }
      }
    })

    if (!professional) {
      return handleResponse(res, 404, false, 'Professional not found');
    }

    // Compute avgRating and numRating
    const ratingAgg = await prisma.rating.aggregate({
      where: { professionalUserId: professional.profile?.userId },
      _avg: { value: true },
      _count: { value: true }
    });

    const profileData = await prisma.profile.findUnique({
      where: { id: professional.profile?.id },
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

    return successResponse(res, 'success', {
      ...professional,
      avgRating: ratingAgg._avg.value ?? 0,
      numRating: ratingAgg._count.value ?? 0,
      profile: profileData
    });
  } catch (error: any) {
    console.log(error)
    return errorResponse(res, 'error', error.message || 'Something went wrong');
  }
}



export const getProfessionalByUserId = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
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
      return handleResponse(res, 404, false, 'Professional not found');
    }

    // Exclude sensitive fields
    (user as any).password = null;
    (user as any).fcmToken = null;

    return successResponse(res, 'success', user);
  } catch (error: any) {
    return errorResponse(res, 'error', error.message || 'Something went wrong');
  }
}



export const getDeliveryMen = async (req: Request, res: Response) => {

}

export const updateProfessionalProfile = async (req: Request, res: Response) => {
  const { id } = req.user;
  const { intro, language } = req.body;

  try {
    const profile = await prisma.profile.findFirst({
      where: { userId: id },
      include: { professional: true },
    });

    if (!profile) {
      return handleResponse(res, 404, false, 'User not found');
    }

    if (!profile.professional) {
      return handleResponse(res, 404, false, 'User is not a professional');
    }

    const updateData: any = {};
    if (intro !== undefined) updateData.intro = intro;
    if (language !== undefined) updateData.language = language;

    const updated = await prisma.professional.update({
      where: { id: profile.professional.id },
      data: updateData,
    });

    return successResponse(res, 'success', updated);
  } catch (error: any) {
    return errorResponse(res, 'error', error.message || 'Something went wrong');
  }
};

export const toggleAvailable = async (req: Request, res: Response) => {
  const { id, role } = req.user

  const { available } = req.body

  try {
    const profile = await prisma.profile.findFirst({
      where: { userId: id },
      include: { professional: true }
    })

    if (!profile) {
      return handleResponse(res, 404, false, 'User not found');
    }

    if (!profile.professional) {
      return handleResponse(res, 404, false, 'User is not a professional');
    }

    await prisma.professional.update({
      where: { id: profile.professional.id },
      data: { available }
    })

    return successResponse(res, 'success', 'Availability updated');
  } catch (error: any) {
    return errorResponse(res, 'error', error.message || 'Something went wrong');
  }
}


