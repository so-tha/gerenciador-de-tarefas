import { z } from 'zod';
import { router, publicProcedure } from '@/app/server/trpc_init';

const tarefas: { id: number; titulo: string; concluida: boolean; descricao: string; dataCriacao: Date }[] = [];

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
        concluida: false,
        descricao: '',
        dataCriacao: new Date
      };
      tarefas.push(novaTarefa);
      return novaTarefa;
    }),
    atualizar: publicProcedure
    .input(z.object({id: z.number()}))
    .mutation(({input})=>{
        const tarefa = tarefas.find((t)=> t.id == input.id);
        if(!tarefa){throw new Error('Tarefa não encontrada')}
    })
    
});