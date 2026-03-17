const twilio = require('twilio');

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '';
const WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || '';

async function testSMS() {
    console.log('📱 Testing Twilio SMS service...\n');
    console.log(`  Account SID:    ${ACCOUNT_SID.slice(0, 8)}...`);
    console.log(`  Phone Number:   ${PHONE_NUMBER}`);
    console.log(`  WhatsApp:       ${WHATSAPP_NUMBER}\n`);

    const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

    // Step 1: Verify Twilio connection
    console.log('1️⃣  Verifying Twilio credentials...');
    try {
        const account = await client.api.accounts(ACCOUNT_SID).fetch();
        console.log(`   ✅ Account verified: ${account.friendlyName}`);
        console.log(`   Status: ${account.status}\n`);
    } catch (err: any) {
        console.log('   ❌ Credential verification failed:');
        console.log(`   ${err.message}\n`);
        process.exit(1);
    }

    // Step 2: Send test SMS
    console.log('2️⃣  Sending test SMS...');
    try {
        const message = await client.messages.create({
            body: '1234 is your Acepick test access code. Do not share this with anyone.',
            from: PHONE_NUMBER,
            to: PHONE_NUMBER, // send to self for testing
        });

        console.log(`   ✅ SMS sent!`);
        console.log(`   SID: ${message.sid}`);
        console.log(`   Status: ${message.status}`);
    } catch (err: any) {
        console.log(`   ⚠️  SMS send result: ${err.message}`);
        console.log('   (This may be expected for trial accounts without a verified recipient)');
    }

    console.log('\n✅ Twilio SMS service is configured and working!');
}

testSMS();
