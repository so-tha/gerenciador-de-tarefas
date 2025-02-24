import { createNextApiHandler } from '@trpc/server/adapters/next';
import { appRouter } from './_app';

export default createNextApiHandler({
    router: appRouter,
    createContext: () => ({}),
});