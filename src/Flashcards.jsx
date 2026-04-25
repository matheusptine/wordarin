import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, Eye, EyeOff, Shuffle, Play, Square } from 'lucide-react';
import { pinyin } from 'pinyin-pro';

const HANZI_KEY = 'Chinês (汉字)';
const PINYIN_KEY = 'Pinyin';
const PT_KEY = 'Português';

const Flashcards = ({ showPinyin = true, showHanzi = true, speechRate = 1.0 }) => {
  const [decks, setDecks] = useState([]);
  const [deckIdx, setDeckIdx] = useState(0);
  const [cardIdx, setCardIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [order, setOrder] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const playSeqRef = useRef(0);
  const activeAudioRef = useRef(null);

  useEffect(() => {
    fetch('/flashcards.json')
      .then(r => r.json())
      .then(data => setDecks(data.decks || []))
      .catch(err => console.error('flashcards load failed', err));
  }, []);

  const deck = decks[deckIdx];
  const cards = deck?.cards || [];

  useEffect(() => {
    const base = cards.map((_, i) => i);
    setOrder(shuffled ? base.sort(() => Math.random() - 0.5) : base);
    setCardIdx(0);
    setRevealed(false);
  }, [deckIdx, shuffled, cards.length]);

  const currentCard = cards[order[cardIdx]];

  const stopPlayback = () => {
    playSeqRef.current += 1;
    window.speechSynthesis.cancel();
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
    setIsPlaying(false);
  };

  const handlePlay = async () => {
    if (isPlaying) { stopPlayback(); return; }
    const text = currentCard?.[HANZI_KEY];
    if (!text) return;

    playSeqRef.current += 1;
    const seq = playSeqRef.current;
    setIsPlaying(true);

    if (speechRate < 0.5) {
      const chars = text.match(/[\u4e00-\u9fa5]/g) || [];
      for (const ch of chars) {
        if (playSeqRef.current !== seq) return;
        const url = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(ch)}&le=zh`;
        await new Promise(resolve => {
          const audio = new Audio(url);
          activeAudioRef.current = audio;
          audio.onended = resolve;
          audio.onerror = () => resolve();
          audio.play().catch(() => resolve());
        });
        activeAudioRef.current = null;
        if (playSeqRef.current !== seq) return;
        await new Promise(r => setTimeout(r, Math.max(0, (0.5 - speechRate) * 3000 + 400)));
      }
    } else {
      window.speechSynthesis.cancel();
      await new Promise(r => setTimeout(r, 100));
      if (playSeqRef.current !== seq) return;
      await new Promise(resolve => {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'zh-CN';
        u.rate = speechRate;
        const voices = window.speechSynthesis.getVoices();
        const zh = voices.find(v => v.lang.includes('zh') || v.lang.includes('cmn'));
        if (zh) u.voice = zh;
        u.onend = resolve;
        u.onerror = () => resolve();
        window.speechSynthesis.speak(u);
      });
    }
    if (playSeqRef.current === seq) setIsPlaying(false);
  };

  const handlePrev = () => {
    stopPlayback();
    setRevealed(false);
    setCardIdx(i => (i - 1 + cards.length) % cards.length);
  };
  const handleNext = () => {
    stopPlayback();
    setRevealed(false);
    setCardIdx(i => (i + 1) % cards.length);
  };

  const hanziWithRuby = useMemo(() => {
    if (!currentCard) return null;
    const text = currentCard[HANZI_KEY] || '';
    return (
      <span className="flashcard-hanzi-inner">
        {Array.from(text).map((ch, i) => {
          if (/[\u4E00-\u9FA5]/.test(ch)) {
            const py = pinyin(ch, { type: 'array' })[0] || '';
            return (
              <span key={i} className="fc-char">
                <span className="fc-pinyin">{py}</span>
                <span className="fc-hz">{ch}</span>
              </span>
            );
          }
          return <span key={i} className="fc-punct">{ch}</span>;
        })}
      </span>
    );
  }, [currentCard]);

  const panelClass = [
    'flashcards-panel',
    !showPinyin ? 'hide-pinyin' : '',
    !showHanzi  ? 'hide-hanzi'  : '',
  ].filter(Boolean).join(' ');

  if (!decks.length) {
    return (
      <div className={panelClass}>
        <div className="flashcards-loading">Loading…</div>
      </div>
    );
  }

  return (
    <div className={panelClass}>
      <div className="flashcards-header">
        <select
          className="flashcards-deck-select"
          value={deckIdx}
          onChange={(e) => setDeckIdx(parseInt(e.target.value, 10))}
        >
          {decks.map((d, i) => (
            <option key={i} value={i}>{d.deck}</option>
          ))}
        </select>
        <span className="flashcards-counter">
          {cards.length ? `${cardIdx + 1}/${cards.length}` : '0/0'}
        </span>
      </div>

      <div className="flashcards-card">
        {currentCard ? (
          <>
            <div className="flashcards-hanzi">{hanziWithRuby}</div>
            <div className={`flashcards-back ${revealed ? 'revealed' : ''}`}>
              <div className="flashcards-pt">{currentCard[PT_KEY]}</div>
            </div>
          </>
        ) : (
          <div className="flashcards-empty">No cards</div>
        )}
      </div>

      <div className="flashcards-controls">
        <button className="flashcards-btn" onClick={handlePrev} title="Anterior">
          ‹
        </button>
        <button
          className={`flashcards-btn ${isPlaying ? 'active' : ''}`}
          onClick={handlePlay}
          title={isPlaying ? 'Parar' : 'Ouvir'}
        >
          {isPlaying ? '■' : '▶'}
        </button>
        <button
          className={`flashcards-btn flashcards-reveal ${revealed ? 'active' : ''}`}
          onClick={() => setRevealed(r => !r)}
          title="Ver resposta"
        >
          {revealed ? 'Ocultar' : 'Revelar'}
        </button>
        <button
          className={`flashcards-btn ${shuffled ? 'active' : ''}`}
          onClick={() => setShuffled(s => !s)}
          title="Baralhar"
        >
          ⇄
        </button>
        <button className="flashcards-btn" onClick={handleNext} title="Próximo">
          ›
        </button>
      </div>
    </div>
  );
};

export default Flashcards;
