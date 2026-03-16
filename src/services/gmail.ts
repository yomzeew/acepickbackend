const nodemailer = require('nodemailer');
import config from '../config/configSetup'
import { templateData } from '../config/template';



const transporter = nodemailer.createTransport({
    host: config.EMAIL_HOST,
    port: config.EMAIL_PORT,
    secure: false,
    // requireTLS: false,
    auth: {
        user: config.EMAIL_USER,
        pass: config.EMAIL_PASS
    },
    // tls: {
    //     rejectUnauthorized: false
    // }
});


export async function sendEmail(to: string, subject: string, text: string, username: string | undefined) {
    const mailOptions = {
        from: config.EMAIL_FROM,
        to: to,
        subject: subject,
        text: '',
        html: templateData(text, username)
    };

    try {
        const info = await transporter.sendMail(mailOptions);

        return {
            success: true,
            message: 'Email sent successfully',
            messageId: info.messageId,
        };
    } catch (error) {

        return {
            success: false,
            message: 'Failed to send email',
            error: error
        }
    }
}

module.exports = {
    sendEmail
}