import React, { useState, useEffect, useRef, Component } from 'react';
import { supabase } from './supabaseClient';
import CryptoJS from 'crypto-js';
import DOMPurify from 'dompurify';

const SECRET_KEY = 'amigo-congressista-doc-2026';

const CSS_AMIGO_DOC = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

  :root {
    --apple-blue: #007AFF;
    --brand-dark: #1E293B;
    --bg-sidebar: #FBFBFC;
    --border: rgba(0, 0, 0, 0.06);
    --text-main: #1D1D1F;
    --text-sec: #86868B;
    --nav-height: 70px;
  }

  * { box-sizing: border-box; -webkit-font-smoothing: antialiased; }
  #root { padding: 0 !important; margin: 0 !important; width: 100vw; height: 100vh; }
  body { 
    margin: 0; 
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
    background: #FFF;
    color: var(--text-main);
    overflow: hidden;
  }

  .app-shell { display: flex; flex-direction: column; height: 100vh; width: 100vw; }

  /* ================= NAVBAR RESPONSIVA ================= */
  .top-navbar { 
    height: var(--nav-height); 
    border-bottom: 1px solid #E5E5EA; 
    display: flex; 
    align-items: center; 
    justify-content: space-between; 
    padding: 0 40px; 
    background: white; 
    flex-shrink: 0; 
    position: relative;
    z-index: 1010;
  }

  .brand { display: flex; align-items: center; gap: 12px; text-decoration: none; min-width: 0; }
  .brand-icon { width: 34px; height: auto; flex-shrink: 0; }
  
  .brand-logo-text {
    font-family: 'Inter', sans-serif;
    font-size: 19px;
    font-weight: 700;
    color: #1D1D1F;
    letter-spacing: -0.5px;
    white-space: nowrap;
    display: inline-block;
  }

  /* CLASSES PARA TROCA DINÂMICA DE TEXTO */
  .text-short { display: none; }

  .menu-toggle {
    display: none;
    background: none;
    border: none;
    font-size: 24px;
    color: var(--brand-dark);
    cursor: pointer;
    padding: 0;
    margin-right: 10px;
  }

  .top-actions { display: flex; align-items: center; gap: 15px; flex-shrink: 0; }

  .btn-acesso-site {
    background: var(--apple-blue);
    color: white;
    padding: 10px 24px;
    border-radius: 50px;
    font-size: 13px;
    font-weight: 700;
    text-decoration: none;
    box-shadow: 0 4px 14px rgba(0, 122, 255, 0.2);
    transition: all 0.2s;
    white-space: nowrap;
  }
  .btn-acesso-site:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0, 122, 255, 0.3); }

  /* --- LAYOUT PRINCIPAL --- */
  .main-layout { display: flex; flex: 1; overflow: hidden; position: relative; }

  .sidebar {
    width: 280px;
    background: var(--bg-sidebar);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    padding: 24px 12px;
    flex-shrink: 0;
    z-index: 1000;
    transition: transform 0.3s ease;
  }

  .sidebar-overlay {
    display: none;
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.3);
    backdrop-filter: blur(2px);
    z-index: 999;
  }

  .section-label { 
    font-size: 10px; 
    font-weight: 700; 
    color: var(--text-sec); 
    text-transform: uppercase; 
    margin: 20px 0 8px 10px; 
    letter-spacing: 0.5px;
    text-align: left;
  }

  /* BOTÃO TÍTULO */
  .btn-new-doc {
    background: #FFF;
    border: 1px solid var(--border);
    color: var(--apple-blue);
    font-weight: 700;
    font-size: 13px;
    padding: 12px;
    border-radius: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 10px 4px 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    transition: 0.2s;
  }

  .nav-item {
    padding: 10px 12px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2px;
    color: #424245;
    text-align: left;
  }
  .nav-item.active { background: rgba(0, 122, 255, 0.08); color: var(--apple-blue); font-weight: 600; }

  .trash { opacity: 0; font-size: 14px; transition: 0.2s; }
  .nav-item:hover .trash { opacity: 0.5; }
  .trash:hover { opacity: 1 !important; color: #FF3B30; }

  /* EDITOR ALINHADO À ESQUERDA */
  .editor-pane { flex: 1; display: flex; flex-direction: column; background: #FFF; overflow-y: auto; align-items: flex-start; }
  .canvas { padding: 60px 80px; max-width: 900px; width: 100%; text-align: left; }

  .title-input {
    font-size: 42px;
    font-weight: 800;
    border: none;
    width: 100%;
    margin-bottom: 24px;
    outline: none;
    letter-spacing: -1.5px;
    background: transparent;
    text-align: left;
  }

  .body-editor { font-size: 19px; line-height: 1.7; color: #333; outline: none; min-height: 60vh; text-align: left; }

  .empty-state { padding: 120px 80px; width: 100%; text-align: left; }
  .empty-state p { color: #94A3B8; font-size: 22px; font-weight: 500; margin: 0; }

  .save-badge { font-size: 10px; font-weight: 800; color: #10B981; text-transform: uppercase; margin-right: 15px; }

  /* ================= MOBILE RULES ================= */
  @media (max-width: 768px) {
    .top-navbar { padding: 0 15px; }
    .menu-toggle { display: block; }
    
    /* TROCA DO NOME DA LOGO NO CELULAR */
    .text-full { display: none; }
    .text-short { display: inline; font-size: 18px; }

    .save-badge { display: none; }
    .btn-acesso-site { padding: 8px 14px; font-size: 11px; }

    .sidebar {
      position: absolute; left: 0; top: 0; bottom: 0;
      transform: translateX(-100%);
      background: white;
      box-shadow: 10px 0 30px rgba(0,0,0,0.1);
    }
    .sidebar.open { transform: translateX(0); }
    .sidebar-overlay.open { display: block; }

    .canvas { padding: 40px 20px; }
    .title-input { font-size: 32px; }
    .empty-state { padding: 60px 20px; }
    .trash { opacity: 1; color: #CCC; }
  }

  /* AUTH SCREEN E LOADING */
  .auth-screen { height: 100vh; display: flex; flex-direction: column; background: #F5F5F7; }
  .auth-content { flex: 1; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .auth-card { background: white; padding: 48px; border-radius: 32px; width: 100%; max-width: 440px; text-align: left; box-shadow: 0 20px 60px rgba(0,0,0,0.05); }
  .apple-input { width: 100%; padding: 14px; margin-bottom: 12px; border-radius: 12px; border: 1px solid #D2D2D7; font-size: 16px; background: #FBFBFE; outline: none; }
  .apple-input:focus { border-color: var(--apple-blue); }
  .btn-auth { background: var(--apple-blue); color: white; border: none; padding: 16px; border-radius: 12px; width: 100%; font-weight: 600; cursor: pointer; margin-top: 10px; transition: 0.2s; font-size: 16px; }
  
  .loading-container { height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #FBFBFC; }
  .spinner { width: 40px; height: 40px; border: 4px solid #E5E5EA; border-top: 4px solid #007AFF; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 20px; }
  @keyframes spin { 100% { transform: rotate(360deg); } }
`;

interface Note {
  id: string;
  tab_name: string;
  title: string;
  content: string;
  updated_at?: string;
}

const encrypt = (text: string) => CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
const decrypt = (ciphertext: string) => {
  if (!ciphertext) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8) || '';
  } catch (e) { return ciphertext; }
};

function Navbar({ session, onSignOut, saveStatus, toggleSidebar }: any) {
  return (
    <nav className="top-navbar">
      <div className="brand">
        {session && <button className="menu-toggle" onClick={toggleSidebar}>☰</button>}
        <img src="https://i.imgur.com/RuxNMnw.png" alt="Logo" className="brand-icon" />
        <span className="brand-logo-text">
          <span className="text-full">Amigo Congressista Doc</span>
          <span className="text-short">AMICO DOC</span>
        </span>
      </div>
      <div className="top-actions">
        <span className="save-badge">{saveStatus}</span>
        <a href="https://www.amigocongressista.com.br" target="_blank" className="btn-acesso-site">Acesse o Site</a>
        {session && (
          <button onClick={onSignOut} style={{background:'none', border:'none', cursor:'pointer', fontSize:'13px', fontWeight:700, color:'#FF3B30', padding:0}}>Sair</button>
        )}
      </div>
    </nav>
  );
}

// ================= COMPONENTE PRINCIPAL =================
function MainApp() {
  const [session, setSession] = useState<any>(null);
  const [hasProfile, setHasProfile] = useState<boolean>(true); 
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeTab, setActiveTab] = useState('Geral');
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [saveStatus, setSaveStatus] = useState('Salvo');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const saveTimeoutRef = useRef<any>(null);

  const [isRegistering, setIsRegistering] = useState(false);
  const [authLoginId, setAuthLoginId] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');

  const fetchNotes = async (userId: string) => {
    const { data } = await supabase.from('clinical_notes').select('*').eq('user_id', userId).order('updated_at', { ascending: false });
    if (data) {
      const decrypted = data.map(n => ({ ...n, content: decrypt(n.content) }));
      setNotes(decrypted);
      if (decrypted.length > 0) setActiveNote(decrypted[0]);
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadData = async (sess: any) => {
      // Proteção contra sessão corrompida no LocalStorage
      if (!sess || !sess.user || !sess.user.id) { 
        if (mounted) setIsInitializing(false);
        return;
      }
      try {
        const { data } = await supabase.from('doc_profiles').select('username').eq('id', sess.user.id).maybeSingle();
        if (mounted) setHasProfile(!!data);
        await fetchNotes(sess.user.id);
      } catch (err) {
        console.error("Erro na busca inicial:", err);
        if (mounted) setHasProfile(true); // Failsafe para destravar login
      } finally {
        if (mounted) setIsInitializing(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (mounted) {
        setSession(initialSession);
        loadData(initialSession);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, newSession) => {
      if (mounted) {
        setSession(newSession);
        loadData(newSession);
      }
    });

    const failsafeTimer = setTimeout(() => {
      if (mounted) setIsInitializing(false);
    }, 4000);

    return () => {
      mounted = false;
      clearTimeout(failsafeTimer);
      subscription.unsubscribe();
    };
  }, []);

  const handleTitleChange = async (newTitle: string) => {
    if (!activeNote) return;
    setActiveNote({ ...activeNote, title: newTitle });
    setNotes(prev => prev.map(n => n.id === activeNote.id ? { ...n, title: newTitle } : n));
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      setSaveStatus('Salvando...');
      await supabase.from('clinical_notes').update({ title: newTitle, updated_at: new Date().toISOString() }).eq('id', activeNote.id);
      setSaveStatus('Salvo');
    }, 800);
  };

  const handleContentChange = (content: string) => {
    if (!activeNote) return;
    const clean = DOMPurify.sanitize(content);
    setActiveNote({ ...activeNote, content: clean });
    setSaveStatus('Salvando...');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      await supabase.from('clinical_notes').update({ content: encrypt(clean), updated_at: new Date().toISOString() }).eq('id', activeNote.id);
      setSaveStatus('Salvo');
      setNotes(prev => prev.map(n => n.id === activeNote.id ? { ...n, content: clean } : n));
    }, 1200);
  };

  const createNote = async (tabName?: string) => {
    if (!session) return;
    const { data } = await supabase.from('clinical_notes').insert([{ 
      user_id: session.user.id, tab_name: tabName || activeTab, title: 'Nova Anotação', content: encrypt('') 
    }]).select().single();
    if (data) {
      const newN = { ...data, content: '' };
      setNotes([newN, ...notes]);
      setActiveNote(newN);
      if (tabName) setActiveTab(tabName);
      setIsSidebarOpen(false); 
    }
  };

  const handleAuthSubmit = async (e: any) => {
    e.preventDefault();
    try {
      if (isRegistering) {
        const cleanUsername = authUsername.toLowerCase().trim().replace(/\s+/g, '');
        const { data: ex } = await supabase.from('doc_profiles').select('username').eq('username', cleanUsername).maybeSingle();
        if (ex) { alert('❌ Esse nome de usuário já está em uso. Por favor, escolha outro.'); return; }

        const { data, error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
        if (error) throw error;
        if (data?.user) {
          await supabase.from('doc_profiles').insert([{ id: data.user.id, username: cleanUsername, email: authEmail }]);
          alert('✅ Cadastro realizado com sucesso! Faça login para continuar.');
          setIsRegistering(false); 
        }
      } else {
        let em = authLoginId.trim();
        if (!authLoginId.includes('@')) {
          const { data: p } = await supabase.from('doc_profiles').select('email').eq('username', authLoginId.toLowerCase().trim()).maybeSingle();
          if (!p) { alert('❌ Usuário não encontrado.'); return; }
          em = p.email;
        }
        const { error } = await supabase.auth.signInWithPassword({ email: em, password: authPassword });
        if (error) throw error;
      }
    } catch (err: any) { alert(err.message); }
  };

  const handleSetupMissingProfile = async (e: any) => {
    e.preventDefault();
    try {
      const cleanUsername = authUsername.toLowerCase().trim().replace(/\s+/g, '');
      const { data: existingUser } = await supabase.from('doc_profiles').select('username').eq('username', cleanUsername).maybeSingle();
      if (existingUser) { alert('❌ Esse nome de usuário já está em uso. Por favor, escolha outro.'); return; }

      const { error } = await supabase.from('doc_profiles').insert([{ id: session.user.id, username: cleanUsername, email: session.user.email }]);
      if (error) throw error;
      
      setHasProfile(true);
      fetchNotes(session.user.id);
    } catch (err: any) { alert(err.message); }
  };

  if (isInitializing) {
    return (
      <div className="loading-container">
        <style>{CSS_AMIGO_DOC}</style>
        <div className="spinner"></div>
        <p style={{ color: '#86868B', fontWeight: 500, fontSize: 14 }}>Conectando ao Repositório...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="auth-screen">
        <style>{CSS_AMIGO_DOC}</style>
        <Navbar saveStatus={saveStatus} />
        <div className="auth-content">
          <div className="auth-card">
            <h1 className="brand-logo-text" style={{ fontSize: 24, marginBottom: 8, whiteSpace: 'normal' }}>Amigo Congressista Doc</h1>
            <p style={{color: '#86868B', marginBottom: 24, fontSize: 13}}>Acesso ao Repositório Seguro</p>
            <form onSubmit={handleAuthSubmit}>
              {isRegistering ? (
                <>
                  <input className="apple-input" type="email" placeholder="E-mail" onChange={e => setAuthEmail(e.target.value)} required />
                  <input className="apple-input" type="text" placeholder="Criar Usuário" onChange={e => setAuthUsername(e.target.value)} required />
                </>
              ) : (
                <input className="apple-input" type="text" placeholder="E-mail ou Usuário" onChange={e => setAuthLoginId(e.target.value)} required />
              )}
              <input className="apple-input" type="password" placeholder="Senha" onChange={e => setAuthPassword(e.target.value)} required />
              <button className="btn-auth" type="submit">{isRegistering ? 'Criar Conta' : 'Entrar'}</button>
            </form>
            <p style={{marginTop: 20, fontSize: 13, textAlign: 'center'}}>
              <span onClick={() => setIsRegistering(!isRegistering)} style={{color: 'var(--apple-blue)', cursor: 'pointer', fontWeight: 600}}>
                {isRegistering ? 'Já tenho conta' : 'Criar conta grátis'}
              </span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (session && !hasProfile) {
    return (
      <div className="auth-screen">
        <style>{CSS_AMIGO_DOC}</style>
        <Navbar session={session} onSignOut={() => supabase.auth.signOut()} saveStatus={saveStatus} />
        <div className="auth-content">
          <div className="auth-card">
            <h2 style={{fontFamily: 'Inter', fontSize: 22, fontWeight: 800, color: 'var(--brand-dark)', marginBottom: 8, letterSpacing: '-0.5px'}}>
              Bem-vindo ao Doc!
            </h2>
            <p style={{color: '#86868B', marginBottom: 24, fontSize: 14, lineHeight: 1.5}}>
              Vimos que você já é membro do Amigo Congressista. Escolha um nome de usuário único para sincronizar seu repositório.
            </p>
            <form onSubmit={handleSetupMissingProfile}>
              <input className="apple-input" type="text" placeholder="Criar Usuário" onChange={e => setAuthUsername(e.target.value)} required />
              <button className="btn-auth" type="submit">Salvar e Entrar no Repositório</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <style>{CSS_AMIGO_DOC}</style>
      <Navbar session={session} onSignOut={() => supabase.auth.signOut()} saveStatus={saveStatus} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <div className="main-layout">
        <div className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={() => setIsSidebarOpen(false)} />
        
        <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <div className="section-label">Eixos Científicos</div>
          <div style={{flex:1, overflowY:'auto'}}>
            {Array.from(new Set(['Geral', ...notes.map(n => n.tab_name)])).map(t => (
              <div key={t} className={`nav-item ${activeTab === t ? 'active' : ''}`} onClick={() => {setActiveTab(t); setActiveNote(null); setIsSidebarOpen(false);}}>
                <span>{t === 'Geral' ? '📥 Geral' : `📂 ${t}`}</span>
                {t !== 'Geral' && <span className="trash" onClick={async (e) => {
                  e.stopPropagation();
                  if(confirm('Excluir pasta?')) {
                    setNotes(notes.filter(n => n.tab_name !== t));
                    setActiveTab('Geral');
                    await supabase.from('clinical_notes').delete().eq('tab_name', t);
                  }
                }}>🗑️</span>}
              </div>
            ))}
            <button style={{background:'none', border:'none', color:'var(--apple-blue)', fontWeight:700, fontSize:12, cursor:'pointer', padding:'10px'}} onClick={() => {
              const n = window.prompt('Nome da pasta:');
              if (n) createNote(n);
            }}>⊕ Criar Pasta</button>
          </div>

          <button className="btn-new-doc" onClick={() => createNote()}>
            <span style={{fontSize: 20}}>+</span> Título
          </button>

          <div className="section-label">Notas em {activeTab}</div>
          <div style={{flex:1, overflowY:'auto'}}>
            {notes.filter(n => n.tab_name === activeTab).map(n => (
              <div key={n.id} className={`nav-item ${activeNote?.id === n.id ? 'active' : ''}`} onClick={() => { setActiveNote(n); setIsSidebarOpen(false); }}>
                <span style={{flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{n.title || 'Sem título'}</span>
                <span className="trash" onClick={async (e) => {
                  e.stopPropagation();
                  if(confirm('Excluir nota?')) {
                    setNotes(notes.filter(note => note.id !== n.id));
                    if(activeNote?.id === n.id) setActiveNote(null);
                    await supabase.from('clinical_notes').delete().eq('id', n.id);
                  }
                }}>🗑️</span>
              </div>
            ))}
          </div>
        </aside>

        <main className="editor-pane">
          {activeNote ? (
            <div className="canvas" key={activeNote.id}>
              <input className="title-input" value={activeNote.title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Título do Documento" />
              <div className="body-editor" contentEditable suppressContentEditableWarning onInput={(e) => handleContentChange(e.currentTarget.innerHTML)} 
                   ref={(el) => { if (el && el.dataset.id !== activeNote.id) { el.innerHTML = activeNote.content || ''; el.dataset.id = activeNote.id; } }} />
            </div>
          ) : (
            <div className="empty-state">
              <p>← Selecione um documento acadêmico na barra lateral.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ================= ESCUDO DE ERROS (ERROR BOUNDARY) =================
class ErrorBoundary extends Component<{children: React.ReactNode}, {hasError: boolean, errorMsg: string}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorMsg: error.toString() };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("CRASH INTERCEPTADO:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, backgroundColor: '#FFF0F0', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
          <h2 style={{ color: '#D8000C', marginBottom: 10 }}>Ocorreu um Erro no Aplicativo</h2>
          <p style={{ color: '#555', marginBottom: 20 }}>O cache do seu navegador pode estar corrompido.</p>
          
          <pre style={{ backgroundColor: '#FFF', padding: 20, borderRadius: 8, border: '1px solid #FCC', color: '#D8000C', maxWidth: '80%', overflowX: 'auto', marginBottom: 30 }}>
            {this.state.errorMsg}
          </pre>

          <button 
            onClick={() => {
              window.localStorage.clear();
              window.sessionStorage.clear();
              window.location.reload();
            }} 
            style={{ padding: '12px 24px', backgroundColor: '#D8000C', color: '#FFF', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer', fontSize: 16 }}
          >
            Limpar Cache e Destravar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Exporta o App blindado pelo escudo de erros
export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}