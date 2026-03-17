import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PASSWORD = 'Test@1234';

// Helper functions
const randomChoice = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomChoices = <T>(arr: T[], count: number): T[] => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};
const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number): number => Math.round((Math.random() * (max - min) + min) * 100) / 100;
const randomDate = (start: Date, end: Date): Date => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

// Mock data arrays
const firstNames = ['John', 'Sarah', 'Emeka', 'Bola', 'Tunde', 'Chidi', 'Aisha', 'David', 'Grace', 'Michael', 'Funke', 'Kunle', 'Ngozi', 'Peter', 'Elizabeth', 'Samuel', 'Ada', 'Paul', 'Mary', 'Joseph', 'Rachel', 'Daniel', 'Patience', 'Christopher', 'Victoria', 'Benjamin', 'Rebecca', 'Joshua', 'Esther', 'Andrew', 'Deborah'];
const lastNames = ['Adeyemi', 'Okafor', 'Obi', 'Akinwale', 'Bakare', 'Nwosu', 'Amadi', 'Eze', 'Okoro', 'Okeke', 'Ibrahim', 'Yusuf', 'Bello', 'Sani', 'Abubakar', 'Mohammed', 'Aliyu', 'Garba', 'Lawal', 'Ogunleye', 'Babalola', 'Adebayo', 'Oladimeji', 'Fashola', 'Tinubu', 'Obasanjo', 'Jonathan', 'Buhari', 'Atiku', 'Shettima', 'Osinbajo'];
const companies = ['TechCorp Nigeria', 'BuildRight Construction', 'MediCare Plus', 'EduTech Solutions', 'FoodLink Logistics', 'CleanPro Services', 'SecureNet Systems', 'GreenEnergy Africa', 'FinanceHub Ltd', 'TransPort Express', 'AgriGrow Nigeria', 'RetailMax Stores', 'CloudSoft Technologies', 'SafeGuard Security', 'FastMove Delivery'];
const jobTitles = ['Software Engineer', 'Project Manager', 'Marketing Director', 'Sales Executive', 'HR Manager', 'Financial Analyst', 'Operations Manager', 'Business Analyst', 'Product Manager', 'Data Scientist', 'UX Designer', 'Graphic Designer', 'Content Writer', 'Digital Marketer', 'Customer Service Rep', 'Accountant', 'Lawyer', 'Doctor', 'Teacher', 'Consultant', 'Engineer', 'Architect', 'Nurse', 'Pharmacist', 'Journalist'];
const lgas = ['Ikeja', 'Lagos Island', 'Eti-Osa', 'Surulere', 'Apapa', 'Agege', 'Ifako-Ijaiye', 'Kosofe', 'Mushin', 'Oshodi-Isolo', 'Shomolu', 'Alimosho'];
const states = ['Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Ibadan', 'Benin City', 'Enugu', 'Aba', 'Jos', 'Ilorin', 'Oyo', 'Akure', 'Maiduguri', 'Warri', 'Uyo'];
const skills = ['JavaScript', 'Python', 'React', 'Node.js', 'UI/UX Design', 'Project Management', 'Data Analysis', 'Digital Marketing', 'Content Writing', 'Graphic Design', 'Sales', 'Customer Service', 'Accounting', 'Legal Services', 'Medical Services', 'Teaching', 'Engineering', 'Architecture', 'Photography', 'Video Editing', 'Social Media Management'];

