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

// Mock data arrays (same as massive seed)
const firstNames = ['John', 'Sarah', 'Emeka', 'Bola', 'Tunde', 'Chidi', 'Aisha', 'David', 'Grace', 'Michael', 'Funke', 'Kunle', 'Ngozi', 'Peter', 'Elizabeth', 'Samuel', 'Ada', 'Paul', 'Mary', 'Joseph', 'Rachel', 'Daniel', 'Patience', 'Christopher', 'Victoria', 'Benjamin', 'Rebecca', 'Joshua', 'Esther', 'Andrew', 'Deborah'];
const lastNames = ['Adeyemi', 'Okafor', 'Obi', 'Akinwale', 'Bakare', 'Nwosu', 'Amadi', 'Eze', 'Okoro', 'Okeke', 'Ibrahim', 'Yusuf', 'Bello', 'Sani', 'Abubakar', 'Mohammed', 'Aliyu', 'Garba', 'Lawal', 'Ogunleye', 'Babalola', 'Adebayo', 'Oladimeji', 'Fashola', 'Tinubu', 'Obasanjo', 'Jonathan', 'Buhari', 'Atiku', 'Shettima', 'Osinbajo'];
const lgas = ['Ikeja', 'Lagos Island', 'Eti-Osa', 'Surulere', 'Apapa', 'Agege', 'Ifako-Ijaiye', 'Kosofe', 'Mushin', 'Oshodi-Isolo', 'Shomolu', 'Alimosho'];
const states = ['Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Ibadan', 'Benin City', 'Enugu', 'Aba', 'Jos', 'Ilorin', 'Oyo', 'Akure', 'Maiduguri', 'Warri', 'Uyo'];

// Skills data
const skillsData = [
    // Technical Skills
    { name: 'Web Development', description: 'Building websites and web applications', category: 'Technical' },
    { name: 'Mobile Development', description: 'Creating mobile applications for iOS and Android', category: 'Technical' },
    { name: 'UI/UX Design', description: 'User interface and user experience design', category: 'Technical' },
    { name: 'DevOps', description: 'Development and operations practices', category: 'Technical' },
    { name: 'Database Management', description: 'Managing and optimizing databases', category: 'Technical' },
    { name: 'Machine Learning', description: 'Building and training machine learning models', category: 'Technical' },
    { name: '3D Modeling', description: 'Creating 3D models and designs', category: 'Creative' },
    
    // Home Services
    { name: 'Electrical', description: 'Electrical installation and maintenance', category: 'Home Services' },
    { name: 'Plumbing', description: 'Installing and repairing plumbing systems', category: 'Home Services' },
    { name: 'Landscaping', description: 'Garden and landscape maintenance', category: 'Home Services' },
    { name: 'Painting', description: 'Interior and exterior painting', category: 'Home Services' },
    { name: 'Pest Control', description: 'Managing and eliminating pests', category: 'Home Services' },
    { name: 'HVAC', description: 'Heating, ventilation, and air conditioning', category: 'Home Services' },
    
    // Creative Skills
    { name: 'Graphic Design', description: 'Creating visual content and graphics', category: 'Creative' },
    { name: 'Music Production', description: 'Producing and editing music', category: 'Creative' },
    { name: 'Photography', description: 'Professional photography services', category: 'Creative' },
    { name: 'Video Editing', description: 'Editing and producing video content', category: 'Creative' },
    { name: 'Voice Over', description: 'Professional voice recording services', category: 'Creative' },
    { name: 'Content Writing', description: 'Writing and editing content', category: 'Creative' },
    
    // Business Skills
    { name: 'Marketing', description: 'Marketing strategy and implementation', category: 'Business' },
    { name: 'Sales', description: 'Sales strategy and execution', category: 'Business' },
    { name: 'Project Management', description: 'Managing projects and teams', category: 'Business' },
    { name: 'Financial Planning', description: 'Creating financial strategies and plans', category: 'Business' },
    { name: 'Human Resources', description: 'HR management and consulting', category: 'Business' },
    { name: 'Business Consulting', description: 'Strategic business advice and consulting', category: 'Business' },
    
    // Education Skills
    { name: 'Teaching', description: 'Educational instruction and teaching', category: 'Education' },
    { name: 'Training', description: 'Professional training and development', category: 'Education' },
    { name: 'Tutoring', description: 'Personalized academic support', category: 'Education' },
    { name: 'E-learning', description: 'Online education and course creation', category: 'Education' },
    
    // Health Skills
    { name: 'Massage Therapy', description: 'Professional massage services', category: 'Health' },
    { name: 'Personal Training', description: 'Fitness coaching and personal training', category: 'Health' },
    { name: 'Nutrition Counseling', description: 'Nutrition advice and meal planning', category: 'Health' },
    { name: 'Mental Health Counseling', description: 'Mental health support and counseling', category: 'Health' },
    { name: 'Yoga Instruction', description: 'Teaching yoga and mindfulness', category: 'Health' },
    
    // Transportation Skills
    { name: 'Driving', description: 'Professional driving services', category: 'Transportation' },
    { name: 'Logistics', description: 'Supply chain and logistics management', category: 'Transportation' },
    { name: 'Delivery', description: 'Package and goods delivery', category: 'Transportation' },
    { name: 'Moving Services', description: 'Relocation and moving assistance', category: 'Transportation' }
];

