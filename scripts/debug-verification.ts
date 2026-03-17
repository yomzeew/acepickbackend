const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();
const API_BASE = process.env.API_BASE_URL || 'http://localhost:5000';

async function debugVerification() {
    try {
        console.log('🔍 Debugging OTP Verification Process\n');

        // Step 1: Check current verification status
        const currentOTP = await prisma.verify.findFirst({ 
            where: { contact: 'testclient@example.com' }, 
            orderBy: { createdAt: 'desc' } 
        });
        
        if (!currentOTP) {
            console.log('❌ No OTP found for testclient@example.com');
            return;
        }

        console.log('📋 Current OTP Status:');
        console.log('  Code:', currentOTP.code);
        console.log('  Email:', currentOTP.contact);
        console.log('  Verified:', currentOTP.verified);
        console.log('  Created:', currentOTP.createdAt);

        // Step 2: Test OTP verification directly
        console.log('\n🧪 Testing OTP verification...');
        
        try {
            const response = await axios.post(`${API_BASE}/api/auth/verify-otp`, {
                emailCode: { email: 'testclient@example.com', code: currentOTP.code }
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
            });

            console.log('✅ OTP Verification Response:');
            console.log('  Status:', response.status);
            console.log('  Data:', JSON.stringify(response.data, null, 2));
        } catch (error: any) {
            console.log('❌ OTP Verification Failed:');
            console.log('  Status:', error.response?.status);
            console.log('  Error:', JSON.stringify(error.response?.data || error.message, null, 2));
        }

        // Step 3: Check verification status after attempt
        console.log('\n🔍 Checking verification status after attempt...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        
        const updatedOTP = await prisma.verify.findFirst({ 
            where: { contact: 'testclient@example.com' }, 
            orderBy: { createdAt: 'desc' } 
        });
        
        if (updatedOTP) {
            console.log('📋 Updated OTP Status:');
            console.log('  Code:', updatedOTP.code);
            console.log('  Email:', updatedOTP.contact);
            console.log('  Verified:', updatedOTP.verified);
            console.log('  Created:', updatedOTP.createdAt);
        }

        // Step 4: Test checkVerification function directly
        console.log('\n🧪 Testing checkVerification function...');
        
        // Import and test the function
        const checkVerification = async (email: string, phone: string) => {
            const verifiedEmail = await prisma.verify.findFirst({ where: { contact: email, verified: true } });
            const verifiedPhone = await prisma.verify.findFirst({ where: { contact: phone, verified: true } });

            console.log('  Verified Email:', verifiedEmail ? 'YES' : 'NO');
            console.log('  Verified Phone:', verifiedPhone ? 'YES' : 'NO');

            if (!verifiedEmail && !verifiedPhone) return "Email or Phone must be verified";
            return null;
        };

        const verificationResult = await checkVerification('testclient@example.com', '08012345678');
        console.log('  Result:', verificationResult || '✅ Verification passed');

    } catch (error) {
        console.error('❌ Debug Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugVerification();
