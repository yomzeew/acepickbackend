import config from '../config/configSetup';
import twilio from 'twilio';

// Check if Twilio credentials are configured
const isTwilioConfigured = config.TWILIO_ACCOUNT_SID && config.TWILIO_AUTH_TOKEN && config.TWILIO_PHONE_NUMBER;

const client = isTwilioConfigured ? twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN) : null;

export const sendSMS = async (phone: string, code: string) => {
    console.log('📱 SMS Service - Attempting to send SMS:', { phone, hasCredentials: isTwilioConfigured });
    
    if (!isTwilioConfigured) {
        console.error('📱 SMS Service - Twilio credentials not configured in .env file');
        return {
            status: false,
            message: 'Twilio service not configured. Missing credentials in environment.',
        };
    }

    try {
        console.log('📱 SMS Service - Using Twilio phone:', config.TWILIO_PHONE_NUMBER);
        
        const message = await client!.messages.create({
            body: `${code} is your Acepick access code. Do not share this with anyone.`,
            from: config.TWILIO_PHONE_NUMBER,
            to: phone,
        });

        console.log('📱 SMS Service - Message sent successfully:', message.sid);
        return {
            status: true,
            message: message.sid,
        };
    } catch (error: any) {
        console.error('📱 SMS send error:', error.message);
        console.error('📱 SMS error details:', {
            code: error.code,
            status: error.status,
            moreInfo: error.moreInfo,
        });
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