async function main() {
    console.log('🌱 Starting SMART database seeding...\n');

    const hashedPassword = await bcrypt.hash(PASSWORD, 10);

    // ──────────────────── SECTORS & PROFESSIONS (Check if exist) ────────────────────
    
    const existingSectors = await prisma.sector.count();
    if (existingSectors === 0) {
        console.log('🏢 Creating sectors and professions...');
        
        const sectorsData = [
            { title: 'Technology', image: 'https://placehold.co/100x100?text=Tech' },
            { title: 'Education', image: 'https://placehold.co/100x100?text=Edu' },
            { title: 'Home Services', image: 'https://placehold.co/100x100?text=Home' },
            { title: 'Agriculture', image: 'https://placehold.co/100x100?text=Agri' },
            { title: 'Transportation & Logistics', image: 'https://placehold.co/100x100?text=Transport' },
            { title: 'Entertainment & Media', image: 'https://placehold.co/100x100?text=Media' },
            { title: 'Health & Wellness', image: 'https://placehold.co/100x100?text=Health' },
            { title: 'Business & Finance', image: 'https://placehold.co/100x100?text=Business' },
            { title: 'Creative & Design', image: 'https://placehold.co/100x100?text=Creative' },
            { title: 'Legal', image: 'https://placehold.co/100x100?text=Legal' }
        ];

        const sectors = await Promise.all(sectorsData.map(sector => prisma.sector.create({ data: sector })));

        const professionsData = [
            { title: 'Software Engineer', sectorId: sectors[0].id, image: 'https://placehold.co/100x100?text=Dev' },
            { title: 'Cybersecurity Expert', sectorId: sectors[0].id, image: 'https://placehold.co/100x100?text=Security' },
            { title: 'Teacher', sectorId: sectors[1].id, image: 'https://placehold.co/100x100?text=Teach' },
            { title: 'Electrician', sectorId: sectors[2].id, image: 'https://placehold.co/100x100?text=Electric' },
            { title: 'Plumber', sectorId: sectors[2].id, image: 'https://placehold.co/100x100?text=Plumb' },
            { title: 'Driver', sectorId: sectors[4].id, image: 'https://placehold.co/100x100?text=Drive' },
            { title: 'Content Creator', sectorId: sectors[5].id, image: 'https://placehold.co/100x100?text=Create' },
            { title: 'Nutritionist', sectorId: sectors[6].id, image: 'https://placehold.co/100x100?text=Nutri' },
            { title: 'Financial Advisor', sectorId: sectors[7].id, image: 'https://placehold.co/100x100?text=Finance' },
            { title: 'Graphic Designer', sectorId: sectors[8].id, image: 'https://placehold.co/100x100?text=Design' },
            { title: 'Lawyer', sectorId: sectors[9].id, image: 'https://placehold.co/100x100?text=Law' }
        ];

        await Promise.all(professionsData.map(profession => prisma.profession.create({ data: profession })));
        console.log('✅ Created sectors and professions');
    } else {
        console.log('✅ Sectors and professions already exist');
    }

    // ──────────────────── SKILLS (Check if exist) ────────────────────
    
    const existingSkills = await prisma.skill.count();
    if (existingSkills === 0) {
        console.log('🎯 Creating skills...');
        const skills = await Promise.all(skillsData.map(skill => prisma.skill.create({ data: skill })));
        console.log(`✅ Created ${skills.length} skills`);
    } else {
        console.log('✅ Skills already exist');
    }

    // ──────────────────── USERS (Check if exist) ────────────────────
    
    const existingUsers = await prisma.user.count();
    if (existingUsers === 0) {
        console.log('👥 Creating users...');
        
        const users = [];
        const professionals = [];
        const riders = [];
        
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
                data: { userId: user.id, previousBalance: randomFloat(50000, 300000), currentBalance: randomFloat(100000, 1000000) }
            });
            
            users.push(user);
        }
        
        console.log(`✅ Created ${users.length} client users`);
    } else {
        console.log('✅ Users already exist');
    }

    console.log('\n🎉 SMART seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`   • Skills: ${await prisma.skill.count()}`);
    console.log(`   • Sectors: ${await prisma.sector.count()}`);
    console.log(`   • Users: ${await prisma.user.count()}`);
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        throw e;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
