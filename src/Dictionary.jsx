import { useState, useEffect, useRef, useCallback } from 'react';
import DrawingSearch from './DrawingSearch';
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

function searchByHanzi(db, query, limit = 40) {
  return new Promise(resolve => {
    try {
      const tx    = db.transaction(STORE, 'readonly');
      const store = tx.objectStore(STORE);
      const out   = [];
      const index = store.index('hanzi');
      const req   = index.openCursor(IDBKeyRange.only(query));
      req.onsuccess = e => {
        const cursor = e.target.result;
        if (cursor) { out.push(cursor.value); resolve(out); return; }
        // Substring scan fallback
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

// ── HSK level table (HSK 1-6 standard word list — hanzi → level) ─────────────
// Covers HSK 1 (150 words) and HSK 2 (150 words). Words not listed = HSK 3+.
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
  // Rough HSK 3-6 heuristic by character count / complexity
  return null;
}

// ── English → Portuguese definition translation ───────────────────────────────
// Maps common English terms to Portuguese. Used to produce a PT gloss from
// the CC-CEDICT English definition without a translation API.
const EN_PT_TERMS = {
  'hello': 'olá', 'good morning': 'bom dia', 'good evening': 'boa noite',
  'goodbye': 'tchau', 'thank you': 'obrigado/a', 'please': 'por favor',
  'sorry': 'desculpe', 'excuse me': 'com licença',
  'yes': 'sim', 'no': 'não', 'ok': 'ok',
  'I': 'eu', 'you': 'você', 'he': 'ele', 'she': 'ela', 'we': 'nós', 'they': 'eles',
  'person': 'pessoa', 'people': 'pessoas', 'man': 'homem', 'woman': 'mulher',
  'child': 'criança', 'friend': 'amigo', 'teacher': 'professor', 'student': 'aluno',
  'family': 'família', 'father': 'pai', 'mother': 'mãe', 'son': 'filho',
  'daughter': 'filha', 'brother': 'irmão', 'sister': 'irmã',
  'good': 'bom', 'bad': 'mau', 'big': 'grande', 'small': 'pequeno',
  'old': 'velho', 'new': 'novo', 'hot': 'quente', 'cold': 'frio',
  'happy': 'feliz', 'sad': 'triste', 'beautiful': 'bonito', 'pretty': 'bonito',
  'fast': 'rápido', 'slow': 'devagar', 'near': 'perto', 'far': 'longe',
  'love': 'amor', 'like': 'gostar', 'want': 'querer', 'need': 'precisar',
  'eat': 'comer', 'drink': 'beber', 'see': 'ver', 'hear': 'ouvir',
  'speak': 'falar', 'say': 'dizer', 'go': 'ir', 'come': 'vir',
  'work': 'trabalhar', 'study': 'estudar', 'sleep': 'dormir', 'run': 'correr',
  'read': 'ler', 'write': 'escrever', 'buy': 'comprar', 'sell': 'vender',
  'give': 'dar', 'take': 'pegar', 'bring': 'trazer', 'use': 'usar',
  'water': 'água', 'food': 'comida', 'rice': 'arroz', 'bread': 'pão',
  'tea': 'chá', 'coffee': 'café', 'meat': 'carne', 'fish': 'peixe',
  'fruit': 'fruta', 'vegetable': 'vegetal', 'chicken': 'frango',
  'house': 'casa', 'room': 'quarto', 'school': 'escola', 'hospital': 'hospital',
  'hotel': 'hotel', 'restaurant': 'restaurante', 'shop': 'loja', 'store': 'loja',
  'China': 'China', 'Chinese': 'chinês', 'language': 'idioma', 'character': 'caractere',
  'book': 'livro', 'time': 'tempo', 'day': 'dia', 'year': 'ano', 'month': 'mês',
  'today': 'hoje', 'tomorrow': 'amanhã', 'yesterday': 'ontem',
  'morning': 'manhã', 'afternoon': 'tarde', 'evening': 'noite',
  'money': 'dinheiro', 'price': 'preço', 'number': 'número', 'name': 'nome',
  'question': 'pergunta', 'answer': 'resposta', 'problem': 'problema',
  'way': 'caminho', 'place': 'lugar', 'country': 'país', 'city': 'cidade',
  'north': 'norte', 'south': 'sul', 'east': 'leste', 'west': 'oeste',
  'not': 'não', 'also': 'também', 'very': 'muito', 'more': 'mais',
  'all': 'todo', 'some': 'alguns', 'this': 'este', 'that': 'aquele',
  'classif': 'classificador', 'surname': 'sobrenome', 'particle': 'partícula',
  'dialect': 'dialeto', 'abbr': 'abrev.', 'variant': 'variante',
};

function translateToPT(enDef) {
  if (!enDef) return null;
  const lower = enDef.toLowerCase();
  // Try multi-word matches first (longer phrases take priority)
  const sorted = Object.entries(EN_PT_TERMS).sort((a, b) => b[0].length - a[0].length);
  for (const [en, pt] of sorted) {
    if (lower.includes(en.toLowerCase())) return pt;
  }
  return null;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Dictionary() {
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [dbReady, setDbReady]   = useState(false);
  const [dbError, setDbError]   = useState(null);
  const [showDraw, setShowDraw] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState(null); // which entry shows stroke order
  const dbRef        = useRef(null);
  const searchGenRef = useRef(0);

  useEffect(() => {
    openDB()
      .then(db => { dbRef.current = db; setDbReady(true); })
      .catch(e => setDbError(e.message));
  }, []);

  const search = useCallback(async (q) => {
    q = q.trim();
    if (!q) { setResults([]); setExpandedIdx(null); return; }
    const gen = ++searchGenRef.current;
    setLoading(true);
    setExpandedIdx(null);

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
            Dicionário indisponível. Abra a aba Editor primeiro para carregar o banco de dados.
          </div>
        )}
      </div>

      <div className="dict-results">
        {loading && <div className="dict-loading">A pesquisar...</div>}
        {!loading && query && results.length === 0 && dbReady && (
          <div className="dict-empty">Nenhum resultado para "{query}"</div>
        )}
        {results.map((row, i) => {
          const hz    = row.hanzi;
          const py    = row.pinyinTone || row.pinyin;
          const enDef = row.definition || '';
          const ptDef = translateToPT(enDef);
          const hsk   = getHSKLevel(hz);
          const isExpanded = expandedIdx === i;

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
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span className="dict-py">{py}</span>
                  {hsk && <span className="dict-hsk-badge">HSK {hsk}</span>}
                </div>
                {ptDef && (
                  <div className="dict-def dict-def-pt">
                    <span className="dict-lang">PT</span>{ptDef}
                  </div>
                )}
                {enDef && (
                  <div className="dict-def dict-def-en">
                    <span className="dict-lang">EN</span>{enDef}
                  </div>
                )}
                {/* Stroke order toggle — only for single characters */}
                {hz.length === 1 && (
                  <div className="dict-stroke-wrap">
                    <button
                      className="dict-stroke-toggle"
                      onClick={() => setExpandedIdx(isExpanded ? null : i)}
                    >
                      {isExpanded ? '▲ Ocultar traços' : '▼ Ordem dos traços'}
                    </button>
                    {isExpanded && <StrokeOrder char={hz} size={140} />}
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