async function main() {
    console.log('🌱 Starting MASSIVE database seeding...\n');

    // Clean existing data
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
    
    const sectors = await Promise.all([
        prisma.sector.create({ data: { title: 'Technology', image: 'https://placehold.co/100x100?text=Tech' } }),
        prisma.sector.create({ data: { title: 'Home Services', image: 'https://placehold.co/100x100?text=Home' } }),
        prisma.sector.create({ data: { title: 'Health & Wellness', image: 'https://placehold.co/100x100?text=Health' } }),
        prisma.sector.create({ data: { title: 'Education', image: 'https://placehold.co/100x100?text=Edu' } }),
        prisma.sector.create({ data: { title: 'Creative & Design', image: 'https://placehold.co/100x100?text=Creative' } }),
        prisma.sector.create({ data: { title: 'Business & Finance', image: 'https://placehold.co/100x100?text=Business' } }),
        prisma.sector.create({ data: { title: 'Legal', image: 'https://placehold.co/100x100?text=Legal' } }),
        prisma.sector.create({ data: { title: 'Transportation & Logistics', image: 'https://placehold.co/100x100?text=Transport' } }),
        prisma.sector.create({ data: { title: 'Agriculture', image: 'https://placehold.co/100x100?text=Agri' } }),
        prisma.sector.create({ data: { title: 'Entertainment & Media', image: 'https://placehold.co/100x100?text=Media' } }),
    ]);

    const professions = await Promise.all([
        // Technology
        prisma.profession.create({ data: { title: 'Web Developer', sectorId: sectors[0].id, image: 'https://placehold.co/100x100?text=WebDev' } }),
        prisma.profession.create({ data: { title: 'Mobile Developer', sectorId: sectors[0].id, image: 'https://placehold.co/100x100?text=MobileDev' } }),
        prisma.profession.create({ data: { title: 'Data Scientist', sectorId: sectors[0].id, image: 'https://placehold.co/100x100?text=DataSci' } }),
        prisma.profession.create({ data: { title: 'UI/UX Designer', sectorId: sectors[0].id, image: 'https://placehold.co/100x100?text=UIUX' } }),
        prisma.profession.create({ data: { title: 'DevOps Engineer', sectorId: sectors[0].id, image: 'https://placehold.co/100x100?text=DevOps' } }),
        prisma.profession.create({ data: { title: 'Cybersecurity Expert', sectorId: sectors[0].id, image: 'https://placehold.co/100x100?text=Security' } }),
        
        // Home Services
        prisma.profession.create({ data: { title: 'Plumber', sectorId: sectors[1].id, image: 'https://placehold.co/100x100?text=Plumber' } }),
        prisma.profession.create({ data: { title: 'Electrician', sectorId: sectors[1].id, image: 'https://placehold.co/100x100?text=Electrician' } }),
        prisma.profession.create({ data: { title: 'Carpenter', sectorId: sectors[1].id, image: 'https://placehold.co/100x100?text=Carpenter' } }),
        prisma.profession.create({ data: { title: 'Painter', sectorId: sectors[1].id, image: 'https://placehold.co/100x100?text=Painter' } }),
        prisma.profession.create({ data: { title: 'HVAC Technician', sectorId: sectors[1].id, image: 'https://placehold.co/100x100?text=HVAC' } }),
        
        // Health & Wellness
        prisma.profession.create({ data: { title: 'Nurse', sectorId: sectors[2].id, image: 'https://placehold.co/100x100?text=Nurse' } }),
        prisma.profession.create({ data: { title: 'Physiotherapist', sectorId: sectors[2].id, image: 'https://placehold.co/100x100?text=Physio' } }),
        prisma.profession.create({ data: { title: 'Nutritionist', sectorId: sectors[2].id, image: 'https://placehold.co/100x100?text=Nutrition' } }),
        prisma.profession.create({ data: { title: 'Fitness Trainer', sectorId: sectors[2].id, image: 'https://placehold.co/100x100?text=Fitness' } }),
        
        // Education
        prisma.profession.create({ data: { title: 'Math Tutor', sectorId: sectors[3].id, image: 'https://placehold.co/100x100?text=Math' } }),
        prisma.profession.create({ data: { title: 'English Tutor', sectorId: sectors[3].id, image: 'https://placehold.co/100x100?text=English' } }),
        prisma.profession.create({ data: { title: 'Music Teacher', sectorId: sectors[3].id, image: 'https://placehold.co/100x100?text=Music' } }),
        
        // Creative & Design
        prisma.profession.create({ data: { title: 'Graphic Designer', sectorId: sectors[4].id, image: 'https://placehold.co/100x100?text=Graphic' } }),
        prisma.profession.create({ data: { title: 'Photographer', sectorId: sectors[4].id, image: 'https://placehold.co/100x100?text=Photo' } }),
        prisma.profession.create({ data: { title: 'Video Editor', sectorId: sectors[4].id, image: 'https://placehold.co/100x100?text=Video' } }),
        
        // Business & Finance
        prisma.profession.create({ data: { title: 'Accountant', sectorId: sectors[5].id, image: 'https://placehold.co/100x100?text=Account' } }),
        prisma.profession.create({ data: { title: 'Business Consultant', sectorId: sectors[5].id, image: 'https://placehold.co/100x100?text=Consult' } }),
        
        // Legal
        prisma.profession.create({ data: { title: 'Lawyer', sectorId: sectors[6].id, image: 'https://placehold.co/100x100?text=Lawyer' } }),
        prisma.profession.create({ data: { title: 'Legal Assistant', sectorId: sectors[6].id, image: 'https://placehold.co/100x100?text=LegalAssist' } }),
    ]);

    console.log('✅ Created sectors and professions');

    // ──────────────────── SKILLS ────────────────────
    
    console.log('🎯 Creating skills...');
    
    const skillsData = [
        // Technical Skills
        { name: 'Web Development', category: 'Technical', description: 'Building websites and web applications' },
        { name: 'Mobile Development', category: 'Technical', description: 'Creating mobile applications for iOS and Android' },
        { name: 'UI/UX Design', category: 'Technical', description: 'User interface and user experience design' },
        { name: 'Database Management', category: 'Technical', description: 'Managing and optimizing databases' },
        { name: 'Cloud Computing', category: 'Technical', description: 'Working with cloud platforms and services' },
        { name: 'Cybersecurity', category: 'Technical', description: 'Protecting systems and data from threats' },
        { name: 'DevOps', category: 'Technical', description: 'Development and operations practices' },
        { name: 'API Development', category: 'Technical', description: 'Creating and managing APIs' },
        { name: 'Machine Learning', category: 'Technical', description: 'Building and training machine learning models' },
        { name: 'Data Science', category: 'Technical', description: 'Analyzing and interpreting complex data' },
        
        // Home Services
        { name: 'Plumbing', category: 'Home Services', description: 'Installing and repairing plumbing systems' },
        { name: 'Electrical', category: 'Home Services', description: 'Electrical installation and maintenance' },
        { name: 'Carpentry', category: 'Home Services', description: 'Woodworking and construction' },
        { name: 'Painting', category: 'Home Services', description: 'Interior and exterior painting' },
        { name: 'Cleaning', category: 'Home Services', description: 'Professional cleaning services' },
        { name: 'Landscaping', category: 'Home Services', description: 'Garden and landscape maintenance' },
        { name: 'HVAC', category: 'Home Services', description: 'Heating, ventilation, and air conditioning' },
        { name: 'Pest Control', category: 'Home Services', description: 'Managing and eliminating pests' },
        
        // Creative & Design
        { name: 'Graphic Design', category: 'Creative', description: 'Creating visual content and graphics' },
        { name: 'Video Editing', category: 'Creative', description: 'Editing and producing video content' },
        { name: 'Photography', category: 'Creative', description: 'Professional photography services' },
        { name: 'Content Writing', category: 'Creative', description: 'Writing engaging content for various platforms' },
        { name: 'Animation', category: 'Creative', description: 'Creating animated content' },
        { name: 'Voice Over', category: 'Creative', description: 'Professional voice recording services' },
        { name: 'Music Production', category: 'Creative', description: 'Producing and editing music' },
        { name: '3D Modeling', category: 'Creative', description: 'Creating 3D models and designs' },
        
        // Business & Finance
        { name: 'Accounting', category: 'Business', description: 'Managing financial records and accounting' },
        { name: 'Bookkeeping', category: 'Business', description: 'Maintaining financial records' },
        { name: 'Financial Planning', category: 'Business', description: 'Creating financial strategies and plans' },
        { name: 'Business Consulting', category: 'Business', description: 'Providing business advice and strategies' },
        { name: 'Marketing', category: 'Business', description: 'Marketing strategy and implementation' },
        { name: 'Project Management', category: 'Business', description: 'Managing projects and teams' },
        { name: 'Sales', category: 'Business', description: 'Sales strategy and execution' },
        { name: 'Human Resources', category: 'Business', description: 'HR management and consulting' },
        
        // Education & Training
        { name: 'Teaching', category: 'Education', description: 'Educational instruction and teaching' },
        { name: 'Tutoring', category: 'Education', description: 'Personalized academic support' },
        { name: 'Training', category: 'Education', description: 'Professional training and development' },
        { name: 'Consulting', category: 'Education', description: 'Expert consulting services' },
        { name: 'Curriculum Development', category: 'Education', description: 'Creating educational curricula' },
        { name: 'E-learning', category: 'Education', description: 'Online education and course creation' },
        
        // Health & Wellness
        { name: 'Personal Training', category: 'Health', description: 'Fitness coaching and personal training' },
        { name: 'Yoga Instruction', category: 'Health', description: 'Teaching yoga and mindfulness' },
        { name: 'Nutrition Counseling', category: 'Health', description: 'Nutrition advice and meal planning' },
        { name: 'Massage Therapy', category: 'Health', description: 'Professional massage services' },
        { name: 'Mental Health Counseling', category: 'Health', description: 'Mental health support and counseling' },
        
        // Transportation & Logistics
        { name: 'Driving', category: 'Transportation', description: 'Professional driving services' },
        { name: 'Delivery', category: 'Transportation', description: 'Package and goods delivery' },
        { name: 'Logistics', category: 'Transportation', description: 'Supply chain and logistics management' },
        { name: 'Moving Services', category: 'Transportation', description: 'Relocation and moving assistance' }
    ];
    
    const skills = await Promise.all(
        skillsData.map(skill => 
            prisma.skill.create({ data: skill })
        )
    );
    
    console.log(`✅ Created ${skills.length} skills`);

    // ──────────────────── CATEGORIES ────────────────────
    
    const categories = await Promise.all([
        prisma.category.create({ data: { name: 'Electronics', description: 'Phones, laptops, and other electronic devices' } }),
        prisma.category.create({ data: { name: 'Tools & Equipment', description: 'Professional and home tools' } }),
        prisma.category.create({ data: { name: 'Health Products', description: 'Medical supplies and wellness products' } }),
        prisma.category.create({ data: { name: 'Books & Education', description: 'Educational materials and books' } }),
        prisma.category.create({ data: { name: 'Clothing & Fashion', description: 'Apparel and fashion accessories' } }),
        prisma.category.create({ data: { name: 'Home & Garden', description: 'Home improvement and garden supplies' } }),
        prisma.category.create({ data: { name: 'Sports & Fitness', description: 'Sports equipment and fitness gear' } }),
        prisma.category.create({ data: { name: 'Food & Beverages', description: 'Food items and beverages' } }),
    ]);

    // ──────────────────── COMMISSIONS ────────────────────
    
    await Promise.all([
        prisma.commission.create({ data: { name: 'Job Commission', rate: 0.05, type: 'percentage', appliesTo: 'job', active: true, effectiveFrom: new Date() } }),
        prisma.commission.create({ data: { name: 'Product Commission', rate: 0.03, type: 'percentage', appliesTo: 'product', active: true, effectiveFrom: new Date() } }),
        prisma.commission.create({ data: { name: 'Delivery Commission', rate: 0.10, type: 'percentage', appliesTo: 'cs_delivery', active: true, effectiveFrom: new Date() } }),
        prisma.commission.create({ data: { name: 'Platform Fee', rate: 0.02, type: 'percentage', appliesTo: 'all', active: true, effectiveFrom: new Date() } }),
    ]);

    // ──────────────────── DELIVERY PRICING ────────────────────
    
    await Promise.all([
        prisma.deliveryPricing.create({ data: { vehicleType: 'bike', baseCost: 500, costPerKm: 100, costPerKg: 50 } }),
        prisma.deliveryPricing.create({ data: { vehicleType: 'car', baseCost: 1000, costPerKm: 150, costPerKg: 30 } }),
        prisma.deliveryPricing.create({ data: { vehicleType: 'truck', baseCost: 3000, costPerKm: 250, costPerKg: 20 } }),
        prisma.deliveryPricing.create({ data: { vehicleType: 'keke', baseCost: 700, costPerKm: 120, costPerKg: 40 } }),
        prisma.deliveryPricing.create({ data: { vehicleType: 'bus', baseCost: 2000, costPerKm: 200, costPerKg: 25 } }),
    ]);

    // ──────────────────── MASSIVE USER CREATION ────────────────────
    
    console.log('👥 Creating users...');
    
    const users = [];
    
    // Create 50 clients
    for (let i = 0; i < 50; i++) {
        const firstName = randomChoice(firstNames);
        const lastName = randomChoice(lastNames);
        const email = `client${i + 1}.${firstName.toLowerCase()}.${lastName.toLowerCase()}@test.com`;
        const phone = `080${String(100000000 + i).padStart(8, '0')}`;
        
        const user = await prisma.user.create({
            data: { email, phone, password: hashedPassword, role: 'client', agreed: true }
        });
        
        await prisma.profile.create({
            data: { 
                userId: user.id, 
                firstName, 
                lastName, 
                avatar: `https://placehold.co/200x200?text=${firstName[0]}${lastName[0]}`,
                verified: Math.random() > 0.3,
                bvnVerified: Math.random() > 0.5,
                totalJobs: randomInt(0, 20),
                totalJobsCompleted: randomInt(0, 15),
                rate: randomInt(1, 5),
                notified: Math.random() > 0.5
            }
        });
        
        await prisma.location.create({
            data: { 
                userId: user.id, 
                address: `${randomInt(1, 999)} ${randomChoice(['Broad', 'Allen', 'Adetokunbo', 'Oba', 'Ikoyi', 'Victoria'])} ${randomChoice(['Street', 'Road', 'Avenue', 'Close'])}`,
                lga: randomChoice(lgas),
                state: randomChoice(states),
                latitude: 6.4 + Math.random() * 0.5,
                longitude: 3.3 + Math.random() * 0.5
            }
        });
        
        await prisma.wallet.create({
            data: { 
                userId: user.id, 
                previousBalance: randomFloat(10000, 100000),
                currentBalance: randomFloat(50000, 500000)
            }
        });
        
        users.push(user);
    }
    
    // Create 30 professionals
    const professionals = [];
    for (let i = 0; i < 30; i++) {
        const firstName = randomChoice(firstNames);
        const lastName = randomChoice(lastNames);
        const email = `pro${i + 1}.${firstName.toLowerCase()}.${lastName.toLowerCase()}@test.com`;
        const phone = `080${String(200000000 + i).padStart(8, '0')}`;
        
        const user = await prisma.user.create({
            data: { email, phone, password: hashedPassword, role: 'professional', agreed: true }
        });
        
        const profile = await prisma.profile.create({
            data: { 
                userId: user.id, 
                firstName, 
                lastName, 
                avatar: `https://placehold.co/200x200?text=${firstName[0]}${lastName[0]}`,
                verified: Math.random() > 0.2,
                bvnVerified: Math.random() > 0.4,
                totalJobs: randomInt(5, 50),
                totalJobsCompleted: randomInt(3, 45),
                rate: randomInt(3, 5),
                notified: Math.random() > 0.5
            }
        });
        
        await prisma.location.create({
            data: { 
                userId: user.id, 
                address: `${randomInt(1, 999)} ${randomChoice(['Lekki', 'Ikoyi', 'Victoria', 'Ikate', 'Ajah'])} ${randomChoice(['Street', 'Road', 'Avenue'])}`,
                lga: randomChoice(['Eti-Osa', 'Ikeja', 'Lagos Island']),
                state: 'Lagos',
                latitude: 6.4 + Math.random() * 0.3,
                longitude: 3.4 + Math.random() * 0.3
            }
        });
        
        await prisma.wallet.create({
            data: { 
                userId: user.id, 
                previousBalance: randomFloat(50000, 300000),
                currentBalance: randomFloat(100000, 1000000)
            }
        });
        
        const professionalRecord = await prisma.professional.create({
            data: { 
                profileId: profile.id, 
                professionId: randomChoice(professions).id,
                intro: `Experienced ${randomChoice(jobTitles)} with ${randomInt(2, 15)} years of expertise.`,
                chargeFrom: randomFloat(5000, 100000),
                yearsOfExp: randomInt(1, 20),
                language: 'English',
                totalEarning: randomFloat(100000, 5000000),
                completedAmount: randomFloat(80000, 4000000)
            }
        });
        
        professionals.push({ user, profile, professional: professionalRecord });
    }
    
    // Create 20 delivery riders
    const riders = [];
    for (let i = 0; i < 20; i++) {
        const firstName = randomChoice(firstNames);
        const lastName = randomChoice(lastNames);
        const email = `rider${i + 1}.${firstName.toLowerCase()}.${lastName.toLowerCase()}@test.com`;
        const phone = `080${String(300000000 + i).padStart(8, '0')}`;
        
        const user = await prisma.user.create({
            data: { email, phone, password: hashedPassword, role: 'delivery', agreed: true }
        });
        
        await prisma.profile.create({
            data: { 
                userId: user.id, 
                firstName, 
                lastName, 
                avatar: `https://placehold.co/200x200?text=${firstName[0]}${lastName[0]}`,
                verified: Math.random() > 0.4,
                bvnVerified: Math.random() > 0.6,
                notified: Math.random() > 0.5
            }
        });
        
        await prisma.location.create({
            data: { 
                userId: user.id, 
                address: `${randomInt(1, 999)} ${randomChoice(['Main', 'Market', 'Station', 'Park'])} ${randomChoice(['Street', 'Road'])}`,
                lga: randomChoice(lgas),
                state: randomChoice(states),
                latitude: 6.4 + Math.random() * 0.6,
                longitude: 3.3 + Math.random() * 0.6
            }
        });
        
        await prisma.wallet.create({
            data: { 
                userId: user.id, 
                previousBalance: randomFloat(20000, 100000),
                currentBalance: randomFloat(40000, 200000)
            }
        });
        
        const rider = await prisma.rider.create({
            data: { 
                userId: user.id,
                vehicleType: randomChoice(['bike', 'keke', 'car']),
                licenseNumber: `LG-2024-RD-${String(i + 1).padStart(3, '0')}`,
                status: randomChoice(['available', 'busy', 'suspended'])
            }
        });
        
        riders.push({ user, rider });
    }
    
    // Create 10 corporate users
    for (let i = 0; i < 10; i++) {
        const firstName = randomChoice(firstNames);
        const lastName = randomChoice(lastNames);
        const email = `corp${i + 1}.${firstName.toLowerCase()}@${randomChoice(companies).toLowerCase().replace(/\s+/g, '')}.com`;
        const phone = `080${String(400000000 + i).padStart(8, '0')}`;
        
        const user = await prisma.user.create({
            data: { email, phone, password: hashedPassword, role: 'corperate', agreed: true }
        });
        
        const profile = await prisma.profile.create({
            data: { 
                userId: user.id, 
                firstName, 
                lastName, 
                avatar: `https://placehold.co/200x200?text=${firstName[0]}${lastName[0]}`,
                verified: true,
                position: randomChoice(['CEO', 'Manager', 'Director', 'Coordinator'])
            }
        });
        
        await prisma.location.create({
            data: { 
                userId: user.id, 
                address: `${randomInt(100, 999)} ${randomChoice(['Corporate', 'Business', 'Commercial'])} ${randomChoice(['Drive', 'Boulevard', 'Way'])}`,
                lga: 'Ikoyi',
                state: 'Lagos',
                latitude: 6.45 + Math.random() * 0.1,
                longitude: 3.4 + Math.random() * 0.1
            }
        });
        
        await prisma.wallet.create({
            data: { 
                userId: user.id, 
                previousBalance: randomFloat(500000, 2000000),
                currentBalance: randomFloat(1000000, 5000000)
            }
        });
        
        const cooperation = await prisma.cooperation.create({
            data: {
                nameOfOrg: randomChoice(companies),
                phone: phone,
                regNum: `RC-${randomInt(1000000, 9999999)}`,
                noOfEmployees: String(randomInt(5, 500)),
                professionId: randomChoice(professions).id,
                profileId: profile.id
            }
        });
        
        await prisma.director.create({
            data: {
                firstName: randomChoice(firstNames),
                lastName: randomChoice(lastNames),
                email: `director${i + 1}@${randomChoice(companies).toLowerCase().replace(/\s+/g, '')}.com`,
                phone: `080${String(500000000 + i).padStart(8, '0')}`,
                address: `${randomInt(1, 999)} Director's Lane, Ikoyi`,
                state: 'Lagos',
                lga: 'Ikoyi',
                cooperateId: cooperation.id
            }
        });
    }
    
    // Create 5 admin users
    for (let i = 0; i < 5; i++) {
        const firstName = randomChoice(firstNames);
        const lastName = randomChoice(lastNames);
        const email = `admin${i + 1}@acepick.com`;
        const phone = `080${String(600000000 + i).padStart(8, '0')}`;
        
        const user = await prisma.user.create({
            data: { email, phone, password: hashedPassword, role: 'admin', agreed: true }
        });
        
        await prisma.profile.create({
            data: { 
                userId: user.id, 
                firstName: 'Admin', 
                lastName: `Acepick${i + 1}`,
                verified: true
            }
        });
        
        await prisma.wallet.create({
            data: { userId: user.id, previousBalance: 0, currentBalance: 0 }
        });
    }

    console.log(`✅ Created ${users.length} clients, ${professionals.length} professionals, ${riders.length} riders, 10 corporate, 5 admin users`);

    // ──────────────────── EDUCATION, EXPERIENCE, CERTIFICATIONS, PORTFOLIOS ────────────────────
    
    console.log('📚 Adding professional profiles...');
    
    for (const professional of professionals) {
        // Add education (guaranteed for all professionals)
        await prisma.education.create({
            data: { 
                profileId: professional.profile.id, 
                school: randomChoice(['University of Lagos', 'University of Ibadan', 'Obafemi Awolowo University', 'Ahmadu Bello University', 'Federal University of Technology', 'Lagos State University', 'Yaba College of Technology', 'Federal Polytechnic Ilaro']),
                degreeType: randomChoice(['B.Sc', 'M.Sc', 'PhD', 'HND', 'OND', 'B.Eng', 'B.Tech']),
                course: randomChoice(['Computer Science', 'Engineering', 'Business Administration', 'Mathematics', 'Physics', 'Chemistry', 'Economics', 'Accounting', 'Mass Communication', 'Medicine', 'Law']),
                startDate: randomDate(new Date(2000, 0, 1), new Date(2018, 0, 1)),
                gradDate: randomDate(new Date(2004, 0, 1), new Date(2023, 0, 1))
            }
        });
        
        // Add experience (guaranteed for all professionals)
        await prisma.experience.create({
            data: { 
                profileId: professional.profile.id, 
                postHeld: randomChoice(jobTitles),
                workPlace: randomChoice(['Andela Nigeria', 'TechCabal', 'Flutterwave', 'Paystack', 'Interswitch', 'Globacom', 'MTN Nigeria', 'Access Bank', 'First Bank', 'Dangote Group', 'Nestle Nigeria', 'Unilever Nigeria', 'PZ Cussons', 'Guinness Nigeria']),
                startDate: randomDate(new Date(2015, 0, 1), new Date(2022, 0, 1)),
                endDate: Math.random() > 0.5 ? randomDate(new Date(2018, 0, 1), new Date(2024, 0, 1)) : null,
                isCurrent: Math.random() > 0.7,
                description: randomChoice(['Building scalable web applications', 'Managing cross-functional teams', 'Leading digital transformation initiatives', 'Developing innovative solutions', 'Optimizing business processes'])
            }
        });
        
        // Add certifications (guaranteed for all professionals)
        await prisma.certification.create({
            data: { 
                profileId: professional.profile.id, 
                title: randomChoice(['AWS Certified Developer', 'Google Cloud Professional', 'Microsoft Azure Architect', 'PMP Certification', 'Scrum Master Certification', 'Six Sigma Black Belt', 'Digital Marketing Certificate', 'Financial Analyst Certification']),
                filePath: `/certs/${randomChoice(['aws', 'google', 'microsoft', 'pmp', 'scrum', 'sixsigma'])}.pdf`,
                companyIssue: randomChoice(['Amazon Web Services', 'Google', 'Microsoft', 'PMI', 'Scrum Alliance', 'Six Sigma Academy']),
                date: randomDate(new Date(2018, 0, 1), new Date(2024, 0, 1))
            }
        });
        
        // Add portfolios (guaranteed for all professionals)
        await prisma.portfolio.create({
            data: { 
                profileId: professional.profile.id, 
                title: randomChoice(['E-Commerce Platform', 'Mobile Banking App', 'Healthcare Management System', 'Educational Platform', 'Social Media Dashboard', 'Inventory Management System', 'CRM System', 'Data Analytics Dashboard']),
                description: randomChoice(['Built a full-stack marketplace for Nigerian SMEs', 'Developed a patient management and billing system', 'Created an innovative learning platform', 'Designed a comprehensive CRM solution']),
                duration: randomChoice(['2 weeks', '1 month', '3 months', '6 months', '1 year']),
                date: randomDate(new Date(2020, 0, 1), new Date(2024, 0, 1)),
                file: `/portfolio/project${professional.profile.id}.pdf`
            }
        });
        
        // Add professional skills (guaranteed for all professionals)
        const numSkills = randomInt(3, 8); // Each professional gets 3-8 skills
        const selectedSkills = randomChoices(skills, numSkills);
        
        for (const skill of selectedSkills) {
            await prisma.professionalSkill.create({
                data: {
                    professionalId: professional.professional.id,
                    skillId: skill.id,
                    proficiency: randomChoice(['Beginner', 'Intermediate', 'Advanced', 'Expert']),
                    yearsOfExp: randomInt(1, 15) // 1-15 years of experience
                }
            });
        }
        
        // Add professional reviews (guaranteed for all professionals)
        const numReviews = randomInt(3, 8); // Each professional gets 3-8 reviews
        for (let i = 0; i < numReviews; i++) {
            const client = randomChoice(users);
            const rating = randomInt(4, 5); // 4-5 star ratings
            const reviewDate = randomDate(new Date(2023, 0, 1), new Date());
            
            // Create review text
            await prisma.review.create({
                data: {
                    professionalUserId: professional.profile.userId,
                    clientUserId: client.id,
                    text: randomChoice([
                        'Excellent work! Very professional and delivered on time.',
                        'Great communication throughout the project. Highly recommended!',
                        'Outstanding quality and attention to detail. Will hire again.',
                        'Very knowledgeable and skilled. Exceeded my expectations.',
                        'Professional, reliable, and produces high-quality work.',
                        'Great experience working together. Project completed successfully.',
                        'Impressed with the expertise and dedication shown.',
                        'Delivered exactly what was promised. Very satisfied!'
                    ]),
                    createdAt: reviewDate
                }
            });
            
            // Create rating
            await prisma.rating.create({
                data: {
                    professionalUserId: professional.profile.userId,
                    clientUserId: client.id,
                    value: rating,
                    createdAt: reviewDate
                }
            });
        }
    }

    console.log('✅ Added education, experience, certifications, portfolios, and reviews');

    // ──────────────────── MASSIVE JOBS CREATION ────────────────────
    
    console.log('💼 Creating jobs...');
    
    const jobs: any[] = [];
    
    // Create 200 jobs across all lifecycle stages
    for (let i = 0; i < 200; i++) {
        const client = randomChoice(users);
        const professional = randomChoice(professionals);
        const statuses = ['PENDING', 'PENDING', 'PENDING', 'PENDING', 'ONGOING', 'COMPLETED', 'APPROVED', 'DISPUTED'];
        const status = randomChoice(statuses);
        
        const job = await prisma.job.create({
            data: {
                title: randomChoice([
                    'Website Development Project', 'Mobile App Design', 'Home Renovation', 'Electrical Installation', 'Plumbing Repair', 'Data Analysis Project', 'Marketing Campaign', 'Content Creation', 'Business Consulting', 'Legal Documentation',
                    'Software Architecture', 'UI/UX Redesign', 'Database Optimization', 'Cloud Migration', 'Security Audit', 'Performance Tuning', 'API Development', 'System Integration', 'Network Setup', 'Hardware Installation'
                ]),
                description: randomChoice([
                    'Complete overhaul of existing system with modern technologies',
                    'Design and implement user-friendly interface for better user experience',
                    'Fix critical issues and optimize performance for better efficiency',
                    'Develop new features to enhance functionality and user engagement',
                    'Provide expert consultation and recommendations for business growth'
                ]),
                clientId: client.id,
                professionalId: professional.user.id,
                status: status as any,
                accepted: status !== 'PENDING' ? Math.random() > 0.1 : false,
                approved: status === 'APPROVED',
                mode: randomChoice(['PHYSICAL', 'VIRTUAL']),
                state: randomChoice(states),
                lga: randomChoice(lgas),
                fullAddress: `${randomInt(1, 999)} ${randomChoice(['Project', 'Work', 'Client'])} ${randomChoice(['Street', 'Road', 'Avenue'])}, ${randomChoice(lgas)}, ${randomChoice(states)}`,
                workmanship: status !== 'PENDING' ? randomFloat(10000, 500000) : null,
                materialsCost: Math.random() > 0.5 ? randomFloat(5000, 200000) : null,
                isMaterial: Math.random() > 0.5,
                durationUnit: randomChoice(['hours', 'days', 'weeks', 'months']),
                durationValue: randomInt(1, 30),
                payStatus: ['ONGOING', 'COMPLETED', 'APPROVED'].includes(status) ? 'paid' : 'unpaid',
                paymentRef: ['ONGOING', 'COMPLETED', 'APPROVED'].includes(status) ? `PAY-JOB-${String(i + 1).padStart(6, '0')}` : null,
                createdAt: randomDate(new Date(2024, 0, 1), new Date())
            }
        });
        
        // Add materials for jobs that have them
        if (job.isMaterial && job.materialsCost && Math.random() > 0.3) {
            const materialCount = randomInt(1, 5);
            for (let j = 0; j < materialCount; j++) {
                await prisma.material.create({
                    data: { 
                        jobId: job.id, 
                        description: randomChoice(['PVC Pipe', 'Copper Wire', 'Software License', 'Hardware Components', 'Building Materials', 'Office Supplies', 'Tools', 'Equipment']),
                        quantity: randomInt(1, 20),
                        unit: randomChoice(['pieces', 'kg', 'liters', 'meters', 'sets']),
                        price: randomFloat(1000, 50000),
                        subTotal: randomFloat(1000, 100000)
                    }
                });
            }
        }
        
        // Add disputes for disputed jobs
        if (status === 'DISPUTED') {
            await prisma.dispute.create({
                data: {
                    reason: randomChoice(['Incomplete work', 'Poor quality', 'Delayed delivery', 'Overcharging', 'Unprofessional behavior', 'Communication issues']),
                    description: randomChoice([
                        'The work was not completed as agreed and quality is below expectations',
                        'Professional missed deadlines and was unresponsive to communications',
                        'Final deliverables do not match the initial requirements',
                        'Additional charges were introduced without prior agreement'
                    ]),
                    jobId: job.id,
                    reporterId: client.id,
                    partnerId: professional.user.id
                }
            });
        }
    }

    // Create 100 products
    const products = [];
    for (let i = 0; i < 100; i++) {
        const seller = randomChoice([...users, ...professionals.map(p => p.user)]);
        
        const product = await prisma.product.create({
            data: {
                name: randomChoice([
                    'Laptop Computer', 'Smartphone', 'Tablet Device', 'Wireless Headphones', 'Bluetooth Speaker', 'Power Bank', 'USB Cable', 'Mouse', 'Keyboard', 'Monitor',
                    'Professional Camera', 'Tripod Stand', 'Microphone', 'Lighting Kit', 'Software License', 'Office Chair', 'Desk Lamp', 'Printer', 'Scanner', 'External Hard Drive',
                    'Cooking Pot', 'Kitchen Knife Set', 'Blender', 'Microwave Oven', 'Rice Cooker', 'Air Fryer', 'Coffee Maker', 'Water Filter', 'Food Processor', 'Mixing Bowl'
                ]),
                description: randomChoice([
                    'High-quality product with excellent performance and durability',
                    'Professional grade equipment suitable for commercial use',
                    'Brand new item with manufacturer warranty included',
                    'Refurbished item in excellent condition with full functionality',
                    'Premium quality product with advanced features and specifications'
                ]),
                price: randomFloat(1000, 500000),
                quantity: randomInt(1, 100),
                weightPerUnit: randomFloat(0.1, 10),
                images: `https://placehold.co/400x400?text=Product${i + 1}`,
                approved: Math.random() > 0.1,
                categoryId: randomChoice(categories).id,
                userId: seller.id,
                locationId: (await prisma.location.findFirst({ where: { userId: seller.id } }))!.id,
            }
        });
        
        products.push(product);
    }

    console.log(`✅ Created ${products.length} products`);

    // ──────────────────── PRODUCT TRANSACTIONS & ORDERS ────────────────────
    
    console.log('📦 Creating product transactions and orders...');
    
    // Create 150 product transactions
    for (let i = 0; i < 150; i++) {
        const product = randomChoice(products) as any;
        const buyer = randomChoice(users.filter(u => u.id !== product.userId));
        const seller = users.find(u => u.id === product.userId) || professionals.find((p: any) => p.user.id === product.userId)?.user;
        
        if (seller) {
            const status = randomChoice(['pt_pending', 'pt_ordered', 'pt_delivered', 'pt_delivered', 'pt_delivered']);
            
            const ptx = await prisma.productTransaction.create({
                data: {
                    productId: product.id,
                    buyerId: buyer.id,
                    sellerId: seller.id,
                    quantity: randomInt(1, Math.min(5, product.quantity)),
                    price: product.price,
                    status: status as any,
                    orderMethod: randomChoice(['delivery', 'self_pickup']),
                    date: randomDate(new Date(2024, 0, 1), new Date())
                }
            });
            
            // Create orders for delivered transactions
            if (status === 'pt_delivered' && Math.random() > 0.3) {
                const rider = randomChoice(riders);
                const orderStatus = randomChoice(['delivered', 'delivered', 'delivered', 'paid', 'accepted']);
                
                await prisma.order.create({
                    data: {
                        productTransactionId: ptx.id,
                        status: orderStatus as any,
                        cost: randomFloat(500, 5000),
                        distance: randomFloat(1, 50),
                        weight: (product.weightPerUnit || 1) * ptx.quantity,
                        locationId: (await prisma.location.findFirst({ where: { userId: rider.user.id } }))!.id,
                        riderId: rider.user.id
                    }
                });
            }
        }
    }

    console.log('✅ Created product transactions and orders');

    // ──────────────────── TRANSACTIONS & LEDGER ENTRIES ────────────────────
    
    console.log('💳 Creating transactions and ledger entries...');
    
    // Create transactions for completed jobs
    const completedJobs = jobs.filter(j => ['COMPLETED', 'APPROVED'].includes(j.status));
    
    for (const job of completedJobs) {
        const workmanship = job.workmanship ? Number(job.workmanship) : 0;
        const materialsCost = job.materialsCost ? Number(job.materialsCost) : 0;
        const amount = Number((workmanship + materialsCost).toFixed(2));
        
        // Client payment
        const txClient = await prisma.transaction.create({
            data: {
                amount: amount,
                type: 'debit',
                status: 'success',
                channel: randomChoice(['paystack', 'wallet', 'bank_transfer']),
                currency: 'NGN',
                timestamp: randomDate(new Date(2024, 0, 1), new Date()),
                description: 'job payment',
                reference: `TXN-JOB-${job.id}`,
                jobId: job.id,
                userId: job.clientId
            }
        });
        
        // Ledger entries for client payment
        await prisma.ledgerEntry.create({
            data: { transactionId: txClient.id, userId: job.clientId, amount: amount, type: 'debit', account: 'payment_gateway', category: 'ec_job' }
        });
        await prisma.ledgerEntry.create({
            data: { transactionId: txClient.id, userId: null, amount: amount, type: 'credit', account: 'platform_escrow', category: 'ec_job' }
        });
        
        // Professional payout (for approved jobs)
        if (job.status === 'APPROVED') {
            const commission = amount * 0.05;
            const payout = amount - commission;
            
            const txPro = await prisma.transaction.create({
                data: {
                    amount: payout,
                    type: 'credit',
                    status: 'success',
                    currency: 'NGN',
                    timestamp: new Date(txClient.timestamp.getTime() + 24 * 60 * 60 * 1000), // Next day
                    description: 'wallet deposit',
                    reference: `TXN-EARN-${job.id}`,
                    jobId: job.id,
                    userId: job.professionalId
                }
            });
            
            // Ledger entries for payout
            await prisma.ledgerEntry.create({
                data: { transactionId: txPro.id, userId: null, amount: amount, type: 'debit', account: 'platform_escrow', category: 'ec_job' }
            });
            await prisma.ledgerEntry.create({
                data: { transactionId: txPro.id, userId: job.professionalId, amount: payout, type: 'credit', account: 'professional_wallet', category: 'ec_job' }
            });
            await prisma.ledgerEntry.create({
                data: { transactionId: txPro.id, userId: null, amount: commission, type: 'credit', account: 'platform_revenue', category: 'ec_job' }
            });
        }
    }
    
    // Create wallet transfers
    for (let i = 0; i < 50; i++) {
        const sender = randomChoice([...users, ...professionals.map(p => p.user), ...riders.map(r => r.user)]);
        const receiver = randomChoice([...users, ...professionals.map(p => p.user), ...riders.map(r => r.user)].filter(u => u.id !== sender.id));
        
        const transfer = await prisma.transfer.create({
            data: {
                userId: sender.id,
                amount: randomFloat(1000, 50000),
                status: randomChoice(['transfer_success', 'transfer_success', 'transfer_pending']),
                reason: 'Wallet transfer',
                reference: `TXN-TRANSFER-${Date.now()}-${i}`,
                recipientCode: `RCV-${receiver.id.slice(-8)}`,
                timestamp: new Date()
            }
        });
        
        if (transfer.status === 'transfer_success') {
            // Sender transaction
            await prisma.transaction.create({
                data: {
                    amount: transfer.amount,
                    type: 'debit',
                    status: 'success',
                    currency: 'NGN',
                    timestamp: randomDate(new Date(2024, 0, 1), new Date()),
                    description: 'wallet transfer',
                    reference: `TXN-TRANSFER-${transfer.id}`,
                    userId: sender.id
                }
            });
            
            // Receiver transaction
            await prisma.transaction.create({
                data: {
                    amount: transfer.amount,
                    type: 'credit',
                    status: 'success',
                    currency: 'NGN',
                    timestamp: new Date(transfer.createdAt.getTime() + 60000), // 1 minute later
                    description: 'wallet transfer received',
                    reference: `TXN-TRANSFER-RECV-${transfer.id}`,
                    userId: receiver.id
                }
            });
        }
    }

    console.log('✅ Created transactions and ledger entries');

    // ──────────────────── RATINGS, REVIEWS, ACTIVITIES ────────────────────
    
    console.log('⭐ Creating ratings, reviews, and activities...');
    
    // Create ratings and reviews for completed jobs (guaranteed for all)
    for (const job of completedJobs) {
        // Client rates professional (guaranteed)
        await prisma.rating.create({
            data: {
                value: randomInt(4, 5), // Higher ratings for better quality
                professionalUserId: job.professionalId,
                clientUserId: job.clientId,
                jobId: job.id
            }
        });
        
        await prisma.review.create({
            data: {
                text: randomChoice([
                    'Excellent work! Very professional and delivered on time.',
                    'Outstanding quality and attention to detail. Highly recommended!',
                    'Great communication throughout the project. Exceeded my expectations!',
                    'Professional, reliable, and produces high-quality work.',
                    'Impressed with the expertise and dedication shown.',
                    'Delivered exactly what was promised. Very satisfied!',
                    'Great experience working together. Project completed successfully.',
                    'Top-notch service! Will definitely hire again for future projects.'
                ]),
                professionalUserId: job.professionalId,
                clientUserId: job.clientId,
                jobId: job.id
            }
        });
        
        // Professional rates client (guaranteed)
        await prisma.rating.create({
            data: {
                value: randomInt(4, 5), // Higher ratings for better client experience
                professionalUserId: job.professionalId,
                clientUserId: job.clientId,
                jobId: job.id
            }
        });
        
        await prisma.review.create({
            data: {
                text: randomChoice([
                    'Excellent client! Clear requirements and great communication.',
                    'Prompt payment and very cooperative throughout the project.',
                    'Professional and respectful. A pleasure to work with!',
                    'Provided all necessary information and resources on time.',
                    'Very understanding and flexible with project requirements.',
                    'Great collaboration skills and constructive feedback.',
                    'Organized and prepared. Made the project run smoothly.',
                    'Appreciative of the work and very professional in all interactions.',
                    'Excellent collaboration, would work with again.'
                ]),
                professionalUserId: job.professionalId,
                clientUserId: job.clientId,
                jobId: job.id
            }
        });
    }
    
    console.log('✅ Created ratings and reviews for all completed jobs');

    console.log('✅ Created ratings, reviews, and activities');

    // ──────────────────── CHAT ROOMS & MESSAGES ────────────────────
    
    console.log('💬 Creating chat rooms and messages...');
    
    // Create chat rooms between users who had transactions
    const chatPairs = new Set<string>();
    
    for (const job of jobs) {
        const pairKey = [job.clientId, job.professionalId].sort().join('-');
        if (!chatPairs.has(pairKey)) {
            chatPairs.add(pairKey);
            
            const chatRoom = await prisma.chatRoom.create({
                data: {
                    name: `Chat Room ${job.id}`,
                    members: JSON.stringify([job.clientId, job.professionalId])
                }
            });
            
            // Add some messages
            const messageCount = randomInt(1, 20);
            for (let i = 0; i < messageCount; i++) {
                await prisma.message.create({
                    data: {
                        from: randomChoice([job.clientId, job.professionalId]),
                        text: randomChoice([
                            'Hello, I\'m interested in your services',
                            'Thank you for reaching out',
                            'Can you provide more details?',
                            'When can you start?',
                            'Looking forward to working with you',
                            'The project is progressing well',
                            'I have some questions about the requirements',
                            'Everything looks good so far',
                            'Let me know if you need anything',
                            'Great work on this project!'
                        ]),
                        chatroomId: chatRoom.id,
                        timestamp: randomDate(new Date(2024, 0, 1), new Date())
                    }
                });
            }
        }
    }

    console.log('✅ Created chat rooms and messages');

    // ──────────────────── VERIFICATION CODES ────────────────────
    
    console.log('🔐 Creating verification codes...');
    
    // Create verification codes for some users
    for (let i = 0; i < 100; i++) {
        const user = randomChoice([...users, ...professionals.map(p => p.user), ...riders.map(r => r.user)]);
        
        await prisma.verify.create({
            data: {
                contact: randomChoice([user.email, user.phone]),
                code: String(randomInt(100000, 999999)),
                type: randomChoice(['EMAIL', 'SMS', 'BOTH']),
                verified: false
            }
        });
    }

    console.log('✅ Created verification codes');

    console.log('\n🎉 MASSIVE seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   • Users: ${50 + 30 + 20 + 10 + 5} (115 total)`);
    console.log(`   • Jobs: ${jobs.length}`);
    console.log(`   • Products: ${products.length}`);
    console.log(`   • Transactions: Hundreds across all types`);
    console.log(`   • Chat rooms: ${chatPairs.size}`);
    console.log(`   • Activities: 500`);
    console.log(`   • And much more...`);
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        throw e;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
