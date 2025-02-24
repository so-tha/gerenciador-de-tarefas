'use client';
import { trpc } from '@/app/utils/clientTrpc';
import styles from "./page.module.css";
import Link from 'next/link';

export default function Home() {
  const removerTarefa = trpc.tarefas.remover.useMutation();
  const atualizarTarefa = trpc.tarefas.atualizar.useMutation();
  const { data: tarefas, error, refetch } = trpc.tarefas.listar.useQuery();


  const handleRemoverTarefa = async (id: number) => {
    try {
      await removerTarefa.mutateAsync({ id });
      refetch();
    } catch (error) {
      console.error("Erro ao remover tarefa:", error);
    }
  };

  const handleAlternarStatus = async (id: number, concluida: boolean) => {
    try {
      await atualizarTarefa.mutateAsync({ 
        id, 
        concluida: !concluida 
      });
      refetch();
    } catch (error) {
      console.error("Erro ao atualizar status da tarefa:", error);
    }
  };

  if (error) {
    console.error("Erro ao listar tarefas:", error);
    return <div>Erro ao carregar tarefas.</div>;
  }

  return (
    <div className={styles.page}>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Lista de Tarefas</h1>
        <Link 
          href="/tarefa/form" 
          className="bg-green-500 text-white p-2 rounded hover:bg-green-600"
        >
          Nova Tarefa
        </Link>
      </div>

      <div className="mt-4">
        {tarefas && tarefas.length > 0 ? (
          tarefas.map(tarefa => (
            <div key={tarefa.id} className="p-3 border mb-2 rounded flex justify-between items-center">
              <div>
                <div className="font-medium">{tarefa.titulo}</div>
                {tarefa.descricao && (
                  <div className="text-gray-600 text-sm mt-1">{tarefa.descricao}</div>
                )}
                <div className="text-xs text-gray-500 mt-1">
                  {tarefa.concluida ? 
                    <span className="text-green-600">Concluída</span> : 
                    <span className="text-yellow-600">Pendente</span>
                  }
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => handleAlternarStatus(tarefa.id, tarefa.concluida)}
                  className={`p-1 px-2 rounded text-xs ${tarefa.concluida ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}
                >
                  {tarefa.concluida ? 'Reabrir' : 'Concluir'}
                </button>
                
                <Link
                  href={`/tarefa/form?id=${tarefa.id}`}
                  className="bg-blue-100 text-blue-700 p-1 px-2 rounded text-xs"
                >
                  Editar
                </Link>
                
                <button
                  onClick={() => handleRemoverTarefa(tarefa.id)}
                  className="bg-red-100 text-red-700 p-1 px-2 rounded text-xs"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))
        ) : (
          <p>Nenhuma tarefa encontrada.</p>
        )}
      </div>
    </div>
  );
}