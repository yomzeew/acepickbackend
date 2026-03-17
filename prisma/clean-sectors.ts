import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Cleaning up duplicate sectors...');

    // Get all sectors
    const allSectors = await prisma.sector.findMany();
    console.log(`Found ${allSectors.length} sectors in database`);

    // Group by title to find duplicates
    const sectorGroups = allSectors.reduce((groups: any, sector) => {
        const title = sector.title;
        if (!groups[title]) {
            groups[title] = [];
        }
        groups[title].push(sector);
        return groups;
    }, {});

    // Keep only the first sector for each title, delete the rest
    for (const [title, sectors] of Object.entries(sectorGroups)) {
        const sectorArray = sectors as any[];
        if (sectorArray.length > 1) {
            console.log(`\n🔍 Found ${sectorArray.length} duplicates of "${title}":`);
            sectorArray.forEach((s, i) => {
                console.log(`   ${i + 1}. ID: ${s.id} (Created: ${s.createdAt})`);
            });

            // Keep the newest one (highest ID) and delete others
            const sortedByDate = sectorArray.sort((a, b) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            
            const toKeep = sortedByDate[0];
            const toDelete = sortedByDate.slice(1);

            console.log(`   ✅ Keeping: ID ${toKeep.id} (newest)`);
            console.log(`   🗑️  Deleting: ${toDelete.map(s => s.id).join(', ')}`);

            // Delete duplicates
            for (const sector of toDelete) {
                await prisma.sector.delete({
                    where: { id: sector.id }
                });
                console.log(`      Deleted sector ID ${sector.id}`);
            }
        }
    }

    // Show final result
    const finalSectors = await prisma.sector.findMany({
        orderBy: { id: 'asc' }
    });

    console.log(`\n✅ Cleanup complete! Now have ${finalSectors.length} unique sectors:`);
    finalSectors.forEach((sector, index) => {
        console.log(`   ${index + 1}. ${sector.title} (ID: ${sector.id})`);
    });
}

main()
    .catch((e) => {
        console.error('❌ Cleanup failed:', e);
        throw e;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
