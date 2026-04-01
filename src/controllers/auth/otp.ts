import { Request, Response } from 'express';
import prisma from "../../config/prisma";
import config from "../../config/configSetup";
import { VerificationType, OTPReason } from "../../utils/enum";
import { errorResponse, successResponse } from "../../utils/modules";
import { otpRequestSchema, verifyOTPSchema } from "../../validation/body";
import { sendSMS } from "../../services/sms";
import { sendEmail } from "../../services/gmail";
import { sendOTPEmail, forgotPasswordEmail } from "../../utils/messages";


export const sendOtp = async (req: Request, res: Response) => {
    const parsed = otpRequestSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({
            error: "Invalid input",
            issues: parsed.error.format(),
        });
    }

    const { email, phone, type, reason } = parsed.data;

    const codeEmail = String(Math.floor(1000 + Math.random() * 9000));
    const codeSms = String(Math.floor(1000 + Math.random() * 9000));
    let emailSendStatus;
    let smsSendStatus;

    try {
        if (type === VerificationType.EMAIL || type === VerificationType.BOTH) {
            await prisma.verify.create({
                data: { contact: email!, code: codeEmail, type: VerificationType.EMAIL as any }
            })

            let emailResult;

            if (reason === OTPReason.VERIFICATION) {
                const verifyEmailMsg = sendOTPEmail(codeEmail);
                emailResult = await sendEmail(email as string, verifyEmailMsg.title, verifyEmailMsg.body, 'User');
            } else if (reason === OTPReason.FORGOT_PASSWORD) {
                const msg = forgotPasswordEmail(codeEmail);
                emailResult = await sendEmail(email as string, msg.title, msg.body, 'User');
            }

            emailSendStatus = emailResult?.success === true;
            if (!emailSendStatus) {
                console.error('[OTP] Email send failed:', emailResult?.message || 'Unknown error');
            }
        }

        if (type === VerificationType.SMS || type === VerificationType.BOTH) {
            await prisma.verify.create({
                data: { contact: phone!, code: codeSms, type: VerificationType.SMS as any }
            })

            const smsResult = await sendSMS(phone as string, codeSms.toString());
            smsSendStatus = smsResult.status
        }

        return successResponse(res, 'OTP sent successfully', { emailSendStatus, smsSendStatus })
    } catch (error: any) {
        return errorResponse(res, error.message, error)
    }
};


export const verifyOtp = async (req: Request, res: Response) => {
    const result = verifyOTPSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            error: "Invalid input",
            issues: result.error.format()
        });
    }

    const { smsCode, emailCode } = result.data;

    let emailVerified = false;
    let smsVerified = false;
    let emailError: string | null = null;
    let smsError: string | null = null;

    try {
        // Verify email OTP independently
        if (emailCode) {
            const verifyEmail = await prisma.verify.findFirst({
                where: { code: emailCode.code, contact: emailCode.email }
            });

            if (!verifyEmail) {
                emailError = 'Invalid Email Code';
            } else if (verifyEmail.verified) {
                emailError = 'Email Code already verified';
            } else if (verifyEmail.createdAt < new Date(Date.now() - config.OTP_EXPIRY_TIME * 60 * 1000)) {
                emailError = 'Email Code expired';
            } else {
                await prisma.verify.update({ where: { id: verifyEmail.id }, data: { verified: true } });
                emailVerified = true;
            }
        }

        // Verify SMS OTP independently
        if (smsCode) {
            const verifySms = await prisma.verify.findFirst({
                where: { code: smsCode.code, contact: smsCode.phone }
            });

            if (!verifySms) {
                smsError = 'Invalid SMS Code';
            } else if (verifySms.verified) {
                smsError = 'SMS Code already verified';
            } else if (verifySms.createdAt < new Date(Date.now() - config.OTP_EXPIRY_TIME * 60 * 1000)) {
                smsError = 'SMS Code expired';
            } else {
                await prisma.verify.update({ where: { id: verifySms.id }, data: { verified: true } });
                smsVerified = true;
            }
        }

        // Succeed if at least one verification passed
        if (emailVerified || smsVerified) {
            return successResponse(res, 'OTP verified successfully', {
                emailVerified,
                smsVerified,
                emailError,
                smsError,
            });
        }

        // Both failed or none provided valid codes
        const errors = [emailError, smsError].filter(Boolean).join('; ');
        return errorResponse(res, errors || 'No valid OTP code provided', null);
    } catch (error: any) {
        return errorResponse(res, 'error', error.message);
    }
}
