import { useState, useCallback, useEffect, useMemo } from 'react';
import { pinyin as getPinyin } from 'pinyin-pro';
import FillBlanks from './FillBlanks';

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────

const VOCAB = [
  { hanzi: '你好', pinyin: 'nǐ hǎo',     pt: 'Olá',                    level: 'beginner' },
  { hanzi: '谢谢', pinyin: 'xiè xie',    pt: 'Obrigado',               level: 'beginner' },
  { hanzi: '再见', pinyin: 'zài jiàn',   pt: 'Tchau',                  level: 'beginner' },
  { hanzi: '我',   pinyin: 'wǒ',         pt: 'Eu',                     level: 'beginner' },
  { hanzi: '你',   pinyin: 'nǐ',         pt: 'Você',                   level: 'beginner' },
  { hanzi: '他',   pinyin: 'tā',         pt: 'Ele',                    level: 'beginner' },
  { hanzi: '她',   pinyin: 'tā',         pt: 'Ela',                    level: 'beginner' },
  { hanzi: '是',   pinyin: 'shì',        pt: 'Ser / estar',            level: 'beginner' },
  { hanzi: '不',   pinyin: 'bù',         pt: 'Não',                    level: 'beginner' },
  { hanzi: '好',   pinyin: 'hǎo',        pt: 'Bom / bem',              level: 'beginner' },
  { hanzi: '大',   pinyin: 'dà',         pt: 'Grande',                 level: 'beginner' },
  { hanzi: '小',   pinyin: 'xiǎo',       pt: 'Pequeno',                level: 'beginner' },
  { hanzi: '人',   pinyin: 'rén',        pt: 'Pessoa',                 level: 'beginner' },
  { hanzi: '中国', pinyin: 'zhōng guó',  pt: 'China',                  level: 'beginner' },
  { hanzi: '学习', pinyin: 'xué xí',     pt: 'Estudar',                level: 'intermediate' },
  { hanzi: '吃饭', pinyin: 'chī fàn',    pt: 'Comer (refeição)',        level: 'intermediate' },
  { hanzi: '朋友', pinyin: 'péng yǒu',   pt: 'Amigo',                  level: 'beginner' },
  { hanzi: '老师', pinyin: 'lǎo shī',    pt: 'Professor',              level: 'beginner' },
  { hanzi: '学生', pinyin: 'xué shēng',  pt: 'Aluno',                  level: 'beginner' },
  { hanzi: '水',   pinyin: 'shuǐ',       pt: 'Água',                   level: 'beginner' },
  { hanzi: '书',   pinyin: 'shū',        pt: 'Livro',                  level: 'beginner' },
  { hanzi: '家',   pinyin: 'jiā',        pt: 'Casa / família',         level: 'beginner' },
  { hanzi: '工作', pinyin: 'gōng zuò',   pt: 'Trabalhar / trabalho',   level: 'intermediate' },
  { hanzi: '今天', pinyin: 'jīn tiān',   pt: 'Hoje',                   level: 'beginner' },
  { hanzi: '明天', pinyin: 'míng tiān',  pt: 'Amanhã',                 level: 'beginner' },
  { hanzi: '什么', pinyin: 'shén me',    pt: 'O quê',                  level: 'beginner' },
  { hanzi: '哪里', pinyin: 'nǎ lǐ',      pt: 'Onde',                   level: 'beginner' },
  { hanzi: '多少', pinyin: 'duō shǎo',   pt: 'Quanto',                 level: 'intermediate' },
  { hanzi: '喜欢', pinyin: 'xǐ huān',    pt: 'Gostar',                 level: 'intermediate' },
  { hanzi: '爱',   pinyin: 'ài',         pt: 'Amor / amar',            level: 'beginner' },
  { hanzi: '吃',   pinyin: 'chī',        pt: 'Comer',                  level: 'beginner' },
  { hanzi: '喝',   pinyin: 'hē',         pt: 'Beber',                  level: 'beginner' },
  { hanzi: '看',   pinyin: 'kàn',        pt: 'Ver / olhar',            level: 'beginner' },
  { hanzi: '说',   pinyin: 'shuō',       pt: 'Falar / dizer',          level: 'beginner' },
  { hanzi: '去',   pinyin: 'qù',         pt: 'Ir',                     level: 'beginner' },
  { hanzi: '来',   pinyin: 'lái',        pt: 'Vir',                    level: 'beginner' },
  { hanzi: '有',   pinyin: 'yǒu',        pt: 'Ter / haver',            level: 'beginner' },
  { hanzi: '没有', pinyin: 'méi yǒu',    pt: 'Não ter / não haver',    level: 'beginner' },
  { hanzi: '可以', pinyin: 'kě yǐ',      pt: 'Poder / pode',           level: 'intermediate' },
  { hanzi: '知道', pinyin: 'zhī dào',    pt: 'Saber',                  level: 'intermediate' },
];

