import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PASSWORD = 'Test@1234';

// Helper functions
const randomChoice = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number): number => Math.round((Math.random() * (max - min) + min) * 100) / 100;
const randomDate = (start: Date, end: Date): Date => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

// Mock data arrays
const firstNames = ['John', 'Sarah', 'Emeka', 'Bola', 'Tunde', 'Chidi', 'Aisha', 'David', 'Grace', 'Michael', 'Funke', 'Kunle', 'Ngozi', 'Peter', 'Elizabeth', 'Samuel', 'Ada', 'Paul', 'Mary', 'Joseph', 'Rachel', 'Daniel', 'Patience', 'Christopher', 'Victoria', 'Benjamin', 'Rebecca', 'Joshua', 'Esther', 'Andrew', 'Deborah'];
const lastNames = ['Adeyemi', 'Okafor', 'Obi', 'Akinwale', 'Bakare', 'Nwosu', 'Amadi', 'Eze', 'Okoro', 'Okeke', 'Ibrahim', 'Yusuf', 'Bello', 'Sani', 'Abubakar', 'Mohammed', 'Aliyu', 'Garba', 'Lawal', 'Ogunleye', 'Babalola', 'Adebayo', 'Oladimeji', 'Fashola', 'Tinubu', 'Obasanjo', 'Jonathan', 'Buhari', 'Atiku', 'Shettima', 'Osinbajo'];
const lgas = ['Ikeja', 'Lagos Island', 'Eti-Osa', 'Surulere', 'Apapa', 'Agege', 'Ifako-Ijaiye', 'Kosofe', 'Mushin', 'Oshodi-Isolo', 'Shomolu', 'Alimosho'];
const states = ['Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Ibadan', 'Benin City', 'Enugu', 'Aba', 'Jos', 'Ilorin', 'Oyo', 'Akure', 'Maiduguri', 'Warri', 'Uyo'];

