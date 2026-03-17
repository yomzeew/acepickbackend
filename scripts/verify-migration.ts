#!/usr/bin/env npx ts-node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyMigration() {
  console.log('🔍 Verifying Supabase Migration...\n');
  
  const tables = [
    'users', 'profiles', 'wallets', 'sectors', 'categories', 'skills',
    'professionals', 'professions', 'products', 'jobs', 'product_transactions',
    'orders', 'materials', 'professional_skills', 'job_skills', 'transactions',
    'ledger_entries', 'reviews', 'ratings', 'notifications', 'disputes',
    'activities', 'accounts', 'certifications', 'education', 'experience',
    'portfolios', 'cooperations', 'directors', 'chat_rooms', 'messages',
    'online_users', 'riders', 'delivery_pricing', 'commissions', 'transfers',
    'verify', 'voicerecords'
  ];

  let totalRecords = 0;
  let tablesWithData = 0;

  for (const table of tables) {
    try {
      // @ts-ignore
      const count = await prisma[table].count();
      if (count > 0) {
        console.log(`✅ ${table}: ${count} records`);
        totalRecords += count;
        tablesWithData++;
      } else {
        console.log(`⭕ ${table}: 0 records`);
      }
    } catch (error) {
      console.log(`❌ ${table}: Error - ${error}`);
    }
  }

  console.log(`\n📊 Migration Summary:`);
  console.log(`   Tables with data: ${tablesWithData}/${tables.length}`);
  console.log(`   Total records migrated: ${totalRecords}`);
  
  if (totalRecords > 0) {
    console.log(`\n🎉 Migration appears successful!`);
  } else {
    console.log(`\n⚠️  No data found in database. This might be expected if the local database was empty.`);
  }
}

async function main() {
  try {
    await verifyMigration();
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