const TONES = [
  { char: '妈', tone: 1, meaning: 'mãe',      pinyin: 'mā' },
  { char: '麻', tone: 2, meaning: 'cânhamo',  pinyin: 'má' },
  { char: '马', tone: 3, meaning: 'cavalo',   pinyin: 'mǎ' },
  { char: '骂', tone: 4, meaning: 'xingar',   pinyin: 'mà' },
  { char: '书', tone: 1, meaning: 'livro',    pinyin: 'shū' },
  { char: '熟', tone: 2, meaning: 'cozido',   pinyin: 'shú' },
  { char: '鼠', tone: 3, meaning: 'rato',     pinyin: 'shǔ' },
  { char: '树', tone: 4, meaning: 'árvore',   pinyin: 'shù' },
  { char: '鸡', tone: 1, meaning: 'galinha',  pinyin: 'jī'  },
  { char: '及', tone: 2, meaning: 'atingir',  pinyin: 'jí'  },
  { char: '己', tone: 3, meaning: 'si mesmo', pinyin: 'jǐ'  },
  { char: '记', tone: 4, meaning: 'lembrar',  pinyin: 'jì'  },
  { char: '天', tone: 1, meaning: 'céu / dia',pinyin: 'tiān'},
  { char: '田', tone: 2, meaning: 'campo',    pinyin: 'tián'},
  { char: '舔', tone: 3, meaning: 'lamber',   pinyin: 'tiǎn'},
  { char: '填', tone: 4, meaning: 'preencher',pinyin: 'tiàn'},
];

const SENTENCES = [
  { zh: '你好！',                    py: 'Nǐ hǎo!',                               pt: 'Olá!',                                     level: 'beginner'     },
  { zh: '谢谢你。',                  py: 'Xièxiè nǐ.',                             pt: 'Obrigado por você.',                        level: 'beginner'     },
  { zh: '再见！',                    py: 'Zàijiàn!',                               pt: 'Tchau!',                                   level: 'beginner'     },
  { zh: '我是巴西人。',              py: 'Wǒ shì Bāxī rén.',                       pt: 'Eu sou brasileiro.',                        level: 'beginner'     },
  { zh: '我叫李明。',                py: 'Wǒ jiào Lǐ Míng.',                       pt: 'Meu nome é Li Ming.',                       level: 'beginner'     },
  { zh: '你叫什么名字？',            py: 'Nǐ jiào shénme míngzì?',                 pt: 'Qual é o seu nome?',                        level: 'beginner'     },
  { zh: '我很好，谢谢。',            py: 'Wǒ hěn hǎo, xièxiè.',                   pt: 'Estou bem, obrigado.',                      level: 'beginner'     },
  { zh: '你好吗？',                  py: 'Nǐ hǎo ma?',                             pt: 'Como vai você?',                            level: 'beginner'     },
  { zh: '他是我的朋友。',            py: 'Tā shì wǒ de péngyǒu.',                  pt: 'Ele é meu amigo.',                          level: 'beginner'     },
  { zh: '我不懂中文。',              py: 'Wǒ bù dǒng Zhōngwén.',                   pt: 'Eu não entendo mandarim.',                  level: 'beginner'     },
  { zh: '今天天气很好。',            py: 'Jīntiān tiānqì hěn hǎo.',                pt: 'O tempo está ótimo hoje.',                  level: 'intermediate' },
  { zh: '我在学习中文。',            py: 'Wǒ zài xuéxí Zhōngwén.',                 pt: 'Estou estudando mandarim.',                 level: 'intermediate' },
  { zh: '你住在哪里？',              py: 'Nǐ zhù zài nǎlǐ?',                       pt: 'Onde você mora?',                           level: 'intermediate' },
  { zh: '我喜欢吃中国菜。',          py: 'Wǒ xǐhuān chī Zhōngguó cài.',            pt: 'Eu gosto de comida chinesa.',               level: 'intermediate' },
  { zh: '这个多少钱？',              py: 'Zhège duōshǎo qián?',                    pt: 'Quanto custa isso?',                        level: 'intermediate' },
  { zh: '请再说一遍。',              py: 'Qǐng zài shuō yī biàn.',                 pt: 'Por favor, repita.',                        level: 'intermediate' },
  { zh: '你会说英语吗？',            py: 'Nǐ huì shuō Yīngyǔ ma?',                 pt: 'Você fala inglês?',                         level: 'intermediate' },
  { zh: '我喜欢学习中文。',          py: 'Wǒ xǐhuān xuéxí Zhōngwén.',              pt: 'Eu gosto de estudar mandarim.',             level: 'intermediate' },
  { zh: '请问，厕所在哪里？',        py: 'Qǐngwèn, cèsuǒ zài nǎlǐ?',              pt: 'Com licença, onde fica o banheiro?',        level: 'intermediate' },
  { zh: '我想喝一杯水。',            py: 'Wǒ xiǎng hē yī bēi shuǐ.',              pt: 'Eu quero beber um copo de água.',           level: 'intermediate' },
  { zh: '你今天有课吗？',            py: 'Nǐ jīntiān yǒu kè ma?',                  pt: 'Você tem aula hoje?',                       level: 'intermediate' },
  { zh: '我每天学两个小时中文。',    py: 'Wǒ měitiān xué liǎng gè xiǎoshí Zhōngwén.', pt: 'Estudo mandarim duas horas por dia.',   level: 'advanced'     },
  { zh: '我学中文已经一年了。',      py: 'Wǒ xué Zhōngwén yǐjīng yī nián le.',    pt: 'Já estudo mandarim há um ano.',             level: 'advanced'     },
  { zh: '虽然很难，但是我不放弃。',  py: 'Suīrán hěn nán, dànshì wǒ bù fàngqì.',  pt: 'Embora seja difícil, não desisto.',         level: 'advanced'     },
  { zh: '如果你练习，你会进步的。',  py: 'Rúguǒ nǐ liànxí, nǐ huì jìnbù de.',    pt: 'Se você praticar, vai melhorar.',           level: 'advanced'     },
];

