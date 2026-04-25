import { useState, useEffect, useRef, useCallback } from 'react';
import DrawingSearch from './DrawingSearch';

// ── IndexedDB ─────────────────────────────────────────────────────────────────
const DB_NAME    = 'wordarin-cedict';
const DB_VERSION = 2;
const STORE      = 'entries';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (db.objectStoreNames.contains(STORE)) db.deleteObjectStore(STORE);
      const store = db.createObjectStore(STORE, { autoIncrement: true });
      store.createIndex('pinyin', 'pinyin', { unique: false });
      store.createIndex('hanzi',  'hanzi',  { unique: false });
    };
    req.onsuccess  = e => resolve(e.target.result);
    req.onerror    = e => reject(e.target.error);
  });
}

function norm(s) {
  return s.toLowerCase()
    .replace(/[āáǎà]/g, 'a').replace(/[ēéěè]/g, 'e')
    .replace(/[īíǐì]/g, 'i').replace(/[ōóǒò]/g, 'o')
    .replace(/[ūúǔù]/g, 'u').replace(/[ǘǘǚǜ]/g, 'v')
    .replace(/v/g, 'v').replace(/\s+/g, '');
}

function searchByPinyin(db, query, limit = 40) {
  return new Promise(resolve => {
    try {
      const tx    = db.transaction(STORE, 'readonly');
      const index = tx.objectStore(STORE).index('pinyin');
      const prefix = norm(query);
      const range  = IDBKeyRange.bound(prefix, prefix + '￿');
      const seen   = new Set();
      const out    = [];
      const req    = index.openCursor(range);
      req.onsuccess = e => {
        const cursor = e.target.result;
        if (!cursor || out.length >= limit) { resolve(out); return; }
        const entry = cursor.value;
        if (!seen.has(entry.hanzi)) { seen.add(entry.hanzi); out.push(entry); }
        cursor.continue();
      };
      req.onerror = () => resolve([]);
    } catch (_) { resolve([]); }
  });
}

function searchByHanzi(db, query, limit = 40) {
  return new Promise(resolve => {
    try {
      const tx    = db.transaction(STORE, 'readonly');
      const store = tx.objectStore(STORE);
      const out   = [];
      // Try exact index match first
      const index = store.index('hanzi');
      const req   = index.openCursor(IDBKeyRange.only(query));
      req.onsuccess = e => {
        const cursor = e.target.result;
        if (cursor) { out.push(cursor.value); resolve(out); return; }
        // Fall back to substring scan
        const scan = store.openCursor();
        scan.onsuccess = ev => {
          const c = ev.target.result;
          if (!c) { resolve(out); return; }
          if (out.length >= limit) { resolve(out); return; }
          if (c.value.hanzi && c.value.hanzi.includes(query)) out.push(c.value);
          c.continue();
        };
        scan.onerror = () => resolve(out);
      };
      req.onerror = () => resolve([]);
    } catch (_) { resolve([]); }
  });
}

const isHanzi = (s) => /[一-龥]/.test(s);

// ── Component ─────────────────────────────────────────────────────────────────
export default function Dictionary() {
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [dbReady, setDbReady]   = useState(false);
  const [dbError, setDbError]   = useState(null);
  const [showDraw, setShowDraw] = useState(false);
  const dbRef                   = useRef(null);
  const searchGenRef            = useRef(0);

  useEffect(() => {
    openDB()
      .then(db => { dbRef.current = db; setDbReady(true); })
      .catch(e => setDbError(e.message));
  }, []);

  const search = useCallback(async (q) => {
    q = q.trim();
    if (!q) { setResults([]); return; }
    const gen = ++searchGenRef.current;
    setLoading(true);

    let rows = [];
    if (dbRef.current) {
      if (isHanzi(q)) {
        rows = await searchByHanzi(dbRef.current, q, 40);
      } else {
        rows = await searchByPinyin(dbRef.current, q, 40);
      }
    }

    if (searchGenRef.current !== gen) return;
    setResults(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
  }, [query, search]);

  const speak = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN'; u.rate = 0.85;
    window.speechSynthesis.speak(u);
  };

  return (
    <div className="dict-page">
      <div className="dict-header">
        <h2 className="dict-title">Dicionário</h2>
        <p className="dict-subtitle">Pesquise por pinyin (ex: nihao) ou por hanzi (ex: 你好)</p>
        <div className="dict-search-row">
          <input
            className="dict-search"
            type="text"
            placeholder="Pinyin ou hanzi..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button className="dict-clear" onClick={() => setQuery('')}>×</button>
          )}
          <button
            className={`dict-draw-btn ${showDraw ? 'active' : ''}`}
            onClick={() => setShowDraw(d => !d)}
            title="Busca por desenho"
          >✏️</button>
        </div>
        {showDraw && (
          <DrawingSearch onResult={(char) => { setQuery(char); setShowDraw(false); }} />
        )}
        {!dbReady && !dbError && (
          <div className="dict-status">Conectando ao dicionário...</div>
        )}
        {dbError && (
          <div className="dict-status dict-status-err">
            Dicionário indisponível: {dbError}. Carregue a aba Editor primeiro para popular o banco de dados.
          </div>
        )}
      </div>

      <div className="dict-results">
        {loading && <div className="dict-loading">Pesquisando...</div>}
        {!loading && query && results.length === 0 && dbReady && (
          <div className="dict-empty">Nenhum resultado para "{query}"</div>
        )}
        {results.map((row, i) => {
          const hz  = row.hanzi;
          const py  = row.pinyinTone || row.pinyin;
          const def = row.definition || '';

          return (
            <div key={i} className="dict-entry">
              <div className="dict-entry-left">
                <span className="dict-hz">{hz}</span>
                <button
                  className="dict-speak-btn"
                  onClick={() => speak(hz)}
                  title="Ouvir pronúncia"
                >▶</button>
              </div>
              <div className="dict-entry-right">
                <div className="dict-py">{py}</div>
                {def && (
                  <div className="dict-def dict-def-en">
                    <span className="dict-lang">EN</span>
                    {def}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
