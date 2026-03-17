const axios = require('axios');

const API_BASE = process.env.API_BASE_URL || 'http://localhost:5000';

// Test data for each registration type
const testUsers = {
    client: {
        email: 'testclient@example.com',
        phone: '08012345678',
        password: 'Test@1234',
        confirmPassword: 'Test@1234',
        agreed: true,
        firstName: 'Test',
        lastName: 'Client',
        lga: 'Ikeja',
        state: 'Lagos',
        address: '123 Test Street, Lagos',
        avatar: 'https://example.com/avatar.jpg'
    },
    professional: {
        email: 'testpro@example.com',
        phone: '08087654321',
        password: 'Test@1234',
        confirmPassword: 'Test@1234',
        agreed: true,
        firstName: 'Test',
        lastName: 'Professional',
        lga: 'Ikeja',
        state: 'Lagos',
        address: '456 Pro Street, Lagos',
        professionId: 1,
        avatar: 'https://example.com/avatar.jpg'
    },
    rider: {
        email: 'testrider@example.com',
        phone: '08098765432',
        password: 'Test@1234',
        confirmPassword: 'Test@1234',
        agreed: true,
        firstName: 'Test',
        lastName: 'Rider',
        lga: 'Ikeja',
        state: 'Lagos',
        address: '789 Rider Street, Lagos',
        rider: {
            vehicleType: 'bike', // Use lowercase enum value
            licenseNumber: 'RIDER123456'
        },
        avatar: 'https://example.com/avatar.jpg'
    }
};

async function sendOtp(email: string, phone: string, type: string = 'EMAIL') {
    console.log(`📧 Sending OTP for ${type}...`);
    
    try {
        const response = await axios.post(`${API_BASE}/api/auth/send-otp`, {
            email: type === 'EMAIL' ? email : undefined,
            phone: type === 'SMS' ? phone : undefined,
            type: type,
            reason: 'verification' // Use correct enum value
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

async function testRegistration(endpoint: string, data: any, userType: string) {
    console.log(`\n🧪 Testing ${userType} registration...`);
    console.log(`Endpoint: ${API_BASE}/api/auth/${endpoint}`);
    console.log(`Data: ${JSON.stringify({ ...data, password: '****', confirmPassword: '****' }, null, 2)}\n`);

    try {
        const response = await axios.post(`${API_BASE}/api/auth/${endpoint}`, data, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
        });

        console.log(`✅ ${userType} registration successful!`);
        console.log(`Status: ${response.status}`);
        console.log(`Response:`, JSON.stringify(response.data, null, 2));
        return { success: true, data: response.data };
    } catch (error: any) {
        console.log(`❌ ${userType} registration failed!`);
        console.log(`Status: ${error.response?.status || 'No response'}`);
        console.log(`Error:`, error.response?.data || error.message);
        return { success: false, error: error.response?.data || error.message };
    }
}

async function testFullRegistrationFlow(userType: string, endpoint: string, userData: any) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 Testing ${userType} Registration Flow`);
    console.log(`${'='.repeat(60)}`);

    // Step 1: Send OTP (email verification)
    const otpResult = await sendOtp(userData.email, userData.phone, 'EMAIL');
    if (!otpResult.success) {
        console.log(`⚠️  Could not send OTP, proceeding with registration anyway...`);
    }

    // For testing purposes, we'll use the actual OTP codes from database
    // In a real scenario, you would get this from email/SMS
    const testEmailCode = userType === 'Client' ? '6586' : userType === 'Professional' ? '5416' : '1234';
    
    // Step 2: Verify OTP
    const verifyResult = await verifyOtp(userData.email, userData.phone, testEmailCode);
    if (!verifyResult.success) {
        console.log(`⚠️  OTP verification failed, trying registration anyway...`);
    }

    // Step 3: Attempt registration
    const regResult = await testRegistration(endpoint, userData, userType);

    return {
        userType,
        otpSent: otpResult.success,
        otpVerified: verifyResult.success,
        registrationSuccess: regResult.success,
        registrationError: regResult.error
    };
}

async function runTests() {
    console.log('🧪 Starting Full Registration Flow Tests...\n');
    console.log(`API Base URL: ${API_BASE}`);

    const results = [];

    // Test Client Registration
    const clientResult = await testFullRegistrationFlow('Client', 'register', testUsers.client);
    results.push(clientResult);

    // Test Professional Registration
    const professionalResult = await testFullRegistrationFlow('Professional', 'register-professional', testUsers.professional);
    results.push(professionalResult);

    // Test Rider Registration
    const riderResult = await testFullRegistrationFlow('Rider (Delivery)', 'register-rider', testUsers.rider);
    results.push(riderResult);

    // Summary
    console.log('\n📊 Test Summary:');
    console.log('='.repeat(50));
    results.forEach(result => {
        const status = result.registrationSuccess ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} ${result.userType}:`);
        console.log(`  OTP Sent: ${result.otpSent ? '✅' : '❌'}`);
        console.log(`  OTP Verified: ${result.otpVerified ? '✅' : '❌'}`);
        console.log(`  Registration: ${result.registrationSuccess ? '✅' : '❌'}`);
        if (!result.registrationSuccess && result.registrationError) {
            console.log(`  Error: ${JSON.stringify(result.registrationError)}`);
        }
        console.log('');
    });

    const passed = results.filter(r => r.registrationSuccess).length;
    const total = results.length;
    console.log(`Total: ${passed}/${total} registrations successful`);

    if (passed === total) {
        console.log('🎉 All registration endpoints are working!');
    } else {
        console.log('⚠️ Some registration endpoints have issues. Check the errors above.');
    }
}

runTests().catch(console.error);
