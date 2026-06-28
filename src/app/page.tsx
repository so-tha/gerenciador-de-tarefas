'use client';

import { useState, useEffect, useRef } from 'react';
import { trpc } from '@/app/utils/clientTrpc';

// Interface for Task representation
interface Task {
  id: number;
  titulo: string;
  concluida: boolean;
  descricao: string;
  dataCriacao: string | Date;
}

export default function Home() {
  // Auth state & operations
  const { data: sessionUser, isLoading: isLoadingSession, refetch: refetchSession } = trpc.auth.me.useQuery();
  const loginMutation = trpc.auth.login.useMutation();
  const registrarMutation = trpc.auth.registrar.useMutation();
  const logoutMutation = trpc.auth.logout.useMutation();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const { data: tarefas, refetch } = trpc.tarefas.listar.useQuery(undefined, {
    enabled: !!sessionUser
  });
  const criarTarefa = trpc.tarefas.criar.useMutation();
  const atualizarTarefa = trpc.tarefas.atualizar.useMutation();
  const removerTarefa = trpc.tarefas.remover.useMutation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    concluida: false
  });

  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (e) {
      console.error('Erro ao deslogar no servidor:', e);
    }
    localStorage.removeItem('auth_token');
    setUsername('');
    setPassword('');
    setAuthSuccess(null);
    setAuthError(null);
    await refetchSession();
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setIsAuthLoading(true);

    try {
      if (activeTab === 'login') {
        const res = await loginMutation.mutateAsync({ username, password });
        localStorage.setItem('auth_token', res.token);
        setAuthSuccess('Login realizado com sucesso! Redirecionando...');
        setTimeout(async () => {
          await refetchSession();
          await refetch();
          setIsAuthLoading(false);
        }, 500);
      } else {
        await registrarMutation.mutateAsync({ username, password });
        setAuthSuccess('Conta criada com sucesso! Você já pode entrar.');
        setActiveTab('login');
        setPassword('');
        setIsAuthLoading(false);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ocorreu um erro. Tente novamente.';
      setAuthError(message);
      setIsAuthLoading(false);
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = systemPrefersDark ? 'dark' : 'light';
      setTheme(initialTheme);
      document.documentElement.setAttribute('data-theme', initialTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // Pomodoro Timer State
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60); // 25 minutes
  const [timerActive, setTimerActive] = useState(false);
  const [todayFocusMinutes, setTodayFocusMinutes] = useState(23); // Standard value from prototype, can be incremented
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [listImage, setListImage] = useState<string | null>(null);

  // Load listImage from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('todoListImage');
    if (saved) {
      setListImage(saved);
    }
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setListImage(base64String);
        localStorage.setItem('todoListImage', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setListImage(null);
    localStorage.removeItem('todoListImage');
  };

  // Get current formatted date
  const [currentDateString, setCurrentDateString] = useState('');
  useEffect(() => {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'long', year: 'numeric' };
    setCurrentDateString(date.toLocaleDateString('pt-BR', options));
  }, []);

  // Sync today focus minutes from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('todayFocusMinutes');
    if (saved) {
      setTodayFocusMinutes(parseInt(saved, 10));
    }
  }, []);

  // Timer Countdown Logic
  useEffect(() => {
    if (timerActive) {
      timerIntervalRef.current = setInterval(() => {
        setPomodoroTime((prev) => {
          if (prev <= 1) {
            // Timer finished
            setTimerActive(false);
            playCompletionSound();
            const newMinutes = todayFocusMinutes + 25;
            setTodayFocusMinutes(newMinutes);
            localStorage.setItem('todayFocusMinutes', newMinutes.toString());
            return 25 * 60; // Reset
          }
          // Accumulate focus time every minute
          if ((25 * 60 - prev + 1) % 60 === 0) {
            setTodayFocusMinutes((m) => {
              const updated = m + 1;
              localStorage.setItem('todayFocusMinutes', updated.toString());
              return updated;
            });
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timerActive, todayFocusMinutes]);



  // Play Pomodoro completion chime using Web Audio API
  const playCompletionSound = () => {
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtxClass();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc1.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15); // G5

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc2.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.2); // C6

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.6);
      osc2.stop(ctx.currentTime + 0.6);
    } catch (e) {
      console.error('Audio chime error:', e);
    }
  };



  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handlers for Tasks
  const handleToggleStatus = async (task: Task) => {
    try {
      await atualizarTarefa.mutateAsync({
        id: task.id,
        concluida: !task.concluida
      });
      refetch();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTask = async (id: number) => {
    try {
      await removerTarefa.mutateAsync({ id });
      refetch();
    } catch (e) {
      console.error(e);
    }
  };

  const openAddModal = () => {
    setEditingTask(null);
    setFormData({ titulo: '', descricao: '', concluida: false });
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setFormData({
      titulo: task.titulo,
      descricao: task.descricao || '',
      concluida: task.concluida
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTask) {
        // Edit existing
        await atualizarTarefa.mutateAsync({
          id: editingTask.id,
          titulo: formData.titulo,
          descricao: formData.descricao,
          concluida: formData.concluida
        });
      } else {
        // Create new
        const res = await criarTarefa.mutateAsync({
          titulo: formData.titulo
        });
        
        // If there is description or it needs to be set completed initially
        if (formData.descricao || formData.concluida) {
          await atualizarTarefa.mutateAsync({
            id: res.novaTarefa.id,
            descricao: formData.descricao,
            concluida: formData.concluida
          });
        }
      }
      setIsModalOpen(false);
      refetch();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar tarefa.');
    }
  };

  if (isLoadingSession) {
    return (
      <div className="page-loading-screen">
        <div className="auth-spinner" style={{ borderTopColor: 'var(--color-purple-dark)' }}></div>
      </div>
    );
  }

  if (!sessionUser) {
    return (
      <div className="auth-wrapper">
        <button 
          className="icon-btn theme-toggle-btn auth-theme-floating" 
          onClick={toggleTheme} 
          aria-label={theme === 'dark' ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
          title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
        >
          {theme === 'dark' ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          )}
        </button>
        <div className="auth-card">
          <div className="auth-logo">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
          </div>
          <h2 className="auth-title">Organize-se</h2>
          <p className="auth-subtitle">Gerencie suas tarefas de forma simples e produtiva.</p>

          <div className="auth-tabs">
            <button 
              className={`auth-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => { setActiveTab('login'); setAuthError(null); setAuthSuccess(null); }}
            >
              Entrar
            </button>
            <button 
              className={`auth-tab-btn ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => { setActiveTab('register'); setAuthError(null); setAuthSuccess(null); }}
            >
              Cadastrar
            </button>
          </div>

          <form className="auth-form" onSubmit={handleAuthSubmit}>
            {authError && (
              <div className="auth-error">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                {authError}
              </div>
            )}
            {authSuccess && (
              <div className="auth-success">
                {authSuccess}
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="auth-username">Nome de Usuário</label>
              <input 
                id="auth-username"
                className="form-input"
                type="text"
                required
                placeholder="Seu usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="auth-password">Senha</label>
              <input 
                id="auth-password"
                className="form-input"
                type="password"
                required
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button 
              className="auth-submit-btn" 
              type="submit"
              disabled={isAuthLoading}
            >
              {isAuthLoading ? (
                <div className="auth-spinner"></div>
              ) : activeTab === 'login' ? (
                'Acessar Conta'
              ) : (
                'Criar Conta'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`app-container ${isSidebarOpen ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
      {/* 1. Sidebar */}
      <aside className="sidebar">
        <button className="sidebar-menu-btn" aria-label="Menu" onClick={() => setIsSidebarOpen(false)} title="Fechar Menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        <button className="sidebar-fab" onClick={openAddModal} title="Adicionar Nova Tarefa" aria-label="Adicionar Tarefa">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF8A8A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
          </svg>
        </button>

        {/* User profile at the bottom of the sidebar */}
        <div className="user-profile-widget" title={sessionUser.username}>
          <div className="user-profile-avatar">
            {sessionUser.username.substring(0, 2).toUpperCase()}
          </div>
          {isSidebarOpen && (
            <div className="user-profile-info">
              <span className="user-profile-name">{sessionUser.username}</span>
            </div>
          )}
          {isSidebarOpen && (
            <button className="user-logout-btn" onClick={handleLogout} title="Sair da Conta" aria-label="Sair">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          )}
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <main className="main-content">
        <header className="header-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {!isSidebarOpen && (
              <button 
                className="icon-btn toggle-sidebar-floating" 
                onClick={() => setIsSidebarOpen(true)} 
                aria-label="Abrir Menu"
                title="Abrir Menu"
                style={{ padding: '8px', borderRadius: '50%' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </button>
            )}
            <h1 className="header-title">Minhas Tarefas</h1>
          </div>
          <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '500', color: 'var(--text-muted)' }}>
              <span>Olá, <strong>{sessionUser.username}</strong></span>
              {!isSidebarOpen && (
                <button className="user-logout-btn" onClick={handleLogout} title="Sair da Conta" aria-label="Sair">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                </button>
              )}
            </div>

            <button 
              className="icon-btn theme-toggle-btn" 
              onClick={toggleTheme} 
              aria-label={theme === 'dark' ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
              title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
            >
              {theme === 'dark' ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              )}
            </button>
          </div>
        </header>

        <div className="dashboard-grid">
          {/* Coluna da Esquerda (Lista de Tarefas + Pomodoro) */}
          <div className="dashboard-left-column" style={{ display: 'flex', flexDirection: 'column', gap: '28px', flex: '0 1 1080px', width: '100%', maxWidth: '1080px' }}>
            {/* TO-DO CARD */}
            <section className="card todo-card-layout">
              {/* Geometric Illustration or Custom Image on the Left */}
              <div className="todo-illustration-container" onClick={() => fileInputRef.current?.click()}>
                {listImage ? (
                  <img src={listImage} alt="Ilustração da lista" className="todo-list-custom-image" />
                ) : (
                  <svg className="todo-illustration" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Background organic blob */}
                    <path className="illustration-blob" d="M160 80C175 110 150 145 125 160C100 175 60 170 45 140C30 110 40 70 65 45C90 20 145 50 160 80Z" />
                    
                    {/* 1. Organic Rounded Triangle-like shape on top */}
                    <path className="illustration-shape" d="M96.5 32.7C98.1 30.1 101.9 30.1 103.5 32.7L132.8 81.3C134.4 83.9 132.5 87.2 129.3 87.2H70.7C67.5 87.2 65.6 83.9 67.2 81.3L96.5 32.7Z" fill="#D3C4EC" style={{ transformOrigin: '100px 60px' }} />
                    
                    {/* 2. Star/Gear shape on bottom-left */}
                    <path className="illustration-shape" d="M60.1 113.8L51.9 111.4C50.2 110.9 48.7 112.4 49.2 114.1L51.6 122.3C52.1 124 50.6 125.5 48.9 125L40.7 122.6C39 122.1 37.5 123.6 38 125.3L40.4 133.5C40.9 135.2 39.4 136.7 37.7 136.2L29.5 133.8C27.8 133.3 26.3 134.8 26.8 136.5L29.2 144.7C29.7 146.4 28.2 147.9 26.5 147.4L18.3 145C16.6 144.5 15.1 146 15.6 147.7L18 155.9C18.5 157.6 17 159.1 15.3 158.6L7.1 156.2C5.4 155.7 3.9 157.2 4.4 158.9L6.8 167.1C7.3 168.8 5.8 170.3 4.1 169.8L-4.1 167.4" fill="#C4C4C4" style={{ transform: 'scale(0.8) translate(30px, 30px)', transformOrigin: '60px 140px' }} />
                    
                    {/* Flower/Burst custom shape as substitute for gear */}
                    <path className="illustration-shape" d="M60 115C56 112 50 112 47 116C44 120 45 127 41 129C37 131 31 128 28 132C25 136 27 143 25 147C23 151 17 152 17 157C17 162 23 163 25 167C27 171 25 178 28 182C31 186 37 183 41 185C45 187 44 194 47 198C50 202 56 202 60 199C64 202 70 202 73 198C76 194 75 187 79 185C83 183 89 186 92 182C95 178 93 171 95 167C97 163 103 162 103 157C103 152 97 151 95 147C93 143 95 136 92 132C89 128 83 131 79 129C75 127 76 120 73 116C70 112 64 112 60 115Z" fill="#CECECE" />

                    {/* 3. Rounded Square on bottom-right */}
                    <rect className="illustration-shape" x="120" y="110" width="50" height="50" rx="14" fill="#C5C2C7" style={{ transformOrigin: '145px 135px' }} />
                  </svg>
                )}

                {/* Overlay to trigger upload */}
                <div className="illustration-overlay">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                    <circle cx="12" cy="13" r="4"></circle>
                  </svg>
                  <span>Alterar Imagem</span>
                </div>

                {listImage && (
                  <button className="remove-image-btn" onClick={handleResetImage} title="Remover Imagem" aria-label="Remover imagem">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                )}

                <input 
                  type="file" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  accept="image/*" 
                  onChange={handleImageChange}
                />
              </div>

              {/* Tasks Panel */}
              <div className="todo-details-panel">
                <h2 className="todo-list-title">To - Do List</h2>
                <p className="todo-list-date">Data - {currentDateString || 'Carregando...'}</p>

                <div className="tasks-container">
                  {tarefas && tarefas.length > 0 ? (
                    tarefas.map((tarefa) => (
                      <div key={tarefa.id} className={`task-item ${tarefa.concluida ? 'completed' : ''}`}>
                        <div className="task-item-left">
                          <button
                            className={`custom-checkbox ${tarefa.concluida ? 'checked' : ''}`}
                            onClick={() => handleToggleStatus(tarefa)}
                            aria-label={tarefa.concluida ? 'Marcar como pendente' : 'Marcar como concluída'}
                          >
                            <div className="custom-checkbox-mark" />
                          </button>
                          
                          <div className="task-info-content">
                            <span className="task-title-text">{tarefa.titulo}</span>
                            {tarefa.descricao && (
                              <span className="task-desc-text">{tarefa.descricao}</span>
                            )}
                          </div>
                        </div>

                        <div className="task-item-actions">
                          <button className="task-action-btn" onClick={() => openEditModal(tarefa)} title="Editar Tarefa" aria-label="Editar">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          </button>
                          <button className="task-action-btn delete" onClick={() => handleDeleteTask(tarefa.id)} title="Excluir Tarefa" aria-label="Excluir">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              <line x1="10" y1="11" x2="10" y2="17"></line>
                              <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">
                      <svg className="empty-state-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                      <p>Nenhuma tarefa criada ainda.</p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* POMODORO TIMER CARD */}
            <section className="card pomodoro-card">
              <div className="pomodoro-left">
                <div className="pomodoro-header" onClick={() => setPomodoroTime(25 * 60)}>
                  <span>Pomodoro</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </div>

                <div className="pomodoro-timer">
                  {formatTime(pomodoroTime)}
                </div>

                <div className="pomodoro-meta">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                  </svg>
                  <span>Hoje · {todayFocusMinutes} min</span>
                </div>
              </div>

              <div className="pomodoro-right">
                <button
                  className={`pomodoro-play-btn ${timerActive ? 'active' : ''}`}
                  onClick={() => setTimerActive(!timerActive)}
                  aria-label={timerActive ? 'Pausar Pomodoro' : 'Iniciar Pomodoro'}
                  title={timerActive ? 'Pausar' : 'Iniciar'}
                >
                  {timerActive ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16" rx="1"></rect>
                      <rect x="14" y="4" width="4" height="16" rx="1"></rect>
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '4px' }}>
                      <path d="M8 5v14l11-7z"></path>
                    </svg>
                  )}
                </button>
              </div>
            </section>
          </div>

          {/* Coluna da Direita (Spotify Player no espaço livre) */}
          <div className="dashboard-right-column" style={{ display: 'flex', flexDirection: 'column', gap: '28px', flex: '1 1 320px', minWidth: '320px', width: '100%', alignItems: 'flex-start' }}>
            <iframe 
              data-testid="embed-iframe"
              style={{ borderRadius: '12px', border: '0' }} 
              src="https://open.spotify.com/embed/playlist/09NUswh4HgOovXtxHaG70P?utm_source=generator&theme=0&si=723ad45324f44b6a" 
              width="100%" 
              height="480" 
              frameBorder="0" 
              allowFullScreen={true}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
              loading="lazy"
            ></iframe>
          </div>
        </div>
      </main>



      {/* 4. Task Modal Dialog (Add & Edit) */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}</h3>
              <button className="icon-btn" onClick={() => setIsModalOpen(false)} aria-label="Fechar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="modal-titulo">Título</label>
                <input
                  id="modal-titulo"
                  className="form-input"
                  type="text"
                  required
                  placeholder="Ex: Estudar Next.js"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="modal-descricao">Descrição</label>
                <textarea
                  id="modal-descricao"
                  className="form-textarea"
                  rows={3}
                  placeholder="Ex: Focar no módulo de roteamento"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                />
              </div>

              {editingTask && (
                <div className="form-group">
                  <label className="form-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.concluida}
                      onChange={(e) => setFormData({ ...formData, concluida: e.target.checked })}
                    />
                    <span className="form-label">Marcar como Concluída</span>
                  </label>
                </div>
              )}

              <div className="modal-actions">
                <button className="btn btn-secondary" type="button" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button className="btn btn-primary" type="submit">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}