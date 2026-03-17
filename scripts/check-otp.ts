const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkLatestOTP() {
  try {
    const otp = await prisma.verify.findFirst({ 
      where: { contact: 'testclient@example.com' }, 
      orderBy: { createdAt: 'desc' } 
    });
    
    if (otp) {
      console.log('Latest OTP for testclient@example.com:');
      console.log('Code:', otp.code);
      console.log('Email:', otp.contact);
      console.log('Verified:', otp.verified);
      console.log('Created:', otp.createdAt);
    } else {
      console.log('No OTP found for testclient@example.com');
    }
    
    // Also check for professional
    const proOtp = await prisma.verify.findFirst({ 
      where: { contact: 'testpro@example.com' }, 
      orderBy: { createdAt: 'desc' } 
    });
    
    if (proOtp) {
      console.log('\nLatest OTP for testpro@example.com:');
      console.log('Code:', proOtp.code);
      console.log('Email:', proOtp.contact);
      console.log('Verified:', proOtp.verified);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLatestOTP();
