import { z } from 'zod';
import { router, publicProcedure } from '@/app/server/trpc_init';

const tarefas: { id: number; titulo: string; concluida: boolean; descricao: string; dataCriacao: Date }[] = [];

export const tarefasRouter = router({

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
      return {message: 'Tarefa criada com sucesso', novaTarefa};
    }),
    listar: publicProcedure
    .query(() => {
      return tarefas;
    }),
    atualizar: publicProcedure
    .input(z.object({id: z.number()}))
    .mutation(({input})=>{
        const tarefa = tarefas.find((t)=> t.id == input.id);
        if(!tarefa){throw new Error('Tarefa não encontrada')}
        return {message: 'Tarefa atualiza', id:input.id}
    }),
    remover: publicProcedure
    .input(z.object({id: z.number()}))
    .mutation(({input}) => {
        const index = tarefas.findIndex((t) => t.id === input.id);
        if(index === -1){throw new Error('Tarefa não encontrada')}
        tarefas.splice(index,1)
        return{message: 'Tarefa removida', id:input.id}
    })
});