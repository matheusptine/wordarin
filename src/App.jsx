import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import WordarinEditor from './Editor';
import Toolbar from './Toolbar';
import Flashcards from './Flashcards';
import { createEditor, Node, Editor } from 'slate';
import { withReact } from 'slate-react';
import { withHistory } from 'slate-history';
import './index.css';

const LOCAL_STORAGE_KEY = 'wordarin-content';

const initialValue = [
  {
    type: 'paragraph',
    children: [
      { text: 'Start typing here! 尝试输入中文以查看拼音。' },
    ],
  },
];

const App = () => {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [translations, setTranslations] = useState({});
  const [showPinyin, setShowPinyin] = useState(true);
  
  const [isLooping, setIsLooping] = useState(false);
  const isLoopingRef = useRef(isLooping);
  const playSeqIdRef = useRef(0);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const activeAudioRef = useRef(null);

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

  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return initialValue;
  });

  const [savedSelection, setSavedSelection] = useState(null);

  const handleChange = (newValue) => {
    setValue(newValue);
    if (editor.selection) {
      setSavedSelection(editor.selection);
    }
    
    const isAstChange = Object.keys(newValue).length > 0; 
    if (isAstChange) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newValue));
    }
  };

  const translationsRef = useRef(translations);
  useEffect(() => { translationsRef.current = translations; }, [translations]);

  useEffect(() => {
    const handler = setTimeout(() => {
      value.forEach((node, index) => {
        const text = Node.string(node);
        const focusedPath = editor.selection?.focus?.path;
        const isEditingThisLine = focusedPath && focusedPath[0] === index;

        if (text.trim().length === 0) {
           setTranslations(prev => {
             if (prev[index]) {
               const n = {...prev}; delete n[index]; return n;
             }
             return prev;
           });
           return;
        }

        if (!isEditingThisLine) {
           const cached = translationsRef.current[index];
           if (!cached || cached.source !== text) {
               
               // Mark as loading to avoid double-firing
               translationsRef.current[index] = { source: text, english: cached?.english || '...', loading: true };
               setTranslations(prev => ({ ...prev, [index]: translationsRef.current[index] }));

               // Fetch proper async
               (async () => {
                   try {
                     const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=en&dt=t&q=${encodeURIComponent(text)}`;
                     const res = await fetch(url);
                     const data = await res.json();
                     const english = data[0].map(x => x[0]).join('');
                     
                     translationsRef.current[index] = { source: text, english, loading: false };
                     setTranslations(prev => ({ ...prev, [index]: translationsRef.current[index] }));
                   } catch(e) {
                     translationsRef.current[index] = { source: text, english: 'Error reading API limit.', loading: false };
                     setTranslations(prev => ({ ...prev, [index]: translationsRef.current[index] }));
                   }
               })();
           }
        }
      });
    }, 1200);

    return () => clearTimeout(handler);
  }, [value, editor.selection]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleTxtExport = useCallback(() => {
    const textContent = value.map(n => Node.string(n)).join('\n');
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Wordarin.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [value]);

  const handlePlay = useCallback(() => {
    if (isPlaying) {
      stopPlayback();
      return;
    }

    playSeqIdRef.current += 1;
    const currentSeqId = playSeqIdRef.current;

    let textToSpeak = '';
    
    if (editor.selection) {
      try {
        textToSpeak = Editor.string(editor, editor.selection);
      } catch (e) {
        console.error("Slate selection error:", e);
      }
    }

    if (!textToSpeak) {
      const selection = window.getSelection();
      textToSpeak = selection ? selection.toString() : '';
    }

    if (!textToSpeak || textToSpeak.trim().length === 0) {
      alert("No text detected. Please highlight a word first!");
      return;
    }

    setIsPlaying(true);

    const runPlaybackLoop = async () => {
      if (playSeqIdRef.current !== currentSeqId) return; // aborted

      if (speechRate < 0.5) {
        window.speechSynthesis.cancel(); 

        const chars = textToSpeak.match(/[\u4e00-\u9fa5]/g);
        if (!chars) {
          alert("No Chinese characters detected to play slowly!");
          setIsPlaying(false);
          return;
        }

        for (let char of chars) {
          if (playSeqIdRef.current !== currentSeqId) return;

          const url = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(char)}&le=zh`;
          await new Promise((resolve) => {
            const audio = new Audio(url);
            activeAudioRef.current = audio;
            audio.onended = resolve;
            audio.onerror = () => resolve(); 
            audio.play().catch(() => resolve());
          });
          activeAudioRef.current = null;
          
          if (playSeqIdRef.current !== currentSeqId) return;
          const delay = Math.max(0, (0.5 - speechRate) * 3000 + 400);
          await new Promise(r => setTimeout(r, delay));
        }

      } else {
        window.speechSynthesis.cancel(); 
        await new Promise(r => setTimeout(r, 100)); // bypass native bug
        if (playSeqIdRef.current !== currentSeqId) return;

        await new Promise((resolve) => {
          const utterance = new SpeechSynthesisUtterance(textToSpeak);
          utterance.lang = 'zh-CN'; 
          utterance.rate = speechRate; 
          
          const voices = window.speechSynthesis.getVoices();
          const zhVoice = voices.find(v => v.lang.includes('zh') || v.lang.includes('cmn'));
          if (zhVoice) utterance.voice = zhVoice;
          
          window._activeUtterance = utterance;

          utterance.onerror = (event) => {
            console.error('SpeechSynthesis error:', event);
            resolve();
          };

          utterance.onend = () => {
             window._activeUtterance = null;
             resolve();
          };

          window.speechSynthesis.speak(utterance);
        });
      }

      // Chain the loop if enabled
      if (playSeqIdRef.current === currentSeqId) {
        if (isLoopingRef.current) {
          await new Promise(r => setTimeout(r, 1200)); // Natural break at the end of the sentence
          if (playSeqIdRef.current === currentSeqId && isLoopingRef.current) {
             runPlaybackLoop(); // Repeat!
          } else {
             setIsPlaying(false);
          }
        } else {
          setIsPlaying(false);
        }
      }
    };

    runPlaybackLoop();

  }, [editor, speechRate, isPlaying, stopPlayback]);

  return (
    <div className="app-container">
      <Toolbar 
        editor={editor}
        savedSelection={savedSelection}
        onPrint={handlePrint} 
        onTxtExport={handleTxtExport} 
        onPlay={handlePlay} 
        isPlaying={isPlaying}
        speechRate={speechRate}
        onSpeechRateChange={setSpeechRate}
        isLooping={isLooping}
        onToggleLoop={handleToggleLoop}
        showPinyin={showPinyin}
        onTogglePinyin={() => setShowPinyin(!showPinyin)}
      />
      <div className="workspace">
        <Flashcards showPinyin={showPinyin} speechRate={speechRate} />
        <WordarinEditor editor={editor} value={value} onChange={handleChange} showPinyin={showPinyin} />
        
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
  );
};

export default App;
