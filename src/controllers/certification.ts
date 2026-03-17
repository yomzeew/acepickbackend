import { Request, Response } from "express";
import prisma from "../config/prisma";
import { errorResponse, handleResponse, successResponse } from "../utils/modules";
import { certificationSchema, updateCertificationSchema } from "../validation/body";


export const getCertificates = async (req: Request, res: Response) => {
    const { id } = req.user;

    try {
        const profile = await prisma.profile.findFirst({ where: { userId: id } });

        if (!profile) {
            return handleResponse(res, 404, false, 'Profile not found');
        }

        const certificates = await prisma.certification.findMany({
            where: { profileId: profile.id },
            orderBy: { createdAt: 'desc' },
        });

        return successResponse(res, 'success', certificates);
    } catch (error) {
        return errorResponse(res, 'error', error);
    }
}


export const addCertificate = async (req: Request, res: Response) => {
    const { id } = req.user;

    const result = certificationSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            status: false,
            message: 'Validation error',
            errors: result.error.flatten().fieldErrors,
        });
    }

    const { title, filePath, companyIssue, date } = result.data;

    try {
        const profile = await prisma.profile.findFirst({ where: { userId: id } });

        if (!profile) {
            return handleResponse(res, 404, false, 'Profile not found');
        }

        const certificate = await prisma.certification.create({
            data: {
                title,
                filePath,
                companyIssue,
                date,
                profileId: profile.id
            }
        });

        return successResponse(res, 'success', certificate);
    } catch (error) {
        return errorResponse(res, 'error', error);
    }
}

export const updateCertificate = async (req: Request, res: Response) => {
    const { id } = req.params;
    //const { userId } = req.user;

    if (!id) {
        return handleResponse(res, 400, false, 'Provide an id')
    }

    const result = updateCertificationSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            status: false,
            message: 'Validation error',
            errors: result.error.flatten().fieldErrors,
        });
    }


    try {
        const updated = await prisma.certification.update({
            where: { id: Number(id) },
            data: result.data
        })

        return successResponse(res, 'success', updated);
    } catch (error) {
        return errorResponse(res, 'error', error);
    }
}


export const deleteCertificate = async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        return handleResponse(res, 400, false, 'Provide an id')
    }

    try {
        await prisma.certification.delete({
            where: { id: Number(id) }
        })

        return successResponse(res, 'success', { message: 'Certificate deleted successfully' });
    } catch (error) {
        return errorResponse(res, 'error', error);
    }
}