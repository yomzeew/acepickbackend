const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkOTP() {
  try {
    const otp = await prisma.verify.findFirst({ 
      where: { contact: 'mobiletest3@example.com' }, 
      orderBy: { createdAt: 'desc' } 
    });
    
    if (otp) {
      console.log('Latest OTP for mobiletest@example.com:');
      console.log('Code:', otp.code);
      console.log('Type:', otp.type);
      console.log('Verified:', otp.verified);
    } else {
      console.log('No OTP found for mobiletest@example.com');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOTP();