const FILL_BLANKS = [
  { before: '我',   blank: '爱',   after: '你。',          py_blank: 'ài',      options: ['爱','是','有','不'],      pt: 'Eu ___ você.' },
  { before: '今天天气很', blank: '好', after: '。',         py_blank: 'hǎo',     options: ['好','坏','热','冷'],      pt: 'O tempo hoje está muito ___.' },
  { before: '我',   blank: '喜欢', after: '学习中文。',     py_blank: 'xǐhuān',  options: ['喜欢','不喜欢','知道','想要'], pt: 'Eu ___ estudar mandarim.' },
  { before: '他',   blank: '是',   after: '我的朋友。',     py_blank: 'shì',     options: ['是','有','在','叫'],      pt: 'Ele ___ meu amigo.' },
  { before: '这个', blank: '多少', after: '钱？',           py_blank: 'duōshǎo', options: ['多少','什么','哪里','几个'], pt: 'Quanto ___ custa isso?' },
  { before: '我不', blank: '懂',   after: '中文。',         py_blank: 'dǒng',    options: ['懂','说','写','读'],      pt: 'Eu não ___ mandarim.' },
  { before: '你叫什么', blank: '名字', after: '？',         py_blank: 'míngzì',  options: ['名字','事情','问题','时间'], pt: 'Qual é o seu ___?' },
  { before: '我想', blank: '喝',   after: '一杯水。',        py_blank: 'hē',      options: ['喝','吃','买','要'],      pt: 'Eu quero ___ um copo de água.' },
  { before: '请再说', blank: '一遍', after: '。',           py_blank: 'yībiàn',  options: ['一遍','一下','一次','两遍'], pt: 'Por favor diga ___.' },
  { before: '我每天', blank: '学习', after: '中文。',        py_blank: 'xuéxí',   options: ['学习','喜欢','知道','工作'], pt: 'Eu ___ mandarim todo dia.' },
  { before: '你',   blank: '有',   after: '没有朋友？',      py_blank: 'yǒu',     options: ['有','是','在','叫'],      pt: 'Você ___ amigos?' },
  { before: '我们', blank: '去',   after: '学校吧。',        py_blank: 'qù',      options: ['去','来','在','回'],      pt: 'Vamos ___ para a escola.' },
];

const WORD_ORDER = [
  { words: ['我','喜欢','学习','中文'],     correct: '我喜欢学习中文',       pt: 'Eu gosto de estudar mandarim'     },
  { words: ['今天','天气','很','好'],       correct: '今天天气很好',         pt: 'O tempo está ótimo hoje'          },
  { words: ['他','是','我的','朋友'],       correct: '他是我的朋友',         pt: 'Ele é meu amigo'                  },
  { words: ['你','叫','什么','名字','？'],  correct: '你叫什么名字？',        pt: 'Qual é o seu nome?'               },
  { words: ['这个','多少','钱','？'],       correct: '这个多少钱？',          pt: 'Quanto custa isso?'               },
  { words: ['我','喜欢','吃','中国菜'],     correct: '我喜欢吃中国菜',       pt: 'Eu gosto de comida chinesa'       },
  { words: ['你','住在','哪里','？'],       correct: '你住在哪里？',          pt: 'Onde você mora?'                  },
  { words: ['我','想','喝','水'],           correct: '我想喝水',             pt: 'Eu quero beber água'              },
  { words: ['请','再','说','一遍'],         correct: '请再说一遍',           pt: 'Por favor repita'                 },
  { words: ['你','好','吗','？'],           correct: '你好吗？',              pt: 'Como vai você?'                   },
  { words: ['我','不','懂','中文'],         correct: '我不懂中文',           pt: 'Eu não entendo mandarim'          },
  { words: ['今天','你','有','课','吗','？'], correct: '今天你有课吗？',      pt: 'Você tem aula hoje?'              },
];

// ─────────────────────────────────────────────────────────────────────────────
// TYPE REGISTRY
// ─────────────────────────────────────────────────────────────────────────────

