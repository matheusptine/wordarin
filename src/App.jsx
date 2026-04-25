import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import WordarinEditor from './Editor';
import Toolbar from './Toolbar';
import Flashcards from './Flashcards';
import CourseView from './CourseView';
import LessonNav from './LessonNav';
import Exercises from './Exercises';
import Dictionary from './Dictionary';
import { useIME } from './IMEProvider';
import { createEditor, Node, Editor } from 'slate';
import { withReact } from 'slate-react';
import { withHistory } from 'slate-history';
import './index.css';

const LOCAL_STORAGE_KEY = 'wordarin-content';

const initialValue = [
  { type: 'paragraph', children: [{ text: '开始在这里输入中文！' }] },
];

const VIEWS = ['curso', 'editor', 'exercicios', 'dicionario', 'flashcards'];
const VIEW_LABELS = { curso: 'Curso', editor: 'Editor', exercicios: 'Exercícios', dicionario: 'Dicionário', flashcards: 'Flashcards' };

export default function App() {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  const [view, setView] = useState('curso');
  const [activeLessonId, setActiveLessonId] = useState('intro');
  const [courseData, setCourseData] = useState(null);

  const [speechRate, setSpeechRate] = useState(1.0);
  const [translations, setTranslations] = useState({});
  const [showPinyin, setShowPinyin] = useState(true);
  const [showHanzi, setShowHanzi] = useState(true);
  const [fontSize, setFontSize] = useState(20);
  const [isLooping, setIsLooping] = useState(false);
  const isLoopingRef = useRef(isLooping);
  const [isPlaying, setIsPlaying] = useState(false);
  const activeAudioRef = useRef(null);
  const playSeqIdRef = useRef(0);

  const ime = useIME();

  // Auto-enable IME when entering the editor, disable when leaving
  useEffect(() => {
    if (view === 'editor') ime?.activate?.();
    else ime?.deactivate?.();
  }, [view]);

  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return initialValue;
  });
  const [savedSelection, setSavedSelection] = useState(null);

  // Load course data
  useEffect(() => {
    fetch('/course-data.json')
      .then(r => r.json())
      .then(data => setCourseData(data))
      .catch(console.error);
  }, []);

  const activeLesson = courseData?.lessons?.find(l => l.id === activeLessonId) || null;

  const stopPlayback = useCallback(() => {
    playSeqIdRef.current += 1;
    setIsPlaying(false);
    window.speechSynthesis.cancel();
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
  }, []);

  const handleToggleLoop = useCallback(() => {
    setIsLooping(prev => {
      const nxt = !prev;
      isLoopingRef.current = nxt;
      return nxt;
    });
  }, []);

  const handleChange = (newValue) => {
    setValue(newValue);
    if (editor.selection) setSavedSelection(editor.selection);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newValue));
  };

  const translationsRef = useRef(translations);
  useEffect(() => { translationsRef.current = translations; }, [translations]);

  useEffect(() => {
    if (view !== 'editor') return;
    const handler = setTimeout(() => {
      value.forEach((node, index) => {
        const text = Node.string(node);
        if (text.trim().length === 0) {
          setTranslations(prev => { const n = { ...prev }; delete n[index]; return n; });
          return;
        }
        const focusedPath = editor.selection?.focus?.path;
        if (focusedPath && focusedPath[0] === index) return;
        const cached = translationsRef.current[index];
        if (!cached || cached.source !== text) {
          translationsRef.current[index] = { source: text, english: cached?.english || '...', loading: true };
          setTranslations(prev => ({ ...prev, [index]: translationsRef.current[index] }));
          (async () => {
            try {
              const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=en&dt=t&q=${encodeURIComponent(text)}`;
              const res = await fetch(url);
              const data = await res.json();
              const english = data[0].map(x => x[0]).join('');
              translationsRef.current[index] = { source: text, english, loading: false };
              setTranslations(prev => ({ ...prev, [index]: translationsRef.current[index] }));
            } catch (_) {
              translationsRef.current[index] = { source: text, english: '(erro)', loading: false };
              setTranslations(prev => ({ ...prev, [index]: translationsRef.current[index] }));
            }
          })();
        }
      });
    }, 1200);
    return () => clearTimeout(handler);
  }, [value, editor.selection, view]);

  const handlePlay = useCallback(() => {
    if (isPlaying) { stopPlayback(); return; }
    playSeqIdRef.current += 1;
    const currentSeqId = playSeqIdRef.current;
    let textToSpeak = '';
    if (editor.selection) {
      try { textToSpeak = Editor.string(editor, editor.selection); } catch (_) {}
    }
    if (!textToSpeak) {
      const sel = window.getSelection();
      textToSpeak = sel ? sel.toString() : '';
    }
    if (!textToSpeak?.trim()) { alert('Seleccione texto primeiro!'); return; }
    setIsPlaying(true);

    const runLoop = async () => {
      if (playSeqIdRef.current !== currentSeqId) return;
      if (speechRate < 0.5) {
        const chars = textToSpeak.match(/[\u4e00-\u9fa5]/g);
        if (!chars) { setIsPlaying(false); return; }
        for (const char of chars) {
          if (playSeqIdRef.current !== currentSeqId) return;
          const url = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(char)}&le=zh`;
          await new Promise(res => {
            const audio = new Audio(url);
            activeAudioRef.current = audio;
            audio.onended = res;
            audio.onerror = res;
            audio.play().catch(res);
          });
          activeAudioRef.current = null;
          if (playSeqIdRef.current !== currentSeqId) return;
          await new Promise(r => setTimeout(r, Math.max(0, (0.5 - speechRate) * 3000 + 400)));
        }
      } else {
        window.speechSynthesis.cancel();
        await new Promise(r => setTimeout(r, 100));
        if (playSeqIdRef.current !== currentSeqId) return;
        await new Promise(res => {
          const u = new SpeechSynthesisUtterance(textToSpeak);
          u.lang = 'zh-CN';
          u.rate = speechRate;
          const v = window.speechSynthesis.getVoices().find(v => v.lang.includes('zh') || v.lang.includes('cmn'));
          if (v) u.voice = v;
          u.onend = res;
          u.onerror = res;
          window.speechSynthesis.speak(u);
        });
      }
      if (playSeqIdRef.current === currentSeqId) {
        if (isLoopingRef.current) {
          await new Promise(r => setTimeout(r, 1200));
          if (playSeqIdRef.current === currentSeqId && isLoopingRef.current) runLoop();
          else setIsPlaying(false);
        } else {
          setIsPlaying(false);
        }
      }
    };
    runLoop();
  }, [editor, speechRate, isPlaying, stopPlayback]);

  return (
    <div className="app-root">
      {/* Top nav bar */}
      <header className="app-header">
        <div className="app-logo">
          <span className="app-logo-zh">当代中文</span>
          <span className="app-logo-pt">Wordarin</span>
        </div>
        <nav className="app-tabs">
          {VIEWS.map(v => (
            <button
              key={v}
              className={`app-tab ${view === v ? 'active' : ''}`}
              onClick={() => setView(v)}
            >
              {VIEW_LABELS[v]}
            </button>
          ))}
        </nav>
        <div className="header-toggles">
          <button
            className={`header-toggle-btn ${showHanzi ? 'active' : ''}`}
            onClick={() => setShowHanzi(h => !h)}
            title={showHanzi ? 'Ocultar Hanzi' : 'Mostrar Hanzi'}
          >
            汉
          </button>
          <button
            className={`header-toggle-btn ${showPinyin ? 'active' : ''}`}
            onClick={() => setShowPinyin(p => !p)}
            title={showPinyin ? 'Ocultar Pinyin' : 'Mostrar Pinyin'}
          >
            pīn
          </button>
          <button
            className={`header-toggle-btn ime-btn ${ime?.active ? 'active' : ''}`}
            onClick={() => ime?.toggle()}
            title={ime?.active ? 'Desativar IME Chinês' : 'Ativar IME Chinês (teclado pinyin)'}
          >
            IME
          </button>
          <button
            className={`header-toggle-btn ${ime?.ttsEnabled ? 'active' : ''}`}
            onClick={() => ime?.toggleTts?.()}
            title={ime?.ttsEnabled ? 'Desativar leitura em voz alta ao confirmar caractere' : 'Ativar leitura em voz alta ao confirmar caractere (fala o caractere em mandarim)'}
          >
            Voz
          </button>
        </div>
      </header>

      {/* Curso view */}
      {view === 'curso' && (
        <div className="curso-layout">
          {courseData ? (
            <LessonNav
              lessons={courseData.lessons}
              activeId={activeLessonId}
              onSelect={setActiveLessonId}
            />
          ) : (
            <div className="lesson-nav loading">A carregar...</div>
          )}
          <main className="curso-main">
            <CourseView lesson={activeLesson} showPinyin={showPinyin} showHanzi={showHanzi} />
          </main>
        </div>
      )}

      {/* Editor view */}
      {view === 'editor' && (
        <div className="app-container">
          <Toolbar
            editor={editor}
            savedSelection={savedSelection}
            onPrint={() => window.print()}
            onTxtExport={() => {
              const text = value.map(n => Node.string(n)).join('\n');
              const a = Object.assign(document.createElement('a'), {
                href: URL.createObjectURL(new Blob([text], { type: 'text/plain' })),
                download: 'Wordarin.txt',
              });
              document.body.appendChild(a);
              a.click();
              a.remove();
            }}
            onPlay={handlePlay}
            isPlaying={isPlaying}
            speechRate={speechRate}
            onSpeechRateChange={setSpeechRate}
            isLooping={isLooping}
            onToggleLoop={handleToggleLoop}
            showPinyin={showPinyin}
            onTogglePinyin={() => setShowPinyin(p => !p)}
            fontSize={fontSize}
            onFontSizeChange={setFontSize}
          />
          <div className="workspace">
            <WordarinEditor editor={editor} value={value} onChange={handleChange} showPinyin={showPinyin} fontSize={fontSize} />
            <div className="translation-gutter">
              {value.map((node, index) => {
                const t = translations[index];
                return (
                  <div key={index} className={`translation-line ${t?.loading ? 'loading' : ''}`}>
                    {t?.english || ''}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Exercises view */}
      {view === 'exercicios' && <Exercises showPinyin={showPinyin} showHanzi={showHanzi} />}

      {/* Dictionary view */}
      {view === 'dicionario' && <Dictionary />}

      {/* Flashcards view */}
      {view === 'flashcards' && (
        <div className="flashcards-fullpage">
          <Flashcards showPinyin={showPinyin} showHanzi={showHanzi} speechRate={speechRate} fullpage />
        </div>
      )}

    </div>
  );
}
