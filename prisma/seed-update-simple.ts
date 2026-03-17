import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Updating sectors and professions with REALISTIC data...\n');

    // ──────────────────── REALISTIC NIGERIAN SECTORS ────────────────────
    
    const sectors = [
        { title: 'Home Services', image: 'https://placehold.co/100x100?text=Home' },
        { title: 'Technology & IT', image: 'https://placehold.co/100x100?text=Tech' },
        { title: 'Building & Construction', image: 'https://placehold.co/100x100?text=Build' },
        { title: 'Automotive Services', image: 'https://placehold.co/100x100?text=Auto' },
        { title: 'Education & Training', image: 'https://placehold.co/100x100?text=Edu' },
        { title: 'Health & Wellness', image: 'https://placehold.co/100x100?text=Health' },
        { title: 'Beauty & Personal Care', image: 'https://placehold.co/100x100?text=Beauty' },
        { title: 'Events & Entertainment', image: 'https://placehold.co/100x100?text=Events' },
        { title: 'Business & Professional', image: 'https://placehold.co/100x100?text=Business' },
        { title: 'Food & Catering', image: 'https://placehold.co/100x100?text=Food' },
    ];

    // Update or create sectors
    const createdSectors = [];
    for (let i = 0; i < sectors.length; i++) {
        const sector = sectors[i];
        const existingSector = await prisma.sector.findFirst();
        
        if (existingSector && i < 10) {
            // Update existing
            await prisma.sector.update({
                where: { id: i + 1 },
                data: { title: sector.title, image: sector.image }
            });
            createdSectors.push({ id: i + 1, ...sector });
            console.log(`✅ Updated sector: ${sector.title}`);
        } else {
            // Create new
            const newSector = await prisma.sector.create({
                data: sector
            });
            createdSectors.push(newSector);
            console.log(`✅ Created sector: ${sector.title}`);
        }
    }

    // ──────────────────── REALISTIC NIGERIAN PROFESSIONS ────────────────────
    
    const professions = [
        // Home Services
        { title: 'Plumber', sectorId: createdSectors[0]?.id, image: 'https://placehold.co/100x100?text=Plumber' },
        { title: 'Electrician', sectorId: createdSectors[0]?.id, image: 'https://placehold.co/100x100?text=Electrician' },
        { title: 'Carpenter', sectorId: createdSectors[0]?.id, image: 'https://placehold.co/100x100?text=Carpenter' },
        { title: 'Painter', sectorId: createdSectors[0]?.id, image: 'https://placehold.co/100x100?text=Painter' },
        { title: 'HVAC Technician', sectorId: createdSectors[0]?.id, image: 'https://placehold.co/100x100?text=HVAC' },
        { title: 'Home Cleaner', sectorId: createdSectors[0]?.id, image: 'https://placehold.co/100x100?text=Cleaner' },
        { title: 'Pest Control', sectorId: createdSectors[0]?.id, image: 'https://placehold.co/100x100?text=Pest' },
        { title: 'Gardener', sectorId: createdSectors[0]?.id, image: 'https://placehold.co/100x100?text=Garden' },
        
        // Technology & IT
        { title: 'Web Developer', sectorId: createdSectors[1]?.id, image: 'https://placehold.co/100x100?text=WebDev' },
        { title: 'Mobile App Developer', sectorId: createdSectors[1]?.id, image: 'https://placehold.co/100x100?text=MobileDev' },
        { title: 'Graphic Designer', sectorId: createdSectors[1]?.id, image: 'https://placehold.co/100x100?text=Designer' },
        { title: 'IT Support Technician', sectorId: createdSectors[1]?.id, image: 'https://placehold.co/100x100?text=ITSupport' },
        { title: 'Network Engineer', sectorId: createdSectors[1]?.id, image: 'https://placehold.co/100x100?text=Network' },
        { title: 'Data Analyst', sectorId: createdSectors[1]?.id, image: 'https://placehold.co/100x100?text=Data' },
        { title: 'Cybersecurity Expert', sectorId: createdSectors[1]?.id, image: 'https://placehold.co/100x100?text=Security' },
        
        // Building & Construction
        { title: 'Mason', sectorId: createdSectors[2]?.id, image: 'https://placehold.co/100x100?text=Mason' },
        { title: 'Tiler', sectorId: createdSectors[2]?.id, image: 'https://placehold.co/100x100?text=Tiler' },
        { title: 'Roofer', sectorId: createdSectors[2]?.id, image: 'https://placehold.co/100x100?text=Roofer' },
        { title: 'Welder', sectorId: createdSectors[2]?.id, image: 'https://placehold.co/100x100?text=Welder' },
        { title: 'Architect', sectorId: createdSectors[2]?.id, image: 'https://placehold.co/100x100?text=Architect' },
        { title: 'Quantity Surveyor', sectorId: createdSectors[2]?.id, image: 'https://placehold.co/100x100?text=QS' },
        
        // Automotive Services
        { title: 'Auto Mechanic', sectorId: createdSectors[3]?.id, image: 'https://placehold.co/100x100?text=Mechanic' },
        { title: 'Auto Electrician', sectorId: createdSectors[3]?.id, image: 'https://placehold.co/100x100?text=AutoElec' },
        { title: 'Car Painter', sectorId: createdSectors[3]?.id, image: 'https://placehold.co/100x100?text=CarPaint' },
        { title: 'Tyre Specialist', sectorId: createdSectors[3]?.id, image: 'https://placehold.co/100x100?text=Tyre' },
        { title: 'Car Wash & Detailing', sectorId: createdSectors[3]?.id, image: 'https://placehold.co/100x100?text=CarWash' },
        
        // Education & Training
        { title: 'Mathematics Tutor', sectorId: createdSectors[4]?.id, image: 'https://placehold.co/100x100?text=Math' },
        { title: 'English Tutor', sectorId: createdSectors[4]?.id, image: 'https://placehold.co/100x100?text=English' },
        { title: 'Science Tutor', sectorId: createdSectors[4]?.id, image: 'https://placehold.co/100x100?text=Science' },
        { title: 'Music Teacher', sectorId: createdSectors[4]?.id, image: 'https://placehold.co/100x100?text=Music' },
        { title: 'Computer Instructor', sectorId: createdSectors[4]?.id, image: 'https://placehold.co/100x100?text=Computer' },
        { title: 'Vocational Trainer', sectorId: createdSectors[4]?.id, image: 'https://placehold.co/100x100?text=Vocational' },
        
        // Health & Wellness
        { title: 'Fitness Trainer', sectorId: createdSectors[5]?.id, image: 'https://placehold.co/100x100?text=Fitness' },
        { title: 'Nutritionist', sectorId: createdSectors[5]?.id, image: 'https://placehold.co/100x100?text=Nutrition' },
        { title: 'Physiotherapist', sectorId: createdSectors[5]?.id, image: 'https://placehold.co/100x100?text=Physio' },
        { title: 'Massage Therapist', sectorId: createdSectors[5]?.id, image: 'https://placehold.co/100x100?text=Massage' },
        { title: 'Yoga Instructor', sectorId: createdSectors[5]?.id, image: 'https://placehold.co/100x100?text=Yoga' },
        
        // Beauty & Personal Care
        { title: 'Hair Stylist', sectorId: createdSectors[6]?.id, image: 'https://placehold.co/100x100?text=Hair' },
        { title: 'Makeup Artist', sectorId: createdSectors[6]?.id, image: 'https://placehold.co/100x100?text=Makeup' },
        { title: 'Barber', sectorId: createdSectors[6]?.id, image: 'https://placehold.co/100x100?text=Barber' },
        { title: 'Nail Technician', sectorId: createdSectors[6]?.id, image: 'https://placehold.co/100x100?text=Nails' },
        { title: 'Beautician', sectorId: createdSectors[6]?.id, image: 'https://placehold.co/100x100?text=Beauty' },
        
        // Events & Entertainment
        { title: 'Event Planner', sectorId: createdSectors[7]?.id, image: 'https://placehold.co/100x100?text=Event' },
        { title: 'Photographer', sectorId: createdSectors[7]?.id, image: 'https://placehold.co/100x100?text=Photo' },
        { title: 'Videographer', sectorId: createdSectors[7]?.id, image: 'https://placehold.co/100x100?text=Video' },
        { title: 'DJ', sectorId: createdSectors[7]?.id, image: 'https://placehold.co/100x100?text=DJ' },
        { title: 'Caterer', sectorId: createdSectors[7]?.id, image: 'https://placehold.co/100x100?text=Caterer' },
        { title: 'Master of Ceremony', sectorId: createdSectors[7]?.id, image: 'https://placehold.co/100x100?text=MC' },
        
        // Business & Professional
        { title: 'Accountant', sectorId: createdSectors[8]?.id, image: 'https://placehold.co/100x100?text=Account' },
        { title: 'Business Consultant', sectorId: createdSectors[8]?.id, image: 'https://placehold.co/100x100?text=Consult' },
        { title: 'Lawyer', sectorId: createdSectors[8]?.id, image: 'https://placehold.co/100x100?text=Lawyer' },
        { title: 'Marketing Expert', sectorId: createdSectors[8]?.id, image: 'https://placehold.co/100x100?text=Marketing' },
        { title: 'HR Consultant', sectorId: createdSectors[8]?.id, image: 'https://placehold.co/100x100?text=HR' },
        
        // Food & Catering
        { title: 'Chef', sectorId: createdSectors[9]?.id, image: 'https://placehold.co/100x100?text=Chef' },
        { title: 'Baker', sectorId: createdSectors[9]?.id, image: 'https://placehold.co/100x100?text=Baker' },
        { title: 'Catering Service', sectorId: createdSectors[9]?.id, image: 'https://placehold.co/100x100?text=Catering' },
        { title: 'Food Vendor', sectorId: createdSectors[9]?.id, image: 'https://placehold.co/100x100?text=Vendor' },
    ];

    // Create new professions
    const createdProfessions = [];
    for (const profession of professions) {
        if (profession.sectorId) {
            const newProfession = await prisma.profession.create({
                data: profession
            });
            createdProfessions.push(newProfession);
        }
    }

    console.log(`✅ Created ${createdProfessions.length} realistic professions`);

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
    
    finalSectors.forEach((sector: any, index: number) => {
        const sectorProfs = finalProfessions.filter((p: any) => p.sectorId === sector.id);
        console.log(`   ${index + 1}. ${sector.title} (${sectorProfs.length} professions)`);
        sectorProfs.forEach((prof: any, pIndex: number) => {
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
