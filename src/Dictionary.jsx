import { useState, useEffect, useRef, useCallback } from 'react';
import DrawingSearch from './DrawingSearch';
import StrokeOrderSteps from './StrokeOrderSteps';
import StrokeOrder from './StrokeOrder';

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

function sortEntries(rows) {
  const isSurname = (def = '') =>
    /^surname |^\w+ \(surname\)|^variant of|^\(same as|^see /i.test(def);
  rows.sort((a, b) => (isSurname(a.definition) ? 1 : 0) - (isSurname(b.definition) ? 1 : 0));
}

function searchByHanzi(db, query, limit = 40) {
  return new Promise(resolve => {
    try {
      const tx    = db.transaction(STORE, 'readonly');
      const store = tx.objectStore(STORE);
      const out   = [];

      const req = store.index('hanzi').openCursor(IDBKeyRange.only(query));
      req.onsuccess = e => {
        const cursor = e.target.result;
        if (cursor && out.length < limit) {
          out.push(cursor.value);
          cursor.continue();
          return;
        }
        if (out.length > 0) { sortEntries(out); resolve(out); return; }

        // Fallback: substring scan
        const scan = store.openCursor();
        scan.onsuccess = ev => {
          const c = ev.target.result;
          if (!c) { sortEntries(out); resolve(out); return; }
          if (out.length >= limit) { sortEntries(out); resolve(out); return; }
          if (c.value.hanzi && c.value.hanzi.includes(query)) out.push(c.value);
          c.continue();
        };
        scan.onerror = () => resolve(out);
      };
      req.onerror = () => resolve([]);
    } catch (_) { resolve([]); }
  });
}

// Scan for words that contain `char` (but are not `char` itself)
function searchCompounds(db, char, limit = 15) {
  return new Promise(resolve => {
    try {
      const tx    = db.transaction(STORE, 'readonly');
      const store = tx.objectStore(STORE);
      const out   = [];
      const seen  = new Set();
      let scanned = 0;
      const SCAN_MAX = 60000;

      const req = store.openCursor();
      req.onsuccess = e => {
        const cursor = e.target.result;
        if (!cursor || out.length >= limit || scanned >= SCAN_MAX) {
          resolve(out);
          return;
        }
        scanned++;
        const entry = cursor.value;
        if (
          entry.hanzi &&
          entry.hanzi.length > 1 &&
          entry.hanzi.includes(char) &&
          !seen.has(entry.hanzi)
        ) {
          seen.add(entry.hanzi);
          // Skip pure surname/variant entries
          const def = entry.definition || '';
          if (!/^surname |^variant of|^\(same as/i.test(def)) {
            out.push(entry);
          }
        }
        cursor.continue();
      };
      req.onerror = () => resolve([]);
    } catch (_) { resolve([]); }
  });
}

const isHanzi = (s) => /[一-龥]/.test(s);

// ── HSK level table ───────────────────────────────────────────────────────────
const HSK1 = new Set([
  '爱','八','爸爸','杯子','北京','本','不','不客气','菜','茶','吃','出租车',
  '打电话','大','的','地图','点','电脑','电视','电影','东西','都','读','对不起',
  '多','多少','饿','二','饭店','飞机','分钟','高兴','个','工作','狗','汉语','好',
  '号','喝','和','很','后面','回','会','几','家','叫','今天','九','开','看','看见',
  '块','来','老师','了','冷','里','两','零','六','妈妈','吗','买','猫','没','没关系',
  '米饭','明天','名字','哪','那','呢','能','你','年','女儿','朋友','漂亮','苹果',
  '七','前面','钱','请','去','热','人','认识','三','商店','上','上午','谁','什么',
  '时候','是','书','水','水果','睡觉','说','四','岁','他','她','太','天气','听','同学',
  '我','我们','五','午饭','喜欢','下','下午','下雨','先生','现在','想','小','小姐',
  '谢谢','写','一','衣服','医生','医院','椅子','一下','一些','有','月','再见','在',
  '怎么','怎么样','这','中国','中午','住','桌子','字','昨天',
]);

const HSK2 = new Set([
  '吧','白','百','帮助','报纸','比','别','宾馆','长','唱歌','出','穿','次','从',
  '错','打','打篮球','大家','但是','到','得到','等','地方','弟弟','第一','东边','动物',
  '都','对','多么','跑步','房间','非常','分','附近','高','告诉','哥哥','给','公共汽车',
  '公司','故事','刮风','贵','规定','还','还是','孩子','好吃','号码','黑','红','花',
  '画','欢迎','换','黄','回答','机场','机会','鸡肉','件','教','结束','节日','介绍',
  '姐姐','今年','进','经常','旧','就','考试','可能','可以','课','空气','口','快',
  '快乐','离','练习','两','了解','路','旅游','卖','慢','忙','没有','每','妹妹','门',
  '面条','男','南','难','南边','牛奶','女','跑','旁边','胖','便宜','票','苹果',
  '瓶','平时','起床','起来','其实','千','前','情况','请客','去年','让','认为','日',
  '如果','山','上边','身体','生病','生日','时间','事情','手表','手机','树','双',
  '说话','送','所以','它','踢足球','题','跳舞','听说','外','完','晚上','往','为什么',
  '问','问题','西边','洗','希望','习惯','下边','先','向','小时','笑','新','兴趣',
  '行李箱','姓','需要','选择','学生','学习','颜色','眼睛','演出','要','也','已经',
  '一共','一样','音乐','因为','影响','用','游泳','右边','鱼','元','远','运动',
]);

function getHSKLevel(hanzi) {
  if (!hanzi) return null;
  if (HSK1.has(hanzi)) return 1;
  if (HSK2.has(hanzi)) return 2;
  return null;
}

// ── Translation helpers ───────────────────────────────────────────────────────
const ptCache = new Map();

async function translateToPT(enDef) {
  if (!enDef) return null;
  if (ptCache.has(enDef)) return ptCache.get(enDef);
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt-BR&dt=t&q=${encodeURIComponent(enDef)}`;
    const res  = await fetch(url);
    const data = await res.json();
    const pt   = data[0].map(x => x[0]).join('');
    ptCache.set(enDef, pt);
    return pt;
  } catch (_) { return null; }
}

async function ptQueryToZH(ptQuery) {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=pt&tl=zh-CN&dt=t&q=${encodeURIComponent(ptQuery)}`;
    const res  = await fetch(url);
    const data = await res.json();
    return data[0].map(x => x[0]).join('').trim();
  } catch (_) { return null; }
}

const isPortuguese = (s) => {
  if (!s || isHanzi(s)) return false;
  if (/[àáâãäçéêëíîïóôõöúûüÀÁÂÃÄÇÉÊËÍÎÏÓÔÕÖÚÛÜ]/.test(s)) return true;
  const lower = s.toLowerCase().trim();
  if (/m(\s|$)/.test(lower)) return true;
  if (/lh|nh/.test(lower)) return true;
  return false;
};

// ── CharPage sub-components ────────────────────────────────────────────────────

function ReadingRow({ row, isMain }) {
  const [pt, setPt] = useState(null);

  useEffect(() => {
    if (!row.definition) return;
    translateToPT(row.definition).then(setPt);
  }, [row.definition]);

  return (
    <div className={`charpage-reading${isMain ? ' charpage-reading-main' : ''}`}>
      <span className="charpage-reading-py">{row.pinyinTone || row.pinyin}</span>
      <span className="charpage-reading-def">
        {pt ?? <span className="charpage-loading-inline">...</span>}
      </span>
    </div>
  );
}

function CompoundRow({ row }) {
  const [pt, setPt] = useState(null);

  useEffect(() => {
    translateToPT(row.definition).then(setPt);
  }, [row.definition]);

  const speak = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(row.hanzi);
    u.lang = 'zh-CN'; u.rate = 0.85;
    window.speechSynthesis.speak(u);
  };

  return (
    <div className="charpage-compound-row">
      <span className="charpage-compound-hz">{row.hanzi}</span>
      <span className="charpage-compound-py">{row.pinyinTone || row.pinyin}</span>
      <span className="charpage-compound-def">{pt ?? '...'}</span>
      <button className="charpage-compound-speak" onClick={speak} title="Ouvir">▶</button>
    </div>
  );
}

