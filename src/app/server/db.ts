import { prisma } from './prisma';
import crypto from 'crypto';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
}

export interface Task {
  id: number;
  userId: string;
  titulo: string;
  descricao: string;
  concluida: boolean;
  dataCriacao: Date;
}

export interface Session {
  token: string;
  userId: string;
  username: string;
  expiresAt: Date;
}

// User methods
export async function findUserByUsername(username: string): Promise<User | undefined> {
  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() }
  });
  return user || undefined;
}

export async function findUserById(id: string): Promise<User | undefined> {
  const user = await prisma.user.findUnique({
    where: { id }
  });
  return user || undefined;
}

export async function createUser(username: string, passwordHash: string): Promise<User> {
  return await prisma.user.create({
    data: {
      username: username.toLowerCase(),
      passwordHash
    }
  });
}

// Task methods
export async function getTasks(userId: string): Promise<Task[]> {
  return await prisma.tarefa.findMany({
    where: { userId },
    orderBy: { dataCriacao: 'desc' }
  });
}

export async function addTask(userId: string, titulo: string): Promise<Task> {
  return await prisma.tarefa.create({
    data: {
      userId,
      titulo,
      descricao: '',
      concluida: false
    }
  });
}

export async function updateTask(userId: string, taskId: number, updates: Partial<Omit<Task, 'id' | 'userId' | 'dataCriacao'>>): Promise<Task> {
  return await prisma.tarefa.update({
    where: { id: taskId, userId },
    data: updates
  });
}

export async function removeTask(userId: string, taskId: number): Promise<void> {
  await prisma.tarefa.delete({
    where: { id: taskId, userId }
  });
}

// Session methods
export async function createSession(userId: string, username: string): Promise<Session> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias
  
  // Limpar sessões expiradas ou sessões antigas deste usuário
  await prisma.session.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { userId }
      ]
    }
  }).catch(() => {});

  return await prisma.session.create({
    data: {
      token,
      userId,
      username,
      expiresAt
    }
  });
}

export async function getSession(token: string): Promise<Session | undefined> {
  const session = await prisma.session.findUnique({
    where: { token }
  });
  
  if (session && session.expiresAt > new Date()) {
    return {
      token: session.token,
      userId: session.userId,
      username: session.username,
      expiresAt: session.expiresAt
    };
  }
  
  if (session) {
    await prisma.session.delete({ where: { token } }).catch(() => {});
  }
  
  return undefined;
}

export async function deleteSession(token: string): Promise<void> {
  await prisma.session.delete({
    where: { token }
  }).catch(() => {});
}
