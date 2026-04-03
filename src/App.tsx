import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import CryptoJS from 'crypto-js';
import DOMPurify from 'dompurify';

const SECRET_KEY = 'amigo-congressista-doc-2026';

const CSS_AMIGO_DOC = `
  :root {
    --apple-blue: #007AFF;
    --bg-sidebar: #FBFBFC;
    --border: rgba(0, 0, 0, 0.06);
    --text-main: #1D1D1F;
    --text-sec: #86868B;
  }

  * { box-sizing: border-box; -webkit-font-smoothing: antialiased; }
  #root { padding: 0 !important; margin: 0 !important; width: 100vw; height: 100vh; }
  body { 
    margin: 0; 
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
    background: #FFF;
    color: var(--text-main);
    overflow: hidden;
  }

  .app-shell { display: flex; flex-direction: column; height: 100vh; width: 100vw; }

  /* --- HEADER OFICIAL --- */
  .top-header {
    height: 60px;
    background: #FFF;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    flex-shrink: 0;
  }

  .brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
  .logo-icon { width: 12px; height: 12px; background: var(--apple-blue); border-radius: 3px; }
  .brand-name { font-weight: 800; font-size: 16px; color: var(--text-main); letter-spacing: -0.5px; }

  .btn-site {
    background: var(--apple-blue);
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
    text-decoration: none;
    transition: 0.2s;
  }

  /* --- LAYOUT SIDEBAR + EDITOR --- */
  .main-layout { display: flex; flex: 1; overflow: hidden; }

  .sidebar {
    width: 280px;
    background: var(--bg-sidebar);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    padding: 20px 12px;
  }

  .section-label { 
    font-size: 10px; 
    font-weight: 700; 
    color: var(--text-sec); 
    text-transform: uppercase; 
    margin: 15px 0 8px 10px; 
    letter-spacing: 0.5px;
    text-align: left;
  }

  /* BOTÃO NOVA NOTA (APPLE STYLE) */
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
    margin: 0 4px 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    transition: 0.2s;
  }
  .btn-new-doc:hover { transform: translateY(-1px); box-shadow: 0 4px 10px rgba(0,0,0,0.06); }

  .btn-subtle {
    background: transparent;
    border: none;
    color: var(--apple-blue);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    padding: 6px 10px;
    text-align: left;
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
  }
  .nav-item.active { background: rgba(0, 122, 255, 0.08); color: var(--apple-blue); font-weight: 600; }
  .nav-item:hover { background: rgba(0,0,0,0.03); }

  .trash { opacity: 0; font-size: 14px; transition: 0.2s; }
  .nav-item:hover .trash { opacity: 0.5; }
  .trash:hover { opacity: 1 !important; color: #FF3B30; }

  /* --- EDITOR --- */
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

  .body-editor { font-size: 19px; line-height: 1.7; color: #333; outline: none; min-height: 50vh; text-align: left; }

  /* --- AUTH SCREEN --- */
  .auth-screen { height: 100vh; display: flex; align-items: center; justify-content: center; background: #F5F5F7; }
  .auth-card { background: white; padding: 40px; border-radius: 32px; width: 380px; text-align: left; box-shadow: 0 20px 60px rgba(0,0,0,0.05); }
  .apple-input { width: 100%; padding: 14px; margin-bottom: 12px; border-radius: 12px; border: 1px solid #D2D2D7; font-size: 16px; background: #FBFBFE; }
  .btn-auth { background: var(--apple-blue); color: white; border: none; padding: 14px; border-radius: 12px; width: 100%; font-weight: 600; cursor: pointer; margin-top: 10px; }
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

function App() {
  const [session, setSession] = useState<any>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeTab, setActiveTab] = useState('Geral');
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [saveStatus, setSaveStatus] = useState('Salvo');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    document.title = "Amigo Congressista Doc - Portal Acadêmico";
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchNotes(session.user.id);
    });
  }, []);

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
    // Atualiza o nome na barra lateral na hora
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

  if (!session) {
    return (
      <div className="auth-screen">
        <style>{CSS_AMIGO_DOC}</style>
        <div className="auth-card">
          <h1 style={{fontSize: 28, fontWeight: 800, marginBottom: 8, letterSpacing: '-1.5px'}}>Amigo Congressista Doc</h1>
          <p style={{color: '#86868B', marginBottom: 32, fontSize: 14}}>Repositório Acadêmico Seguro</p>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const { error } = isRegistering 
              ? await supabase.auth.signUp({ email, password })
              : await supabase.auth.signInWithPassword({ email, password });
            if (error) alert(error.message);
            else if (isRegistering) alert("Cadastro realizado! Verifique seu e-mail.");
          }}>
            <input className="apple-input" type="email" placeholder="Seu melhor e-mail" onChange={e => setEmail(e.target.value)} required />
            <input className="apple-input" type="password" placeholder="Sua senha" onChange={e => setPassword(e.target.value)} required />
            <button className="btn-auth" type="submit">{isRegistering ? 'Criar Minha Conta' : 'Acessar Documentos'}</button>
          </form>
          <p style={{marginTop: 24, fontSize: 13, color: '#86868B'}}>
            {isRegistering ? 'Já possui acesso?' : 'Não tem uma conta?'} 
            <span onClick={() => setIsRegistering(!isRegistering)} style={{color: 'var(--apple-blue)', cursor: 'pointer', marginLeft: 6, fontWeight: 600}}>
              {isRegistering ? 'Fazer Login' : 'Cadastre-se Grátis'}
            </span>
          </p>
        </div>
      </div>
    );
  }

  const tabs = Array.from(new Set(['Geral', ...notes.map(n => n.tab_name)]));
  const filteredNotes = notes.filter(n => n.tab_name === activeTab);

  return (
    <div className="app-shell">
      <style>{CSS_AMIGO_DOC}</style>

      <header className="top-header">
        <div className="brand">
          <div className="logo-icon" />
          <span className="brand-name">Amigo Congressista Doc</span>
        </div>
        <div style={{display:'flex', gap:20, alignItems:'center'}}>
          <span style={{fontSize:10, fontWeight:800, color:'#10B981'}}>{saveStatus.toUpperCase()}</span>
          <a href="https://www.amigocongressista.com.br" target="_blank" className="btn-site">Ver Site Oficial</a>
        </div>
      </header>

      <div className="main-layout">
        <aside className="sidebar">
          <div className="section-label">Eixos Científicos</div>
          {tabs.map(t => (
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
          <button className="btn-subtle" onClick={() => {
            const n = window.prompt('Nome da nova pasta acadêmica:');
            if (n) createNote(n);
          }}>⊕ Criar Pasta</button>

          <button className="btn-new-doc" onClick={() => createNote()} style={{marginTop: 20}}>
            <span style={{fontSize: 20}}>+</span> Nova Anotação
          </button>

          <div className="section-label">Notas em {activeTab}</div>
          <div style={{flex:1, overflowY:'auto'}}>
            {filteredNotes.map(n => (
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

          <button className="btn-subtle" style={{marginTop: 'auto', borderTop:'1px solid var(--border)', paddingTop:15}} onClick={() => supabase.auth.signOut()}>Sair do Portal</button>
        </aside>

        <main className="editor-pane">
          {activeNote ? (
            <div className="canvas">
              <input 
                className="title-input"
                value={activeNote.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Título do Documento"
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
            <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', color: '#BBB'}}>
              Selecione um documento científico na barra lateral.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;