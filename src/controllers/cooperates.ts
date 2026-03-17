import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { successResponse, errorResponse, nestFlatKeys } from '../utils/modules';
import { professionalSearchQuerySchema } from '../validation/query';

export const getCooperates = async (req: Request, res: Response) => {
    try {
        const result = professionalSearchQuerySchema.safeParse(req.query);

        if (!result.success) {
            return res.status(400).json({
                error: "Invalid query parameters",
                issues: result.error.format(),
            });
        }

        const { professionId, profession, sector, span, state, lga, rating, page, limit, chargeFrom } = result.data;
        const { id } = req.user;

        let userLocation: any = null;
        let distanceQuery = '';
        let minRating = rating;
        let offset = (page - 1) * limit;

        if (span) {
            userLocation = await prisma.location.findFirst({ where: { userId: id } });

            distanceQuery = `
              6371 * acos(
                cos(radians(${userLocation?.latitude})) * cos(radians(loc.latitude)) *
                cos(radians(loc.longitude) - radians(${userLocation?.longitude})) +
                sin(radians(${userLocation?.latitude})) * sin(radians(loc.latitude))
              )
            `;
        }

        const cooperates: any[] = await prisma.$queryRawUnsafe(`
            SELECT 
                c.id, c."nameOfOrg", c.phone, c.address, c.state, c.lga,
                c."regNum", c."noOfEmployees", c."professionId", c."profileId",
                c."createdAt", c."updatedAt",

                loc.id AS "profile.user.location.id",
                loc.address AS "profile.user.location.address",
                loc.lga AS "profile.user.location.lga",
                loc.state AS "profile.user.location.state",
                loc.latitude AS "profile.user.location.latitude",
                loc.longitude AS "profile.user.location.longitude",
                loc.zipcode AS "profile.user.location.zipcode",
                loc."userId" AS "profile.user.location.userId"
                ${span ? `, (${distanceQuery}) AS "profile.user.location.distance"` : ''}

                , prof.id AS "profession.id",
                prof.title AS "profession.title",
                prof.image AS "profession.image",
                prof."sectorId" AS "profession.sectorId",

                sec.id AS "profession.sector.id",
                sec.title AS "profession.sector.title",
                sec.image AS "profession.sector.image"

            FROM cooperations AS c
            LEFT JOIN profiles AS p ON c."profileId" = p.id
            LEFT JOIN users AS u ON p."userId" = u.id
            LEFT JOIN location AS loc ON u.id = loc."userId"
                ${span || state || lga ? `
                AND (
                    ${span ? `(${distanceQuery} <= ${span})` : '1=1'}
                    ${state ? `AND loc.state LIKE '%${state}%'` : ''}
                    ${lga ? `AND loc.lga LIKE '%${lga}%'` : ''}
                )` : ''}
            LEFT JOIN professions AS prof ON c."professionId" = prof.id
                ${profession ? `AND prof.title LIKE '%${profession}%'` : ''}
            LEFT JOIN sectors AS sec ON prof."sectorId" = sec.id
                ${sector ? `AND sec.title LIKE '%${sector}%'` : ''}

            ${chargeFrom || professionId ? `WHERE ` : ''}
            ${chargeFrom ? `c."chargeFrom" >= ${chargeFrom}` : ''}
            ${chargeFrom && professionId ? ' AND ' : ''}
            ${professionId ? `c."professionId" = ${professionId}` : ''}

            GROUP BY c.id, c."nameOfOrg", c.phone, c.address, c.state, c.lga,
                c."regNum", c."noOfEmployees", c."professionId", c."profileId",
                c."createdAt", c."updatedAt",
                loc.id, loc.address, loc.lga, loc.state, loc.latitude, loc.longitude, loc.zipcode, loc."userId",
                prof.id, prof.title, prof.image, prof."sectorId",
                sec.id, sec.title, sec.image

            ORDER BY c."createdAt" DESC
            LIMIT ${limit} OFFSET ${offset};
        `);

        const nestedCooperates = cooperates.map(nestFlatKeys);

        return successResponse(res, 'success', nestedCooperates);
    } catch (error: any) {
        return errorResponse(res, 'error', error.message || 'Something went wrong');
    }
}