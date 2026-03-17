import config from '../config/configSetup';
import twilio from 'twilio';

const client = twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);

export const sendSMS = async (phone: string, code: string) => {
    try {
        const message = await client.messages.create({
            body: `${code} is your Acepick access code. Do not share this with anyone.`,
            from: config.TWILIO_PHONE_NUMBER,
            to: phone,
        });

        return {
            status: true,
            message: message.sid,
        };
    } catch (error: any) {
        console.error('SMS send error:', error.message);
        return {
            status: false,
            message: error.message,
        };
    }
};

export const sendWhatsApp = async (phone: string, code: string) => {
    try {
        const message = await client.messages.create({
            body: `${code} is your Acepick access code. Do not share this with anyone.`,
            from: `whatsapp:${config.TWILIO_WHATSAPP_NUMBER}`,
            to: `whatsapp:${phone}`,
        });

        return {
            status: true,
            message: message.sid,
        };
    } catch (error: any) {
        console.error('WhatsApp send error:', error.message);
        return {
            status: false,
            message: error.message,
        };
    }
};
