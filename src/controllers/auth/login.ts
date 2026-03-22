import { Request, Response } from 'express';
import prisma from "../../config/prisma";
import config from "../../config/configSetup";
import { compare } from "bcryptjs";
import { verify } from "jsonwebtoken";
import { handleResponse, successResponse, errorResponse } from "../../utils/modules";
import { generateToken, getUserDataByRole } from "./helpers";


export const authorize = async (req: Request, res: Response) => {

    let { token }: { token: string } = req.body;

    if (!token) return handleResponse(res, 401, false, `Access Denied / Unauthorized request`);

    if (token.includes('Bearer')) token = token.split(' ')[1];

    if (token === 'null' || !token) return handleResponse(res, 401, false, `Unauthorized request`);

    let verified: any = verify(token, config.TOKEN_SECRET);

    if (!verified) return handleResponse(res, 401, false, `Unauthorized request`);

    return handleResponse(res, 200, true, `Authorized`, verified);

}


export const login = async (req: Request, res: Response) => {
    let { email, password, fcmToken } = req.body;

    try {
        const user = await prisma.user.findFirst({ where: { email } })

        if (!user) return handleResponse(res, 404, false, "User does not exist")

        const match = await compare(password, user.password || '')

        if (!match) return handleResponse(res, 404, false, "Invalid Credentials")

        const token = generateToken(user);

        const profile = await prisma.profile.findFirst({ where: { userId: user.id } })

        // Save fcmToken to both User (for push notifications) and Profile
        if (fcmToken) {
            await prisma.user.update({ where: { id: user.id }, data: { fcmToken } });
        }
        if (profile && fcmToken) {
            await prisma.profile.update({ where: { id: profile.id }, data: { fcmToken } })
        }

        const userData = await getUserDataByRole(user.id, user.role as string);

        return successResponse(res, "Successful", { status: true, user: userData, token })

    } catch (error: any) {
        console.log(error);
        return errorResponse(res, 'error', error.message);
    }
}
