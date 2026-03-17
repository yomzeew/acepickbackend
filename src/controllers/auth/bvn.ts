import { Request, Response } from 'express';
import prisma from "../../config/prisma";
import axios from "axios";
import { handleResponse, errorResponse, successResponse } from "../../utils/modules";


export const verifyBvnMatch = async (req: Request, res: Response) => {
    let { bvn } = req.body;

    const { id, role } = req.user;

    try {
        const user = await prisma.user.findUnique({
            where: { id },
            include: { profile: true }
        })

        if (!user) {
            return handleResponse(res, 404, false, 'User not found');
        }

        if (!user.phone || !user.profile?.firstName || !user.profile?.lastName) {
            return handleResponse(res, 404, false, 'Phone or First Name or Last name is missing');
        }

        if (user.profile.bvnVerified) {
            return handleResponse(res, 400, false, "BVN already verified");
        }

        const baseUrl = 'https://api.qoreid.com'

        let response = await axios.post(`${baseUrl}/token`, {
            "clientId": "Z2YZZNAWSGPFF63Z2M5H",
            "secret": "f1b57902f30f4a8998228ef36aa0d6b8"
        });

        const token = response.data.accessToken;

        response = await axios.post(`${baseUrl}/v1/ng/identities/bvn-match/${bvn}`, {
            firstname: user.profile.firstName,
            lastname: user.profile.lastName,
            phone: user.phone
        }, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        await prisma.profile.update({
            where: { id: user.profile.id },
            data: { bvnVerified: response.data.metadata.match }
        });

        const verifyStatus = response.data.bvn_match.fieldMatches;

        return successResponse(res, "BVN verified successfully", verifyStatus);
    } catch (error) {
        console.log(error);
        return errorResponse(res, "BVN verification failed", error);
    }
}


export const verifyBvnHook = async (req: Request, res: Response) => {
    console.log(req.body);
    res.status(200).json({ status: "success" });
}