const ALL_TYPES = [
  { id: 'hz2py',       label: 'Hanzi → Pinyin',          category: 'vocab',    desc: 'Dado o caractere, identifique o pinyin'       },
  { id: 'py2hz',       label: 'Pinyin → Hanzi',           category: 'vocab',    desc: 'Dado o pinyin, identifique o caractere'       },
  { id: 'hz2pt',       label: 'Significado',              category: 'vocab',    desc: 'Dado o caractere, identifique o significado'  },
  { id: 'pt2hz',       label: 'Português → Hanzi',        category: 'vocab',    desc: 'Dado o significado, identifique o caractere'  },
  { id: 'tone',        label: 'Tons',                     category: 'vocab',    desc: 'Identifique o tom do caractere'               },
  { id: 'sent-zh2pt',  label: 'Frase: Chinês → Port.',    category: 'sentence', desc: 'Dada a frase em chinês, escolha a tradução'   },
  { id: 'sent-pt2zh',  label: 'Frase: Port. → Chinês',    category: 'sentence', desc: 'Dada a frase em português, escolha o chinês'  },
  { id: 'sent-fill',   label: 'Completar a frase',        category: 'sentence', desc: 'Escolha a palavra que completa a frase'       },
  { id: 'sent-order',  label: 'Ordenar palavras',         category: 'sentence', desc: 'Coloque as palavras na ordem correta'         },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function pick(arr, n = 1) { return shuffle(arr).slice(0, n); }
function pickOne(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function distractors(correct, pool, n = 3, key) {
  return pick(pool.filter(x => (key ? x[key] : x) !== (key ? correct[key] : correct)), n);
}

function filterByLevel(arr, level) {
  if (level === 'all') return arr;
  if (level === 'beginner') return arr.filter(x => x.level === 'beginner');
  if (level === 'advanced') return arr.filter(x => x.level !== 'beginner');
  return arr;
}

const STORAGE_KEY = 'wordarin-ex-config';

function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_CONFIG, ...parsed, enabledTypes: new Set(parsed.enabledTypes || DEFAULT_CONFIG.enabledTypes) };
    }
  } catch (_) {}
  return { ...DEFAULT_CONFIG, enabledTypes: new Set(DEFAULT_CONFIG.enabledTypes) };
}

const DEFAULT_CONFIG = {
  enabledTypes:    ['hz2py','py2hz','hz2pt','sent-zh2pt','sent-fill','sent-order'],
  sessionLength:   10,
  difficulty:      'all',
  showPinyinHint:  false,
};

