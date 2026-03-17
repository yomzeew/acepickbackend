import { Request, Response } from "express";
import prisma from '../config/prisma';
import { successResponse, errorResponse, handleResponse } from "../utils/modules";

export const getSectors = async (req: Request, res: Response) => {
  try {

    const sectors = await prisma.sector.findMany({
      orderBy: { title: 'asc' },
    });

    return successResponse(res, 'success', sectors)
  } catch (error) {
    return errorResponse(res, 'error', error)
  }
}


export const getSectorsMetrics = async (req: Request, res: Response) => {
  let { id } = req.params

  try {
    let sectors = await prisma.sector.findMany()

    const results = await Promise.all(sectors.map(async (sector: any) => {
      const numOfProf = await prisma.professional.count({
        where: {
          profession: {
            sectorId: sector.id,
          },
        },
      });

      const numOfJobs = await prisma.job.count({
        where: {
          professional: {
            profile: {
              professional: {
                profession: {
                  sectorId: sector.id,
                },
              },
            },
          },
        },
      });

      return {
        ...sector,
        numOfProf,
        numOfJobs,
      };
    }));

    return successResponse(res, "success", results)
  } catch (error) {
    return errorResponse(res, "error", error)
  }
}


export const createSector = async (req: Request, res: Response) => {
  const { title, image } = req.body

  if (!title || !image) {
    return handleResponse(res, 400, false, 'Please provide all fields')
  }

  try {
    const sector = await prisma.sector.create({ data: { title, image } })

    return successResponse(res, 'success', sector)
  } catch (error) {
    return errorResponse(res, 'error', error);
  }
}


export const updateSector = async (req: Request, res: Response) => {
  let { id } = req.params

  if (!req.body) {
    return handleResponse(res, 400, false, "Please provide at least one field to update");
  }

  try {
    let sector = await prisma.sector.update({
      where: { id: Number(id) },
      data: req.body
    })

    return successResponse(res, "success", sector)
  } catch (error) {
    return errorResponse(res, "error", error)
  }

}

export const deleteSector = async (req: Request, res: Response) => {
  let { id } = req.params

  try {
    await prisma.sector.delete({ where: { id: Number(id) } })

    return successResponse(res, "success", {})
  } catch (error) {
    return errorResponse(res, "error", error)
  }
}