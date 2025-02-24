import { z } from 'zod';
import { router, publicProcedure } from '@/app/server/trpc_init';

const tarefas: { id: number; titulo: string; concluida: boolean }[] = [];

export const tarefasRouter = router({
  listar: publicProcedure
    .query(() => {
      return tarefas;
    }),
  criar: publicProcedure
    .input(z.object({ titulo: z.string() }))
    .mutation(({ input }) => {
      const novaTarefa = {
        id: tarefas.length + 1,
        titulo: input.titulo,
        concluida: false
      };
      tarefas.push(novaTarefa);
      return novaTarefa;
    })
});