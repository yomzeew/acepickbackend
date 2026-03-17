# Supabase Migration Guide

## 🚨 IMPORTANT: Get Your Database Password First

Before proceeding, you MUST get your actual Supabase database password:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `iqplvtcimwijytirdzzt`
3. Navigate to **Settings** → **Database**
4. Scroll to **Connection string** section
5. Copy the password from the connection URL (it will look like `postgres.abc123:password@...`)
6. Replace `[YOUR-PASSWORD]` in your `.env` file with the actual password

## Step 1: Update Environment Variables

Update your `.env` file with the actual Supabase credentials:

```bash
# Replace [YOUR-PASSWORD] with your actual database password
DATABASE_URL="postgresql://postgres.iqplvtcimwijytirdzzt:YOUR-ACTUAL-PASSWORD@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.iqplvtcimwijytirdzzt:YOUR-ACTUAL-PASSWORD@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"
```

## Step 2: Test Database Connection

```bash
cd /Volumes/ExternalSSD/acepickbackend/acepickapi
npx prisma db pull --schema=prisma/schema.prisma
```

If this works, your database connection is ready.

## Step 3: Run Migration Script

```bash
# Install Node.js types if needed
npm install --save-dev @types/node

# Run the migration script
npx ts-node scripts/migrate-to-supabase.ts
```

## Step 4: Verify Migration

After migration completes, verify the data:

```bash
npx prisma studio
```

Check that your data appears correctly in the Supabase database.

## Alternative: Manual Migration Steps

If the automated script fails, follow these manual steps:

### 1. Export Current Data
```bash
# Connect to your local database and export data
pg_dump -h localhost -U mac -d acepickdb > current-data.sql
```

### 2. Setup Supabase Schema
```bash
npx prisma db push
```

### 3. Import Data to Supabase
```bash
# Import the data to Supabase
psql "postgresql://postgres.iqplvtcimwijytirdzzt:YOUR-PASSWORD@aws-1-eu-west-1.pooler.supabase.com:5432/postgres" < current-data.sql
```

## Step 5: Update Application Configuration

Once migration is complete and verified:

1. Remove or comment out local database settings
2. Ensure only Supabase DATABASE_URL and DIRECT_URL are active
3. Test your application thoroughly
4. Backup your old database before decommissioning

## Troubleshooting

### Connection Issues
- Ensure your password is correctly encoded (special characters may need URL encoding)
- Check that your IP is whitelisted in Supabase settings
- Verify the project ID and region are correct

### Data Import Issues
- Foreign key constraints may require specific import order
- Large datasets may need to be imported in batches
- Some data types may need conversion (UUIDs, timestamps)

### Performance Issues
- Use connection pooling (already configured with pgbouncer=true)
- Consider indexing for frequently queried fields
- Monitor Supabase dashboard for performance metrics

## Post-Migration Checklist

- [ ] All users can log in
- [ ] Jobs and products display correctly
- [ ] Transactions and wallets work
- [ ] Notifications function
- [ ] File uploads work (Supabase Storage)
- [ ] Real-time features work
- [ ] Performance is acceptable
- [ ] Backup procedures are in place
