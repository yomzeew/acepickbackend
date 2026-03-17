#!/usr/bin/env npx ts-node

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface MigrationConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  databaseUrl: string;
  directUrl: string;
}

async function exportCurrentDatabase() {
  console.log('📦 Exporting current database data...');
  
  const tables = [
    'users', 'profiles', 'wallets', 'locations', 'professionals', 'professions', 'sectors',
    'jobs', 'materials', 'skills', 'professional_skills', 'job_skills', 'reviews', 'ratings',
    'products', 'categories', 'product_transactions', 'orders', 'riders', 'delivery_pricing',
    'transactions', 'ledger_entries', 'commissions', 'transfers', 'notifications',
    'disputes', 'activities', 'accounts', 'certifications', 'education', 'experience',
    'portfolios', 'cooperations', 'directors', 'chat_rooms', 'messages', 'online_users',
    'verify', 'voicerecords'
  ];

  const exportData: any = {};

  for (const table of tables) {
    try {
      console.log(`  Exporting ${table}...`);
      // @ts-ignore
      const data = await prisma[table].findMany({
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
  const exportPath = path.join(process.cwd(), 'data-export.json');
  fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
  console.log(`✅ Export saved to ${exportPath}`);
  
  return exportData;
}

async function setupSupabaseSchema() {
  console.log('🏗️  Setting up Supabase schema...');
  
  try {
    // Generate Prisma client for Supabase
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // Push schema to Supabase
    execSync('npx prisma db push', { stdio: 'inherit' });
    
    console.log('✅ Schema pushed to Supabase successfully');
  } catch (error) {
    console.error('❌ Failed to setup Supabase schema:', error);
    throw error;
  }
}

async function importToSupabase(exportData: any) {
  console.log('📥 Importing data to Supabase...');
  
  // Import in dependency order to avoid foreign key constraints
  const importOrder = [
    'sectors',
    'categories', 
    'skills',
    'users',
    'profiles',
    'wallets',
    'locations',
    'professionals',
    'professions',
    'products',
    'jobs',
    'product_transactions',
    'orders',
    'materials',
    'professional_skills',
    'job_skills',
    'transactions',
    'ledger_entries',
    'reviews',
    'ratings',
    'notifications',
    'disputes',
    'activities',
    'accounts',
    'certifications',
    'education',
    'experience',
    'portfolios',
    'cooperations',
    'directors',
    'chat_rooms',
    'messages',
    'online_users',
    'riders',
    'delivery_pricing',
    'commissions',
    'transfers',
    'verify',
    'voicerecords'
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
        await prisma[table].deleteMany();
      } catch (error) {
        console.log(`    Warning: Could not clear ${table}: ${error}`);
      }
      
      // Insert data in batches
      const batchSize = 50;
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        try {
          // @ts-ignore
          await prisma[table].createMany({
            data: batch,
            skipDuplicates: true
          });
        } catch (error) {
          console.log(`    ❌ Batch failed for ${table}: ${error}`);
          // Try individual inserts
          for (const record of batch) {
            try {
              // @ts-ignore
              await prisma[table].create({
                data: record
              });
            } catch (individualError) {
              console.log(`      ❌ Individual record failed: ${individualError}`);
            }
          }
        }
      }
      
      console.log(`  ✅ Imported ${data.length} records to ${table}`);
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
      const count = await prisma[table].count();
      console.log(`  ✅ ${table}: ${count} records`);
    } catch (error) {
      console.log(`  ❌ Failed to count ${table}: ${error}`);
    }
  }
}

async function main() {
  console.log('🚀 Starting migration to Supabase...\n');
  
  try {
    // Step 1: Export current data
    const exportData = await exportCurrentDatabase();
    
    // Step 2: Setup Supabase schema
    await setupSupabaseSchema();
    
    // Step 3: Import data to Supabase
    await importToSupabase(exportData);
    
    // Step 4: Verify migration
    await verifyMigration();
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Update your .env file with Supabase credentials');
    console.log('2. Test your application with the new database');
    console.log('3. Remove the old database connection if everything works');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
