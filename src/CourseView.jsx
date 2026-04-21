import { useState } from 'react';
import { pinyin as getPinyin } from 'pinyin-pro';
import AudioPlayer from './AudioPlayer';
import StrokeOrder from './StrokeOrder';

// ── Speak a Chinese string via Web Speech API ──────────────────────────────
function speakChinese(text) {
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'zh-CN';
  const v = window.speechSynthesis.getVoices().find(v => v.lang.includes('zh') || v.lang.includes('cmn'));
  if (v) u.voice = v;
  window.speechSynthesis.speak(u);
}

// ── Hanzi with per-character pinyin above ─────────────────────────────────
function HanziRuby({ text, className = '' }) {
  if (!text) return null;
  return (
    <span className={`hanzi-ruby ${className}`}>
      {[...text].map((ch, i) => {
        if (ch === '\n') return <br key={i} />;
        if (/[\u4e00-\u9fa5]/.test(ch)) {
          const py = getPinyin(ch, { type: 'array' })[0] || '';
          return (
            <span key={i} className="hz-char">
              <span className="hz-py">{py}</span>
              <span className="hz-ch">{ch}</span>
            </span>
          );
        }
        return <span key={i} className="hz-punc">{ch}</span>;
      })}
    </span>
  );
}

function hanziOnly(text) {
  if (!text) return '';
  return text.split('\n').map(line => {
    // strip 'hanzi[punc] Pinyin.' patterns
    let r = line.replace(/([\u3002\uff01\uff1f])\s*[A-Z][\w\s\u00C0-\u024F,.!?;:]*$/, '$1');
    // strip 'hanzi. Pinyin.' with a space-separated cap
    r = r.replace(/\s+[A-Z][\w\s\u00C0-\u024F,.!?;:]*$/, '');
    return r.trim();
  }).join('\n');
}

function ChText({ text, className = '' }) {
  if (!text) return null;
  const clean = hanziOnly(text);
  if (/[一-龥]/.test(clean)) return <HanziRuby text={clean} className={className} />;
  return <span className={className}>{text}</span>;
}

// ── Single vocab card ───────────────────────────────────────────────────────
function VocabCard({ item, selected, onSelect }) {
  return (
    <div
      className={`vocab-card ${selected ? 'selected' : ''}`}
      onClick={onSelect}
      title="Clique para ver traços"
    >
      <HanziRuby text={item.hanzi} className="vocab-hanzi-ruby" />
      <div className="vocab-type">{item.type}</div>
      <div className="vocab-pt">{item.pt}</div>
      <div className="vocab-actions">
        <button
          className="vocab-speak-btn"
          onClick={(e) => { e.stopPropagation(); speakChinese(item.hanzi); }}
          title="Ouvir pronúncia"
        >
          🔊
        </button>
      </div>
    </div>
  );
}

