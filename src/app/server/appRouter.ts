import { router } from './trpc_init';
import { tarefasRouter } from './routers/tarefas';

export const appRouter = router({
    tarefas: tarefasRouter,
});

export type AppRouter = typeof appRouter;