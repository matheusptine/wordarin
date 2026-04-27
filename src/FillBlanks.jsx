import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RefreshCw, Lightbulb, Check, Eye, EyeOff, X, Languages } from 'lucide-react';
import { pinyin as pinyinPro } from 'pinyin-pro';

// ─────────────────────────────────────────────────────────────────
// Proper nouns — never blankable, even when they match vocabulary.
// ─────────────────────────────────────────────────────────────────
const PROPER_NOUNS = [
  // Personagens
  { hanzi: '米格尔', pinyin: "Mǐgé'ěr", pt: 'Miguel' },
  { hanzi: '保罗', pinyin: 'Bǎoluó', pt: 'Paulo' },
  { hanzi: '王英', pinyin: 'Wáng Yīng', pt: 'Wang Ying' },
  { hanzi: '张林', pinyin: 'Zhāng Lín', pt: 'Zhang Lin' },
  { hanzi: '白小虹', pinyin: 'Bái Xiǎohóng', pt: 'Bai Xiaohong' },
  { hanzi: '卡米洛', pinyin: 'Kāmǐluò', pt: 'Camilo' },
  { hanzi: '张圆圆', pinyin: 'Zhāng Yuányuan', pt: 'Zhang Yuanyuan' },
  { hanzi: '丁汉生', pinyin: 'Dīng Hànshēng', pt: 'Ding Hansheng' },
  // Apelidos isolados (ex.: 张老师)
  { hanzi: '张', pinyin: 'Zhāng', pt: '(apelido)' },
  { hanzi: '白', pinyin: 'Bái', pt: '(apelido)' },
  { hanzi: '丁', pinyin: 'Dīng', pt: '(apelido)' },
  { hanzi: '王', pinyin: 'Wáng', pt: '(apelido)' },
  { hanzi: '刘', pinyin: 'Liú', pt: '(apelido)' },
  { hanzi: '林', pinyin: 'Lín', pt: '(apelido)' },
  // Lugares
  { hanzi: '里斯本', pinyin: 'Lǐsīběn', pt: 'Lisboa' },
  { hanzi: '东方研究学院', pinyin: 'Dōngfāng Yánjiū Xuéyuàn', pt: 'Instituto Oriental' },
  { hanzi: '中国', pinyin: 'Zhōngguó', pt: 'China' },
  { hanzi: '葡萄牙', pinyin: 'Pútáoyá', pt: 'Portugal' },
  { hanzi: '加拿大', pinyin: 'Jiānádà', pt: 'Canadá' },
  { hanzi: '巴西', pinyin: 'Bāxī', pt: 'Brasil' },
  { hanzi: '美国', pinyin: 'Měiguó', pt: 'Estados Unidos' },
];

