import { useState, useEffect, useRef } from 'react';
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

  .top-navbar { 
    height: 70px; 
    border-bottom: 1px solid #E5E5EA; 
    display: flex; 
    align-items: center; 
    justify-content: space-between; 
    padding: 0 40px; 
    background: white; 
    flex-shrink: 0; 
  }

  .brand { display: flex; align-items: center; gap: 15px; text-decoration: none; }
  .brand-icon { width: 38px; height: auto; }
  
  .brand-logo-text {
    font-family: 'Inter', sans-serif;
    font-size: 20px;
    font-weight: 700;
    color: #1D1D1F;
    letter-spacing: -0.5px;
    white-space: nowrap;
    display: inline-block;
  }

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
    margin-right: 15px;
  }
  .btn-acesso-site:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0, 122, 255, 0.3); }

  .top-actions { display: flex; align-items: center; gap: 15px; } 

  .main-layout { display: flex; flex: 1; overflow: hidden; }

  .sidebar {
    width: 280px;
    background: var(--bg-sidebar);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    padding: 24px 12px;
    flex-shrink: 0;
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
  .empty-state span { display: block; color: #CBD5E1; font-size: 14px; margin-top: 15px; max-width: 400px; line-height: 1.5; }

  .save-badge { font-size: 10px; font-weight: 800; color: #10B981; text-transform: uppercase; margin-right: 15px; }

  .auth-screen { height: 100vh; display: flex; flex-direction: column; background: #F5F5F7; }
  .auth-content { flex: 1; display: flex; align-items: center; justify-content: center; }
  .auth-card { background: white; padding: 48px; border-radius: 32px; width: 400px; text-align: left; box-shadow: 0 20px 60px rgba(0,0,0,0.05); }
  .apple-input { width: 100%; padding: 14px; margin-bottom: 12px; border-radius: 12px; border: 1px solid #D2D2D7; font-size: 16px; background: #FBFBFE; outline: none; }
  .apple-input:focus { border-color: var(--apple-blue); }
  .btn-auth { background: var(--apple-blue); color: white; border: none; padding: 14px; border-radius: 12px; width: 100%; font-weight: 600; cursor: pointer; margin-top: 10px; transition: 0.2s; }
  .btn-auth:hover { opacity: 0.9; }
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

function Navbar({ session, onSignOut, saveStatus }: any) {
  return (
    <nav className="top-navbar">
      <div className="brand">
        <img src="https://i.imgur.com/RuxNMnw.png" alt="Logo" className="brand-icon" />
        <span className="brand-logo-text">Amigo Congressista Doc</span>
      </div>

      <div className="top-actions">
        <span className="save-badge">{saveStatus}</span>
        
        <a href="https://www.amigocongressista.com.br" target="_blank" className="btn-acesso-site">
          Acesse o Site
        </a>

        {session && (
          <button onClick={onSignOut} style={{background:'none', border:'none', cursor:'pointer', fontSize:'13px', fontWeight:700, color:'#FF3B30'}}>
            Sair
          </button>
        )}
      </div>
    </nav>
  );
}

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null); // Novo estado: Checa se tem crachá
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeTab, setActiveTab] = useState('Geral');
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [saveStatus, setSaveStatus] = useState('Salvo');
  const saveTimeoutRef = useRef<any>(null);

  const [isRegistering, setIsRegistering] = useState(false);
  const [authLoginId, setAuthLoginId] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');

  useEffect(() => {
    document.title = "Amigo Congressista Doc";
    supabase.auth.getSession().then(({ data: { session } }) => handleSession(session));
    supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });
  }, []);

  const handleSession = async (currentSession: any) => {
    setSession(currentSession);
    if (currentSession) {
      // Assim que loga, vamos checar se ele tem o usuário único cadastrado no Doc
      const { data } = await supabase
        .from('doc_profiles')
        .select('username')
        .eq('id', currentSession.user.id)
        .maybeSingle();

      if (data) {
        setHasProfile(true);
        fetchNotes(currentSession.user.id);
      } else {
        setHasProfile(false); // Ativa a Tela de Interceptação
      }
    } else {
      setHasProfile(null);
    }
  };

  const fetchNotes = async (userId: string) => {
    const { data } = await supabase.from('clinical_notes').select('*').eq('user_id', userId).order('updated_at', { ascending: false });
    if (data) {
      const decrypted = data.map(n => ({ ...n, content: decrypt(n.content) }));
      setNotes(decrypted);
      if (decrypted.length > 0) setActiveNote(decrypted[0]);
    }
  };

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
      await supabase.from('clinical_notes').update({ 
        content: encrypt(clean), updated_at: new Date().toISOString() 
      }).eq('id', activeNote.id);
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
    }
  };

  // Envio do Login/Cadastro Oficial
  const handleAuthSubmit = async (e: any) => {
    e.preventDefault();
    try {
      if (isRegistering) {
        const cleanUsername = authUsername.toLowerCase().trim().replace(/\s+/g, '');
        const { data: existingUser } = await supabase.from('doc_profiles').select('username').eq('username', cleanUsername).maybeSingle();
        if (existingUser) { alert('❌ Esse nome de usuário já está em uso. Por favor, escolha outro.'); return; }

        const { data, error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
        if (error) throw error;

        if (data?.user) {
          await supabase.from('doc_profiles').insert([{ id: data.user.id, username: cleanUsername, email: authEmail }]);
          alert('✅ Cadastro realizado! Faça login para continuar.');
          setIsRegistering(false); 
        }
      } else {
        let emailToUse = authLoginId.trim();
        if (!authLoginId.includes('@')) {
          const cleanLoginId = authLoginId.toLowerCase().trim().replace(/\s+/g, '');
          const { data: profile, error: profileError } = await supabase.from('doc_profiles').select('email').eq('username', cleanLoginId).maybeSingle();
          if (profileError || !profile) { alert('❌ Usuário não encontrado. Verifique se digitou corretamente.'); return; }
          emailToUse = profile.email;
        }
        const { error } = await supabase.auth.signInWithPassword({ email: emailToUse, password: authPassword });
        if (error) throw error;
      }
    } catch (err: any) { alert(err.message); }
  };

  // Envio do Formulário de Interceptação (A Opção B)
  const handleSetupMissingProfile = async (e: any) => {
    e.preventDefault();
    try {
      const cleanUsername = authUsername.toLowerCase().trim().replace(/\s+/g, '');
      const { data: existingUser } = await supabase.from('doc_profiles').select('username').eq('username', cleanUsername).maybeSingle();
      if (existingUser) { alert('❌ Esse nome de usuário já está em uso. Por favor, escolha outro.'); return; }

      // Cria o crachá do Doc para o usuário que já é do Amigo Congressista
      const { error } = await supabase.from('doc_profiles').insert([{ 
        id: session.user.id, 
        username: cleanUsername, 
        email: session.user.email 
      }]);

      if (error) throw error;
      
      setHasProfile(true);
      fetchNotes(session.user.id);
    } catch (err: any) { alert(err.message); }
  };

  // --- TELA DE LOGIN ---
  if (!session) {
    return (
      <div className="auth-screen">
        <style>{CSS_AMIGO_DOC}</style>
        <Navbar saveStatus={saveStatus} />
        <div className="auth-content">
          <div className="auth-card">
            <h1 className="brand-logo-text" style={{ fontSize: 28, marginBottom: 8 }}>Amigo Congressista Doc</h1>
            <p style={{color: '#86868B', marginBottom: 32, fontSize: 14}}>Repositório Acadêmico Seguro</p>
            <form onSubmit={handleAuthSubmit}>
              {isRegistering ? (
                <>
                  <input className="apple-input" type="email" placeholder="E-mail institucional" onChange={e => setAuthEmail(e.target.value)} required />
                  <input className="apple-input" type="text" placeholder="Criar Usuário " onChange={e => setAuthUsername(e.target.value)} required />
                </>
              ) : (
                <input className="apple-input" type="text" placeholder="E-mail ou Usuário" onChange={e => setAuthLoginId(e.target.value)} required />
              )}
              <input className="apple-input" type="password" placeholder="Senha" onChange={e => setAuthPassword(e.target.value)} required />
              <button className="btn-auth" type="submit">{isRegistering ? 'Criar Conta' : 'Entrar'}</button>
            </form>
            <p style={{marginTop: 24, fontSize: 13, color: '#86868B'}}>
              <span onClick={() => setIsRegistering(!isRegistering)} style={{color: 'var(--apple-blue)', cursor: 'pointer', fontWeight: 600}}>
                {isRegistering ? 'Voltar para Login' : 'Cadastre-se Grátis'}
              </span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- TELA DE INTERCEPTAÇÃO (Opção B) ---
  if (session && hasProfile === false) {
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
              <input className="apple-input" type="text" placeholder="Seu novo usuário" onChange={e => setAuthUsername(e.target.value)} required />
              <button className="btn-auth" type="submit">Salvar e Entrar no Repositório</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Se a sessão existir, mas o perfil ainda estiver carregando (null), não mostra nada pra não piscar
  if (hasProfile === null) return null;

  // --- WORKSPACE (O PAINEL DE NOTAS) ---
  return (
    <div className="app-shell">
      <style>{CSS_AMIGO_DOC}</style>
      <Navbar session={session} onSignOut={() => supabase.auth.signOut()} saveStatus={saveStatus} />

      <div className="main-layout">
        <aside className="sidebar">
          <div className="section-label">Eixos Científicos</div>
          <div style={{flex:1, overflowY:'auto'}}>
            {Array.from(new Set(['Geral', ...notes.map(n => n.tab_name)])).map(t => (
              <div key={t} className={`nav-item ${activeTab === t ? 'active' : ''}`} onClick={() => {setActiveTab(t); setActiveNote(null);}}>
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
            <span style={{fontSize: 20}}>+</span> Nova Anotação
          </button>

          <div className="section-label">Notas em {activeTab}</div>
          <div style={{flex:1, overflowY:'auto'}}>
            {notes.filter(n => n.tab_name === activeTab).map(n => (
              <div key={n.id} className={`nav-item ${activeNote?.id === n.id ? 'active' : ''}`} onClick={() => setActiveNote(n)}>
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
            <div className="canvas">
              <input 
                className="title-input"
                value={activeNote.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Título"
              />
              <div
                className="body-editor"
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => handleContentChange(e.currentTarget.innerHTML)}
                ref={(el) => {
                  if (el && el.dataset.id !== activeNote.id) {
                    el.innerHTML = activeNote.content || '';
                    el.dataset.id = activeNote.id;
                  }
                }}
              />
            </div>
          ) : (
            <div className="empty-state">
              <p>← Selecione um documento acadêmico na barra lateral.</p>
              <span>Suas notas são criptografadas (AES) e salvas automaticamente em tempo real no seu repositório seguro.</span>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}