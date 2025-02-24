'use client';
import { trpc } from '@/app/utils/clientTrpc';
import Image from "next/image";
import styles from "./page.module.css";

export default function Home() {
  const tarefas = trpc.tarefas.listar.useQuery();
  const criarTarefa = trpc.tarefas.criar.useMutation({
    onSuccess: () => {
      tarefas.refetch();
    }
  });

  const handleNovaTarefa = () => {
    criarTarefa.mutate({ titulo: "Nova Tarefa" });
  };

  return (
    <div className={styles.page}>
        <button 
          onClick={handleNovaTarefa}
          className="bg-blue-500 text-white p-2 rounded"
        >
          Adicionar Tarefa
        </button>

        <div className="mt-4">
          {tarefas.data?.map(tarefa => (
            <div key={tarefa.id} className="p-2 border mb-2">
              <span>{tarefa.titulo}</span>
              <span>{tarefa.descricao ? " (Concluída)" : " (Pendente)"}</span>
            </div>
          ))}
        </div>
      <footer className={styles.footer}>
        <a
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
