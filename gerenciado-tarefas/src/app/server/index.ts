import {router } from './trpc';
import { tarefasRouter } from './routers/tarefas';

export const appRouter = router({
    tarefas: tarefasRouter,
});

export type AppRouter = typeof appRouter;