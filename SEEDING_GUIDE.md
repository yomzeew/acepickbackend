# Database Seeding Guide

## 🌱 Smart Seeding (Recommended for Development)

**Use this method when you want to update schema without losing existing data:**

```bash
# Step 1: Apply schema changes without data loss
npm run prisma:push

# Step 2: Run smart seed (only creates missing data)
npm run prisma:seed-smart
```

## 🔄 Full Seeding (Use When You Want Fresh Data)

**Use this method when you want to completely reset the database:**

```bash
# Step 1: Reset database (WARNING: Deletes all data)
npx prisma migrate reset --force --skip-seed

# Step 2: Run full massive seed
npm run prisma:seed
```

## 📋 Available Seed Scripts

| Command | Description | Data Loss |
|---------|-------------|-----------|
| `npm run prisma:push` | Apply schema changes | ❌ No |
| `npm run prisma:seed-smart` | Smart seeding (only missing data) | ❌ No |
| `npm run prisma:seed` | Full massive seeding | ✅ Yes |
| `npx prisma migrate reset` | Complete database reset | ✅ Yes |

## 🎯 What Smart Seed Creates

- ✅ **Skills** (49 skills across 7 categories) - if none exist
- ✅ **Sectors** (10 sectors with professions) - if none exist  
- ✅ **Users** (50 clients with profiles) - if none exist
- ✅ **Locations**, **Wallets** - if none exist

## 🔐 Default Credentials

**Email Pattern:**
- Clients: `client[1-50].[firstname].[lastname]@test.com`
- Password: `Test@1234` (for all users)

## 💡 Best Practices

1. **Development**: Use `prisma:push` + `prisma:seed-smart`
2. **Testing**: Use `prisma:seed` for fresh test data
3. **Production**: Never use seed scripts in production
4. **Schema Changes**: Always use `prisma:push` to avoid data loss

## 🚀 Quick Start

```bash
# For schema changes without data loss:
npm run prisma:push && npm run prisma:seed-smart

# For completely fresh data:
npx prisma migrate reset --force --skip-seed && npm run prisma:seed
```
