import { Request, Response } from "express";
import prisma from "../config/prisma";
import config from "../config/configSetup";
import axios from "axios";
import { errorResponse, handleResponse, successResponse } from "../utils/modules";
import { bankDetailsSchema, resolveBankSchema } from "../validation/body";

export const getBanks = async (req: Request, res: Response) => {
    try {
        const response = await axios.get("https://api.paystack.co/bank?currency=NGN", {
            headers: {
                Authorization: `Bearer ${config.PAYSTACK_SECRET_KEY}`
            }
        })

        return successResponse(res, "success", response.data.data)
    } catch (error: any) {
        return errorResponse(res, "error", error.message)
    }
}


export const addAccount = async (req: Request, res: Response) => {
    const { id } = req.user;

    const result = bankDetailsSchema.safeParse(req.body);


    if (!result.success) {
        return res.status(400).json({ errors: result.error.format() });
    }

    const { accountName, bank, bankCode, accountNumber } = result.data;

    const existingAccount = await prisma.account.findFirst({ where: { number: accountNumber } });

    if (existingAccount) {
        return handleResponse(res, 400, false, 'Account already exists');
    }

    const response = await axios.post(
        'https://api.paystack.co/transferrecipient',
        {
            type: 'nuban',
            name: accountName,
            account_number: accountNumber,
            bank_code: bankCode,
            currency: 'NGN',
        },
        {
            headers: {
                Authorization: `Bearer ${config.PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
        }
    );

    const { data } = response.data;

    const account = await prisma.account.create({
        data: {
            userId: id,
            name: accountName,
            bank: bank,
            number: accountNumber,
            recipientCode: data.recipient_code,
            currency: data.currency,
        }
    })

    return successResponse(res, 'success', account);
}


export const getAccounts = async (req: Request, res: Response) => {
    try {
        const { id } = req.user;

        const accounts = await prisma.account.findMany({
            where: { userId: id },
            orderBy: { createdAt: 'desc' }
        });

        return successResponse(res, 'success', accounts);
    } catch (error: any) {
        return errorResponse(res, 'error', error.message);
    }
}

export const resolveAccount = async (req: Request, res: Response) => {
    const result = resolveBankSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            status: false,
            message: 'Validation error',
            errors: result.error.flatten().fieldErrors,
        });
    }

    const { accountNumber, bankCode } = result.data;

    try {
        console.log('🏦 resolveAccount called:', { accountNumber, bankCode, hasKey: !!config.PAYSTACK_SECRET_KEY });
        const response = await axios.get(
            `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
            {
                headers: {
                    Authorization: `Bearer ${config.PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        console.log('🏦 resolveAccount success:', JSON.stringify(response.data).substring(0, 200));
        return successResponse(res, 'success', response.data);
    } catch (error: any) {
        console.error('🏦 resolveAccount error:', error?.response?.data || error?.message);
        return errorResponse(res, error?.response?.data?.message || 'Failed to resolve account', error?.message);
    }
}


export const updateAccount = async (req: Request, res: Response) => {
    const recipientCode = req.params.recipientCode;

    const { name } = req.body;

    try {
        const account = await prisma.account.findFirst({ where: { recipientCode } });

        if (!account) {
            return handleResponse(res, 404, false, 'Account not found')
        }

        const response = await axios.put(`https://api.paystack.co/transferrecipient/${recipientCode}`, { name }, {
            headers: {
                Authorization: `Bearer ${config.PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data.status) {
            const updated = await prisma.account.update({
                where: { id: account.id },
                data: { name }
            });

            return successResponse(res, 'success', updated);
        }
    } catch (error) {
        return errorResponse(res, 'error', error);
    }
}


export const deleteAccount = async (req: Request, res: Response) => {
    const { id } = req.user;

    const { recipientCode } = req.params;

    const account = await prisma.account.findFirst({ where: { userId: id, recipientCode } });

    try {
        if (!account) {
            return handleResponse(res, 404, false, 'Account not found');
        }

        let response = await axios.delete(`https://api.paystack.co/transferrecipient/${recipientCode}`, {
            headers: {
                Authorization: `Bearer ${config.PAYSTACK_SECRET_KEY}`
            }
        })

        if (response.data.status) {
            await prisma.account.delete({ where: { id: account.id } });

            return successResponse(res, 'success', response.data);
        }

    } catch (error) {
        return errorResponse(res, 'error', error);
    }
}