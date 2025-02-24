'use client';
import { trpc } from '@/app/utils/clientTrpc';
import styles from "./page.module.css";

export default function Home() {
  const criarTarefa = trpc.tarefas.criar.useMutation();
  const { data: tarefas, error } = trpc.tarefas.listar.useQuery();

  const handleNovaTarefa = async () => {
    try {
      const response = await criarTarefa.mutateAsync({ titulo: "Nova Tarefa" });
      console.log("Tarefa adicionada:", response);
    } catch (error) {
      console.error("Erro ao adicionar tarefa:", error);
      }
  };

  if (error) {
    console.error("Erro ao listar tarefas:", error);
    return <div>Erro ao carregar tarefas.</div>;
  }

  return (
    <div className={styles.page}>
      <button 
        onClick={handleNovaTarefa}
        className="bg-blue-500 text-white p-2 rounded">
        Adicionar Tarefa
      </button>
      <div className="mt-4">
        {tarefas && tarefas.length > 0 ? (
          tarefas.map(tarefa => (
            <div key={tarefa.id} className="p-2 border mb-2">
              <span>{tarefa.titulo}</span>
              <span>{tarefa.concluida ? " (Concluída)" : " (Pendente)"}</span>
            </div>
          ))
        ) : (
          <p>Nenhuma tarefa encontrada.</p>
        )}
      </div>
    </div>
  );
}
