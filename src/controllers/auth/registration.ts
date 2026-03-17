import { Request, Response } from 'express';
import prisma from "../../config/prisma";
import bcrypt from "bcryptjs";
import { UserRole, RiderStatus } from "../../utils/enum";
import { validateEmail, validatePhone, errorResponse, handleResponse, successResponse } from "../../utils/modules";
import { registrationSchema, registrationProfSchema, registerCoporateSchema, registerRiderSchema } from "../../validation/body";
import { registerEmail } from "../../utils/messages";
import { sendEmail } from "../../services/gmail";
import {
    generateToken,
    checkExistingUser,
    checkVerification,
    createWallet,
    logActivity,
    sanitizeUserData
} from "./helpers";


export const register = async (req: Request, res: Response): Promise<any> => {
    const result = registrationSchema.safeParse(req.body);

    if (!result.success)
        return res.status(400).json({
            error: "Invalid input",
            issues: result.error.format()
        })

    const { email, phone, password, agreed, firstName, lastName, lga, state, address, avatar } = result.data

    try {
        if (!validateEmail(email)) return handleResponse(res, 404, false, "Enter a valid email");
        if (!validatePhone(phone)) return handleResponse(res, 404, false, "Enter a valid phone number");

        const existingError = await checkExistingUser(email, phone);
        if (existingError) return handleResponse(res, 400, false, existingError);

        const verificationError = await checkVerification(email, phone);
        if (verificationError) return handleResponse(res, 404, false, verificationError);

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: { email, phone, password: hashedPassword, role: UserRole.CLIENT as any, agreed }
        })

        const profile = await prisma.profile.create({
            data: { userId: user.id, firstName, lastName, avatar }
        })

        await prisma.location.create({
            data: { userId: user.id, lga, state, address }
        })

        const wallet = await createWallet(user.id);
        const token = generateToken(user);
        const userData = sanitizeUserData(user, profile, wallet);

        const regEmail = registerEmail(userData);
        const { success } = await sendEmail(email, regEmail.title, regEmail.body, profile.firstName || 'User');

        await logActivity(user.id, `${profile.firstName} ${profile.lastName} registered as a client`, 'New User');

        return successResponse(res, "success", { user: userData, token, emailSendStatus: success });
    } catch (error: any) {
        return errorResponse(res, 'error', { message: error.message, error });
    }
}

export const registerProfessional = async (req: Request, res: Response): Promise<any> => {
    const result = registrationProfSchema.safeParse(req.body);

    if (!result.success)
        return res.status(400).json({
            error: "Invalid input",
            issues: result.error.format()
        })

    const { email, phone, password, agreed, firstName, lastName, lga, state, address, avatar, professionId } = result.data

    try {
        if (!validateEmail(email)) return handleResponse(res, 404, false, "Enter a valid email");
        if (!validatePhone(phone)) return handleResponse(res, 404, false, "Enter a valid phone number");

        const verificationError = await checkVerification(email, phone);
        if (verificationError) return handleResponse(res, 404, false, verificationError);

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: { email, phone, password: hashedPassword, role: UserRole.PROFESSIONAL as any, agreed }
        })

        const profile = await prisma.profile.create({
            data: { userId: user.id, firstName, lastName, avatar }
        })

        await prisma.location.create({
            data: { userId: user.id, lga, state, address }
        })

        const professional = await prisma.professional.create({
            data: { profileId: profile.id, professionId: professionId }
        })

        const wallet = await createWallet(user.id);
        const token = generateToken(user);
        const userData = sanitizeUserData(user, profile, wallet, { professional });

        const regEmail = registerEmail(userData);
        const { success } = await sendEmail(email, regEmail.title, regEmail.body, profile.firstName || 'User');

        await logActivity(user.id, `${profile.firstName} ${profile.lastName} registered as a professional`, 'New User');

        return successResponse(res, "success", { user: userData, token, emailSendStatus: success });
    } catch (error: any) {
        return errorResponse(res, 'error', { message: error.message, error });
    }
}

