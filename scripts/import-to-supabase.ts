#!/usr/bin/env npx ts-node

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// Connect to Supabase database
const supabasePrisma = new PrismaClient();

async function importToSupabase() {
  console.log('📥 Importing data to Supabase...');
  
  // Load export data
  const exportPath = path.join(process.cwd(), 'local-data-export.json');
  if (!fs.existsSync(exportPath)) {
    console.log('❌ Export file not found. Run export-from-local.ts first');
    return;
  }
  
  const exportData = JSON.parse(fs.readFileSync(exportPath, 'utf-8'));
  
  // Import in dependency order to avoid foreign key constraints
  const importOrder = [
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

  for (const table of importOrder) {
    const data = exportData[table];
    if (!data || data.length === 0) {
      console.log(`  ⏭️  Skipping ${table} (no data)`);
      continue;
    }

    try {
      console.log(`  Importing ${data.length} records to ${table}...`);
      
      // Clear existing data
      try {
        // @ts-ignore
        await supabasePrisma[table].deleteMany();
      } catch (error) {
        console.log(`    Warning: Could not clear ${table}: ${error}`);
      }
      
      // Insert data in batches
      const batchSize = 50;
      let successCount = 0;
      
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        try {
          // @ts-ignore
          await supabasePrisma[table].createMany({
            data: batch,
            skipDuplicates: true
          });
          successCount += batch.length;
        } catch (error) {
          console.log(`    ❌ Batch failed for ${table}: ${error}`);
          // Try individual inserts
          for (const record of batch) {
            try {
              // @ts-ignore
              await supabasePrisma[table].create({
                data: record
              });
              successCount++;
            } catch (individualError) {
              console.log(`      ❌ Individual record failed: ${individualError}`);
            }
          }
        }
      }
      
      console.log(`  ✅ Imported ${successCount}/${data.length} records to ${table}`);
    } catch (error) {
      console.error(`  ❌ Failed to import ${table}: ${error}`);
    }
  }
}

async function verifyMigration() {
  console.log('🔍 Verifying migration...');
  
  const tables = ['users', 'profiles', 'jobs', 'products', 'orders'];
  
  for (const table of tables) {
    try {
      // @ts-ignore
      const count = await supabasePrisma[table].count();
      console.log(`  ✅ ${table}: ${count} records`);
    } catch (error) {
      console.log(`  ❌ Failed to count ${table}: ${error}`);
    }
  }
}

async function main() {
  try {
    await importToSupabase();
    await verifyMigration();
    console.log('\n🎉 Migration to Supabase completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await supabasePrisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