// Jisho-inspired character detail page
function CharPage({ hanzi, db, onBack }) {
  const [readings, setReadings]               = useState([]);
  const [compounds, setCompounds]             = useState([]);
  const [compoundLoading, setCompoundLoading] = useState(true);

  const chars    = hanzi ? [...hanzi] : [];
  const isSingle = chars.length === 1;
  const hsk      = getHSKLevel(hanzi);

  useEffect(() => {
    if (!db || !hanzi) return;
    searchByHanzi(db, hanzi, 20).then(setReadings);
  }, [hanzi, db]);

  useEffect(() => {
    if (!db) { setCompoundLoading(false); return; }
    if (!isSingle) { setCompoundLoading(false); return; }
    setCompoundLoading(true);
    searchCompounds(db, hanzi, 15).then(rows => {
      setCompounds(rows);
      setCompoundLoading(false);
    });
  }, [hanzi, db, isSingle]);

  return (
    <div className="charpage">
      <button className="charpage-back" onClick={onBack}>← Resultados</button>

      {/* Hero: large char + animation + readings */}
      <div className="charpage-hero">
        <div className="charpage-hero-left">
          <div className="charpage-big-hz">{hanzi}</div>
          <StrokeOrder char={chars[0]} size={150} autoAnimate />
          {hsk && <span className="dict-hsk-badge charpage-hsk">HSK {hsk}</span>}
        </div>
        <div className="charpage-hero-right">
          {readings.length === 0 ? (
            <div className="charpage-loading-inline">A carregar leituras...</div>
          ) : (
            readings.map((r, i) => <ReadingRow key={i} row={r} isMain={i === 0} />)
          )}
        </div>
      </div>

      {/* Stroke order steps */}
      <div className="charpage-section">
        <h3 className="charpage-section-title">Ordem dos traços</h3>
        {isSingle ? (
          <StrokeOrderSteps char={hanzi} stepSize={72} />
        ) : (
          <div className="charpage-chars-strokes">
            {chars.map((ch, i) => (
              <div key={i} className="charpage-char-stroke-block">
                <span className="charpage-char-label">{ch}</span>
                <StrokeOrderSteps char={ch} stepSize={64} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Words containing this character */}
      {isSingle && (
        <div className="charpage-section">
          <h3 className="charpage-section-title">Palavras com {hanzi}</h3>
          {compoundLoading ? (
            <div className="charpage-loading-block">A pesquisar palavras...</div>
          ) : compounds.length === 0 ? (
            <div className="charpage-loading-block">Nenhuma palavra encontrada.</div>
          ) : (
            <div className="charpage-compounds">
              {compounds.map((c, i) => <CompoundRow key={i} row={c} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Per-character block inside expanded multi-char entry ──────────────────────
function CharDetail({ char, db }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!db || !char) return;
    let cancelled = false;
    searchByHanzi(db, char, 5).then(async rows => {
      if (cancelled) return;
      const row   = rows[0];
      const enDef = row?.definition || '';
      const py    = row?.pinyinTone || row?.pinyin || '';
      const pt    = enDef ? await translateToPT(enDef) : null;
      if (!cancelled) setData({ py, ptDef: pt });
    });
    return () => { cancelled = true; };
  }, [char, db]);

  return (
    <div className="dict-char-block">
      <div className="dict-char-block-info">
        <span className="dict-char-block-hz">{char}</span>
        <span className="dict-char-block-py">{data?.py ?? ''}</span>
        {data?.ptDef && <span className="dict-char-block-def">{data.ptDef}</span>}
      </div>
      <div className="dict-stroke-row">
        <StrokeOrder char={char} size={100} />
        <StrokeOrderSteps char={char} stepSize={58} />
      </div>
    </div>
  );
}

// ── Single dictionary result entry ────────────────────────────────────────────
function DictEntry({ row, isExpanded, onToggleExpand, db, onOpenChar }) {
  const [ptDef, setPtDef]         = useState(null);
  const [ptLoading, setPtLoading] = useState(false);

  const hz    = row.hanzi;
  const py    = row.pinyinTone || row.pinyin;
  const enDef = row.definition || '';
  const hsk   = getHSKLevel(hz);
  const chars = hz ? [...hz] : [];

  useEffect(() => {
    if (!enDef) return;
    if (ptCache.has(enDef)) { setPtDef(ptCache.get(enDef)); return; }
    let cancelled = false;
    setPtLoading(true);
    translateToPT(enDef).then(pt => {
      if (!cancelled) { setPtDef(pt); setPtLoading(false); }
    });
    return () => { cancelled = true; };
  }, [enDef]);

  const speak = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(hz);
    u.lang = 'zh-CN'; u.rate = 0.85;
    window.speechSynthesis.speak(u);
  };

  return (
    <div className="dict-entry">
      <div className="dict-entry-left">
        <button
          className="dict-hz dict-hz-btn"
          onClick={() => onOpenChar(hz)}
          title="Ver detalhes do caractere"
        >
          {hz}
        </button>
        <button className="dict-speak-btn" onClick={speak} title="Ouvir pronúncia">▶</button>
      </div>
      <div className="dict-entry-right">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span className="dict-py">{py}</span>
          {hsk && <span className="dict-hsk-badge">HSK {hsk}</span>}
        </div>
        {(ptDef || ptLoading) && (
          <div className="dict-def dict-def-pt">
            <span className="dict-lang">PT</span>
            {ptLoading
              ? <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>...</span>
              : ptDef}
          </div>
        )}
        <div className="dict-stroke-wrap">
          <button className="dict-stroke-toggle" onClick={onToggleExpand}>
            {isExpanded ? '▲ Ocultar traços' : '▼ Ordem dos traços'}
          </button>
          {isExpanded && (
            <div className="dict-stroke-expanded">
              {chars.length === 1 ? (
                <div className="dict-stroke-row">
                  <StrokeOrder char={hz} size={120} />
                  <StrokeOrderSteps char={hz} stepSize={68} />
                </div>
              ) : (
                <div className="dict-chars-list">
                  {chars.map((ch, i) => (
                    <CharDetail key={i} char={ch} db={db} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function Dictionary() {
  const [query, setQuery]               = useState('');
  const [results, setResults]           = useState([]);
  const [loading, setLoading]           = useState(false);
  const [dbReady, setDbReady]           = useState(false);
  const [dbError, setDbError]           = useState(null);
  const [showDraw, setShowDraw]         = useState(false);
  const [expandedIdx, setExpandedIdx]   = useState(null);
  const [selectedChar, setSelectedChar] = useState(null);
  // 'auto' | 'pt' | 'pinyin'
  const [searchMode, setSearchMode]     = useState('auto');

  const dbRef        = useRef(null);
  const searchGenRef = useRef(0);

  useEffect(() => {
    openDB()
      .then(db => { dbRef.current = db; setDbReady(true); })
      .catch(e => setDbError(e.message));
  }, []);

  const search = useCallback(async (q) => {
    q = q.trim();
    setSelectedChar(null);
    if (!q) { setResults([]); setExpandedIdx(null); return; }
    const gen = ++searchGenRef.current;
    setLoading(true);
    setExpandedIdx(null);

    let rows = [];
    if (dbRef.current) {
      if (isHanzi(q)) {
        rows = await searchByHanzi(dbRef.current, q, 40);
      } else if (searchMode === 'pt' || (searchMode === 'auto' && isPortuguese(q))) {
        const zh = await ptQueryToZH(q);
        if (searchGenRef.current !== gen) return;
        if (zh && isHanzi(zh)) {
          rows = await searchByHanzi(dbRef.current, zh, 40);
        } else if (zh) {
          rows = await searchByPinyin(dbRef.current, zh, 40);
        }
      } else {
        rows = await searchByPinyin(dbRef.current, q, 40);
      }
    }

    if (searchGenRef.current !== gen) return;
    setResults(rows);
    setLoading(false);
  }, [searchMode]);

  useEffect(() => {
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
  }, [query, search]);

  const toggleMode = (mode) =>
    setSearchMode(cur => cur === mode ? 'auto' : mode);

  return (
    <div className="dict-page">
      <div className="dict-header">
        <h2 className="dict-title">Dicionário</h2>
        <p className="dict-subtitle">Pesquise por pinyin, hanzi ou português</p>

        <div className="dict-search-row">
          <input
            className="dict-search"
            type="text"
            placeholder="Pinyin, hanzi ou português..."
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

        {/* Explicit search mode selector */}
        <div className="dict-mode-row">
          <span className="dict-mode-label">Buscar por:</span>
          <button
            className={`dict-mode-btn ${searchMode === 'pt' ? 'active' : ''}`}
            onClick={() => toggleMode('pt')}
          >
            🇧🇷 Português
          </button>
          <button
            className={`dict-mode-btn ${searchMode === 'pinyin' ? 'active' : ''}`}
            onClick={() => toggleMode('pinyin')}
          >
            拼 Pinyin / Hanzi
          </button>
          {searchMode !== 'auto' && (
            <button className="dict-mode-reset" onClick={() => setSearchMode('auto')}>
              Auto
            </button>
          )}
        </div>

        {showDraw && (
          <DrawingSearch onResult={(char) => { setQuery(char); setShowDraw(false); }} />
        )}

        {!dbReady && !dbError && (
          <div className="dict-status">Conectando ao dicionário...</div>
        )}
        {dbError && (
          <div className="dict-status dict-status-err">
            Dicionário indisponível. Abra a aba Editor primeiro para carregar o banco de dados.
          </div>
        )}
      </div>

      {selectedChar ? (
        <CharPage
          hanzi={selectedChar}
          db={dbRef.current}
          onBack={() => setSelectedChar(null)}
        />
      ) : (
        <div className="dict-results">
          {loading && <div className="dict-loading">A pesquisar...</div>}
          {!loading && query && results.length === 0 && dbReady && (
            <div className="dict-empty">Nenhum resultado para "{query}"</div>
          )}
          {results.map((row, i) => (
            <DictEntry
              key={`${row.hanzi}-${i}`}
              row={row}
              isExpanded={expandedIdx === i}
              onToggleExpand={() => setExpandedIdx(expandedIdx === i ? null : i)}
              db={dbRef.current}
              onOpenChar={(hz) => setSelectedChar(hz)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
