const axios = require('axios');

const API_BASE = process.env.API_BASE_URL || 'http://localhost:5000';

async function sendOtp(email: string, phone: string, type: string = 'EMAIL') {
    console.log(`📧 Sending OTP for ${type}...`);
    
    try {
        const response = await axios.post(`${API_BASE}/api/auth/send-otp`, {
            email: type === 'EMAIL' ? email : undefined,
            phone: type === 'SMS' ? phone : undefined,
            type: type,
            reason: 'verification'
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
        });

        console.log(`✅ OTP sent successfully!`);
        return { success: true, data: response.data };
    } catch (error: any) {
        console.log(`❌ OTP send failed!`);
        console.log(`Status: ${error.response?.status || 'No response'}`);
        console.log(`Error:`, error.response?.data || error.message);
        return { success: false, error: error.response?.data || error.message };
    }
}

async function verifyOtp(email: string, phone: string, emailCode?: string, smsCode?: string) {
    console.log(`🔐 Verifying OTP...`);
    
    try {
        const payload: any = {};
        if (emailCode) {
            payload.emailCode = { email, code: emailCode };
        }
        if (smsCode) {
            payload.smsCode = { phone, code: smsCode };
        }

        const response = await axios.post(`${API_BASE}/api/auth/verify-otp`, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
        });

        console.log(`✅ OTP verified successfully!`);
        return { success: true, data: response.data };
    } catch (error: any) {
        console.log(`❌ OTP verification failed!`);
        console.log(`Status: ${error.response?.status || 'No response'}`);
        console.log(`Error:`, error.response?.data || error.message);
        return { success: false, error: error.response?.data || error.message };
    }
}

async function testClientRegistration() {
    console.log('🧪 Testing Client Registration with BOTH Email and Phone verification\n');

    const userData = {
        email: 'testclient2@example.com',
        phone: '08012345679',
        password: 'Test@1234',
        confirmPassword: 'Test@1234',
        agreed: true,
        firstName: 'Test',
        lastName: 'Client2',
        lga: 'Ikeja',
        state: 'Lagos',
        address: '123 Test Street, Lagos',
        avatar: 'https://example.com/avatar.jpg'
    };

    // Step 1: Send Email OTP
    const emailOtpResult = await sendOtp(userData.email, userData.phone, 'EMAIL');
    
    // Step 2: Send SMS OTP
    const smsOtpResult = await sendOtp(userData.email, userData.phone, 'SMS');

    // Step 3: Get actual OTP codes from database
    console.log('\n📋 Getting OTP codes from database...');
    // We'll use common test codes for now
    const emailCode = '1234'; // Would get from database
    const smsCode = '5678';   // Would get from database

    // Step 4: Verify Email OTP
    const emailVerifyResult = await verifyOtp(userData.email, userData.phone, emailCode);

    // Step 5: Verify SMS OTP
    const smsVerifyResult = await verifyOtp(userData.email, userData.phone, undefined, smsCode);

    // Step 6: Attempt registration
    console.log('\n🧪 Testing registration...');
    try {
        const response = await axios.post(`${API_BASE}/api/auth/register`, userData, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
        });

        console.log(`✅ Client registration successful!`);
        console.log(`Status: ${response.status}`);
        console.log(`Response:`, JSON.stringify(response.data, null, 2));
        return { success: true, data: response.data };
    } catch (error: any) {
        console.log(`❌ Client registration failed!`);
        console.log(`Status: ${error.response?.status || 'No response'}`);
        console.log(`Error:`, error.response?.data || error.message);
        return { success: false, error: error.response?.data || error.message };
    }
}

testClientRegistration().catch(console.error);
