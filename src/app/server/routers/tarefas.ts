import { z } from 'zod';
import { router, protectedProcedure } from '../trpc_init';
import { getTasks, addTask, updateTask, removeTask } from '../db';

export const tarefasRouter = router({
  criar: protectedProcedure
    .input(z.object({ 
      titulo: z.string() 
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      console.log(`[criar] Usuário ${ctx.user.username} criando tarefa com input:`, input);
      const novaTarefa = await addTask(userId, input.titulo);
      const response = { message: 'Tarefa criada com sucesso', novaTarefa };
      return response;
    }),
    
  listar: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.user.id;
      console.log(`[listar] Listando tarefas para usuário ${ctx.user.username}`);
      return await getTasks(userId);
    }),
    
  atualizar: protectedProcedure
    .input(z.object({
      id: z.number(),
      titulo: z.string().optional(),
      descricao: z.string().optional(),
      concluida: z.boolean().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      console.log(`[atualizar] Usuário ${ctx.user.username} atualizando tarefa ${input.id}`);
      const tarefa = await updateTask(userId, input.id, {
        ...(input.titulo !== undefined && { titulo: input.titulo }),
        ...(input.descricao !== undefined && { descricao: input.descricao }),
        ...(input.concluida !== undefined && { concluida: input.concluida })
      });
      
      return { 
        message: 'Tarefa atualizada com sucesso', 
        tarefa 
      };
    }),
    
  remover: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      console.log(`[remover] Usuário ${ctx.user.username} removendo tarefa ${input.id}`);
      await removeTask(userId, input.id);
      return { message: 'Tarefa removida', id: input.id };
    }),
    
  precarregar: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.user.id;
      return await getTasks(userId);
    }),
});