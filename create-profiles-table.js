import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createProfilesTable() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Profile" (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✅ profiles table created successfully');
  } catch (error) {
    console.error('❌ Error creating table:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createProfilesTable();
