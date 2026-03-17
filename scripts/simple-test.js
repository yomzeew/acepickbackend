const axios = require('axios');

const API_BASE = 'http://localhost:5000';

async function testRegistration() {
    try {
        console.log('🧪 Testing simple registration...');
        
        const userData = {
            email: 'simpletest@example.com',
            phone: '08012345675',
            password: 'Test@1234',
            confirmPassword: 'Test@1234',
            agreed: true,
            firstName: 'Simple',
            lastName: 'Test',
            lga: 'Ikeja',
            state: 'Lagos',
            address: '123 Simple Street, Lagos'
        };

        // Send OTP first
        console.log('📧 Sending OTP...');
        const otpResponse = await axios.post(`${API_BASE}/api/auth/send-otp`, {
            email: userData.email,
            type: 'EMAIL',
            reason: 'verification'
        });

        console.log('✅ OTP sent');

        // Wait a bit then try registration without verification
        console.log('🧪 Trying registration without verification...');
        const regResponse = await axios.post(`${API_BASE}/api/auth/register`, userData);

        console.log('✅ Registration successful!');
        console.log('Response:', regResponse.data);
        
    } catch (error) {
        console.log('❌ Test failed:');
        console.log('Status:', error.response?.status);
        console.log('Error:', error.response?.data || error.message);
    }
}

testRegistration();
