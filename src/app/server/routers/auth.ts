import { z } from 'zod';
import { router, publicProcedure } from '../trpc_init';
import { createUser, findUserByUsername, createSession, deleteSession } from '../db';
import crypto from 'crypto';
import { TRPCError } from '@trpc/server';

function hashPassword(password: string): string {
  // Use sha256 with a static salt for reliable Node built-in hashing
  return crypto.createHash('sha256').update(password + '_task_manager_salt_987').digest('hex');
}

export const authRouter = router({
  registrar: publicProcedure
    .input(z.object({
      username: z.string().min(3, 'O usuário deve ter pelo menos 3 caracteres'),
      password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres')
    }))
    .mutation(async ({ input }) => {
      const existing = await findUserByUsername(input.username);
      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Este nome de usuário já está em uso.'
        });
      }

      const passwordHash = hashPassword(input.password);
      const user = await createUser(input.username, passwordHash);

      return {
        success: true,
        message: 'Usuário registrado com sucesso!',
        userId: user.id
      };
    }),

  login: publicProcedure
    .input(z.object({
      username: z.string(),
      password: z.string()
    }))
    .mutation(async ({ input }) => {
      const user = await findUserByUsername(input.username);
      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Usuário ou senha incorretos.'
        });
      }

      const hash = hashPassword(input.password);
      if (user.passwordHash !== hash) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Usuário ou senha incorretos.'
        });
      }

      const session = await createSession(user.id, user.username);

      return {
        success: true,
        token: session.token,
        username: session.username,
        userId: session.userId
      };
    }),

  logout: publicProcedure
    .mutation(async ({ ctx }) => {
      if (ctx.token) {
        await deleteSession(ctx.token);
      }
      return { success: true };
    }),

  me: publicProcedure
    .query(({ ctx }) => {
      if (!ctx.user) {
        return null;
      }
      return {
        id: ctx.user.id,
        username: ctx.user.username
      };
    })
});
