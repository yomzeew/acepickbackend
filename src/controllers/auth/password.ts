import { Request, Response } from 'express';
import prisma from "../../config/prisma";
import { hash } from "bcryptjs";
import { errorResponse, saltRounds, successResponse } from "../../utils/modules";


export const passwordChange = async (req: Request, res: Response) => {
    let { password, confirmPassword } = req.body;
    const { id } = req.user;
    if (password !== confirmPassword) return errorResponse(res, "Password do not match", { status: false, message: "Password do not match" })

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) return errorResponse(res, "Failed", { status: false, message: "User does not exist" })

    hash(password, saltRounds, async function (err, hashedPassword) {
        await prisma.user.update({ where: { id }, data: { password: hashedPassword } })
        return successResponse(res, "Password changed successfully")
    })
}


export const changePassword = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        hash(password, saltRounds, async function (err, hashedPassword) {
            const user = await prisma.user.findFirst({ where: { email } });
            if (user) {
                await prisma.user.update({ where: { id: user.id }, data: { password: hashedPassword } });
            }
            return successResponse(res, "Password Changed Successfully")
        });
    } catch (error) {
        return errorResponse(res, "Failed", { status: false, message: "Error changing password" })
    }
};
