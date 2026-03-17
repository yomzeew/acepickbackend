const axios = require('axios');

const API_BASE = process.env.API_BASE_URL || 'http://localhost:5000';

// Test data for each registration type
const clientData = {
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
};

const professionalData = {
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
};

const riderData = {
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
        vehicleType: 'BIKE',
        licenseNumber: 'RIDER123456'
    },
    avatar: 'https://example.com/avatar.jpg'
};

async function testRegistration(endpoint: string, data: any, userType: string) {
    console.log(`\n🧪 Testing ${userType} registration...`);
    console.log(`Endpoint: ${API_BASE}/api/auth/${endpoint}`);
    console.log(`Data: ${JSON.stringify({ ...data, password: '****', confirmPassword: '****' }, null, 2)}\n`);

    try {
        const response = await axios.post(`${API_BASE}/api/auth/${endpoint}`, data, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 10000 // 10 second timeout
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

async function runTests() {
    console.log('🚀 Starting Registration Endpoint Tests...\n');
    console.log(`API Base URL: ${API_BASE}`);

    const results = [];

    // Test Client Registration
    const clientResult = await testRegistration('register', clientData, 'Client');
    results.push({ type: 'Client', ...clientResult });

    // Test Professional Registration
    const professionalResult = await testRegistration('register-professional', professionalData, 'Professional');
    results.push({ type: 'Professional', ...professionalResult });

    // Test Rider (Delivery) Registration
    const riderResult = await testRegistration('register-rider', riderData, 'Rider (Delivery)');
    results.push({ type: 'Rider (Delivery)', ...riderResult });

    // Summary
    console.log('\n📊 Test Summary:');
    console.log('='.repeat(50));
    results.forEach(result => {
        const status = result.success ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} ${result.type}: ${result.success ? 'Success' : 'Failed'}`);
    });

    const passed = results.filter(r => r.success).length;
    const total = results.length;
    console.log(`\nTotal: ${passed}/${total} tests passed`);

    if (passed === total) {
        console.log('🎉 All registration endpoints are working!');
    } else {
        console.log('⚠️ Some registration endpoints have issues.');
    }
}

runTests().catch(console.error);
