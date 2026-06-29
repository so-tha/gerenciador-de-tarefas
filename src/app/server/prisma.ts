import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  let connectionString = process.env.DATABASE_URL;
  
  // Fallback para URL placeholder para compilação local se o banco não estiver configurado localmente
  if (!connectionString || (!connectionString.startsWith('postgres') && !connectionString.startsWith('postgresql'))) {
    console.warn('[Prisma] DATABASE_URL não é uma URL de PostgreSQL válida. Usando placeholder para compilação.');
    connectionString = 'postgresql://placeholder:placeholder@localhost:5432/placeholder';
  }

  // Criar pool de conexões do pg
  const pool = new Pool({ connectionString });
  
  // Adaptador para PostgreSQL
  const adapter = new PrismaPg(pool);

  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
