#!/usr/bin/env npx ts-node

import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createTestUsers() {
  console.log('👥 Creating Test Users...\n');

  try {
    // Create Professional User
    const professionalEmail = 'professional@test.com';
    const professionalPhone = '+12345678901';
    
    // Check if professional already exists
    const existingProfessional = await prisma.user.findFirst({
      where: {
        OR: [
          { email: professionalEmail },
          { phone: professionalPhone }
        ]
      }
    });

    let professionalUser;
    if (!existingProfessional) {
      professionalUser = await prisma.user.create({
        data: {
          email: professionalEmail,
          phone: professionalPhone,
          password: await bcrypt.hash('Professional123!', 10),
          role: UserRole.professional,
          status: UserStatus.ACTIVE,
          agreed: true,
          profile: {
            create: {
              firstName: 'John',
              lastName: 'Smith',
              verified: true,
              totalJobs: 15,
              totalJobsCompleted: 12,
              totalReview: 8,
              professional: {
                create: {
                  intro: 'Experienced software developer specializing in web and mobile applications',
                  language: 'English',
                  available: true,
                  workType: 'IDLE',
                  professionId: 1, // Assuming profession with ID 1 exists
                  totalEarning: 150000,
                  completedAmount: 150000,
                  online: true
                }
              }
            }
          },
          wallet: {
            create: {
              currency: 'NGN',
              currentBalance: 50000,
              previousBalance: 0,
              status: 'active'
            }
          }
        }
      });
      console.log('✅ Professional user created successfully');
    } else {
      professionalUser = existingProfessional;
      console.log('ℹ️ Professional user already exists');
    }

    // Create Client User  
    const clientEmail = 'client@test.com';
    const clientPhone = '+12345678902';

    // Check if client already exists
    const existingClient = await prisma.user.findFirst({
      where: {
        OR: [
          { email: clientEmail },
          { phone: clientPhone }
        ]
      }
    });

    let clientUser;
    if (!existingClient) {
      clientUser = await prisma.user.create({
        data: {
          email: clientEmail,
          phone: clientPhone,
          password: await bcrypt.hash('Client123!', 10),
          role: UserRole.client,
          status: UserStatus.ACTIVE,
          agreed: true,
          profile: {
            create: {
              firstName: 'Jane',
              lastName: 'Doe',
              verified: true,
              totalJobs: 8,
              totalExpense: 75000,
              totalJobsCompleted: 6
            }
          },
          wallet: {
            create: {
              currency: 'NGN',
              currentBalance: 100000,
              previousBalance: 0,
              status: 'active'
            }
          }
        }
      });
      console.log('✅ Client user created successfully');
    } else {
      clientUser = existingClient;
      console.log('ℹ️ Client user already exists');
    }

    // Display credentials
    console.log('\n📋 User Credentials:');
    console.log('\n👨‍💻 PROFESSIONAL:');
    console.log(`   Email: ${professionalUser.email}`);
    console.log(`   Phone: ${professionalUser.phone}`);
    console.log(`   Password: Professional123!`);
    console.log(`   Role: ${professionalUser.role}`);
    console.log(`   User ID: ${professionalUser.id}`);

    console.log('\n👤 CLIENT:');
    console.log(`   Email: ${clientUser.email}`);
    console.log(`   Phone: ${clientUser.phone}`);
    console.log(`   Password: Client123!`);
    console.log(`   Role: ${clientUser.role}`);
    console.log(`   User ID: ${clientUser.id}`);

    console.log('\n🔐 Login Credentials Summary:');
    console.log('Professional: professional@test.com / Professional123!');
    console.log('Client: client@test.com / Client123!');

  } catch (error) {
    console.error('❌ Error creating users:', error);
    
    // Check if profession exists
    const professions = await prisma.profession.findMany();
    if (professions.length === 0) {
      console.log('\n⚠️ No professions found. Creating a default profession...');
      await prisma.profession.create({
        data: {
          title: 'Software Developer',
          image: '',
          sectorId: 1 // Assuming sector with ID 1 exists
        }
      });
      console.log('✅ Default profession created. Please run this script again.');
    }
  }
}

async function createSectorsAndProfessions() {
  console.log('🏢 Creating basic sectors and professions...');

  // Create sectors if they don't exist
  const sectors = await prisma.sector.findMany();
  if (sectors.length === 0) {
    await prisma.sector.createMany({
      data: [
        { title: 'Technology', image: '' },
        { title: 'Healthcare', image: '' },
        { title: 'Education', image: '' },
        { title: 'Business', image: '' }
      ]
    });
    console.log('✅ Basic sectors created');
  }

  // Create professions if they don't exist
  const professions = await prisma.profession.findMany();
  if (professions.length === 0) {
    const sector = await prisma.sector.findFirst({ where: { title: 'Technology' } });
    if (sector) {
      await prisma.profession.createMany({
        data: [
          { title: 'Software Developer', image: '', sectorId: sector.id },
          { title: 'Web Designer', image: '', sectorId: sector.id },
          { title: 'Mobile Developer', image: '', sectorId: sector.id },
          { title: 'Data Scientist', image: '', sectorId: sector.id }
        ]
      });
      console.log('✅ Basic professions created');
    }
  }
}

async function main() {
  try {
    await createSectorsAndProfessions();
    await createTestUsers();
    console.log('\n🎉 Test users setup completed!');
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
