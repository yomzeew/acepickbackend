import { Request, Response } from "express"
import { successResponse, errorResponse, handleResponse } from "../utils/modules"
import prisma from "../config/prisma"


export const getProfessions = async (req: Request, res: Response) => {
    const { sector_id, order_by } = req.query as {
        sector_id?: string;
        order_by?: string;
    };

    const sectorId = sector_id ? parseInt(sector_id, 10) : undefined;

    const whereCondition = sectorId ? { sectorId } : {};

    let orderBy: any = undefined;

    if (order_by) {
        const parts = order_by.split("-");
        if (parts.length === 2) {
            const column = parts[0];
            const direction = parts[1].toLowerCase() === "desc" ? "desc" : "asc";
            orderBy = { [column]: direction };
        }
    }

    try {
        const professions = await prisma.profession.findMany({
            where: whereCondition,
            orderBy: orderBy,
        });

        return successResponse(res, "success", professions);
    } catch (error) {
        return errorResponse(res, "error", error);
    }
};



export const getProfessionById = async (req: Request, res: Response) => {
    let { id } = req.params

    try {
        let professions = await prisma.profession.findUnique({
            where: { id: Number(id) },
            include: { sector: true }
        })

        return successResponse(res, "success", professions)
    } catch (error) {
        return errorResponse(res, "error", error)
    }
}

export const createProfession = async (req: Request, res: Response) => {
    let { title, image, sectorId } = req.body;

    if (!title || !sectorId) {
        return handleResponse(res, 400, false, "Please provide all required fields")
    }

    try {
        const sector = await prisma.sector.findUnique({ where: { id: sectorId } })

        if (!sector) {
            return handleResponse(res, 400, false, "Invalid sector id")
        }

        let profession = await prisma.profession.create({ data: { title, image, sectorId } })

        return successResponse(res, "success", profession)
    } catch (error) {
        return errorResponse(res, "error", error)
    }
}

export const updateProfession = async (req: Request, res: Response) => {
    let { id } = req.params;

    if(!req.body){
        return handleResponse(res, 400, false, "Please provide at least on changed field")
    }

    try {
        let prof = await prisma.profession.update({
            where: { id: Number(id) },
            data: req.body
        });

        return successResponse(res, "success", prof)
    } catch (error) {
        return errorResponse(res, "error", error)
    }
}

export const deleteProfession = async (req: Request, res: Response) => {
    let { id } = req.params;

    try {
        await prisma.profession.delete({ where: { id: Number(id) } });

        return successResponse(res, "success", 'Profession deleted')
    } catch (error) {
        return errorResponse(res, "error", error)
    }
}
