import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // Obter URL do banco do process.env ou fallback
  const rawUrl = process.env.DATABASE_URL || 'file:./dev.db';
  
  // Limpar prefixo "file:" para resolver o caminho absoluto contra o process.cwd()
  const cleanPath = rawUrl.replace(/^file:/, '');
  const absolutePath = path.resolve(process.cwd(), cleanPath);
  
  // Remontar a URL com o caminho absoluto
  const dbUrl = `file:${absolutePath}`;

  console.log(`[Prisma] Connecting to SQLite database at: ${dbUrl}`);

  const adapter = new PrismaBetterSqlite3({
    url: dbUrl,
  });

  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
