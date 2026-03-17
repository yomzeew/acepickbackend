import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Updating sectors and professions with REALISTIC data...\n');

    // ──────────────────── UPDATE SECTORS ────────────────────
    
    const sectorUpdates = [
        { id: 1, title: 'Home Services', image: 'https://placehold.co/100x100?text=Home' },
        { id: 2, title: 'Technology & IT', image: 'https://placehold.co/100x100?text=Tech' },
        { id: 3, title: 'Building & Construction', image: 'https://placehold.co/100x100?text=Build' },
        { id: 4, title: 'Automotive Services', image: 'https://placehold.co/100x100?text=Auto' },
        { id: 5, title: 'Education & Training', image: 'https://placehold.co/100x100?text=Edu' },
        { id: 6, title: 'Health & Wellness', image: 'https://placehold.co/100x100?text=Health' },
        { id: 7, title: 'Beauty & Personal Care', image: 'https://placehold.co/100x100?text=Beauty' },
        { id: 8, title: 'Events & Entertainment', image: 'https://placehold.co/100x100?text=Events' },
        { id: 9, title: 'Business & Professional', image: 'https://placehold.co/100x100?text=Business' },
        { id: 10, title: 'Food & Catering', image: 'https://placehold.co/100x100?text=Food' },
    ];

    for (const sector of sectorUpdates) {
        try {
            await prisma.sector.update({
                where: { id: sector.id },
                data: { title: sector.title, image: sector.image }
            });
            console.log(`✅ Updated sector: ${sector.title}`);
        } catch (error) {
            console.log(`⚠️  Sector ${sector.id} not found, creating new...`);
            await prisma.sector.create({
                data: { title: sector.title, image: sector.image }
            });
        }
    }

    // ──────────────────── UPDATE PROFESSIONS ────────────────────
    
    // Clear existing professions
    await prisma.profession.deleteMany();
    
    const professions = [
        // Home Services (Sector 1)
        { title: 'Plumber', sectorId: 1, image: 'https://placehold.co/100x100?text=Plumber' },
        { title: 'Electrician', sectorId: 1, image: 'https://placehold.co/100x100?text=Electrician' },
        { title: 'Carpenter', sectorId: 1, image: 'https://placehold.co/100x100?text=Carpenter' },
        { title: 'Painter', sectorId: 1, image: 'https://placehold.co/100x100?text=Painter' },
        { title: 'HVAC Technician', sectorId: 1, image: 'https://placehold.co/100x100?text=HVAC' },
        { title: 'Home Cleaner', sectorId: 1, image: 'https://placehold.co/100x100?text=Cleaner' },
        { title: 'Pest Control', sectorId: 1, image: 'https://placehold.co/100x100?text=Pest' },
        { title: 'Gardener', sectorId: 1, image: 'https://placehold.co/100x100?text=Garden' },
        
        // Technology & IT (Sector 2)
        { title: 'Web Developer', sectorId: 2, image: 'https://placehold.co/100x100?text=WebDev' },
        { title: 'Mobile App Developer', sectorId: 2, image: 'https://placehold.co/100x100?text=MobileDev' },
        { title: 'Graphic Designer', sectorId: 2, image: 'https://placehold.co/100x100?text=Designer' },
        { title: 'IT Support Technician', sectorId: 2, image: 'https://placehold.co/100x100?text=ITSupport' },
        { title: 'Network Engineer', sectorId: 2, image: 'https://placehold.co/100x100?text=Network' },
        { title: 'Data Analyst', sectorId: 2, image: 'https://placehold.co/100x100?text=Data' },
        { title: 'Cybersecurity Expert', sectorId: 2, image: 'https://placehold.co/100x100?text=Security' },
        
        // Building & Construction (Sector 3)
        { title: 'Mason', sectorId: 3, image: 'https://placehold.co/100x100?text=Mason' },
        { title: 'Tiler', sectorId: 3, image: 'https://placehold.co/100x100?text=Tiler' },
        { title: 'Roofer', sectorId: 3, image: 'https://placehold.co/100x100?text=Roofer' },
        { title: 'Welder', sectorId: 3, image: 'https://placehold.co/100x100?text=Welder' },
        { title: 'Architect', sectorId: 3, image: 'https://placehold.co/100x100?text=Architect' },
        { title: 'Quantity Surveyor', sectorId: 3, image: 'https://placehold.co/100x100?text=QS' },
        
        // Automotive Services (Sector 4)
        { title: 'Auto Mechanic', sectorId: 4, image: 'https://placehold.co/100x100?text=Mechanic' },
        { title: 'Auto Electrician', sectorId: 4, image: 'https://placehold.co/100x100?text=AutoElec' },
        { title: 'Car Painter', sectorId: 4, image: 'https://placehold.co/100x100?text=CarPaint' },
        { title: 'Tyre Specialist', sectorId: 4, image: 'https://placehold.co/100x100?text=Tyre' },
        { title: 'Car Wash & Detailing', sectorId: 4, image: 'https://placehold.co/100x100?text=CarWash' },
        
        // Education & Training (Sector 5)
        { title: 'Mathematics Tutor', sectorId: 5, image: 'https://placehold.co/100x100?text=Math' },
        { title: 'English Tutor', sectorId: 5, image: 'https://placehold.co/100x100?text=English' },
        { title: 'Science Tutor', sectorId: 5, image: 'https://placehold.co/100x100?text=Science' },
        { title: 'Music Teacher', sectorId: 5, image: 'https://placehold.co/100x100?text=Music' },
        { title: 'Computer Instructor', sectorId: 5, image: 'https://placehold.co/100x100?text=Computer' },
        { title: 'Vocational Trainer', sectorId: 5, image: 'https://placehold.co/100x100?text=Vocational' },
        
        // Health & Wellness (Sector 6)
        { title: 'Fitness Trainer', sectorId: 6, image: 'https://placehold.co/100x100?text=Fitness' },
        { title: 'Nutritionist', sectorId: 6, image: 'https://placehold.co/100x100?text=Nutrition' },
        { title: 'Physiotherapist', sectorId: 6, image: 'https://placehold.co/100x100?text=Physio' },
        { title: 'Massage Therapist', sectorId: 6, image: 'https://placehold.co/100x100?text=Massage' },
        { title: 'Yoga Instructor', sectorId: 6, image: 'https://placehold.co/100x100?text=Yoga' },
        
        // Beauty & Personal Care (Sector 7)
        { title: 'Hair Stylist', sectorId: 7, image: 'https://placehold.co/100x100?text=Hair' },
        { title: 'Makeup Artist', sectorId: 7, image: 'https://placehold.co/100x100?text=Makeup' },
        { title: 'Barber', sectorId: 7, image: 'https://placehold.co/100x100?text=Barber' },
        { title: 'Nail Technician', sectorId: 7, image: 'https://placehold.co/100x100?text=Nails' },
        { title: 'Beautician', sectorId: 7, image: 'https://placehold.co/100x100?text=Beauty' },
        
        // Events & Entertainment (Sector 8)
        { title: 'Event Planner', sectorId: 8, image: 'https://placehold.co/100x100?text=Event' },
        { title: 'Photographer', sectorId: 8, image: 'https://placehold.co/100x100?text=Photo' },
        { title: 'Videographer', sectorId: 8, image: 'https://placehold.co/100x100?text=Video' },
        { title: 'DJ', sectorId: 8, image: 'https://placehold.co/100x100?text=DJ' },
        { title: 'Caterer', sectorId: 8, image: 'https://placehold.co/100x100?text=Caterer' },
        { title: 'Master of Ceremony', sectorId: 8, image: 'https://placehold.co/100x100?text=MC' },
        
        // Business & Professional (Sector 9)
        { title: 'Accountant', sectorId: 9, image: 'https://placehold.co/100x100?text=Account' },
        { title: 'Business Consultant', sectorId: 9, image: 'https://placehold.co/100x100?text=Consult' },
        { title: 'Lawyer', sectorId: 9, image: 'https://placehold.co/100x100?text=Lawyer' },
        { title: 'Marketing Expert', sectorId: 9, image: 'https://placehold.co/100x100?text=Marketing' },
        { title: 'HR Consultant', sectorId: 9, image: 'https://placehold.co/100x100?text=HR' },
        
        // Food & Catering (Sector 10)
        { title: 'Chef', sectorId: 10, image: 'https://placehold.co/100x100?text=Chef' },
        { title: 'Baker', sectorId: 10, image: 'https://placehold.co/100x100?text=Baker' },
        { title: 'Catering Service', sectorId: 10, image: 'https://placehold.co/100x100?text=Catering' },
        { title: 'Food Vendor', sectorId: 10, image: 'https://placehold.co/100x100?text=Vendor' },
    ];

    for (const profession of professions) {
        await prisma.profession.create({
            data: profession
        });
    }

    console.log(`✅ Created ${professions.length} realistic professions`);

    // Get final data
    const finalSectors = await prisma.sector.findMany();
    const finalProfessions = await prisma.profession.findMany({
        include: { sector: true }
    });

    console.log('\n🎉 REALISTIC data update completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   • Sectors: ${finalSectors.length}`);
    console.log(`   • Professions: ${finalProfessions.length}`);
    console.log(`\n📋 Realistic Nigerian Sectors & Professions:`);
    
    finalSectors.forEach((sector, index) => {
        const sectorProfs = finalProfessions.filter(p => p.sectorId === sector.id);
        console.log(`   ${index + 1}. ${sector.title} (${sectorProfs.length} professions)`);
        sectorProfs.forEach((prof, pIndex) => {
            console.log(`      ${pIndex + 1}. ${prof.title}`);
        });
    });
}

main()
    .catch((e) => {
        console.error('❌ Update failed:', e);
        throw e;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
