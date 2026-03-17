#!/usr/bin/env npx ts-node

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// Connect to local database
const localPrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://mac:@localhost:5432/acepickdb?schema=public'
    }
  }
});

async function exportFromLocalDatabase() {
  console.log('📦 Exporting data from LOCAL database...');
  
  const tables = [
    'sectors', 'categories', 'skills',
    'users', 'profiles', 'wallets', 'locations', 
    'professionals', 'professions', 'products', 'jobs',
    'product_transactions', 'orders', 'materials',
    'professional_skills', 'job_skills', 'transactions',
    'ledger_entries', 'reviews', 'ratings', 'notifications',
    'disputes', 'activities', 'accounts', 'certifications',
    'education', 'experience', 'portfolios', 'cooperations',
    'directors', 'chat_rooms', 'messages', 'online_users',
    'riders', 'delivery_pricing', 'commissions', 'transfers',
    'verify', 'voicerecords'
  ];

  const exportData: any = {};

  for (const table of tables) {
    try {
      console.log(`  Exporting ${table}...`);
      // @ts-ignore
      const data = await localPrisma[table].findMany({
        take: 1000 // Limit to prevent memory issues
      });
      exportData[table] = data;
      console.log(`  ✅ Exported ${data.length} records from ${table}`);
    } catch (error) {
      console.log(`  ❌ Failed to export ${table}: ${error}`);
      exportData[table] = [];
    }
  }

  // Save export to file
  const exportPath = path.join(process.cwd(), 'local-data-export.json');
  fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
  console.log(`✅ Export saved to ${exportPath}`);
  
  return exportData;
}

async function main() {
  try {
    await exportFromLocalDatabase();
    console.log('\n🎉 Local data export completed!');
    console.log('Now run: npx ts-node scripts/import-to-supabase.ts');
  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  } finally {
    await localPrisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
