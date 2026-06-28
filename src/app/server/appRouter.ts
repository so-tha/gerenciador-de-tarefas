import { router } from './trpc_init';
import { tarefasRouter } from './routers/tarefas';
import { authRouter } from './routers/auth';

export const appRouter = router({
    tarefas: tarefasRouter,
    auth: authRouter,
});

export type AppRouter = typeof appRouter;