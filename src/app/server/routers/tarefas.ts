import { z } from 'zod';
import { router, publicProcedure } from '../trpc_init';

const tarefas: { 
  id: number; 
  titulo: string; 
  concluida: boolean; 
  descricao: string; 
  dataCriacao: Date 
}[] = [];

export const tarefasRouter = router({
  criar: publicProcedure
    .input(z.object({ 
      titulo: z.string() 
    }))
    .mutation(({ input }) => {
      console.log("Chamando a rota criar com input:", input);
      const novaTarefa = {
        id: tarefas.length + 1,
        titulo: input.titulo,
        concluida: false,
        descricao: '',
        dataCriacao: new Date(),
      };
      tarefas.push(novaTarefa);
      const response = { message: 'Tarefa criada com sucesso', novaTarefa };
      console.log("Resposta do servidor:", response);
      return response;
    }),
    
  listar: publicProcedure
    .query(() => {
      console.log("Chamando a rota listar");
      return tarefas;
    }),
    
  atualizar: publicProcedure
    .input(z.object({
      id: z.number(),
      titulo: z.string().optional(),
      descricao: z.string().optional(),
      concluida: z.boolean().optional()
    }))
    .mutation(({input}) => {
      const index = tarefas.findIndex((t) => t.id === input.id);
      if (index === -1) {
        throw new Error('Tarefa não encontrada');
      }
      tarefas[index] = {
        ...tarefas[index],
        ...(input.titulo !== undefined && { titulo: input.titulo }),
        ...(input.descricao !== undefined && { descricao: input.descricao }),
        ...(input.concluida !== undefined && { concluida: input.concluida })
      };
      
      return { 
        message: 'Tarefa atualizada com sucesso', 
        tarefa: tarefas[index] 
      };
    }),
    
  remover: publicProcedure
    .input(z.object({id: z.number()}))
    .mutation(({input}) => {
      const index = tarefas.findIndex((t) => t.id === input.id);
      if (index === -1) {
        throw new Error('Tarefa não encontrada');
      }
      tarefas.splice(index, 1);
      return { message: 'Tarefa removida', id: input.id };
    }),
    
  precarregar: publicProcedure
    .query(() => {
      return tarefas;
    }),
});