// Vocabulário suplementar não listado explicitamente em course-data.json
// mas usado nos textos (partículas, números, palavras de apoio).
const ADDITIONAL_VOCAB = [
  // Partículas e interrogativas
  { hanzi: '的', pinyin: 'de', pt: '(part. possessiva)' },
  { hanzi: '呢', pinyin: 'ne', pt: '(part. interrogativa)' },
  { hanzi: '谁', pinyin: 'shéi', pt: 'quem' },
  { hanzi: '哪', pinyin: 'nǎ', pt: 'qual' },
  { hanzi: '国', pinyin: 'guó', pt: 'país' },
  { hanzi: '人', pinyin: 'rén', pt: 'pessoa' },
  { hanzi: '第', pinyin: 'dì', pt: '(prefixo ordinal)' },
  { hanzi: '家', pinyin: 'jiā', pt: 'casa / (med. empresas)' },
  { hanzi: '个', pinyin: 'ge', pt: '(medidor geral)' },
  { hanzi: '女', pinyin: 'nǚ', pt: 'mulher / feminino' },
  { hanzi: '女朋友', pinyin: 'nǚ péngyou', pt: 'namorada' },
  // Adjetivos usados
  { hanzi: '好', pinyin: 'hǎo', pt: 'bom / estar bem' },
  { hanzi: '大', pinyin: 'dà', pt: 'grande' },
  // Intro — sala de aula
  { hanzi: '上课', pinyin: 'shàng kè', pt: 'começar a aula' },
  { hanzi: '下课', pinyin: 'xià kè', pt: 'terminar a aula' },
  { hanzi: '现在', pinyin: 'xiànzài', pt: 'agora' },
  { hanzi: '休息', pinyin: 'xiūxi', pt: 'descansar, intervalo' },
  { hanzi: '一下', pinyin: 'yīxià', pt: 'um pouco' },
  { hanzi: '继续', pinyin: 'jìxù', pt: 'continuar' },
  { hanzi: '翻', pinyin: 'fān', pt: 'virar, folhear' },
  { hanzi: '书', pinyin: 'shū', pt: 'livro' },
  { hanzi: '到', pinyin: 'dào', pt: 'até, a, chegar' },
  { hanzi: '页', pinyin: 'yè', pt: 'página' },
  { hanzi: '听', pinyin: 'tīng', pt: 'ouvir' },
  { hanzi: '录音', pinyin: 'lùyīn', pt: 'gravação' },
  { hanzi: '读', pinyin: 'dú', pt: 'ler' },
  { hanzi: '再', pinyin: 'zài', pt: 'novamente' },
  { hanzi: '遍', pinyin: 'biàn', pt: '(vezes)' },
  { hanzi: '意思', pinyin: 'yìsi', pt: 'significado' },
  { hanzi: '怎么', pinyin: 'zěnme', pt: 'como' },
  { hanzi: '写', pinyin: 'xiě', pt: 'escrever' },
  { hanzi: '翻译', pinyin: 'fānyì', pt: 'traduzir' },
  { hanzi: '看', pinyin: 'kàn', pt: 'olhar, ver' },
  { hanzi: '黑板', pinyin: 'hēibǎn', pt: 'quadro' },
  { hanzi: '听写', pinyin: 'tīngxiě', pt: 'ditado' },
  { hanzi: '做', pinyin: 'zuò', pt: 'fazer' },
  { hanzi: '练习', pinyin: 'liànxí', pt: 'exercício' },
  { hanzi: '今天', pinyin: 'jīntiān', pt: 'hoje' },
  { hanzi: '作业', pinyin: 'zuòyè', pt: 'trabalho de casa' },
  { hanzi: '茶', pinyin: 'chá', pt: 'chá' },
  // Números (L0)
  { hanzi: '一', pinyin: 'yī', pt: 'um' },
  { hanzi: '二', pinyin: 'èr', pt: 'dois' },
  { hanzi: '三', pinyin: 'sān', pt: 'três' },
  { hanzi: '四', pinyin: 'sì', pt: 'quatro' },
  { hanzi: '五', pinyin: 'wǔ', pt: 'cinco' },
  { hanzi: '六', pinyin: 'liù', pt: 'seis' },
  { hanzi: '七', pinyin: 'qī', pt: 'sete' },
  { hanzi: '八', pinyin: 'bā', pt: 'oito' },
  { hanzi: '九', pinyin: 'jiǔ', pt: 'nove' },
  { hanzi: '十', pinyin: 'shí', pt: 'dez' },
  { hanzi: '零', pinyin: 'líng', pt: 'zero' },
];