// Build a randomised queue of { type, item } for a session
function buildQueue(config) {
  const types = ALL_TYPES.filter(t => config.enabledTypes.has(t.id));
  if (!types.length) return [];
  const vocab = filterByLevel(VOCAB, config.difficulty);
  const sents = filterByLevel(SENTENCES, config.difficulty);
  const fills = FILL_BLANKS;
  const words = WORD_ORDER;

  const pool = [];
  for (const t of types) {
    if (t.category === 'vocab') {
      const src = t.id === 'tone' ? TONES : vocab;
      src.forEach(item => pool.push({ type: t.id, item }));
    } else if (t.id === 'sent-zh2pt' || t.id === 'sent-pt2zh') {
      sents.forEach(item => pool.push({ type: t.id, item }));
    } else if (t.id === 'sent-fill') {
      fills.forEach(item => pool.push({ type: t.id, item }));
    } else if (t.id === 'sent-order') {
      words.forEach(item => pool.push({ type: t.id, item }));
    }
  }

  const len = config.sessionLength === 0 ? pool.length : config.sessionLength;
  return shuffle(pool).slice(0, len);
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED UI PIECES
// ─────────────────────────────────────────────────────────────────────────────

function ResultBar({ correct, feedback, onNext }) {
  return (
    <div className={`ex-result ${correct ? 'correct' : 'wrong'}`}>
      <span className="ex-result-icon">{correct ? '✓' : '✗'}</span>
      <span className="ex-result-text">{feedback}</span>
      <button className="ex-next-btn" onClick={() => onNext()}>Próximo →</button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VOCAB EXERCISES
// ─────────────────────────────────────────────────────────────────────────────

function HanziToPinyin({ items, showHint, onDone }) {
  const item = useMemo(() => pickOne(items), []);
  const choices = useMemo(() => shuffle([item.pinyin, ...distractors(item, items, 3, 'pinyin').map(x => x.pinyin)]), []);
  const [sel, setSel] = useState(null);
  const choose = v => { if (sel) return; setSel(v); onDone(v === item.pinyin); };
  return (
    <div className="ex-card">
      <div className="ex-prompt-label">Qual é o pinyin?</div>
      <div className="ex-hanzi-big">{item.hanzi}</div>
      {showHint && <div className="ex-hint ex-pinyin-hint">{item.pinyin}</div>}
      <div className="ex-hint">{item.pt}</div>
      <div className="ex-choices">
        {choices.map(c => (
          <button key={c} className={choiceCls(sel, c, item.pinyin)} onClick={() => choose(c)}>{c}</button>
        ))}
      </div>
      {sel && <ResultBar correct={sel === item.pinyin} feedback={sel === item.pinyin ? 'Correto!' : `Correto: ${item.pinyin}`} onNext={onDone} />}
    </div>
  );
}

function PinyinToHanzi({ items, showHint, onDone }) {
  const item = useMemo(() => pickOne(items), []);
  const choices = useMemo(() => shuffle([item.hanzi, ...distractors(item, items, 3, 'hanzi').map(x => x.hanzi)]), []);
  const [sel, setSel] = useState(null);
  const choose = v => { if (sel) return; setSel(v); onDone(v === item.hanzi); };
  return (
    <div className="ex-card">
      <div className="ex-prompt-label">Qual é o caractere?</div>
      <div className="ex-pinyin-big">{item.pinyin}</div>
      <div className="ex-hint">{item.pt}</div>
      <div className="ex-choices">
        {choices.map(c => (
          <button key={c} className={`${choiceCls(sel, c, item.hanzi)} ex-choice-hz`} onClick={() => choose(c)}>{c}</button>
        ))}
      </div>
      {sel && <ResultBar correct={sel === item.hanzi} feedback={sel === item.hanzi ? 'Correto!' : `Correto: ${item.hanzi} (${item.pinyin})`} onNext={onDone} />}
    </div>
  );
}

function HanziMeaning({ items, showHint, onDone }) {
  const item = useMemo(() => pickOne(items), []);
  const choices = useMemo(() => shuffle([item.pt, ...distractors(item, items, 3, 'pt').map(x => x.pt)]), []);
  const [sel, setSel] = useState(null);
  const choose = v => { if (sel) return; setSel(v); onDone(v === item.pt); };
  return (
    <div className="ex-card">
      <div className="ex-prompt-label">O que significa?</div>
      <div className="ex-hanzi-big">{item.hanzi}</div>
      {showHint && <div className="ex-hint ex-pinyin-hint">{item.pinyin}</div>}
      <div className="ex-choices ex-choices-text">
        {choices.map(c => (
          <button key={c} className={`${choiceCls(sel, c, item.pt)} ex-choice-text`} onClick={() => choose(c)}>{c}</button>
        ))}
      </div>
      {sel && <ResultBar correct={sel === item.pt} feedback={sel === item.pt ? 'Correto!' : `${item.hanzi} = ${item.pt}`} onNext={onDone} />}
    </div>
  );
}

function PtToHanzi({ items, showHint, onDone }) {
  const item = useMemo(() => pickOne(items), []);
  const choices = useMemo(() => shuffle([item.hanzi, ...distractors(item, items, 3, 'hanzi').map(x => x.hanzi)]), []);
  const [sel, setSel] = useState(null);
  const choose = v => { if (sel) return; setSel(v); onDone(v === item.hanzi); };
  return (
    <div className="ex-card">
      <div className="ex-prompt-label">Qual é o caractere?</div>
      <div className="ex-pt-big">{item.pt}</div>
      {showHint && <div className="ex-hint ex-pinyin-hint">{item.pinyin}</div>}
      <div className="ex-choices">
        {choices.map(c => (
          <button key={c} className={`${choiceCls(sel, c, item.hanzi)} ex-choice-hz`} onClick={() => choose(c)}>{c}</button>
        ))}
      </div>
      {sel && <ResultBar correct={sel === item.hanzi} feedback={sel === item.hanzi ? 'Correto!' : `${item.pt} = ${item.hanzi} (${item.pinyin})`} onNext={onDone} />}
    </div>
  );
}

function ToneExercise({ onDone }) {
  const item = useMemo(() => pickOne(TONES), []);
  const [sel, setSel] = useState(null);
  const marks = ['ˉ (mā)', 'ˊ (má)', 'ˇ (mǎ)', 'ˋ (mà)'];
  const choose = t => { if (sel) return; setSel(t); onDone(t === item.tone); };
  return (
    <div className="ex-card">
      <div className="ex-prompt-label">Qual é o tom?</div>
      <div className="ex-hanzi-big">{item.char}</div>
      <div className="ex-hint">"{item.meaning}" — {item.pinyin}</div>
      <div className="ex-choices ex-choices-tones">
        {[1,2,3,4].map(t => (
          <button key={t} className={choiceCls(sel, t, item.tone)} onClick={() => choose(t)}>
            <span className="ex-tone-num">{t}º</span>
            <span className="ex-tone-mark">{marks[t-1]}</span>
          </button>
        ))}
      </div>
      {sel && <ResultBar correct={sel === item.tone} feedback={sel === item.tone ? `Correto! Tom ${item.tone}: ${item.pinyin}` : `${item.tone}º tom: ${item.pinyin} (${item.meaning})`} onNext={onDone} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SENTENCE EXERCISES
// ─────────────────────────────────────────────────────────────────────────────

function SentZhToPt({ items, showHint, onDone }) {
  const item = useMemo(() => pickOne(items), []);
  const choices = useMemo(() => shuffle([item.pt, ...distractors(item, items, 3, 'pt').map(x => x.pt)]), []);
  const [sel, setSel] = useState(null);
  const choose = v => { if (sel) return; setSel(v); onDone(v === item.pt); };
  return (
    <div className="ex-card ex-card-wide">
      <div className="ex-prompt-label">O que significa esta frase?</div>
      <div className="ex-sentence-zh">{item.zh}</div>
      {showHint && <div className="ex-hint ex-pinyin-hint">{item.py}</div>}
      <div className="ex-choices ex-choices-text ex-choices-full">
        {choices.map(c => (
          <button key={c} className={`${choiceCls(sel, c, item.pt)} ex-choice-text`} onClick={() => choose(c)}>{c}</button>
        ))}
      </div>
      {sel && <ResultBar correct={sel === item.pt} feedback={sel === item.pt ? 'Correto!' : `Correto: "${item.pt}"`} onNext={onDone} />}
    </div>
  );
}

function SentPtToZh({ items, showHint, onDone }) {
  const item = useMemo(() => pickOne(items), []);
  const choices = useMemo(() => shuffle([item.zh, ...distractors(item, items, 3, 'zh').map(x => x.zh)]), []);
  const [sel, setSel] = useState(null);
  const choose = v => { if (sel) return; setSel(v); onDone(v === item.zh); };
  return (
    <div className="ex-card ex-card-wide">
      <div className="ex-prompt-label">Como se diz em mandarim?</div>
      <div className="ex-sentence-pt">{item.pt}</div>
      <div className="ex-choices ex-choices-text ex-choices-full">
        {choices.map(c => (
          <button key={c} className={`${choiceCls(sel, c, item.zh)} ex-choice-text`} onClick={() => choose(c)}>
            <span>{c}</span>
            {showHint && <span className="ex-choice-py">{getPinyin(c, { type: 'string' })}</span>}
          </button>
        ))}
      </div>
      {sel && <ResultBar correct={sel === item.zh} feedback={sel === item.zh ? 'Correto!' : `Correto: "${item.zh}"`} onNext={onDone} />}
    </div>
  );
}

function SentFill({ showHint, onDone }) {
  const item = useMemo(() => pickOne(FILL_BLANKS), []);
  const choices = useMemo(() => shuffle(item.options), []);
  const [sel, setSel] = useState(null);
  const choose = v => { if (sel) return; setSel(v); onDone(v === item.blank); };
  return (
    <div className="ex-card ex-card-wide">
      <div className="ex-prompt-label">Complete a frase</div>
      <div className="ex-fill-sentence">
        <span>{item.before}</span>
        <span className={`ex-fill-blank ${sel ? (sel === item.blank ? 'filled-correct' : 'filled-wrong') : ''}`}>
          {sel || '___'}
        </span>
        <span>{item.after}</span>
      </div>
      {showHint && <div className="ex-hint ex-pinyin-hint">Dica: {item.py_blank}</div>}
      <div className="ex-hint">{item.pt}</div>
      <div className="ex-choices">
        {choices.map(c => (
          <button key={c} className={`${choiceCls(sel, c, item.blank)} ex-choice-hz`} onClick={() => choose(c)}>{c}</button>
        ))}
      </div>
      {sel && <ResultBar correct={sel === item.blank} feedback={sel === item.blank ? 'Correto!' : `Correto: ${item.blank} (${item.py_blank})`} onNext={onDone} />}
    </div>
  );
}

function SentOrder({ showHint, onDone }) {
  const item = useMemo(() => pickOne(WORD_ORDER), []);
  const [remaining, setRemaining] = useState(() => shuffle(item.words));
  const [placed, setPlaced]       = useState([]);
  const [checked, setChecked]     = useState(false);

  const place = w => {
    if (checked) return;
    setRemaining(r => { const idx = r.indexOf(w); if (idx === -1) return r; return [...r.slice(0,idx), ...r.slice(idx+1)]; });
    setPlaced(p => [...p, w]);
  };
  const unplace = i => {
    if (checked) return;
    const w = placed[i];
    setPlaced(p => p.filter((_, j) => j !== i));
    setRemaining(r => [...r, w]);
  };
  const check = () => {
    if (placed.length !== item.words.length) return;
    setChecked(true);
    onDone(placed.join('') === item.correct);
  };

  const correct = placed.join('') === item.correct;

  return (
    <div className="ex-card ex-card-wide">
      <div className="ex-prompt-label">Coloque as palavras na ordem correta</div>
      <div className="ex-hint">{item.pt}</div>
      {showHint && checked && <div className="ex-hint ex-pinyin-hint">{getPinyin(item.correct, { type: 'string' })}</div>}

      <div className="ex-order-zone">
        {placed.length === 0
          ? <span className="ex-order-placeholder">Clique nas palavras abaixo para construir a frase</span>
          : placed.map((w, i) => (
              <button key={i} className={`ex-word-tile placed ${checked ? (correct ? 'correct' : 'wrong') : ''}`}
                onClick={() => unplace(i)}>{w}</button>
            ))
        }
      </div>

      <div className="ex-order-pool">
        {remaining.map((w, i) => (
          <button key={i} className="ex-word-tile" onClick={() => place(w)}>{w}</button>
        ))}
      </div>

      {!checked && placed.length === item.words.length && (
        <button className="ex-check-btn" onClick={check}>Verificar</button>
      )}

      {checked && (
        <ResultBar
          correct={correct}
          feedback={correct ? 'Correto!' : `Correto: ${item.correct}`}
          onNext={onDone}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function choiceCls(sel, val, correct) {
  const base = 'ex-choice';
  if (!sel) return base;
  if (val === correct) return `${base} ex-choice-correct`;
  if (val === sel)     return `${base} ex-choice-wrong`;
  return `${base} ex-choice-muted`;
}

function renderExercise(type, item, showHint, items, onDone) {
  const vocab = items.vocab;
  const sents = items.sents;
  switch (type) {
    case 'hz2py':      return <HanziToPinyin items={vocab} showHint={showHint} onDone={onDone} />;
    case 'py2hz':      return <PinyinToHanzi items={vocab} showHint={showHint} onDone={onDone} />;
    case 'hz2pt':      return <HanziMeaning  items={vocab} showHint={showHint} onDone={onDone} />;
    case 'pt2hz':      return <PtToHanzi     items={vocab} showHint={showHint} onDone={onDone} />;
    case 'tone':       return <ToneExercise  onDone={onDone} />;
    case 'sent-zh2pt': return <SentZhToPt    items={sents} showHint={showHint} onDone={onDone} />;
    case 'sent-pt2zh': return <SentPtToZh    items={sents} showHint={showHint} onDone={onDone} />;
    case 'sent-fill':  return <SentFill      showHint={showHint} onDone={onDone} />;
    case 'sent-order': return <SentOrder     showHint={showHint} onDone={onDone} />;
    default:           return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION SUMMARY
// ─────────────────────────────────────────────────────────────────────────────

function SessionSummary({ score, total, onRestart, onNewSession }) {
  const pct = total > 0 ? Math.round(score / total * 100) : 0;
  const medal = pct >= 90 ? '🏆' : pct >= 70 ? '🥈' : pct >= 50 ? '🥉' : '📚';
  const msg   = pct >= 90 ? 'Excelente! Você dominou esta sessão!'
              : pct >= 70 ? 'Muito bem! Continue praticando.'
              : pct >= 50 ? 'Bom esforço! Revise os erros.'
              : 'Continue praticando, você vai melhorar!';
  return (
    <div className="ex-summary">
      <div className="ex-summary-medal">{medal}</div>
      <div className="ex-summary-pct">{pct}%</div>
      <div className="ex-summary-score">{score} de {total} corretos</div>
      <div className="ex-summary-msg">{msg}</div>
      <div className="ex-summary-btns">
        <button className="ex-next-btn" onClick={() => onRestart()}>Repetir sessão</button>
        <button className="ex-reset-btn" onClick={() => onNewSession()}>Nova configuração</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG PANEL
// ─────────────────────────────────────────────────────────────────────────────

function ConfigPanel({ config, onChange }) {
  const toggleType = id => {
    const next = new Set(config.enabledTypes);
    next.has(id) ? next.delete(id) : next.add(id);
    onChange({ ...config, enabledTypes: next });
  };

  const vocabTypes    = ALL_TYPES.filter(t => t.category === 'vocab');
  const sentenceTypes = ALL_TYPES.filter(t => t.category === 'sentence');

  return (
    <div className="ex-config-panel">
      <div className="ex-config-section-label">Tipos de exercício</div>

      <div className="ex-config-group-label">Vocabulário</div>
      {vocabTypes.map(t => (
        <label key={t.id} className="ex-config-checkbox">
          <input type="checkbox" checked={config.enabledTypes.has(t.id)} onChange={() => toggleType(t.id)} />
          <span>{t.label}</span>
        </label>
      ))}

      <div className="ex-config-group-label" style={{ marginTop: 10 }}>Frases</div>
      {sentenceTypes.map(t => (
        <label key={t.id} className="ex-config-checkbox">
          <input type="checkbox" checked={config.enabledTypes.has(t.id)} onChange={() => toggleType(t.id)} />
          <span>{t.label}</span>
        </label>
      ))}

      <div className="ex-config-section-label" style={{ marginTop: 14 }}>Questões por sessão</div>
      <div className="ex-config-lengths">
        {[5, 10, 20, 0].map(n => (
          <button key={n}
            className={`ex-len-btn ${config.sessionLength === n ? 'active' : ''}`}
            onClick={() => onChange({ ...config, sessionLength: n })}
          >{n === 0 ? '∞' : n}</button>
        ))}
      </div>

      <div className="ex-config-section-label" style={{ marginTop: 14 }}>Nível</div>
      <div className="ex-config-lengths">
        {[['all','Todos'],['beginner','Iniciante'],['advanced','Avançado']].map(([v,l]) => (
          <button key={v}
            className={`ex-len-btn ${config.difficulty === v ? 'active' : ''}`}
            onClick={() => onChange({ ...config, difficulty: v })}
          >{l}</button>
        ))}
      </div>

      <label className="ex-config-checkbox" style={{ marginTop: 14 }}>
        <input type="checkbox" checked={config.showPinyinHint} onChange={() => onChange({ ...config, showPinyinHint: !config.showPinyinHint })} />
        <span>Mostrar dica de pinyin</span>
      </label>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

export default function Exercises({ showPinyin, showHanzi }) {
  // mode: 'vocab' = vocabulary/sentence drills | 'fill' = FillBlanks text exercise
  const [mode, setMode] = useState('vocab');

  const [config, setConfigState] = useState(() => {
    const c = loadConfig();
    return { ...c, enabledTypes: new Set(c.enabledTypes) };
  });
  const [showConfig, setShowConfig] = useState(false);

  // Free-practice state
  const [freeType, setFreeType]   = useState('hz2py');
  const [freeKey, setFreeKey]     = useState(0);
  const [freeScore, setFreeScore] = useState({ correct: 0, total: 0 });

  // Session state: null = not started, { queue, idx, score, done }
  const [session, setSession] = useState(null);
  const [sessKey, setSessKey] = useState(0);

  const setConfig = useCallback(next => {
    setConfigState(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...next, enabledTypes: [...next.enabledTypes] }));
    } catch (_) {}
  }, []);

  const startSession = useCallback(() => {
    const queue = buildQueue(config);
    if (!queue.length) return;
    setSession({ queue, idx: 0, score: { correct: 0, total: 0 }, done: false });
    setSessKey(k => k + 1);
    setShowConfig(false);
  }, [config]);

  const filteredItems = useMemo(() => ({
    vocab: filterByLevel(VOCAB, config.difficulty),
    sents: filterByLevel(SENTENCES, config.difficulty),
  }), [config.difficulty]);

  // Called by exercise when an answer is selected (true/false) or "next" is clicked (undefined)
  const handleFreeScore = useCallback((result) => {
    if (result === undefined) { setFreeKey(k => k + 1); return; }
    setFreeScore(s => ({ correct: s.correct + (result ? 1 : 0), total: s.total + 1 }));
  }, []);

  const handleSessScore = useCallback((result) => {
    if (result === undefined) {
      // Advance to next question
      setSession(s => {
        if (!s) return s;
        const nextIdx = s.idx + 1;
        const done    = nextIdx >= s.queue.length;
        return { ...s, idx: nextIdx, done };
      });
      setSessKey(k => k + 1);
      return;
    }
    setSession(s => s && ({
      ...s,
      score: { correct: s.score.correct + (result ? 1 : 0), total: s.score.total + 1 },
    }));
  }, []);

  const exitSession = () => { setSession(null); setFreeKey(k => k + 1); };

  const typeInfo = ALL_TYPES.find(t => t.id === freeType);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="exercises-page">
      {/* Sidebar */}
      <div className="exercises-sidebar">
        {/* Mode switcher */}
        <div className="ex-mode-group">
          <button
            className={`ex-mode-btn ${mode === 'vocab' ? 'active' : ''}`}
            onClick={() => setMode('vocab')}
          >
            Vocabulário & Frases
          </button>
          <button
            className={`ex-mode-btn ${mode === 'fill' ? 'active' : ''}`}
            onClick={() => setMode('fill')}
          >
            Complete os Textos
          </button>
        </div>

        {mode === 'vocab' && (
        <>
        {/* Config toggle */}
        <button className={`ex-config-toggle ${showConfig ? 'active' : ''}`} onClick={() => setShowConfig(v => !v)}>
          ⚙ Configurar sessão
        </button>

        {showConfig ? (
          <>
            <ConfigPanel config={config} onChange={setConfig} />
            <button
              className="ex-start-btn"
              disabled={config.enabledTypes.size === 0}
              onClick={startSession}
            >
              Iniciar sessão configurada
            </button>
          </>
        ) : (
          <>
            <div className="exercises-sidebar-title">Prática livre</div>
            {ALL_TYPES.map(t => (
              <button
                key={t.id}
                className={`ex-type-btn ${!session && freeType === t.id ? 'active' : ''}`}
                onClick={() => { setSession(null); setFreeType(t.id); setFreeKey(k => k + 1); }}
              >
                <span className="ex-type-label">{t.label}</span>
                <span className="ex-type-desc">{t.desc}</span>
              </button>
            ))}

            {!session && (
              <div className="ex-scoreboard">
                <div className="ex-score-title">Pontuação livre</div>
                <div className="ex-score-numbers">
                  <span className="ex-score-correct">{freeScore.correct}</span>
                  <span className="ex-score-sep">/</span>
                  <span className="ex-score-total">{freeScore.total}</span>
                </div>
                {freeScore.total > 0 && (
                  <div className="ex-score-pct">{Math.round(freeScore.correct / freeScore.total * 100)}% corretos</div>
                )}
                {freeScore.total >= 5 && (
                  <button className="ex-reset-btn" onClick={() => setFreeScore({ correct: 0, total: 0 })}>Reiniciar</button>
                )}
              </div>
            )}

            {session && !session.done && (
              <div className="ex-scoreboard">
                <div className="ex-score-title">Sessão em andamento</div>
                <div className="ex-score-numbers">
                  <span className="ex-score-correct">{session.idx}</span>
                  <span className="ex-score-sep">/</span>
                  <span className="ex-score-total">{session.queue.length}</span>
                </div>
                <div className="ex-progress-bar">
                  <div className="ex-progress-fill" style={{ width: `${session.queue.length ? session.idx / session.queue.length * 100 : 0}%` }} />
                </div>
                <button className="ex-reset-btn" style={{ marginTop: 8 }} onClick={exitSession}>Encerrar sessão</button>
              </div>
            )}
          </>
        )}
        </>) /* end mode === 'vocab' */}
      </div>

      {/* Main area */}
      <div className="exercises-main">
        {mode === 'fill' ? (
          <FillBlanks showPinyin={showPinyin} showHanzi={showHanzi} />
        ) : session?.done ? (
          <SessionSummary
            score={session.score.correct}
            total={session.score.total}
            onRestart={() => { const q = buildQueue(config); setSession({ queue: q, idx: 0, score: { correct: 0, total: 0 }, done: false }); setSessKey(k => k + 1); }}
            onNewSession={() => { setSession(null); setShowConfig(true); }}
          />
        ) : session ? (
          // Session exercise
          <div key={sessKey} style={{ width: '100%', maxWidth: 780, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="ex-session-header">
              <span className="ex-session-label">
                Questão {session.idx + 1} de {session.queue.length}
              </span>
              <span className="ex-session-type">{ALL_TYPES.find(t => t.id === session.queue[session.idx]?.type)?.label}</span>
            </div>
            {session.queue[session.idx] && renderExercise(
              session.queue[session.idx].type,
              session.queue[session.idx].item,
              config.showPinyinHint,
              filteredItems,
              handleSessScore,
            )}
          </div>
        ) : (
          // Free practice
          <div key={`${freeType}-${freeKey}`} style={{ width: '100%', maxWidth: 780, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {renderExercise(freeType, null, config.showPinyinHint, filteredItems, handleFreeScore)}
          </div>
        )}
      </div>
    </div>
  );
}
