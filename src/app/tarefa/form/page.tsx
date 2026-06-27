'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { trpc } from '@/app/utils/clientTrpc';

// Main wrapper with Suspense boundary to prevent build failures
export default function TarefaFormPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#FAF6FB' }}>
        <p style={{ color: '#49454F', fontSize: '18px', fontWeight: 500 }}>Carregando formulário...</p>
      </div>
    }>
      <TarefaForm />
    </Suspense>
  );
}

function TarefaForm() {
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
          descricao: tarefaExistente.descricao || '',
          concluida: tarefaExistente.concluida
        });
      }
    }
  }, [tarefaId, tarefas]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (tarefaId) {
        await atualizarTarefa.mutateAsync({
          id: tarefaId,
          ...formData
        });
      } else {
        const res = await criarTarefa.mutateAsync({
          titulo: formData.titulo
        });
        if (formData.descricao || formData.concluida) {
          await atualizarTarefa.mutateAsync({
            id: res.novaTarefa.id,
            descricao: formData.descricao,
            concluida: formData.concluida
          });
        }
      }
      router.push('/');
    } catch (error) {
      console.error("Erro ao salvar tarefa:", error);
      alert("Ocorreu um erro ao salvar a tarefa.");
    }
  };
  
  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', background: '#FAF6FB', padding: '20px' }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '24px',
        padding: '40px',
        width: '100%',
        maxWidth: '500px',
        boxShadow: '0px 4px 30px rgba(0, 0, 0, 0.03)',
        border: '1px solid rgba(0, 0, 0, 0.03)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#1D1B20' }}>
            {tarefaId ? 'Editar Tarefa' : 'Nova Tarefa'}
          </h2>
          
          <button 
            type="button" 
            onClick={() => router.push('/')}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#49454F',
              padding: '8px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s ease'
            }}
            title="Voltar"
            aria-label="Voltar para a página inicial"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="form-titulo">Título</label>
            <input
              id="form-titulo"
              className="form-input"
              type="text"
              required
              placeholder="Ex: Estudar Next.js"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="form-descricao">Descrição</label>
            <textarea
              id="form-descricao"
              className="form-textarea"
              rows={4}
              placeholder="Ex: Focar no módulo de roteamento"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
            />
          </div>
          
          <div className="form-group">
            <label className="form-checkbox-label" htmlFor="form-concluida">
              <input
                id="form-concluida"
                type="checkbox"
                checked={formData.concluida}
                onChange={(e) => setFormData({ ...formData, concluida: e.target.checked })}
              />
              <span className="form-label">Marcar como Concluída</span>
            </label>
          </div>
          
          <div className="modal-actions" style={{ marginTop: '40px' }}>
            <button 
              className="btn btn-secondary" 
              type="button" 
              onClick={() => router.push('/')}
            >
              Cancelar
            </button>
            <button 
              className="btn btn-primary" 
              type="submit"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}