const PUNCT_RE = /[\s，。！？：；、（）"'""''—…·\-—]/;

const DIFFICULTY_OPTIONS = [
  { id: 'facil',   label: 'Fácil',   ratio: 0.20 },
  { id: 'medio',   label: 'Médio',   ratio: 0.35 },
  { id: 'dificil', label: 'Difícil', ratio: 0.55 },
];

// ─────────────────────────────────────────────────────────────────
// Build lexicon from course-data.json + proper nouns + extras.
// Proper nouns registered FIRST so the dedup keeps them blank-proof.
// ─────────────────────────────────────────────────────────────────
function buildLexicon(courseData) {
  const entries = [];

  for (const p of PROPER_NOUNS) {
    entries.push({ hanzi: p.hanzi, pinyin: p.pinyin, pt: p.pt, blankable: false });
  }

  if (courseData?.lessons) {
    for (const lesson of courseData.lessons) {
      for (const w of lesson.vocabulary || []) {
        entries.push({ hanzi: w.hanzi, pinyin: w.pinyin, pt: w.pt, blankable: true });
      }
      for (const w of lesson.supplementaryVocabulary || []) {
        const parts = w.hanzi.split('／');
        const pins = (w.pinyin || '').split(/\s*\/\s*/);
        parts.forEach((part, i) => {
          entries.push({
            hanzi: part,
            pinyin: pins[i] || pins[0] || '',
            pt: w.pt,
            blankable: true,
          });
        });
      }
      for (const w of lesson.referenceVocabulary || []) {
        entries.push({ hanzi: w.hanzi, pinyin: w.pinyin, pt: w.pt, blankable: true });
      }
    }
  }

  for (const w of ADDITIONAL_VOCAB) {
    entries.push({ hanzi: w.hanzi, pinyin: w.pinyin, pt: w.pt, blankable: true });
  }

  // Dedup by hanzi, keeping first occurrence (proper nouns win).
  const seen = new Set();
  return entries.filter(e => {
    if (seen.has(e.hanzi)) return false;
    seen.add(e.hanzi);
    return true;
  });
}

// Greedy longest-match tokenizer.
function tokenize(text, lexicon) {
  const sorted = [...lexicon].sort((a, b) => b.hanzi.length - a.hanzi.length);
  const tokens = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '\n') { tokens.push({ type: 'newline' }); i++; continue; }
    if (PUNCT_RE.test(ch)) { tokens.push({ type: 'punct', text: ch }); i++; continue; }

    let matched = null;
    for (const entry of sorted) {
      if (text.startsWith(entry.hanzi, i)) { matched = entry; break; }
    }
    if (matched) {
      tokens.push({
        type: 'word',
        hanzi: matched.hanzi,
        pinyin: matched.pinyin,
        pt: matched.pt,
        blankable: matched.blankable,
        offset: i,
      });
      i += matched.hanzi.length;
    } else {
      tokens.push({ type: 'char', hanzi: ch, blankable: false, offset: i });
      i++;
    }
  }
  return tokens;
}

// Pick blank indices. Different each attempt (re-randomized).
function pickBlanks(tokens, ratio) {
  const candidates = [];
  tokens.forEach((t, idx) => {
    if (t.type === 'word' && t.blankable) candidates.push(idx);
  });
  const n = Math.max(1, Math.round(candidates.length * ratio));
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  return new Set(shuffled.slice(0, n));
}

