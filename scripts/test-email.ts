const nodemailer = require('nodemailer');

const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.zoho.com';
const EMAIL_PORT = Number(process.env.EMAIL_PORT) || 2525;
const EMAIL_USER = process.env.EMAIL_USER || '';
const EMAIL_PASS = process.env.EMAIL_PASS || '';
const EMAIL_FROM = process.env.EMAIL_FROM || '';

async function testEmail() {
    console.log('📧 Testing email service...\n');
    console.log(`  Host:  ${EMAIL_HOST}`);
    console.log(`  Port:  ${EMAIL_PORT}`);
    console.log(`  User:  ${EMAIL_USER}`);
    console.log(`  From:  ${EMAIL_FROM}`);
    console.log(`  Pass:  ${EMAIL_PASS ? '****' + EMAIL_PASS.slice(-4) : '(empty)'}\n`);

    const transporter = nodemailer.createTransport({
        host: EMAIL_HOST,
        port: EMAIL_PORT,
        secure: EMAIL_PORT === 465,
        auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASS,
        },
    });

    // Step 1: Verify connection
    console.log('1️⃣  Verifying SMTP connection...');
    try {
        await transporter.verify();
        console.log('   ✅ SMTP connection successful!\n');
    } catch (err: any) {
        console.log('   ❌ SMTP connection failed:');
        console.log(`   ${err.message}\n`);
        process.exit(1);
    }

    // Step 2: Send test email
    console.log('2️⃣  Sending test email...');
    try {
        const info = await transporter.sendMail({
            from: EMAIL_FROM,
            to: 'test@acepickdev.com',
            subject: 'Acepick - Email Service Test',
            text: 'This is a test email from the Acepick API email service.',
            html: '<h2>Acepick Email Test</h2><p>If you received this, the email service is working correctly! ✅</p>',
        });

        console.log('   ✅ Email sent successfully!');
        console.log(`   Message ID: ${info.messageId}`);
        console.log(`   Sent to: ${EMAIL_USER}`);
    } catch (err: any) {
        console.log('   ❌ Failed to send email:');
        console.log(`   ${err.message}`);
        process.exit(1);
    }
}

testEmail();
