import {router } from '@/app/server/trpc_init';
import { tarefasRouter } from '../../server/routers/tarefas';
import { authRouter } from '../../server/routers/auth';

export const appRouter = router({
    tarefas: tarefasRouter,
    auth: authRouter,
});

export type AppRouter = typeof appRouter;