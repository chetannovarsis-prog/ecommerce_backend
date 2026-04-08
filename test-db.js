import 'dotenv/config';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function testConnection() {
  try {
    await prisma.$connect();
    console.log('Database connection successful');
  } catch (error) {
    console.log('Database connection failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();