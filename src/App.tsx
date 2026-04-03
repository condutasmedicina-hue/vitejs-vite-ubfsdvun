import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import CryptoJS from 'crypto-js';
import DOMPurify from 'dompurify';

const SECRET_KEY = 'amigo-congressista-seguro-2026';

const NOTAS_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

#root { padding: 0 !important; margin: 0 !important; max-width: none !important; width: 100vw !important; height: 100vh !important; }
html, body { margin: 0 !important; padding: 0 !important; width: 100vw; height: 100vh; overflow: hidden; background: #FFFFFF; color: #1D1D1F; font-family: 'Inter', sans-serif; }
* { box-sizing: border-box; outline: none !important; }

.app-container { display: flex; height: 100vh; width: 100vw; background: white; }

/* ================= COLUNA DA ESQUERDA (SIDEBAR) ================= */
.sidebar { 
  width: 300px; 
  background: #F8F9FA; 
  border-right: 1px solid #E5E5EA; 
  display: flex; 
  flex-direction: column; 
  flex-shrink: 0; 
}

.sidebar-header { 
  padding: 24px; 
  border-bottom: 1px solid #E5E5EA; 
  background: white;
}

.brand-logo-text { 
  font-size: 18px; 
  font-weight: 800; 
  color: #0071E3; 
  display: block;
  margin-bottom: 20px;
  text-decoration: none;
}

/* SEÇÃO DE ABAS NA SIDEBAR */
.tabs-section { padding: 10px 16px; border-bottom: 1px solid #E5E5EA; }
.section-title { font-size: 11px; font-weight: 700; color: #86868B; text-transform: uppercase; margin-bottom: 8px; padding-left: 8px; }

.nav-tab { 
  padding: 10px 12px; 
  border-radius: 8px; 
  cursor: pointer; 
  font-size: 14px; 
  font-weight: 500; 
  color: #444; 
  display: flex; 
  align-items: center; 
  justify-content: space-between;
  margin-bottom: 4px;
  transition: all 0.2s; 
}
.nav-tab:hover { background: #EBEBEB; }
.nav-tab.active { background: #E8F0FE; color: #0071E3; font-weight: 600; }
.nav-tab-delete { font-size: 16px; opacity: 0.3; }
.nav-tab-delete:hover { opacity: 1; color: #D63939; }

/* LISTA DE NOTAS NA SIDEBAR */
.notes-list-section { flex: 1; overflow-y: auto; padding: 10px 16px; }
.note-card { 
  padding: 12px; 
  border-radius: 8px; 
  cursor: pointer; 
  margin-bottom: 8px; 
  border: 1px solid transparent;
  transition: all 0.2s;
  text-align: left;
}
.note-card:hover { background: #EBEBEB; }
.note-card.active { background: white; border: 1px solid #0071E3; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }

/* ================= ÁREA DO EDITOR ================= */
.main-content { flex: 1; display: flex; flex-direction: column; background: white; min-width: 0; }

.editor-header { 
  padding: 30px 50px; 
  display: flex; 
  flex-direction: column;
  gap: 10px;
  text-align: left;
}

.title-input { 
  font-size: 32px; 
  font-weight: 800; 
  border: none; 
  width: 100%; 
  color: #1D1D1F; 
  background: transparent; 
  text-align: left;
}

.editor-area { 
  flex: 1; 
  padding: 20px 50px 50px 50px; 
  font-size: 17px; 
  line-height: 1.8; 
  overflow-y: auto; 
  color: #333; 
  text-align: left; /* Garante alinhamento à esquerda */
}

.toolbar { 
  display: flex; 
  gap: 6px; 
  background: #F5F5F7; 
  padding: 8px; 
  border-radius: 10px; 
  margin: 0 50px; 
  border: 1px solid #E5E5EA; 
}

.editor-btn { 
  width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; 
  border: 1px solid transparent; background: transparent; border-radius: 6px; cursor: pointer; 
}
.editor-btn:hover { background: white; border-color: #DDD; }

.btn { padding: 10px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; font-size: 13px; width: 100%; margin-top: 10px; }
.btn-primary { background: #0071E3; color: white; }
.btn-outline { background: white; border: 1px solid #E5E5EA; color: #666; margin-top: 20px; }

@media (max-width: 768px) {
  .sidebar { width: 100vw; height: auto; border-right: none; border-bottom: 1px solid #EEE; }
  .app-container { flex-direction: column; }
}
`;

interface Note {
  id: string;
  tab_name: string;
  title: string;
  content: string;
  updated_at?: string;
}

const encrypt = (text: string) =>
  CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
const decrypt = (ciphertext: string) => {
  if (!ciphertext) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8) || '';
  } catch (e) {
    return ciphertext;
  }
};

function AppNotas() {
  const [session, setSession] = useState<any>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeTab, setActiveTab] = useState<string>('Geral');
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [saveStatus, setSaveStatus] = useState<'salvo' | 'salvando' | 'erro'>(
    'salvo'
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => setSession(session));
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchNotes(session.user.id);
    });
  }, []);

  const fetchNotes = async (userId: string) => {
    const { data, error } = await supabase
      .from('clinical_notes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (!error && data) {
      const decrypted = data.map((n) => ({
        ...n,
        content: decrypt(n.content),
      }));
      setNotes(decrypted);
      if (decrypted.length > 0) setActiveNote(decrypted[0]);
    }
  };

  const handleContentChange = (content: string) => {
    if (!activeNote) return;
    const cleanContent = DOMPurify.sanitize(content);
    setActiveNote({ ...activeNote, content: cleanContent });
    setSaveStatus('salvando');

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      const { error } = await supabase
        .from('clinical_notes')
        .update({
          content: encrypt(cleanContent),
          updated_at: new Date().toISOString(),
        })
        .eq('id', activeNote.id);
      setSaveStatus(error ? 'erro' : 'salvo');
    }, 1000);
  };

  const createNote = async (tabName?: string) => {
    if (!session) return;
    const tabToUse = tabName || activeTab;
    const { data, error } = await supabase
      .from('clinical_notes')
      .insert([
        {
          user_id: session.user.id,
          tab_name: tabToUse,
          title: 'Nova Anotação',
          content: encrypt(''),
        },
      ])
      .select()
      .single();
    if (!error && data) {
      const newNote = { ...data, content: '' };
      setNotes([newNote, ...notes]);
      setActiveNote(newNote);
      if (tabName) setActiveTab(tabName);
    }
  };

  const tabs = Array.from(new Set(['Geral', ...notes.map((n) => n.tab_name)]));
  const filteredNotes =
    activeTab === 'Geral'
      ? notes
      : notes.filter((n) => n.tab_name === activeTab);

  if (!session) {
    return (
      <div
        style={{
          display: 'flex',
          height: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F5F5F7',
        }}
      >
        <style>{NOTAS_STYLES}</style>
        <div
          style={{
            background: 'white',
            padding: 40,
            borderRadius: 24,
            width: 350,
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          }}
        >
          <h2 style={{ color: '#0071E3', fontWeight: 800 }}>
            Amigo Congressista
          </h2>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await supabase.auth.signInWithPassword({ email, password });
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              marginTop: 20,
            }}
          >
            <input
              type="email"
              placeholder="E-mail"
              onChange={(e) => setEmail(e.target.value)}
              style={{ padding: 12, borderRadius: 8, border: '1px solid #DDD' }}
            />
            <input
              type="password"
              placeholder="Senha"
              onChange={(e) => setPassword(e.target.value)}
              style={{ padding: 12, borderRadius: 8, border: '1px solid #DDD' }}
            />
            <button type="submit" className="btn btn-primary">
              Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <style>{NOTAS_STYLES}</style>

      {/* SIDEBAR ESQUERDA */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <a href="#" className="brand-logo-text">
            Amigo Congressista
          </a>
          <button className="btn btn-primary" onClick={() => createNote()}>
            + Criar Nota
          </button>
          <button
            className="btn"
            style={{ background: '#EBEBEB', marginTop: 8 }}
            onClick={() => {
              const name = window.prompt('Nome da nova aba:');
              if (name) createNote(name);
            }}
          >
            + Nova Aba
          </button>
        </div>

        <div className="tabs-section">
          <div className="section-title">Minhas Abas</div>
          {tabs.map((tab) => (
            <div
              key={tab}
              className={`nav-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </div>
          ))}
        </div>

        <div className="notes-list-section">
          <div className="section-title">Notas em {activeTab}</div>
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className={`note-card ${
                activeNote?.id === note.id ? 'active' : ''
              }`}
              onClick={() => setActiveNote(note)}
            >
              <div
                style={{
                  fontWeight: 600,
                  fontSize: '14px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {note.title}
              </div>
              <div style={{ fontSize: '11px', color: '#888', marginTop: 4 }}>
                {new Date(note.updated_at || '').toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: 16 }}>
          <button
            className="btn btn-outline"
            onClick={() => supabase.auth.signOut()}
          >
            Sair
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL (EDITOR) */}
      <main className="main-content">
        {activeNote ? (
          <>
            <div className="editor-header">
              <div
                style={{
                  fontSize: 11,
                  color: saveStatus === 'salvando' ? 'orange' : '#10B981',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  marginBottom: 10,
                }}
              >
                {saveStatus === 'salvando'
                  ? '● Salvando...'
                  : '● Alterações Salvas'}
              </div>
              <input
                className="title-input"
                value={activeNote.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setActiveNote({ ...activeNote, title });
                  supabase
                    .from('clinical_notes')
                    .update({ title })
                    .eq('id', activeNote.id)
                    .then();
                }}
              />
            </div>

            <div className="toolbar">
              <button
                className="editor-btn"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => document.execCommand('bold')}
              >
                <b>B</b>
              </button>
              <button
                className="editor-btn"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => document.execCommand('italic')}
              >
                <i>I</i>
              </button>
              <button
                className="editor-btn"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => document.execCommand('underline')}
              >
                <u>U</u>
              </button>
              <button
                className="editor-btn"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() =>
                  document.execCommand('backColor', false, '#FEF08A')
                }
              >
                🖍️
              </button>
              <button
                className="editor-btn"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => document.execCommand('insertUnorderedList')}
              >
                • List
              </button>
            </div>

            <div
              className="editor-area"
              contentEditable
              suppressContentEditableWarning
              onInput={(e) => handleContentChange(e.currentTarget.innerHTML)}
              ref={(el) => {
                if (el && el.dataset.id !== activeNote.id) {
                  el.innerHTML = activeNote.content;
                  el.dataset.id = activeNote.id;
                }
              }}
            />
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#CCC',
            }}
          >
            Selecione uma nota na barra lateral
          </div>
        )}
      </main>
    </div>
  );
}

export default AppNotas;