// ─────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────
export default function FillBlanks({ showPinyin = true, showHanzi = true }) {
  const [courseData, setCourseData] = useState(null);
  const [texts, setTexts] = useState([]);
  const [textId, setTextId] = useState(null);
  const [difficulty, setDifficulty] = useState('medio');
  const [attempt, setAttempt] = useState(0);
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [hintMode, setHintMode]     = useState(false);   // dicas: user clicks individual blanks
  const [hintedBlanks, setHintedBlanks] = useState(new Set()); // which blanks have hint revealed
  const [showTranslation, setShowTranslation] = useState(false);
  const firstInputRef = useRef(null);

  useEffect(() => {
    fetch('/course-data.json').then(r => r.json()).then(setCourseData).catch(console.error);
    fetch('/study_texts.json').then(r => r.json()).then(d => {
      setTexts(d.texts || []);
      if (d.texts?.length) setTextId(d.texts[0].id);
    }).catch(console.error);
  }, []);

  const lexicon = useMemo(() => buildLexicon(courseData), [courseData]);
  const currentText = useMemo(
    () => texts.find(t => t.id === textId) || null,
    [texts, textId]
  );

  const tokens = useMemo(() => {
    if (!currentText || !lexicon.length) return [];
    return tokenize(currentText.hanzi, lexicon);
  }, [currentText, lexicon]);

  // Per-character pinyin of the full text, for ruby display above hanzi.
  const charPinyins = useMemo(() => {
    if (!currentText?.hanzi) return [];
    try {
      return pinyinPro(currentText.hanzi, { type: 'array', toneType: 'symbol' });
    } catch (_) {
      return [];
    }
  }, [currentText]);

  const ratio = DIFFICULTY_OPTIONS.find(d => d.id === difficulty)?.ratio ?? 0.35;

  const blanks = useMemo(() => {
    if (!tokens.length) return new Set();
    return pickBlanks(tokens, ratio);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens, ratio, attempt]);

  // Reset input state whenever the exercise changes.
  useEffect(() => {
    setAnswers({});
    setChecked(false);
    setRevealed(false);
    setHintMode(false);
    setHintedBlanks(new Set());
  }, [textId, difficulty, attempt]);

  const blankCount = blanks.size;
  const correctCount = useMemo(() => {
    let n = 0;
    blanks.forEach(idx => {
      if ((answers[idx] || '').trim() === tokens[idx]?.hanzi) n++;
    });
    return n;
  }, [blanks, answers, tokens]);

  const textsByLevel = useMemo(() => {
    const grouped = {};
    for (const t of texts) {
      if (!grouped[t.level]) grouped[t.level] = [];
      grouped[t.level].push(t);
    }
    return grouped;
  }, [texts]);

  const diffLabel = (d) => DIFFICULTY_OPTIONS.find(x => x.id === d)?.label ?? d;

  const setAnswer = (idx, v) => setAnswers(a => ({ ...a, [idx]: v }));

  const handleCheck = () => { setChecked(true); setRevealed(false); };
  const handleReveal = () => { setRevealed(true); setChecked(false); };
  const handleNewAttempt = () => setAttempt(a => a + 1);

  return (
    <div className="fb-page">
      <div className="fb-sidebar">
        <div className="fb-sidebar-header">
          <span className="fb-sidebar-title">完形填空</span>
          <span className="fb-sidebar-subtitle">Complete os Textos</span>
        </div>

        <div className="fb-sidebar-section">
          <div className="fb-sidebar-label">Dificuldade do exercício</div>
          <div className="fb-diff-group">
            {DIFFICULTY_OPTIONS.map(opt => (
              <button
                key={opt.id}
                className={`fb-diff-btn ${difficulty === opt.id ? 'active' : ''}`}
                onClick={() => setDifficulty(opt.id)}
              >
                {opt.label}
                <span className="fb-diff-pct">{Math.round(opt.ratio * 100)}%</span>
              </button>
            ))}
          </div>
        </div>

        <div className="fb-sidebar-section">
          <div className="fb-sidebar-label">Textos</div>
          <ul className="fb-text-list">
            {Object.keys(textsByLevel).sort().map(level => (
              <li key={level} className="fb-text-level">
                <div className="fb-text-level-label">Nível {level}</div>
                <ul className="fb-text-sublist">
                  {textsByLevel[level].map(t => (
                    <li key={t.id}>
                      <button
                        className={`fb-text-item ${textId === t.id ? 'active' : ''}`}
                        onClick={() => setTextId(t.id)}
                      >
                        <span className={`fb-text-diff fb-diff-${t.difficulty}`}>{diffLabel(t.difficulty)}</span>
                        <span className="fb-text-id">{t.id}</span>
                        <span className="fb-text-title">{t.title}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <main className="fb-main">
        {!currentText ? (
          <div className="fb-empty">A carregar…</div>
        ) : (
          <>
            <header className="fb-header">
              <div className="fb-header-title">
                <h2>{currentText.title}</h2>
                <span className="fb-header-meta">
                  Nível {currentText.level} · {diffLabel(currentText.difficulty)} · {blankCount} lacunas
                </span>
              </div>
              <div className="fb-header-actions">
                <button
                  className="fb-action"
                  onClick={handleNewAttempt}
                  title="Sorteia outras palavras"
                >
                  <RefreshCw size={15} /> Nova tentativa
                </button>
                <button
                  className={`fb-action ${hintMode ? 'active' : ''}`}
                  onClick={() => { setHintMode(h => !h); setHintedBlanks(new Set()); }}
                  title={hintMode ? 'Sair do modo dicas' : 'Ativar modo dicas: clique numa lacuna para receber uma dica'}
                >
                  <Lightbulb size={15} /> Dicas{hintMode ? ' (clique numa lacuna)' : ''}
                </button>
                <button
                  className="fb-action primary"
                  onClick={handleCheck}
                >
                  <Check size={15} /> Verificar
                </button>
                <button
                  className="fb-action"
                  onClick={revealed ? () => setRevealed(false) : handleReveal}
                >
                  {revealed ? <EyeOff size={15} /> : <Eye size={15} />}
                  {revealed ? ' Esconder' : ' Gabarito'}
                </button>
              </div>
            </header>

            {checked && (
              <div className={`fb-score ${correctCount === blankCount ? 'perfect' : ''}`}>
                {correctCount} de {blankCount} corretas
                {correctCount === blankCount && ' — 太好了！'}
                <button className="fb-score-close" onClick={() => setChecked(false)}>
                  <X size={14} />
                </button>
              </div>
            )}

            <section className={`fb-text-body ${showPinyin ? '' : 'fb-no-pinyin'}`}>
              {renderTokens(tokens, blanks, charPinyins, {
                answers, setAnswer, checked, revealed,
                hintMode, hintedBlanks, setHintedBlanks,
                firstInputRef,
              })}
            </section>

            {/* Portuguese translation always shown below the text box */}
            {currentText.pt && (
              <aside className="fb-aux">
                <div className="fb-aux-block">
                  <div className="fb-aux-label">Tradução em português</div>
                  <div className="fb-aux-content">{currentText.pt}</div>
                </div>
              </aside>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function renderTokens(tokens, blanks, charPinyins, ctx) {
  const { answers, setAnswer, checked, revealed, hintMode, hintedBlanks, setHintedBlanks } = ctx;
  let blankSeen = 0;
  return tokens.map((t, i) => {
    if (t.type === 'newline') return <br key={i} />;
    // Wrap punctuation in ruby so it aligns with the ruby baseline (no floating)
    if (t.type === 'punct') return (
      <ruby className="fb-ruby fb-ruby-punct" key={i}>
        <span className="fb-punct">{t.text}</span>
        <rt className="fb-rt"> </rt>
      </ruby>
    );

    if (t.type === 'char') {
      const py = charPinyins[t.offset] || '';
      return (
        <ruby className="fb-ruby" key={i}>
          <span className="fb-char">{t.hanzi}</span>
          <rt className="fb-rt">{py}</rt>
        </ruby>
      );
    }

    // word
    if (blanks.has(i)) {
      blankSeen++;
      const myOrder = blankSeen;
      return (
        <BlankInput
          key={i}
          token={t}
          index={i}
          order={myOrder}
          value={answers[i] || ''}
          onChange={v => setAnswer(i, v)}
          checked={checked}
          revealed={revealed}
          hintMode={hintMode}
          showHint={hintedBlanks.has(i)}
          onRequestHint={() => hintMode && setHintedBlanks(s => new Set([...s, i]))}
        />
      );
    }

    // visible word: one <ruby> per character so each hanzi gets its own pinyin above
    return (
      <span className="fb-word" key={i} title={`${t.pinyin} — ${t.pt}`}>
        {t.hanzi.split('').map((ch, k) => (
          <ruby className="fb-ruby" key={k}>
            {ch}
            <rt className="fb-rt">{charPinyins[t.offset + k] || ''}</rt>
          </ruby>
        ))}
      </span>
    );
  });
}

function BlankInput({ token, index, order, value, onChange, checked, revealed,
                       hintMode, showHint, onRequestHint }) {
  const trimmed = (value || '').trim();
  const isCorrect = trimmed === token.hanzi;
  const status = revealed ? 'revealed' : (checked ? (isCorrect ? 'correct' : 'wrong') : '');
  const display = revealed ? token.hanzi : value;
  const placeholder = '?'.repeat(token.hanzi.length);
  const width = `${Math.max(2.5, token.hanzi.length * 1.6 + 0.5)}em`;

  const pinyinVisible = revealed || (checked && isCorrect) || showHint;
  const ptVisible = showHint;

  return (
    <span className="fb-blank-wrap">
      <span className="fb-blank-order">{order}</span>
      <span
        className="fb-blank-pinyin"
        style={{ visibility: pinyinVisible ? 'visible' : 'hidden' }}
        aria-hidden={!pinyinVisible}
      >
        {token.pinyin}
      </span>
      <input
        type="text"
        className={`fb-blank ${status}${hintMode && !showHint ? ' fb-blank-hintable' : ''}`}
        value={display}
        onChange={e => onChange(e.target.value)}
        onClick={onRequestHint}
        disabled={revealed}
        placeholder={placeholder}
        style={{ width }}
        lang="zh-CN"
        autoComplete="off"
        spellCheck={false}
        title={hintMode && !showHint ? 'Clique para ver a dica' : `${token.pinyin} — ${token.pt}`}
      />
      <span
        className="fb-blank-pt"
        style={{ visibility: ptVisible ? 'visible' : 'hidden' }}
        aria-hidden={!ptVisible}
      >
        {token.pt}
      </span>
    </span>
  );
}
