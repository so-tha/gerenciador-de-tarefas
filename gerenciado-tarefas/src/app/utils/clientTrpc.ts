import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../server/appRouter';

export type { AppRouter };
export const trpc = createTRPCReact<AppRouter>();