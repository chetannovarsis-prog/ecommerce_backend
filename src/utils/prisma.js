import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development (hot reload)
const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export default prisma;