export const registerCorperate = async (req: Request, res: Response): Promise<any> => {
    const result = registerCoporateSchema.safeParse(req.body)

    if (!result.success)
        return res.status(400).json({
            error: "Invalid input",
            issues: result.error.format()
        })

    const { email, phone, password, confirmPassword, position, agreed, firstName, lastName, cooperation } = result.data;

    if (!validateEmail(email)) return handleResponse(res, 404, false, "Enter a valid email");
    if (!validatePhone(phone)) return handleResponse(res, 404, false, "Enter a valid phone number");

    try {
        const verificationError = await checkVerification(email, phone);
        if (verificationError) return handleResponse(res, 404, false, verificationError);

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: { email, phone, password: hashedPassword, role: UserRole.CORPERATE as any, agreed }
        })

        await prisma.location.create({
            data: { userId: user.id, lga: cooperation.lga, state: cooperation.state, address: cooperation.address }
        })

        const profile = await prisma.profile.create({
            data: { avatar: cooperation.avatar, userId: user.id, firstName, lastName, position }
        })

        const newCooperation = await prisma.cooperation.create({
            data: {
                nameOfOrg: cooperation.nameOfOrg,
                phone: cooperation.phone,
                regNum: cooperation.regNum,
                noOfEmployees: String(cooperation.noOfEmployees),
                professionId: cooperation.professionId,
                profileId: profile.id
            }
        })

        await prisma.director.create({
            data: {
                firstName: cooperation.director.firstName,
                lastName: cooperation.director.lastName,
                email: cooperation.director.email,
                phone: cooperation.director.phone,
                address: cooperation.director.address,
                state: cooperation.director.state,
                lga: cooperation.director.lga,
                cooperateId: newCooperation.id
            }
        })

        const wallet = await createWallet(user.id);
        const token = generateToken(user);
        const userData = sanitizeUserData(user, profile, wallet);

        const regEmail = registerEmail(userData);
        const { success } = await sendEmail(email, regEmail.title, regEmail.body, profile?.firstName || 'User');

        await logActivity(user.id, `${newCooperation.nameOfOrg} registered as a corperate`, 'New User');

        return successResponse(res, "success", { user: userData, token, emailSendStatus: success });
    } catch (error) {
        return errorResponse(res, 'error', error)
    }
}

export const registerRider = async (req: Request, res: Response) => {
    try {
        const result = registerRiderSchema.safeParse(req.body)

        if (!result.success)
            return res.status(400).json({
                error: "Invalid input",
                issues: result.error.format()
            })

        const { email, phone, password, confirmPassword, agreed, avatar, firstName, lastName, address, state, lga, rider } = result.data

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: { email, phone, password: hashedPassword, role: UserRole.DELIVERY as any }
        })

        await prisma.location.create({
            data: { userId: user.id, lga, state, address }
        })

        const profile = await prisma.profile.create({
            data: { avatar, userId: user.id, firstName, lastName }
        })

        await prisma.rider.create({
            data: {
                userId: user.id,
                vehicleType: rider.vehicleType as any,
                licenseNumber: rider.licenseNumber,
                status: RiderStatus.AVAILABLE as any
            }
        })

        const wallet = await createWallet(user.id);
        const token = generateToken(user);
        const userData = sanitizeUserData(user, profile, wallet);

        const regEmail = registerEmail(userData);
        const { success } = await sendEmail(email, regEmail.title, regEmail.body, profile?.firstName || 'User');

        await logActivity(user.id, `${profile.firstName} ${profile.lastName} registered as a rider`, 'New User');

        return successResponse(res, "success", { user: userData, token, emailSendStatus: success });
    } catch (error) {
        console.log(error);
        return errorResponse(res, "error", 'Error registering rider');
    }
}

export const corperateReg = async (req: Request, res: Response) => {
    let { nameOfOrg, phone, address, state, lga, postalCode, regNum, noOfEmployees } = req.body;
    let { id } = (req as any).user;
    const user = await prisma.user.findUnique({ where: { id } });
    const corperate = await prisma.cooperation.findFirst({ where: { profileId: (await prisma.profile.findFirst({ where: { userId: id } }))?.id } });
    if (corperate) return errorResponse(res, "Failed", { status: false, message: "Coorperate Account Already Exist" })
    const profile = await prisma.profile.findFirst({ where: { userId: id } });
    const coorperateCreate = await prisma.cooperation.create({
        data: { nameOfOrg, phone, regNum, noOfEmployees: String(noOfEmployees), profileId: profile?.id! }
    })
}
