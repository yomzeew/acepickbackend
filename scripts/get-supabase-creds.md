# How to Get Your Supabase Database Credentials

## Step 1: Go to Supabase Dashboard
1. Open https://supabase.com/dashboard
2. Log in to your account
3. Select your project: `iqplvtcimwijytirdzzt`

## Step 2: Get Connection String
1. In the left sidebar, click **Settings** (gear icon)
2. Click **Database** in the settings menu
3. Scroll down to **Connection string** section
4. Click **URI** to copy the connection string

## Step 3: Extract the Password
Your connection string will look like:
```
postgresql://postgres.abc123:YOUR_PASSWORD@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
```

Copy the password after the colon `:` and before the `@` symbol.

## Step 4: Update Your .env File
Replace the DATABASE_URL and DIRECT_URL with:

```bash
# Using the actual password you copied
DATABASE_URL="postgresql://postgres.iqplvtcimwijytirdzzt:YOUR_ACTUAL_PASSWORD@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.iqplvtcimwijytirdzzt:YOUR_ACTUAL_PASSWORD@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"
```

## Step 5: Test Connection
```bash
npx prisma db pull
```

## Alternative: Reset Database Password
If you can't access the current password, you can reset it:

1. In Supabase Dashboard → Database → Reset database password
2. Set a new password (without special characters for simplicity)
3. Update your .env file with the new password
4. Try the connection again

## Common Issues:
- Special characters in passwords need URL encoding
- Make sure your IP is whitelisted in Supabase settings
- Check that the project region is correct (eu-west-1)
- Ensure the project ID `iqplvtcimwijytirdzzt` is correct
