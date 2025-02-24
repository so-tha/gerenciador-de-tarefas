'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { trpc } from '@/app/utils/clientTrpc';
import styles from "@/app/page.module.css";

export default function TarefaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tarefaId = searchParams.get('id') ? parseInt(searchParams.get('id')!) : null;
  
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    concluida: false
  });
  
  const { data: tarefas } = trpc.tarefas.listar.useQuery();
  const criarTarefa = trpc.tarefas.criar.useMutation();
  const atualizarTarefa = trpc.tarefas.atualizar.useMutation();
  
  useEffect(() => {
    if (tarefaId && tarefas) {
      const tarefaExistente = tarefas.find(t => t.id === tarefaId);
      if (tarefaExistente) {
        setFormData({
          titulo: tarefaExistente.titulo,
          descricao: tarefaExistente.descricao,
          concluida: tarefaExistente.concluida
        });
      }
    }
  }, [tarefaId, tarefas]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (tarefaId) {
        await atualizarTarefa.mutateAsync({
          id: tarefaId,
          ...formData
        });
      } else {
        await criarTarefa.mutateAsync({
          titulo: formData.titulo
        });
      }
      
      
      router.push('/');
    } catch (error) {
      console.error("Erro ao salvar tarefa:", error);
      alert("Ocorreu um erro ao salvar a tarefa.");
    }
  };
  
  return (
    <div className={styles.page}>
      <h1 className="text-2xl font-bold mb-4">
        {tarefaId ? 'Editar Tarefa' : 'Nova Tarefa'}
      </h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="titulo" className="block text-sm font-medium mb-1">
            Título
          </label>
          <input
            type="text"
            id="titulo"
            name="titulo"
            value={formData.titulo}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div>
          <label htmlFor="descricao" className="block text-sm font-medium mb-1">
            Descrição
          </label>
          <textarea
            id="descricao"
            name="descricao"
            value={formData.descricao}
            onChange={handleChange}
            rows={4}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="concluida"
            name="concluida"
            checked={formData.concluida}
            onChange={handleChange}
            className="mr-2"
          />
          <label htmlFor="concluida">
            Concluída
          </label>
        </div>
        
        <div className="flex space-x-4">
          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Salvar
          </button>
          
          <button
            type="button"
            onClick={() => router.push('/')}
            className="border border-gray-300 p-2 rounded hover:bg-gray-100"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}