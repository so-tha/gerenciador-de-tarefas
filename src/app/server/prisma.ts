import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // Em produção (Vercel): usar DATABASE_URL com pgbouncer (porta 6543) — IPs da Vercel não podem ser whitelistados
  // Em desenvolvimento: usar DIRECT_URL (porta 5432) com IP local whitelistado no Supabase
  const isProduction = process.env.NODE_ENV === 'production';
  let connectionString = isProduction
    ? process.env.DATABASE_URL
    : (process.env.DIRECT_URL || process.env.DATABASE_URL);

  // Remover parâmetros do PgBouncer incompatíveis com pg.Pool (usado só em dev com conexão direta)
  if (!isProduction && connectionString) {
    connectionString = connectionString.replace('?pgbouncer=true', '').replace('&pgbouncer=true', '');
  }

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