// ── Vocab inline whiteboard ─────────────────────────────────────────────────
function VocabWhiteboard({ item, onClose }) {
  const chars = [...(item.hanzi || '')].filter(c => /[\u4e00-\u9fa5]/.test(c));
  const [charIdx, setCharIdx] = useState(0);
  const activeChar = chars[Math.min(charIdx, chars.length - 1)];

  return (
    <div className="vocab-whiteboard">
      <div className="vocab-whiteboard-header">
        <span className="vocab-whiteboard-hanzi">{item.hanzi}</span>
        <div className="vocab-whiteboard-info">
          <span className="vocab-whiteboard-pinyin">{item.pinyin}</span>
          <span className="vocab-whiteboard-pt">{item.pt}</span>
        </div>
        <button className="vocab-whiteboard-close" onClick={onClose}>✕</button>
      </div>

      {chars.length > 1 && (
        <div style={{ display: 'flex', gap: 6, padding: '8px 14px 0', background: '#fafff9' }}>
          {chars.map((c, i) => (
            <button
              key={i}
              onClick={() => setCharIdx(i)}
              style={{
                padding: '2px 8px', borderRadius: 6, fontSize: 18,
                background: i === charIdx ? 'var(--green-700)' : 'var(--green-100)',
                color: i === charIdx ? '#fff' : 'var(--green-900)',
                border: '1px solid var(--green-200)',
                cursor: 'pointer',
              }}
            >{c}</button>
          ))}
        </div>
      )}

      <div className="vocab-whiteboard-chars">
        {activeChar && <StrokeOrder key={activeChar} char={activeChar} size={260} />}
        {!activeChar && (
          <div style={{ padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>
            Sem caracteres para praticar
          </div>
        )}
      </div>
    </div>
  );
}

// ── Vocabulary section ──────────────────────────────────────────────────────
function VocabSection({ items, title, subtitle, selectedItem, onSelect }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="course-section">
      <h3 className="section-title">
        <span className="section-icon">📖</span>
        {title || '词汇 Vocabulário'}
        {subtitle && <span className="section-subtitle-zh">{subtitle}</span>}
      </h3>
      <div className="vocab-grid">
        {items.map((item, i) => (
          <VocabCard
            key={i}
            item={item}
            selected={selectedItem?.hanzi === item.hanzi}
            onSelect={() => onSelect(selectedItem?.hanzi === item.hanzi ? null : item)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Dialogue list (greetings / classroom) ───────────────────────────────────
function DialogueList({ section }) {
  return (
    <div className="course-section">
      <h3 className="section-title">
        <span className="section-icon">💬</span>
        {section.title}
        {section.chineseTitle && <span className="section-subtitle-zh">{section.chineseTitle}</span>}
      </h3>
      <div className="dialogue-list">
        {section.items.map((item, i) => (
          <div key={i} className="dialogue-row" onClick={() => speakChinese(item.hanzi)}>
            <HanziRuby text={item.hanzi} className="dialogue-hanzi" />
            <div className="dialogue-pt">{item.pt}</div>
            <button className="dialogue-speak" onClick={(e) => { e.stopPropagation(); speakChinese(item.hanzi); }}>🔊</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Text / dialogue scene ───────────────────────────────────────────────────
function TextScene({ text }) {
  return (
    <div className="text-scene">
      {text.context && <p className="text-context">{text.context}</p>}
      <div className="text-dialogue">
        {text.lines.map((line, i) => (
          <div key={i} className="text-line" onClick={() => speakChinese(line.hanzi)}>
            <span className="text-speaker">{line.speaker}</span>
            <div className="text-content">
              <HanziRuby text={line.hanzi} className="text-hanzi" />
              <div className="text-pt">{line.pt}</div>
            </div>
            <button className="text-speak" onClick={(e) => { e.stopPropagation(); speakChinese(line.hanzi); }}>🔊</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Grammar section ─────────────────────────────────────────────────────────
function GrammarSection({ grammar }) {
  if (!grammar || grammar.length === 0) return null;
  return (
    <div className="course-section">
      <h3 className="section-title">
        <span className="section-icon">📐</span>
        语法 Gramática
      </h3>
      {grammar.map((g, gi) => (
        <div key={gi} className="grammar-block">
          <h4 className="grammar-title">{g.title}</h4>
          {g.chineseTitle && <span className="grammar-title-zh">{g.chineseTitle}</span>}
          {g.content && <p className="grammar-content">{g.content}</p>}
          {g.pattern && <div className="grammar-pattern">{g.pattern}</div>}
          {g.note && <p className="grammar-note">📌 {g.note}</p>}
          {g.examples && (
            <div className="grammar-examples">
              {g.examples.map((ex, ei) => (
                <div key={ei} className="grammar-example">
                  {ex.affirmative && (
                    <div className="grammar-ex-row affirm">
                      <span className="grammar-ex-label">✓</span>
                      <div>
                        <div className="grammar-ex-zh" onClick={() => speakChinese(hanziOnly(ex.affirmative))}>
                          <HanziRuby text={hanziOnly(ex.affirmative)} />
                        </div>
                        {ex.pt_aff && <div className="grammar-ex-pt">{ex.pt_aff}</div>}
                      </div>
                    </div>
                  )}
                  {ex.negative && (
                    <div className="grammar-ex-row negat">
                      <span className="grammar-ex-label">✗</span>
                      <div>
                        <div className="grammar-ex-zh" onClick={() => speakChinese(hanziOnly(ex.negative))}>
                          <HanziRuby text={hanziOnly(ex.negative)} />
                        </div>
                        {ex.pt_neg && <div className="grammar-ex-pt">{ex.pt_neg}</div>}
                      </div>
                    </div>
                  )}
                  {ex.hanzi && !ex.affirmative && (
                    <div className="grammar-ex-row affirm">
                      <span className="grammar-ex-label">•</span>
                      <div>
                        <div className="grammar-ex-zh" onClick={() => speakChinese(ex.hanzi)}>
                          <HanziRuby text={ex.hanzi} />
                        </div>
                        {ex.pinyin && <div className="grammar-ex-pin">{ex.pinyin}</div>}
                        {ex.pt && <div className="grammar-ex-pt">{ex.pt}</div>}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {g.subsections && g.subsections.map((sub, si) => (
            <div key={si} className="grammar-sub">
              <h5 className="grammar-sub-title">{sub.label}</h5>
              {sub.desc && <p className="grammar-sub-desc">{sub.desc}</p>}
              <div className="grammar-examples">
                {sub.examples.map((ex, ei) => (
                  <div key={ei} className="grammar-example">
                    <div className="grammar-ex-row affirm">
                      <span className="grammar-ex-label">•</span>
                      <div>
                        <div className="grammar-ex-zh" onClick={() => speakChinese(ex.hanzi.split('\n')[0])}>
                          <HanziRuby text={hanziOnly(ex.hanzi)} />
                        </div>
                        {ex.pinyin && <div className="grammar-ex-pin" style={{ whiteSpace: 'pre-line' }}>{ex.pinyin}</div>}
                        {ex.pt && <div className="grammar-ex-pt" style={{ whiteSpace: 'pre-line' }}>{ex.pt}</div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Exercise: fill in the blank ──────────────────────────────────────────────
function ExFill({ items, title }) {
  const [revealed, setRevealed] = useState({});
  const [inputs, setInputs] = useState({});
  const [checked, setChecked] = useState({});

  const check = (i) => {
    const correct = items[i].answer.toLowerCase();
    const given = (inputs[i] || '').toLowerCase().trim();
    setChecked(c => ({ ...c, [i]: given === correct ? 'correct' : 'wrong' }));
    setRevealed(r => ({ ...r, [i]: true }));
  };

  return (
    <div className="exercise-block">
      <h4 className="exercise-title">✏️ {title}</h4>
      {items.map((item, i) => (
        <div key={i} className={`ex-fill-item ${checked[i] || ''}`}>
          <div className="ex-question"><ChText text={item.question} /></div>
          <div className="ex-fill-row">
            <input
              className="ex-input"
              value={inputs[i] || ''}
              onChange={e => setInputs(inp => ({ ...inp, [i]: e.target.value }))}
              placeholder="Resposta..."
              disabled={revealed[i]}
            />
            {!revealed[i] ? (
              <button className="ex-btn" onClick={() => check(i)}>Verificar</button>
            ) : null}
            <button className="ex-reveal-btn" onClick={() => setRevealed(r => ({ ...r, [i]: !r[i] }))}>
              {revealed[i] ? '🙈 Ocultar' : '👁 Resposta'}
            </button>
          </div>
          {revealed[i] && (
            <div className={`ex-answer ${checked[i] || ''}`}>
              <strong>Resposta:</strong> <ChText text={item.answer} />
              {checked[i] === 'correct' && <span className="ex-badge correct">✓ Correcto!</span>}
              {checked[i] === 'wrong' && <span className="ex-badge wrong">✗ Tenta outra vez</span>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Exercise: translation ────────────────────────────────────────────────────
function ExTranslate({ items, title }) {
  const [revealed, setRevealed] = useState({});
  const toggle = (i) => setRevealed(r => ({ ...r, [i]: !r[i] }));

  return (
    <div className="exercise-block">
      <h4 className="exercise-title">🔤 {title}</h4>
      {items.map((item, i) => (
        <div key={i} className="ex-translate-item">
          <div className="ex-question"><ChText text={item.question} /></div>
          <button className="ex-reveal-btn" onClick={() => toggle(i)}>
            {revealed[i] ? '🙈 Ocultar' : '👁 Ver resposta'}
          </button>
          {revealed[i] && (
            <div className="ex-answer" onClick={() => speakChinese(item.answer)}>
              <ChText text={item.answer} />
              <button className="ex-speak" onClick={() => speakChinese(item.answer)}>🔊</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Exercise: transform ──────────────────────────────────────────────────────
function ExTransform({ items, title }) {
  const [revealed, setRevealed] = useState({});
  return (
    <div className="exercise-block">
      <h4 className="exercise-title">🔄 {title}</h4>
      {items.map((item, i) => (
        <div key={i} className="ex-translate-item">
          <div className="ex-question" onClick={() => speakChinese(item.question)}><ChText text={item.question} /></div>
          <button className="ex-reveal-btn" onClick={() => setRevealed(r => ({ ...r, [i]: !r[i] }))}>
            {revealed[i] ? '🙈 Ocultar' : '👁 Ver resposta'}
          </button>
          {revealed[i] && (
            <div className="ex-answer" onClick={() => speakChinese(item.answer)}>
              <ChText text={item.answer} />
              <button className="ex-speak" onClick={() => speakChinese(item.answer)}>🔊</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Exercise: matching ────────────────────────────────────────────────────────
function ExMatch({ pairs, title }) {
  const [selected, setSelected] = useState({ a: null, b: null });
  const [matched, setMatched] = useState([]);
  const [wrong, setWrong] = useState(null);
  const shuffled = useState(() => [...pairs].sort(() => Math.random() - 0.5))[0];
  const shuffledB = useState(() => [...pairs].sort(() => Math.random() - 0.5))[0];

  const pick = (side, index, value) => {
    if (matched.some(m => m.a === value || m.b === value)) return;
    const next = { ...selected, [side]: { index, value } };
    if (next.a && next.b) {
      const pair = pairs.find(p => p.a === next.a.value || p.b === next.a.value);
      const isMatch = pair && ((pair.a === next.a.value && pair.b === next.b.value) || (pair.b === next.a.value && pair.a === next.b.value));
      if (isMatch) {
        setMatched(m => [...m, { a: next.a.value, b: next.b.value }]);
        setSelected({ a: null, b: null });
      } else {
        setWrong({ a: next.a.value, b: next.b.value });
        setTimeout(() => { setWrong(null); setSelected({ a: null, b: null }); }, 800);
      }
    } else {
      setSelected(next);
    }
  };

  const isMatched = (val) => matched.some(m => m.a === val || m.b === val);
  const isWrong = (val) => wrong && (wrong.a === val || wrong.b === val);
  const isSelected = (side, val) => selected[side]?.value === val;

  return (
    <div className="exercise-block">
      <h4 className="exercise-title">🔗 {title}</h4>
      {matched.length === pairs.length && (
        <div className="ex-complete">🎉 Parabéns! Todos correspondidos!</div>
      )}
      <div className="ex-match-grid">
        <div className="ex-match-col">
          {shuffled.map((p, i) => (
            <button
              key={i}
              className={`ex-match-chip ex-match-a
                ${isMatched(p.a) ? 'matched' : ''}
                ${isWrong(p.a) ? 'wrong' : ''}
                ${isSelected('a', p.a) ? 'selected' : ''}`}
              onClick={() => pick('a', i, p.a)}
              disabled={isMatched(p.a)}
            >
              <ChText text={p.a} />
            </button>
          ))}
        </div>
        <div className="ex-match-col">
          {shuffledB.map((p, i) => (
            <button
              key={i}
              className={`ex-match-chip ex-match-b
                ${isMatched(p.b) ? 'matched' : ''}
                ${isWrong(p.b) ? 'wrong' : ''}
                ${isSelected('b', p.b) ? 'selected' : ''}`}
              onClick={() => pick('b', i, p.b)}
              disabled={isMatched(p.b)}
            >
              <ChText text={p.b} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Exercise: tone identify ─────────────────────────────────────────────────
function ExToneIdentify({ items, title }) {
  const [answers, setAnswers] = useState({});
  const [revealed, setRevealed] = useState({});

  return (
    <div className="exercise-block">
      <h4 className="exercise-title">🎵 {title}</h4>
      {items.map((item, i) => (
        <div key={i} className="ex-tone-item">
          <div className="ex-question">{item.question}</div>
          <div className="ex-tone-options">
            {item.options.map((opt, oi) => (
              <button
                key={oi}
                className={`ex-tone-btn
                  ${answers[i] === oi ? (oi === item.answer ? 'correct' : 'wrong') : ''}
                  ${revealed[i] && oi === item.answer ? 'correct' : ''}`}
                onClick={() => { setAnswers(a => ({ ...a, [i]: oi })); setRevealed(r => ({ ...r, [i]: true })); }}
              >
                {opt}
              </button>
            ))}
          </div>
          {revealed[i] && (
            <div className={`ex-tone-result ${answers[i] === item.answer ? 'correct' : 'wrong'}`}>
              {answers[i] === item.answer ? '✓ Correcto!' : `✗ Resposta correcta: ${item.options[item.answer]}`}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Exercises dispatcher ─────────────────────────────────────────────────────
function ExercisesSection({ exercises, audio }) {
  if (!exercises || exercises.length === 0) return null;
  return (
    <div className="course-section">
      <h3 className="section-title">
        <span className="section-icon">🏋️</span>
        练习 Exercícios
      </h3>
      {audio && (
        <div className="exercise-audio">
          <AudioPlayer src={audio} label="Áudio dos exercícios" />
        </div>
      )}
      {exercises.map((ex, i) => {
        if (ex.type === 'fill') return <ExFill key={i} items={ex.items} title={ex.title} />;
        if (ex.type === 'translate') return <ExTranslate key={i} items={ex.items} title={ex.title} />;
        if (ex.type === 'transform') return <ExTransform key={i} items={ex.items} title={ex.title} />;
        if (ex.type === 'match') return <ExMatch key={i} pairs={ex.pairs} title={ex.title} />;
        if (ex.type === 'tone-identify') return <ExToneIdentify key={i} items={ex.items} title={ex.title} />;
        return null;
      })}
    </div>
  );
}

// ── Phonetics section for Lição 0 ───────────────────────────────────────────
function PhoneticsSection({ phonetics, subsections }) {
  const [activeTab, setActiveTab] = useState('initials');

  return (
    <div className="course-section">
      <h3 className="section-title">
        <span className="section-icon">🎵</span>
        语音 Fonética
      </h3>

      {subsections && (
        <div className="phonetics-audios">
          {subsections.map(sub => (
            <div key={sub.id} className="phonetics-audio-row">
              <span className="phonetics-audio-label">{sub.id} · {sub.title}</span>
              <AudioPlayer src={sub.audio} compact />
            </div>
          ))}
        </div>
      )}

      <div className="phonetics-tabs">
        {['initials','finals','tones'].map(tab => (
          <button key={tab} className={`phonetics-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab === 'initials' ? '声母 Iniciais' : tab === 'finals' ? '韵母 Finals' : '声调 Tons'}
          </button>
        ))}
      </div>

      {activeTab === 'initials' && (
        <div className="phonetics-grid-initials">
          {phonetics.initials.map((init, i) => (
            <button key={i} className="phonetics-chip" onClick={() => speakChinese(init)}>
              {init}
            </button>
          ))}
        </div>
      )}

      {activeTab === 'finals' && (
        <div className="phonetics-grid-finals">
          {phonetics.finals.map((fin, i) => (
            <button key={i} className="phonetics-chip" onClick={() => speakChinese(fin)}>
              {fin}
            </button>
          ))}
        </div>
      )}

      {activeTab === 'tones' && (
        <div className="phonetics-tones">
          {phonetics.tones.map((tone, i) => (
            <div key={i} className="tone-card">
              <div className="tone-number">{tone.number}.º Tom</div>
              <div className="tone-mark">{tone.mark}</div>
              <div className="tone-name">{tone.name}</div>
              <div className="tone-chinese">{tone.chinese}</div>
              <div className="tone-desc">{tone.desc}</div>
              <div className="tone-contour">Contorno: {tone.freq}</div>
              {phonetics.toneExamples && (
                <button
                  className="tone-example-btn"
                  onClick={() => speakChinese(phonetics.toneExamples[i]?.pinyin?.replace(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/g, m => m) || '')}
                >
                  {phonetics.toneExamples[i]?.pinyin} — {phonetics.toneExamples[i]?.meaning}
                </button>
              )}
            </div>
          ))}
          {phonetics.buToneChange && (
            <div className="tone-sandhi">
              <h4>Mudança de tom de 不 bù</h4>
              <p>{phonetics.buToneChange.rule}</p>
              {phonetics.buToneChange.examples.map((ex, i) => (
                <div key={i} className="sandhi-row">
                  <span className="sandhi-rule">{ex.original} → {ex.result}</span>
                  <span className="sandhi-ex" onClick={() => speakChinese(ex.example.replace(/[a-z\s\.]+/gi, '').trim())}>{ex.example}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Characters section with stroke order ─────────────────────────────────────
function CharactersSection({ characters, strokes }) {
  return (
    <div className="course-section">
      <h3 className="section-title">
        <span className="section-icon">✍️</span>
        汉字 Caracteres e Ordem dos Traços
      </h3>

      {strokes && (
        <div className="strokes-rules">
          <h4>Regras da ordem dos traços</h4>
          <ul>
            {strokes.rules.map((rule, i) => (
              <li key={i}>{rule}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="char-grid">
        {characters.map((c, i) => (
          <div
            key={i}
            className="char-card"
            onClick={() => speakChinese(c.hanzi)}
          >
            <HanziRuby text={c.hanzi} className="char-hanzi" />
            <div className="char-meaning">{c.meaning}</div>
            {c.strokes && <div className="char-strokes">{c.strokes} traço{c.strokes !== 1 ? 's' : ''}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main CourseView ──────────────────────────────────────────────────────────
export default function CourseView({ lesson, showPinyin = true, showHanzi = true }) {
  const [selectedVocabItem, setSelectedVocabItem] = useState(null);

  if (!lesson) {
    return (
      <div className="course-empty">
        <div className="course-empty-inner">
          <span className="course-empty-char">当代中文</span>
          <p>Selecione uma lição no menu à esquerda para começar.</p>
        </div>
      </div>
    );
  }

  const viewClass = [
    'course-view',
    !showPinyin ? 'hide-pinyin' : '',
    !showHanzi  ? 'hide-hanzi'  : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={viewClass}>
      <div className="course-scroll-area">
        <div className="course-header" style={{ '--lesson-color': lesson.color || '#52b788' }}>
          <div className="course-header-inner">
            <span className="course-number">{lesson.number}</span>
            <div className="course-titles">
              <h1 className="course-title">{lesson.title}</h1>
              {lesson.chineseTitle && <span className="course-title-zh">{lesson.chineseTitle}</span>}
            </div>
          </div>
          {lesson.audio?.student && (
            <div className="course-audio-bar">
              <AudioPlayer src={lesson.audio.student} label={`Áudio · ${lesson.number}`} />
            </div>
          )}
        </div>

        <div className="course-body">
          {lesson.audio?.student && <div id="section-audio" />}

          {lesson.sections?.length > 0 && (
            <div id="section-sections">
              {lesson.sections.map((sec, i) => <DialogueList key={i} section={sec} />)}
            </div>
          )}

          {lesson.phonetics && (
            <div id="section-phonetics">
              <PhoneticsSection phonetics={lesson.phonetics} subsections={lesson.subsections} />
            </div>
          )}

          {lesson.characters && (
            <div id="section-characters">
              <CharactersSection characters={lesson.characters} strokes={lesson.strokes} />
            </div>
          )}

          {(lesson.vocabulary || lesson.supplementaryVocabulary || lesson.referenceVocabulary) && (
            <div id="section-vocabulary">
              {lesson.vocabulary && (
                <VocabSection
                  items={lesson.vocabulary}
                  title="词汇 Vocabulário"
                  selectedItem={selectedVocabItem}
                  onSelect={setSelectedVocabItem}
                />
              )}
              {lesson.supplementaryVocabulary && (
                <VocabSection
                  items={lesson.supplementaryVocabulary}
                  title="补充词汇 Vocabulário suplementar"
                  selectedItem={selectedVocabItem}
                  onSelect={setSelectedVocabItem}
                />
              )}
              {lesson.referenceVocabulary && (
                <VocabSection
                  items={lesson.referenceVocabulary}
                  title="参考词汇 Vocabulário de referência"
                  selectedItem={selectedVocabItem}
                  onSelect={setSelectedVocabItem}
                />
              )}
            </div>
          )}

          {lesson.texts?.length > 0 && (
            <div id="section-texts" className="course-section">
              <h3 className="section-title"><span className="section-icon">📜</span>课文 Texto</h3>
              {lesson.texts.map((text, i) => (
                <div key={i} className="text-block">
                  <div className="text-block-num">{text.number}.</div>
                  <TextScene text={text} />
                </div>
              ))}
            </div>
          )}

          {lesson.grammar && (
            <div id="section-grammar"><GrammarSection grammar={lesson.grammar} /></div>
          )}

          {lesson.exercises && (
            <div id="section-exercises">
              <ExercisesSection exercises={lesson.exercises} audio={lesson.audio?.exercises} />
            </div>
          )}
        </div>
      </div>

      {selectedVocabItem && (
        <div className="course-whiteboard-panel">
          <VocabWhiteboard item={selectedVocabItem} onClose={() => setSelectedVocabItem(null)} />
        </div>
      )}
    </div>
  );
}
