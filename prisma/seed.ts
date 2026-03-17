import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PASSWORD = 'Test@1234';

async function main() {
    console.log('🌱 Seeding database...\n');

    // Clean existing data (in reverse dependency order)
    await prisma.ledgerEntry.deleteMany();
    await prisma.rating.deleteMany();
    await prisma.review.deleteMany();
    await prisma.message.deleteMany();
    await prisma.chatRoom.deleteMany();
    await prisma.dispute.deleteMany();
    await prisma.material.deleteMany();
    await prisma.order.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.productTransaction.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.activity.deleteMany();
    await prisma.onlineUser.deleteMany();
    await prisma.rider.deleteMany();
    await prisma.director.deleteMany();
    await prisma.cooperation.deleteMany();
    await prisma.voiceRecording.deleteMany();
    await prisma.portfolio.deleteMany();
    await prisma.certification.deleteMany();
    await prisma.experience.deleteMany();
    await prisma.education.deleteMany();
    await prisma.professional.deleteMany();
    await prisma.job.deleteMany();
    await prisma.wallet.deleteMany();
    await prisma.transfer.deleteMany();
    await prisma.verify.deleteMany();
    await prisma.commission.deleteMany();
    await prisma.deliveryPricing.deleteMany();
    await prisma.profile.deleteMany();
    await prisma.location.deleteMany();
    await prisma.account.deleteMany();
    await prisma.user.deleteMany();
    await prisma.profession.deleteMany();
    await prisma.sector.deleteMany();

    console.log('✅ Cleaned existing data');

    const hashedPassword = await bcrypt.hash(PASSWORD, 10);

    // ──────────────────── SECTORS & PROFESSIONS ────────────────────

    const sectorTech = await prisma.sector.create({
        data: { title: 'Technology', image: 'https://placehold.co/100x100?text=Tech' }
    });
    const sectorHome = await prisma.sector.create({
        data: { title: 'Home Services', image: 'https://placehold.co/100x100?text=Home' }
    });
    const sectorHealth = await prisma.sector.create({
        data: { title: 'Health & Wellness', image: 'https://placehold.co/100x100?text=Health' }
    });

    const profWebDev = await prisma.profession.create({
        data: { title: 'Web Developer', sectorId: sectorTech.id, image: 'https://placehold.co/100x100?text=WebDev' }
    });
    const profMobileDev = await prisma.profession.create({
        data: { title: 'Mobile Developer', sectorId: sectorTech.id, image: 'https://placehold.co/100x100?text=MobileDev' }
    });
    const profPlumber = await prisma.profession.create({
        data: { title: 'Plumber', sectorId: sectorHome.id, image: 'https://placehold.co/100x100?text=Plumber' }
    });
    const profElectrician = await prisma.profession.create({
        data: { title: 'Electrician', sectorId: sectorHome.id, image: 'https://placehold.co/100x100?text=Electrician' }
    });
    const profNurse = await prisma.profession.create({
        data: { title: 'Nurse', sectorId: sectorHealth.id, image: 'https://placehold.co/100x100?text=Nurse' }
    });

    console.log('✅ Sectors & Professions created');

    // ──────────────────── CATEGORIES ────────────────────

    const catElectronics = await prisma.category.create({
        data: { name: 'Electronics', description: 'Phones, laptops, and other electronic devices' }
    });
    const catTools = await prisma.category.create({
        data: { name: 'Tools & Equipment', description: 'Professional and home tools' }
    });
    const catHealthProducts = await prisma.category.create({
        data: { name: 'Health Products', description: 'Medical supplies and wellness products' }
    });

    console.log('✅ Categories created');

    // ──────────────────── COMMISSIONS ────────────────────

    await prisma.commission.create({
        data: {
            name: 'Job Commission',
            rate: 0.05,
            type: 'percentage',
            appliesTo: 'job',
            active: true,
            effectiveFrom: new Date()
        }
    });
    await prisma.commission.create({
        data: {
            name: 'Product Commission',
            rate: 0.03,
            type: 'percentage',
            appliesTo: 'product',
            active: true,
            effectiveFrom: new Date()
        }
    });
    await prisma.commission.create({
        data: {
            name: 'Delivery Commission',
            rate: 0.10,
            type: 'percentage',
            appliesTo: 'cs_delivery',
            active: true,
            effectiveFrom: new Date()
        }
    });

    console.log('✅ Commissions created');

    // ──────────────────── DELIVERY PRICING ────────────────────

    await prisma.deliveryPricing.create({
        data: { vehicleType: 'bike', baseCost: 500, costPerKm: 100, costPerKg: 50 }
    });
    await prisma.deliveryPricing.create({
        data: { vehicleType: 'car', baseCost: 1000, costPerKm: 150, costPerKg: 30 }
    });
    await prisma.deliveryPricing.create({
        data: { vehicleType: 'truck', baseCost: 3000, costPerKm: 250, costPerKg: 20 }
    });
    await prisma.deliveryPricing.create({
        data: { vehicleType: 'keke', baseCost: 700, costPerKm: 120, costPerKg: 40 }
    });

    console.log('✅ Delivery Pricing created');

    // ──────────────────── USERS ────────────────────

    // Client 1
    const client1 = await prisma.user.create({
        data: {
            email: 'john.client@test.com',
            phone: '08011111111',
            password: hashedPassword,
            role: 'client',
            agreed: true,
        }
    });
    const client1Profile = await prisma.profile.create({
        data: { userId: client1.id, firstName: 'John', lastName: 'Adeyemi', avatar: 'https://placehold.co/200x200?text=JA', verified: true, bvnVerified: true }
    });
    await prisma.location.create({
        data: { userId: client1.id, address: '15 Broad Street', lga: 'Lagos Island', state: 'Lagos', latitude: 6.4541, longitude: 3.4085 }
    });
    const client1Wallet = await prisma.wallet.create({
        data: { userId: client1.id, previousBalance: 50000, currentBalance: 120000 }
    });

    // Client 2
    const client2 = await prisma.user.create({
        data: {
            email: 'sarah.client@test.com',
            phone: '08022222222',
            password: hashedPassword,
            role: 'client',
            agreed: true,
        }
    });
    const client2Profile = await prisma.profile.create({
        data: { userId: client2.id, firstName: 'Sarah', lastName: 'Okafor', avatar: 'https://placehold.co/200x200?text=SO', verified: true, bvnVerified: true }
    });
    await prisma.location.create({
        data: { userId: client2.id, address: '22 Allen Avenue', lga: 'Ikeja', state: 'Lagos', latitude: 6.6018, longitude: 3.3515 }
    });
    await prisma.wallet.create({
        data: { userId: client2.id, previousBalance: 30000, currentBalance: 85000 }
    });

    // Professional 1 (Web Developer)
    const pro1 = await prisma.user.create({
        data: {
            email: 'emeka.pro@test.com',
            phone: '08033333333',
            password: hashedPassword,
            role: 'professional',
            agreed: true,
        }
    });
    const pro1Profile = await prisma.profile.create({
        data: { userId: pro1.id, firstName: 'Emeka', lastName: 'Obi', avatar: 'https://placehold.co/200x200?text=EO', verified: true, bvnVerified: true, totalJobs: 15, totalJobsCompleted: 12 }
    });
    await prisma.location.create({
        data: { userId: pro1.id, address: '8 Admiralty Way', lga: 'Eti-Osa', state: 'Lagos', latitude: 6.4281, longitude: 3.4219 }
    });
    const pro1Wallet = await prisma.wallet.create({
        data: { userId: pro1.id, previousBalance: 200000, currentBalance: 350000 }
    });
    const professional1 = await prisma.professional.create({
        data: { profileId: pro1Profile.id, professionId: profWebDev.id, intro: 'Experienced full-stack web developer with 5 years of expertise.', chargeFrom: 50000, yearsOfExp: 5, language: 'English', totalEarning: 750000, completedAmount: 600000 }
    });

    // Professional 2 (Plumber)
    const pro2 = await prisma.user.create({
        data: {
            email: 'bola.pro@test.com',
            phone: '08044444444',
            password: hashedPassword,
            role: 'professional',
            agreed: true,
        }
    });
    const pro2Profile = await prisma.profile.create({
        data: { userId: pro2.id, firstName: 'Bola', lastName: 'Akinwale', avatar: 'https://placehold.co/200x200?text=BA', verified: true, bvnVerified: true, totalJobs: 25, totalJobsCompleted: 22 }
    });
    await prisma.location.create({
        data: { userId: pro2.id, address: '45 Toyin Street', lga: 'Ikeja', state: 'Lagos', latitude: 6.6010, longitude: 3.3580 }
    });
    await prisma.wallet.create({
        data: { userId: pro2.id, previousBalance: 100000, currentBalance: 180000 }
    });
    const professional2 = await prisma.professional.create({
        data: { profileId: pro2Profile.id, professionId: profPlumber.id, intro: 'Expert plumber with over 8 years experience in residential and commercial plumbing.', chargeFrom: 15000, yearsOfExp: 8, language: 'English', totalEarning: 400000, completedAmount: 350000 }
    });

    // Professional 3 (Electrician)
    const pro3 = await prisma.user.create({
        data: {
            email: 'tunde.pro@test.com',
            phone: '08055555555',
            password: hashedPassword,
            role: 'professional',
            agreed: true,
        }
    });
    const pro3Profile = await prisma.profile.create({
        data: { userId: pro3.id, firstName: 'Tunde', lastName: 'Bakare', avatar: 'https://placehold.co/200x200?text=TB', verified: true, bvnVerified: true, totalJobs: 10, totalJobsCompleted: 8 }
    });
    await prisma.location.create({
        data: { userId: pro3.id, address: '12 Opebi Road', lga: 'Ikeja', state: 'Lagos', latitude: 6.5892, longitude: 3.3598 }
    });
    await prisma.wallet.create({
        data: { userId: pro3.id, previousBalance: 60000, currentBalance: 95000 }
    });
    await prisma.professional.create({
        data: { profileId: pro3Profile.id, professionId: profElectrician.id, intro: 'Certified electrician specializing in solar installations and home wiring.', chargeFrom: 20000, yearsOfExp: 6, language: 'English', totalEarning: 250000, completedAmount: 200000 }
    });

    // Rider
    const riderUser = await prisma.user.create({
        data: {
            email: 'kola.rider@test.com',
            phone: '08066666666',
            password: hashedPassword,
            role: 'delivery',
            agreed: true,
        }
    });
    const riderProfile = await prisma.profile.create({
        data: { userId: riderUser.id, firstName: 'Kola', lastName: 'Amadi', avatar: 'https://placehold.co/200x200?text=KA', verified: true, bvnVerified: true }
    });
    const riderLocation = await prisma.location.create({
        data: { userId: riderUser.id, address: '5 Surulere Street', lga: 'Surulere', state: 'Lagos', latitude: 6.5059, longitude: 3.3601 }
    });
    await prisma.wallet.create({
        data: { userId: riderUser.id, previousBalance: 20000, currentBalance: 45000 }
    });
    await prisma.rider.create({
        data: { userId: riderUser.id, vehicleType: 'bike', licenseNumber: 'LG-2024-RD-001', status: 'available' }
    });

    // Corporate user
    const corpUser = await prisma.user.create({
        data: {
            email: 'admin@acmecorp.com',
            phone: '08077777777',
            password: hashedPassword,
            role: 'corperate',
            agreed: true,
        }
    });
    const corpProfile = await prisma.profile.create({
        data: { userId: corpUser.id, firstName: 'Chidi', lastName: 'Nwosu', avatar: 'https://placehold.co/200x200?text=CN', verified: true, position: 'CEO' }
    });
    await prisma.location.create({
        data: { userId: corpUser.id, address: '100 Adeola Odeku', lga: 'Eti-Osa', state: 'Lagos', latitude: 6.4310, longitude: 3.4250 }
    });
    await prisma.wallet.create({
        data: { userId: corpUser.id, previousBalance: 500000, currentBalance: 1200000 }
    });
    const cooperation = await prisma.cooperation.create({
        data: { nameOfOrg: 'Acme Corporation', phone: '08077777777', regNum: 'RC-123456', noOfEmployees: '50', professionId: profWebDev.id, profileId: corpProfile.id }
    });
    await prisma.director.create({
        data: { firstName: 'Chidi', lastName: 'Nwosu', email: 'chidi@acmecorp.com', phone: '08077777777', address: '100 Adeola Odeku', state: 'Lagos', lga: 'Eti-Osa', cooperateId: cooperation.id }
    });

    // Admin user
    const adminUser = await prisma.user.create({
        data: {
            email: 'admin@acepick.com',
            phone: '08088888888',
            password: hashedPassword,
            role: 'admin',
            agreed: true,
        }
    });
    await prisma.profile.create({
        data: { userId: adminUser.id, firstName: 'Admin', lastName: 'Acepick', verified: true }
    });
    await prisma.wallet.create({
        data: { userId: adminUser.id, previousBalance: 0, currentBalance: 0 }
    });

    console.log('✅ Users, Profiles, Locations, Wallets created');

    // ──────────────────── EDUCATION & EXPERIENCE ────────────────────

    await prisma.education.create({
        data: { profileId: pro1Profile.id, school: 'University of Lagos', degreeType: 'B.Sc', course: 'Computer Science', startDate: new Date('2015-09-01'), gradDate: new Date('2019-07-15') }
    });
    await prisma.education.create({
        data: { profileId: pro2Profile.id, school: 'Federal Polytechnic Ilaro', degreeType: 'HND', course: 'Mechanical Engineering', startDate: new Date('2012-09-01'), gradDate: new Date('2016-07-15') }
    });

    await prisma.experience.create({
        data: { profileId: pro1Profile.id, postHeld: 'Senior Developer', workPlace: 'Andela Nigeria', startDate: new Date('2019-08-01'), isCurrent: true, description: 'Building scalable web applications for enterprise clients.' }
    });
    await prisma.experience.create({
        data: { profileId: pro2Profile.id, postHeld: 'Lead Plumber', workPlace: 'HomeFix Services', startDate: new Date('2016-08-01'), endDate: new Date('2022-12-31'), description: 'Managed a team of 5 plumbers for residential projects.' }
    });

    await prisma.certification.create({
        data: { profileId: pro1Profile.id, title: 'AWS Certified Developer', filePath: '/certs/aws-dev.pdf', companyIssue: 'Amazon Web Services', date: new Date('2021-03-15') }
    });
    await prisma.certification.create({
        data: { profileId: pro3Profile.id, title: 'Solar Installation Certificate', filePath: '/certs/solar.pdf', companyIssue: 'Nigerian Institute of Electrical Engineers', date: new Date('2020-06-20') }
    });

    await prisma.portfolio.create({
        data: { profileId: pro1Profile.id, title: 'E-Commerce Platform', description: 'Built a full-stack marketplace for Nigerian SMEs', duration: '3 months', date: new Date('2023-01-15'), file: '/portfolio/ecommerce.pdf' }
    });
    await prisma.portfolio.create({
        data: { profileId: pro1Profile.id, title: 'Hospital Management System', description: 'Developed a patient management and billing system', duration: '6 months', date: new Date('2023-09-01'), file: '/portfolio/hospital.pdf' }
    });

    console.log('✅ Education, Experience, Certifications, Portfolios created');

    // ──────────────────── JOBS (every lifecycle stage) ────────────────────

    // ── Stage 1: PENDING – brand new, professional hasn't responded yet ──
    const jobPendingNew = await prisma.job.create({
        data: {
            title: 'Electrical wiring for new apartment',
            description: 'Complete electrical wiring for a 3-bedroom apartment including sockets and switches.',
            clientId: client2.id,
            professionalId: pro3.id,
            status: 'PENDING',
            accepted: false,
            mode: 'PHYSICAL',
            state: 'Lagos',
            lga: 'Ikeja',
            fullAddress: '22 Allen Avenue, Ikeja',
        }
    });

    // ── Stage 2: PENDING + accepted – professional accepted, invoice NOT yet raised ──
    const jobAcceptedNoInvoice = await prisma.job.create({
        data: {
            title: 'Fix bathroom tap',
            description: 'Bathroom tap is dripping non-stop. Needs replacement.',
            clientId: client1.id,
            professionalId: pro2.id,
            status: 'PENDING',
            accepted: true,
            mode: 'PHYSICAL',
            state: 'Lagos',
            lga: 'Lagos Island',
            fullAddress: '15 Broad Street, Lagos Island',
        }
    });

    // ── Stage 3: PENDING + accepted + invoice raised – awaiting payment ──
    const jobInvoiced = await prisma.job.create({
        data: {
            title: 'Kitchen plumbing overhaul',
            description: 'Replace all kitchen pipes, install new mixer tap and dishwasher hookup.',
            clientId: client2.id,
            professionalId: pro2.id,
            status: 'PENDING',
            accepted: true,
            mode: 'PHYSICAL',
            state: 'Lagos',
            lga: 'Ikeja',
            fullAddress: '22 Allen Avenue, Ikeja',
            workmanship: 45000,
            materialsCost: 18500,
            isMaterial: true,
            durationUnit: 'days',
            durationValue: 3,
        }
    });

    // ── Stage 4: ONGOING – paid, work in progress ──
    const jobOngoing = await prisma.job.create({
        data: {
            title: 'Build company website',
            description: 'Need a modern responsive website with admin panel for my business.',
            clientId: client1.id,
            professionalId: pro1.id,
            status: 'ONGOING',
            accepted: true,
            mode: 'VIRTUAL',
            state: 'Lagos',
            workmanship: 150000,
            durationUnit: 'weeks',
            durationValue: 4,
            payStatus: 'paid',
            paymentRef: 'PAY-JOB-ONGOING-001',
        }
    });

    // ── Stage 5: COMPLETED – work done, awaiting client approval ──
    const jobCompleted = await prisma.job.create({
        data: {
            title: 'Solar panel installation',
            description: 'Install 2kW solar system on rooftop with inverter and battery bank.',
            clientId: client1.id,
            professionalId: pro3.id,
            status: 'COMPLETED',
            accepted: true,
            mode: 'PHYSICAL',
            state: 'Lagos',
            lga: 'Eti-Osa',
            fullAddress: '8 Admiralty Way, Lekki',
            workmanship: 120000,
            materialsCost: 380000,
            isMaterial: true,
            durationUnit: 'days',
            durationValue: 5,
            payStatus: 'paid',
            paymentRef: 'PAY-JOB-COMPLETED-001',
        }
    });

    // ── Stage 6a: APPROVED – happy path, money released ──
    const jobApproved = await prisma.job.create({
        data: {
            title: 'Fix kitchen sink leakage',
            description: 'The kitchen sink has been leaking for 3 days. Need urgent repair.',
            clientId: client1.id,
            professionalId: pro2.id,
            status: 'APPROVED',
            accepted: true,
            approved: true,
            mode: 'PHYSICAL',
            state: 'Lagos',
            lga: 'Lagos Island',
            fullAddress: '15 Broad Street, Lagos Island',
            workmanship: 20000,
            materialsCost: 5000,
            isMaterial: true,
            durationUnit: 'hours',
            durationValue: 4,
            payStatus: 'released',
            paymentRef: 'PAY-JOB-APPROVED-001',
        }
    });

    // ── Stage 6b: DISPUTED – client raised dispute after completion ──
    const jobDisputed = await prisma.job.create({
        data: {
            title: 'Bathroom plumbing repair',
            description: 'Replace old bathroom pipes and fix shower head.',
            clientId: client2.id,
            professionalId: pro2.id,
            status: 'DISPUTED',
            accepted: true,
            mode: 'PHYSICAL',
            state: 'Lagos',
            lga: 'Ikeja',
            fullAddress: '22 Allen Avenue, Ikeja',
            workmanship: 30000,
            materialsCost: 5000,
            isMaterial: true,
            durationUnit: 'hours',
            durationValue: 6,
            payStatus: 'paid',
            paymentRef: 'PAY-JOB-DISPUTED-001',
        }
    });

    // ── Stage 7: ONGOING (corporate) – large virtual job in progress ──
    const jobCorpOngoing = await prisma.job.create({
        data: {
            title: 'Mobile app development',
            description: 'Develop a React Native mobile app for inventory management.',
            clientId: corpUser.id,
            professionalId: pro1.id,
            status: 'ONGOING',
            accepted: true,
            mode: 'VIRTUAL',
            workmanship: 500000,
            durationUnit: 'months',
            durationValue: 2,
            payStatus: 'paid',
            paymentRef: 'PAY-JOB-CORP-001',
        }
    });

    console.log('✅ Jobs created (8 jobs across every lifecycle stage)');

    // ──────────────────── MATERIALS ────────────────────

    // Materials for the invoiced job (stage 3)
    await prisma.material.create({
        data: { jobId: jobInvoiced.id, description: 'PVC Pipe 1.5 inch', quantity: 5, unit: 'pieces', price: 1500, subTotal: 7500 }
    });
    await prisma.material.create({
        data: { jobId: jobInvoiced.id, description: 'Mixer Tap Chrome', quantity: 1, unit: 'pieces', price: 8000, subTotal: 8000 }
    });
    await prisma.material.create({
        data: { jobId: jobInvoiced.id, description: 'Teflon Tape', quantity: 3, unit: 'rolls', price: 1000, subTotal: 3000 }
    });

    // Materials for completed solar job (stage 5)
    await prisma.material.create({
        data: { jobId: jobCompleted.id, description: '300W Solar Panel', quantity: 7, unit: 'pieces', price: 45000, subTotal: 315000 }
    });
    await prisma.material.create({
        data: { jobId: jobCompleted.id, description: '5kVA Inverter', quantity: 1, unit: 'pieces', price: 55000, subTotal: 55000 }
    });
    await prisma.material.create({
        data: { jobId: jobCompleted.id, description: '200AH Battery', quantity: 2, unit: 'pieces', price: 5000, subTotal: 10000 }
    });

    // Materials for approved job (stage 6a)
    await prisma.material.create({
        data: { jobId: jobApproved.id, description: 'PVC Pipe 2 inch', quantity: 3, unit: 'pieces', price: 1200, subTotal: 3600 }
    });
    await prisma.material.create({
        data: { jobId: jobApproved.id, description: 'Plumber Sealant', quantity: 1, unit: 'tube', price: 1400, subTotal: 1400 }
    });

    // Materials for disputed job (stage 6b)
    await prisma.material.create({
        data: { jobId: jobDisputed.id, description: 'Bathroom Pipe Set', quantity: 2, unit: 'pieces', price: 2000, subTotal: 4000 }
    });
    await prisma.material.create({
        data: { jobId: jobDisputed.id, description: 'Shower Head', quantity: 1, unit: 'pieces', price: 1000, subTotal: 1000 }
    });

    console.log('✅ Materials created');

    // ──────────────────── DISPUTE (for disputed job) ────────────────────

    await prisma.dispute.create({
        data: {
            reason: 'Incomplete work',
            description: 'The shower head was not properly fitted and is still leaking. Pipes are making noise when water flows.',
            jobId: jobDisputed.id,
            reporterId: client2.id,
            partnerId: pro2.id,
        }
    });

    console.log('✅ Dispute created');

    // ──────────────────── PRODUCTS ────────────────────

    const product1 = await prisma.product.create({
        data: {
            name: 'Samsung Galaxy A54',
            description: 'Brand new Samsung Galaxy A54, 128GB, dual SIM.',
            price: 185000,
            quantity: 10,
            weightPerUnit: 0.2,
            images: 'https://placehold.co/400x400?text=Galaxy+A54',
            approved: true,
            categoryId: catElectronics.id,
            userId: client1.id,
            locationId: (await prisma.location.findFirst({ where: { userId: client1.id } }))!.id,
        }
    });

    const product2 = await prisma.product.create({
        data: {
            name: 'Bosch Drill Machine',
            description: 'Professional cordless drill, 18V with 2 batteries.',
            price: 45000,
            quantity: 5,
            weightPerUnit: 1.5,
            images: 'https://placehold.co/400x400?text=Bosch+Drill',
            approved: true,
            categoryId: catTools.id,
            userId: pro2.id,
            locationId: (await prisma.location.findFirst({ where: { userId: pro2.id } }))!.id,
        }
    });

    const product3 = await prisma.product.create({
        data: {
            name: 'First Aid Kit Professional',
            description: 'Complete 200-piece professional first aid kit.',
            price: 12000,
            quantity: 20,
            weightPerUnit: 0.8,
            images: 'https://placehold.co/400x400?text=First+Aid',
            approved: true,
            categoryId: catHealthProducts.id,
            userId: client2.id,
        }
    });

    console.log('✅ Products created');

    // ──────────────────── PRODUCT TRANSACTIONS ────────────────────

    const ptx1 = await prisma.productTransaction.create({
        data: {
            productId: product1.id,
            buyerId: client2.id,
            sellerId: client1.id,
            quantity: 1,
            price: 185000,
            status: 'pt_delivered',
            orderMethod: 'delivery',
            date: new Date('2024-12-01'),
        }
    });

    const ptx2 = await prisma.productTransaction.create({
        data: {
            productId: product2.id,
            buyerId: client1.id,
            sellerId: pro2.id,
            quantity: 2,
            price: 90000,
            status: 'pt_pending',
            orderMethod: 'self_pickup',
            date: new Date(),
        }
    });

    console.log('✅ Product Transactions created');

    // ──────────────────── ORDERS ────────────────────

    await prisma.order.create({
        data: {
            productTransactionId: ptx1.id,
            status: 'delivered',
            cost: 2500,
            distance: 15.5,
            weight: 0.2,
            locationId: riderLocation.id,
            riderId: riderUser.id,
        }
    });

    console.log('✅ Orders created');

    // ──────────────────── TRANSACTIONS & LEDGER ENTRIES ────────────────────

    // Client payment for approved job (kitchen sink) – into escrow
    const txApprovedPay = await prisma.transaction.create({
        data: {
            amount: 25000,
            type: 'debit',
            status: 'success',
            channel: 'paystack',
            currency: 'NGN',
            timestamp: new Date('2024-11-15'),
            description: 'job payment',
            reference: 'PAY-JOB-APPROVED-001',
            jobId: jobApproved.id,
            userId: client1.id,
        }
    });
    // Ledger: payment gateway → platform escrow
    await prisma.ledgerEntry.create({
        data: { transactionId: txApprovedPay.id, userId: client1.id, amount: 25000, type: 'debit', account: 'payment_gateway', category: 'ec_job' }
    });
    await prisma.ledgerEntry.create({
        data: { transactionId: txApprovedPay.id, userId: null, amount: 25000, type: 'credit', account: 'platform_escrow', category: 'ec_job' }
    });

    // Professional payout for approved job – escrow → professional wallet (minus 5% commission)
    const txApprovedPayout = await prisma.transaction.create({
        data: {
            amount: 24000, // (20000 workmanship + 5000 materials) - (20000 * 0.05 commission) = 24000
            type: 'credit',
            status: 'success',
            currency: 'NGN',
            timestamp: new Date('2024-11-16'),
            description: 'wallet deposit',
            reference: 'TXN-EARN-APPROVED-001',
            jobId: jobApproved.id,
            userId: pro2.id,
        }
    });
    // Ledger: escrow → professional wallet + platform revenue (commission)
    await prisma.ledgerEntry.create({
        data: { transactionId: txApprovedPayout.id, userId: pro2.id, amount: 25000, type: 'debit', account: 'platform_escrow', category: 'ec_job' }
    });
    await prisma.ledgerEntry.create({
        data: { transactionId: txApprovedPayout.id, userId: pro2.id, amount: 24000, type: 'credit', account: 'professional_wallet', category: 'ec_job' }
    });
    await prisma.ledgerEntry.create({
        data: { transactionId: txApprovedPayout.id, userId: null, amount: 1000, type: 'credit', account: 'platform_revenue', category: 'ec_job' }
    });

    // Client payment for ongoing website job – into escrow
    const txOngoingPay = await prisma.transaction.create({
        data: {
            amount: 150000,
            type: 'debit',
            status: 'success',
            channel: 'paystack',
            currency: 'NGN',
            timestamp: new Date('2024-12-20'),
            description: 'job payment',
            reference: 'TXN-JOB-ONGOING-001',
            jobId: jobOngoing.id,
            userId: client1.id,
        }
    });
    await prisma.ledgerEntry.create({
        data: { transactionId: txOngoingPay.id, userId: client1.id, amount: 150000, type: 'debit', account: 'payment_gateway', category: 'ec_job' }
    });
    await prisma.ledgerEntry.create({
        data: { transactionId: txOngoingPay.id, userId: null, amount: 150000, type: 'credit', account: 'platform_escrow', category: 'ec_job' }
    });

    // Client payment for completed solar job – into escrow
    const txCompletedPay = await prisma.transaction.create({
        data: {
            amount: 500000,
            type: 'debit',
            status: 'success',
            channel: 'paystack',
            currency: 'NGN',
            timestamp: new Date('2025-01-10'),
            description: 'job payment',
            reference: 'TXN-JOB-COMPLETED-001',
            jobId: jobCompleted.id,
            userId: client1.id,
        }
    });
    await prisma.ledgerEntry.create({
        data: { transactionId: txCompletedPay.id, userId: client1.id, amount: 500000, type: 'debit', account: 'payment_gateway', category: 'ec_job' }
    });
    await prisma.ledgerEntry.create({
        data: { transactionId: txCompletedPay.id, userId: null, amount: 500000, type: 'credit', account: 'platform_escrow', category: 'ec_job' }
    });

    // Client payment for disputed bathroom job – into escrow (still held)
    const txDisputedPay = await prisma.transaction.create({
        data: {
            amount: 35000,
            type: 'debit',
            status: 'success',
            channel: 'wallet',
            currency: 'NGN',
            timestamp: new Date('2025-01-05'),
            description: 'job wallet payment',
            reference: 'TXN-JOB-DISPUTED-001',
            jobId: jobDisputed.id,
            userId: client2.id,
        }
    });
    await prisma.ledgerEntry.create({
        data: { transactionId: txDisputedPay.id, userId: client2.id, amount: 35000, type: 'debit', account: 'user_wallet', category: 'ec_job' }
    });
    await prisma.ledgerEntry.create({
        data: { transactionId: txDisputedPay.id, userId: null, amount: 35000, type: 'credit', account: 'platform_escrow', category: 'ec_job' }
    });

    // Corporate payment for mobile app job – into escrow
    const txCorpPay = await prisma.transaction.create({
        data: {
            amount: 500000,
            type: 'debit',
            status: 'success',
            channel: 'paystack',
            currency: 'NGN',
            timestamp: new Date('2025-02-01'),
            description: 'job payment',
            reference: 'TXN-JOB-CORP-001',
            jobId: jobCorpOngoing.id,
            userId: corpUser.id,
        }
    });
    await prisma.ledgerEntry.create({
        data: { transactionId: txCorpPay.id, userId: corpUser.id, amount: 500000, type: 'debit', account: 'payment_gateway', category: 'ec_job' }
    });
    await prisma.ledgerEntry.create({
        data: { transactionId: txCorpPay.id, userId: null, amount: 500000, type: 'credit', account: 'platform_escrow', category: 'ec_job' }
    });

    // Product purchase transaction
    const tx4 = await prisma.transaction.create({
        data: {
            amount: 185000,
            type: 'debit',
            status: 'success',
            channel: 'paystack',
            currency: 'NGN',
            timestamp: new Date('2024-12-01'),
            description: 'product payment',
            reference: 'TXN-PROD-001',
            productTransactionId: ptx1.id,
            userId: client2.id,
        }
    });

    console.log('✅ Transactions & Ledger Entries created');

    // ──────────────────── REVIEWS & RATINGS ────────────────────

    await prisma.review.create({
        data: { text: 'Excellent plumbing work! Fixed the leak quickly and professionally.', professionalUserId: pro2.id, clientUserId: client1.id, jobId: jobApproved.id }
    });
    await prisma.review.create({
        data: { text: 'Great web developer, very responsive and skilled.', professionalUserId: pro1.id, clientUserId: client1.id, jobId: jobOngoing.id }
    });

    await prisma.rating.create({
        data: { value: 5, professionalUserId: pro2.id, clientUserId: client1.id, jobId: jobApproved.id }
    });
    await prisma.rating.create({
        data: { value: 5, professionalUserId: pro1.id, clientUserId: client1.id, jobId: jobOngoing.id }
    });

    console.log('✅ Reviews & Ratings created');

    // ──────────────────── ACTIVITIES ────────────────────

    await prisma.activity.create({
        data: { userId: client1.id, action: 'John Adeyemi registered as a client', type: 'New User', status: 'act_success' }
    });
    await prisma.activity.create({
        data: { userId: pro1.id, action: 'Emeka Obi registered as a professional', type: 'New User', status: 'act_success' }
    });
    await prisma.activity.create({
        data: { userId: client1.id, action: `John Adeyemi created Job #${jobApproved.id} - Fix kitchen sink`, type: 'Job Created', status: 'act_success' }
    });
    await prisma.activity.create({
        data: { userId: pro2.id, action: `Bola Akinwale completed Job #${jobApproved.id} - Fix kitchen sink`, type: 'Job Completion', status: 'act_success' }
    });
    await prisma.activity.create({
        data: { userId: client1.id, action: `John Adeyemi approved Job #${jobApproved.id} - Fix kitchen sink`, type: 'Job Approval', status: 'act_success' }
    });
    await prisma.activity.create({
        data: { userId: client2.id, action: `Sarah Okafor disputed Job #${jobDisputed.id} - Bathroom plumbing repair`, type: 'Dispute', status: 'act_success' }
    });

    console.log('✅ Activities created');

    // ──────────────────── VERIFIED CONTACTS (for OTP) ────────────────────

    await prisma.verify.create({ data: { contact: 'john.client@test.com', code: '1234', verified: true, type: 'EMAIL' } });
    await prisma.verify.create({ data: { contact: '08011111111', code: '1234', verified: true, type: 'SMS' } });
    await prisma.verify.create({ data: { contact: 'sarah.client@test.com', code: '1234', verified: true, type: 'EMAIL' } });
    await prisma.verify.create({ data: { contact: '08022222222', code: '1234', verified: true, type: 'SMS' } });
    await prisma.verify.create({ data: { contact: 'emeka.pro@test.com', code: '1234', verified: true, type: 'EMAIL' } });
    await prisma.verify.create({ data: { contact: '08033333333', code: '1234', verified: true, type: 'SMS' } });

    console.log('✅ Verified contacts created');

    // ──────────────────── SUMMARY ────────────────────

    console.log('\n🎉 Seeding complete!\n');
    console.log('📋 Test Accounts (password: Test@1234):');
    console.log('─'.repeat(60));
    console.log('  Client 1:       john.client@test.com');
    console.log('  Client 2:       sarah.client@test.com');
    console.log('  Professional 1: emeka.pro@test.com    (Web Developer)');
    console.log('  Professional 2: bola.pro@test.com     (Plumber)');
    console.log('  Professional 3: tunde.pro@test.com    (Electrician)');
    console.log('  Rider:          kola.rider@test.com');
    console.log('  Corporate:      admin@acmecorp.com');
    console.log('  Admin:          admin@acepick.com');
    console.log('─'.repeat(60));
    console.log('\n📦 Seeded Jobs (lifecycle stages):');
    console.log('─'.repeat(60));
    console.log(`  #${jobPendingNew.id}       PENDING (new, not accepted)`);
    console.log(`  #${jobAcceptedNoInvoice.id}       PENDING (accepted, no invoice)`);
    console.log(`  #${jobInvoiced.id}       PENDING (accepted + invoiced, awaiting payment)`);
    console.log(`  #${jobOngoing.id}       ONGOING (paid, work in progress)`);
    console.log(`  #${jobCompleted.id}       COMPLETED (awaiting client approval)`);
    console.log(`  #${jobApproved.id}       APPROVED (money released to professional)`);
    console.log(`  #${jobDisputed.id}       DISPUTED (client raised dispute)`);
    console.log(`  #${jobCorpOngoing.id}       ONGOING (corporate, large virtual job)`);
    console.log('─'.repeat(60));
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
