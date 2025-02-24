import {router } from '@/app/server/trpc_init';
import { tarefasRouter } from '../../server/routers/tarefas';

export const appRouter = router({
    tarefas: tarefasRouter,
});

export type AppRouter = typeof appRouter;