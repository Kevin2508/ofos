import { prisma } from '../config/prisma.ts';

async function connectDB() {
  try {
    await prisma.$connect();
    console.log('✨ Database connected successfully (Prisma)');
  } catch (error) {
    console.error('💥 DB connection failed');
    console.error(error);
    process.exit(1);
  }
}

export { connectDB };
