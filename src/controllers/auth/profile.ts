import { Request, Response } from 'express';
import prisma from "../../config/prisma";
import { errorResponse, successResponse } from "../../utils/modules";
import { updateRiderSchema } from "../../validation/body";


export const updateProfile = async (req: Request, res: Response) => {
    let { postalCode, lga, state, address, avatar } = req.body;

    let { id } = req.user;

    const profile = await prisma.profile.findFirst({ where: { userId: id } })

    if (!profile?.verified) return errorResponse(res, "Verify your bvn")

    const updated = await prisma.profile.update({
        where: { id: profile!.id },
        data: { avatar: avatar ?? profile!.avatar }
    })

    return successResponse(res, "Updated Successfully", updated)
}


export const updatePushToken = async (req: Request, res: Response) => {
    try {
        const { token } = req.body;

        if (!token) return errorResponse(res, "Token is required", { status: false });

        const { id } = req.user;

        const user = await prisma.user.findUnique({ where: { id } });

        if (!user) return errorResponse(res, "User not found", { status: false });

        await prisma.user.update({ where: { id }, data: { fcmToken: token } });

        return successResponse(res, "Successful", { status: true, user })
    } catch (error: any) {
    }
    return errorResponse(res, "error", 'Error updating push token');
}


export const updateRider = async (req: Request, res: Response) => {
    const { id } = req.user;

    const result = updateRiderSchema.safeParse(req.body)

    if (!result.success)
        return res.status(400).json({
            error: "Invalid input",
            issues: result.error.format()
        })

    try {
        const existing = await prisma.rider.findFirst({ where: { userId: id } });
        if (!existing) return errorResponse(res, "Rider not found");

        const rider = await prisma.rider.update({
            where: { id: existing.id },
            data: result.data as any
        })

        return successResponse(res, "Rider updated successfully", rider)
    } catch (error) {
        return errorResponse(res, "Error updating rider", error)
    }
}


export const postlocationData = async (req: Request, res: Response) => {

    const { lan, log, address } = req.body;
    const { id } = req.user;

    try {
        const getlocation = await prisma.location.findFirst({ where: { userId: id } });

        if (getlocation) {
            const location = await prisma.location.update({
                where: { id: getlocation.id },
                data: {
                    latitude: lan ?? getlocation.latitude,
                    longitude: log ?? getlocation.longitude,
                    address: address ?? getlocation.address,
                }
            })
            if (location) return successResponse(res, "Updated Successfully", location);
            return errorResponse(res, "Failed updating Location");
        } else {
            const location = await prisma.location.create({
                data: { latitude: lan, longitude: log, userId: id, address }
            });
            if (location) return successResponse(res, "Created Successfully", location);
            return errorResponse(res, "Failed Creating Location");
        }

    } catch (error) {
        console.log(error);
        return errorResponse(res, `An error occurred - ${error}`);
    }
}


export const deleteUsers = async (req: Request, res: Response) => {
    await prisma.user.deleteMany({})
    return successResponse(res, "Successful")
}
