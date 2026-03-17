import { Request, Response } from "express";
import prisma from '../config/prisma';
import { errorResponse, handleResponse, successResponse } from "../utils/modules";

export const getLocationById = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const location = await prisma.location.findUnique({
            where: { id: Number(id) }
        });

        if (!location) {
            return handleResponse(res, 404, false, 'Location not found')
        }

        return successResponse(res, 'success', location);
    } catch (error) {
        return errorResponse(res, 'error', error)
    }
}

export const getMyLocations = async (req: Request, res: Response) => {
    const { id } = req.user;

    try {
        const locations = await prisma.location.findMany({
            where: { userId: id },
            orderBy: { createdAt: 'desc' }
        })

        return successResponse(res, 'success', locations);
    } catch (error) {
        return errorResponse(res, 'error', error)
    }
}

export const addLocation = async (req: Request, res: Response) => {
    const { id } = req.user;

    try {
        const { latitude, longitude, address, lga, state, zipcode } = req.body;

        const location = await prisma.location.create({
            data: {
                latitude,
                longitude,
                address,
                lga,
                state,
                zipcode,
                userId: id
            }
        })

        return successResponse(res, 'Location added successfully', location);
    } catch (error) {
        console.log(error)
        return errorResponse(res, 'Error adding location', error);
    }
}

export const updateLocation = async (req: Request, res: Response) => {
    const { locationId } = req.params;
    const { id } = req.user;

    try {
        const location = await prisma.location.findFirst({
            where: { id: Number(locationId), userId: id }
        });

        if (!location) {
            return handleResponse(res, 404, false, 'Location not found');
        }

        const { latitude, longitude, address, lga, state, zipcode } = req.body;

        const updated = await prisma.location.update({
            where: { id: Number(locationId) },
            data: {
                ...(latitude !== undefined && { latitude }),
                ...(longitude !== undefined && { longitude }),
                ...(address !== undefined && { address }),
                ...(lga !== undefined && { lga }),
                ...(state !== undefined && { state }),
                ...(zipcode !== undefined && { zipcode }),
            }
        });

        return successResponse(res, 'Location updated successfully', updated);
    } catch (error) {
        console.log(error);
        return errorResponse(res, 'Error updating location', error);
    }
}

export const deleteLocation = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        await prisma.location.delete({
            where: { id: Number(id) }
        })

        return successResponse(res, 'Location deleted successfully', {});
    } catch (error) {
        console.log(error)
        return errorResponse(res, 'Error deleting location', error);
    }
}