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
      <div className="div-titulo">
        <h1 className="titulo">📍Lista de Tarefas</h1>
        <Link 
          href="/tarefa/form" 
          className="nv-tarefa-link"
        >
          ✨ Adicionar Nova Tarefa ✨ 
        </Link>
      </div>

      <div className="mt-4">
        {tarefas && tarefas.length > 0 ? (
          tarefas.map(tarefa => (
            <div key={tarefa.id} className="id-tarefa">
              <div>
                <div className="titulo-tarefa">{tarefa.titulo}</div>
                {tarefa.descricao && (
                  <div >
                    <p className="descricao-tarefa">Descrição: {tarefa.descricao}</p></div>
                )}
                <div>
                  {tarefa.concluida ? 
                    <span className="concluida">Concluída</span> : 
                    <span className="pendente">Pendente</span>
                  }
                </div>
              </div>
              
              <div>
                <button
                  onClick={() => handleAlternarStatus(tarefa.id, tarefa.concluida)}
                  className={`button-concluida ${tarefa.concluida ? 'submit-button' : 'submit-button'}`}
                >
                  {tarefa.concluida ? 'Reabrir' : 'Concluir'}
                </button>
                
                <button className="submit-button">
                  <Link
                  href={`/tarefa/form?id=${tarefa.id}`}
                >
                  Editar
                </Link>
                </button>

                
                <button
                  onClick={() => handleRemoverTarefa(tarefa.id)}
                  className="submit-button"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className='nn-tarefa'>🌼 Nenhuma tarefa encontrada.🌼</p>
        )}
      </div>
    </div>
  );
}