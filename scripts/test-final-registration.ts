const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const API_BASE = process.env.API_BASE_URL || 'http://localhost:5000';
const prisma = new PrismaClient();

async function getLatestOTP(email: string) {
    const otp = await prisma.verify.findFirst({ 
        where: { contact: email }, 
        orderBy: { createdAt: 'desc' } 
    });
    return otp?.code;
}

async function testRegistration(userType: string, endpoint: string, userData: any) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 Testing ${userType} Registration`);
    console.log(`${'='.repeat(60)}`);

    try {
        // Step 1: Send OTP
        console.log('📧 Sending OTP...');
        const otpResponse = await axios.post(`${API_BASE}/api/auth/send-otp`, {
            email: userData.email,
            type: 'EMAIL',
            reason: 'verification'
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
        });
        console.log('✅ OTP sent successfully');

        // Step 2: Get the latest OTP code
        console.log('🔍 Getting OTP code from database...');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for OTP to be saved
        const otpCode = await getLatestOTP(userData.email);
        
        if (!otpCode) {
            console.log('❌ No OTP code found');
            return { success: false, error: 'No OTP code found' };
        }
        console.log(`📋 Found OTP code: ${otpCode}`);

        // Step 3: Verify OTP
        console.log('🔐 Verifying OTP...');
        const verifyResponse = await axios.post(`${API_BASE}/api/auth/verify-otp`, {
            emailCode: { email: userData.email, code: otpCode }
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
        });
        console.log('✅ OTP verified successfully');

        // Step 4: Register user
        console.log('🧪 Registering user...');
        const regResponse = await axios.post(`${API_BASE}/api/auth/${endpoint}`, userData, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
        });

        console.log(`✅ ${userType} registration successful!`);
        console.log(`Status: ${regResponse.status}`);
        console.log(`Response:`, JSON.stringify(regResponse.data, null, 2));
        
        return { success: true, data: regResponse.data };
    } catch (error: any) {
        console.log(`❌ ${userType} registration failed!`);
        console.log(`Status: ${error.response?.status || 'No response'}`);
        console.log(`Error:`, error.response?.data || error.message);
        return { success: false, error: error.response?.data || error.message };
    }
}

async function runFinalTests() {
    console.log('🧪 Starting Final Registration Tests...\n');

    const testUsers = {
        client: {
            email: 'finalclient@example.com',
            phone: '08012345677',
            password: 'Test@1234',
            confirmPassword: 'Test@1234',
            agreed: true,
            firstName: 'Final',
            lastName: 'Client',
            lga: 'Ikeja',
            state: 'Lagos',
            address: '123 Final Street, Lagos',
            avatar: 'https://example.com/avatar.jpg'
        },
        professional: {
            email: 'finalpro@example.com',
            phone: '08087654320',
            password: 'Test@1234',
            confirmPassword: 'Test@1234',
            agreed: true,
            firstName: 'Final',
            lastName: 'Professional',
            lga: 'Ikeja',
            state: 'Lagos',
            address: '456 Final Street, Lagos',
            professionId: 1,
            avatar: 'https://example.com/avatar.jpg'
        },
        rider: {
            email: 'finalrider@example.com',
            phone: '08098765430',
            password: 'Test@1234',
            confirmPassword: 'Test@1234',
            agreed: true,
            firstName: 'Final',
            lastName: 'Rider',
            lga: 'Ikeja',
            state: 'Lagos',
            address: '789 Final Street, Lagos',
            rider: {
                vehicleType: 'bike',
                licenseNumber: 'RIDER123456'
            },
            avatar: 'https://example.com/avatar.jpg'
        }
    };

    const results = [];

    // Test Client Registration
    const clientResult = await testRegistration('Client', 'register', testUsers.client);
    results.push({ type: 'Client', ...clientResult });

    // Test Professional Registration  
    const professionalResult = await testRegistration('Professional', 'register-professional', testUsers.professional);
    results.push({ type: 'Professional', ...professionalResult });

    // Test Rider Registration
    const riderResult = await testRegistration('Rider (Delivery)', 'register-rider', testUsers.rider);
    results.push({ type: 'Rider (Delivery)', ...riderResult });

    // Summary
    console.log('\n📊 Final Test Summary:');
    console.log('='.repeat(50));
    results.forEach(result => {
        const status = result.success ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} ${result.type}`);
        if (!result.success) {
            console.log(`  Error: ${JSON.stringify(result.error)}`);
        }
    });

    const passed = results.filter(r => r.success).length;
    const total = results.length;
    console.log(`\nTotal: ${passed}/${total} registrations successful`);

    if (passed === total) {
        console.log('🎉 All registration endpoints are working perfectly!');
    } else {
        console.log('⚠️ Some registration endpoints still have issues.');
    }

    await prisma.$disconnect();
}

runFinalTests().catch(console.error);