async function main() {
    console.log('🌱 Starting REALISTIC database seeding...\n');

    // Clean existing data
    await prisma.professional.deleteMany();
    await prisma.profession.deleteMany();
    await prisma.sector.deleteMany();

    console.log('✅ Cleaned existing sectors and professions');

    // ──────────────────── REALISTIC NIGERIAN SECTORS ────────────────────
    
    const sectors = await Promise.all([
        prisma.sector.create({ data: { title: 'Home Services', image: 'https://placehold.co/100x100?text=Home' } }),
        prisma.sector.create({ data: { title: 'Technology & IT', image: 'https://placehold.co/100x100?text=Tech' } }),
        prisma.sector.create({ data: { title: 'Building & Construction', image: 'https://placehold.co/100x100?text=Build' } }),
        prisma.sector.create({ data: { title: 'Automotive Services', image: 'https://placehold.co/100x100?text=Auto' } }),
        prisma.sector.create({ data: { title: 'Education & Training', image: 'https://placehold.co/100x100?text=Edu' } }),
        prisma.sector.create({ data: { title: 'Health & Wellness', image: 'https://placehold.co/100x100?text=Health' } }),
        prisma.sector.create({ data: { title: 'Beauty & Personal Care', image: 'https://placehold.co/100x100?text=Beauty' } }),
        prisma.sector.create({ data: { title: 'Events & Entertainment', image: 'https://placehold.co/100x100?text=Events' } }),
        prisma.sector.create({ data: { title: 'Business & Professional', image: 'https://placehold.co/100x100?text=Business' } }),
        prisma.sector.create({ data: { title: 'Food & Catering', image: 'https://placehold.co/100x100?text=Food' } }),
    ]);

    // ──────────────────── REALISTIC NIGERIAN PROFESSIONS ────────────────────
    
    const professions = await Promise.all([
        // Home Services
        prisma.profession.create({ data: { title: 'Plumber', sectorId: sectors[0].id, image: 'https://placehold.co/100x100?text=Plumber' } }),
        prisma.profession.create({ data: { title: 'Electrician', sectorId: sectors[0].id, image: 'https://placehold.co/100x100?text=Electrician' } }),
        prisma.profession.create({ data: { title: 'Carpenter', sectorId: sectors[0].id, image: 'https://placehold.co/100x100?text=Carpenter' } }),
        prisma.profession.create({ data: { title: 'Painter', sectorId: sectors[0].id, image: 'https://placehold.co/100x100?text=Painter' } }),
        prisma.profession.create({ data: { title: 'HVAC Technician', sectorId: sectors[0].id, image: 'https://placehold.co/100x100?text=HVAC' } }),
        prisma.profession.create({ data: { title: 'Home Cleaner', sectorId: sectors[0].id, image: 'https://placehold.co/100x100?text=Cleaner' } }),
        prisma.profession.create({ data: { title: 'Pest Control', sectorId: sectors[0].id, image: 'https://placehold.co/100x100?text=Pest' } }),
        prisma.profession.create({ data: { title: 'Gardener', sectorId: sectors[0].id, image: 'https://placehold.co/100x100?text=Garden' } }),
        
        // Technology & IT
        prisma.profession.create({ data: { title: 'Web Developer', sectorId: sectors[1].id, image: 'https://placehold.co/100x100?text=WebDev' } }),
        prisma.profession.create({ data: { title: 'Mobile App Developer', sectorId: sectors[1].id, image: 'https://placehold.co/100x100?text=MobileDev' } }),
        prisma.profession.create({ data: { title: 'Graphic Designer', sectorId: sectors[1].id, image: 'https://placehold.co/100x100?text=Designer' } }),
        prisma.profession.create({ data: { title: 'IT Support Technician', sectorId: sectors[1].id, image: 'https://placehold.co/100x100?text=ITSupport' } }),
        prisma.profession.create({ data: { title: 'Network Engineer', sectorId: sectors[1].id, image: 'https://placehold.co/100x100?text=Network' } }),
        prisma.profession.create({ data: { title: 'Data Analyst', sectorId: sectors[1].id, image: 'https://placehold.co/100x100?text=Data' } }),
        prisma.profession.create({ data: { title: 'Cybersecurity Expert', sectorId: sectors[1].id, image: 'https://placehold.co/100x100?text=Security' } }),
        
        // Building & Construction
        prisma.profession.create({ data: { title: 'Mason', sectorId: sectors[2].id, image: 'https://placehold.co/100x100?text=Mason' } }),
        prisma.profession.create({ data: { title: 'Tiler', sectorId: sectors[2].id, image: 'https://placehold.co/100x100?text=Tiler' } }),
        prisma.profession.create({ data: { title: 'Roofer', sectorId: sectors[2].id, image: 'https://placehold.co/100x100?text=Roofer' } }),
        prisma.profession.create({ data: { title: 'Welder', sectorId: sectors[2].id, image: 'https://placehold.co/100x100?text=Welder' } }),
        prisma.profession.create({ data: { title: 'Architect', sectorId: sectors[2].id, image: 'https://placehold.co/100x100?text=Architect' } }),
        prisma.profession.create({ data: { title: 'Quantity Surveyor', sectorId: sectors[2].id, image: 'https://placehold.co/100x100?text=QS' } }),
        
        // Automotive Services
        prisma.profession.create({ data: { title: 'Auto Mechanic', sectorId: sectors[3].id, image: 'https://placehold.co/100x100?text=Mechanic' } }),
        prisma.profession.create({ data: { title: 'Auto Electrician', sectorId: sectors[3].id, image: 'https://placehold.co/100x100?text=AutoElec' } }),
        prisma.profession.create({ data: { title: 'Car Painter', sectorId: sectors[3].id, image: 'https://placehold.co/100x100?text=CarPaint' } }),
        prisma.profession.create({ data: { title: 'Tyre Specialist', sectorId: sectors[3].id, image: 'https://placehold.co/100x100?text=Tyre' } }),
        prisma.profession.create({ data: { title: 'Car Wash & Detailing', sectorId: sectors[3].id, image: 'https://placehold.co/100x100?text=CarWash' } }),
        
        // Education & Training
        prisma.profession.create({ data: { title: 'Mathematics Tutor', sectorId: sectors[4].id, image: 'https://placehold.co/100x100?text=Math' } }),
        prisma.profession.create({ data: { title: 'English Tutor', sectorId: sectors[4].id, image: 'https://placehold.co/100x100?text=English' } }),
        prisma.profession.create({ data: { title: 'Science Tutor', sectorId: sectors[4].id, image: 'https://placehold.co/100x100?text=Science' } }),
        prisma.profession.create({ data: { title: 'Music Teacher', sectorId: sectors[4].id, image: 'https://placehold.co/100x100?text=Music' } }),
        prisma.profession.create({ data: { title: 'Computer Instructor', sectorId: sectors[4].id, image: 'https://placehold.co/100x100?text=Computer' } }),
        prisma.profession.create({ data: { title: 'Vocational Trainer', sectorId: sectors[4].id, image: 'https://placehold.co/100x100?text=Vocational' } }),
        
        // Health & Wellness
        prisma.profession.create({ data: { title: 'Fitness Trainer', sectorId: sectors[5].id, image: 'https://placehold.co/100x100?text=Fitness' } }),
        prisma.profession.create({ data: { title: 'Nutritionist', sectorId: sectors[5].id, image: 'https://placehold.co/100x100?text=Nutrition' } }),
        prisma.profession.create({ data: { title: 'Physiotherapist', sectorId: sectors[5].id, image: 'https://placehold.co/100x100?text=Physio' } }),
        prisma.profession.create({ data: { title: 'Massage Therapist', sectorId: sectors[5].id, image: 'https://placehold.co/100x100?text=Massage' } }),
        prisma.profession.create({ data: { title: 'Yoga Instructor', sectorId: sectors[5].id, image: 'https://placehold.co/100x100?text=Yoga' } }),
        
        // Beauty & Personal Care
        prisma.profession.create({ data: { title: 'Hair Stylist', sectorId: sectors[6].id, image: 'https://placehold.co/100x100?text=Hair' } }),
        prisma.profession.create({ data: { title: 'Makeup Artist', sectorId: sectors[6].id, image: 'https://placehold.co/100x100?text=Makeup' } }),
        prisma.profession.create({ data: { title: 'Barber', sectorId: sectors[6].id, image: 'https://placehold.co/100x100?text=Barber' } }),
        prisma.profession.create({ data: { title: 'Nail Technician', sectorId: sectors[6].id, image: 'https://placehold.co/100x100?text=Nails' } }),
        prisma.profession.create({ data: { title: 'Beautician', sectorId: sectors[6].id, image: 'https://placehold.co/100x100?text=Beauty' } }),
        
        // Events & Entertainment
        prisma.profession.create({ data: { title: 'Event Planner', sectorId: sectors[7].id, image: 'https://placehold.co/100x100?text=Event' } }),
        prisma.profession.create({ data: { title: 'Photographer', sectorId: sectors[7].id, image: 'https://placehold.co/100x100?text=Photo' } }),
        prisma.profession.create({ data: { title: 'Videographer', sectorId: sectors[7].id, image: 'https://placehold.co/100x100?text=Video' } }),
        prisma.profession.create({ data: { title: 'DJ', sectorId: sectors[7].id, image: 'https://placehold.co/100x100?text=DJ' } }),
        prisma.profession.create({ data: { title: 'Caterer', sectorId: sectors[7].id, image: 'https://placehold.co/100x100?text=Caterer' } }),
        prisma.profession.create({ data: { title: 'Master of Ceremony', sectorId: sectors[7].id, image: 'https://placehold.co/100x100?text=MC' } }),
        
        // Business & Professional
        prisma.profession.create({ data: { title: 'Accountant', sectorId: sectors[8].id, image: 'https://placehold.co/100x100?text=Account' } }),
        prisma.profession.create({ data: { title: 'Business Consultant', sectorId: sectors[8].id, image: 'https://placehold.co/100x100?text=Consult' } }),
        prisma.profession.create({ data: { title: 'Lawyer', sectorId: sectors[8].id, image: 'https://placehold.co/100x100?text=Lawyer' } }),
        prisma.profession.create({ data: { title: 'Marketing Expert', sectorId: sectors[8].id, image: 'https://placehold.co/100x100?text=Marketing' } }),
        prisma.profession.create({ data: { title: 'HR Consultant', sectorId: sectors[8].id, image: 'https://placehold.co/100x100?text=HR' } }),
        
        // Food & Catering
        prisma.profession.create({ data: { title: 'Chef', sectorId: sectors[9].id, image: 'https://placehold.co/100x100?text=Chef' } }),
        prisma.profession.create({ data: { title: 'Baker', sectorId: sectors[9].id, image: 'https://placehold.co/100x100?text=Baker' } }),
        prisma.profession.create({ data: { title: 'Catering Service', sectorId: sectors[9].id, image: 'https://placehold.co/100x100?text=Catering' } }),
        prisma.profession.create({ data: { title: 'Food Vendor', sectorId: sectors[9].id, image: 'https://placehold.co/100x100?text=Vendor' } }),
    ]);

    console.log(`✅ Created ${sectors.length} realistic sectors and ${professions.length} professions`);

    console.log('\n🎉 REALISTIC seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   • Sectors: ${sectors.length}`);
    console.log(`   • Professions: ${professions.length}`);
    console.log(`\n📋 Realistic Nigerian Sectors:`);
    sectors.forEach((sector, index) => {
        const sectorProfs = professions.filter(p => p.sectorId === sector.id);
        console.log(`   ${index + 1}. ${sector.title} (${sectorProfs.length} professions)`);
        sectorProfs.forEach((prof, pIndex) => {
            console.log(`      ${pIndex + 1}. ${prof.title}`);
        });
    });
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        throw e;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
