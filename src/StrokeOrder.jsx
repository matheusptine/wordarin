import { useEffect, useRef, useState } from 'react';
import HanziWriter from 'hanzi-writer';

export default function StrokeOrder({ char, size = 120, autoAnimate = false }) {
  const containerRef = useRef(null);
  const writerRef = useRef(null);
  const [animating, setAnimating] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !char) return;
    containerRef.current.innerHTML = '';
    setReady(false);
    setError(false);
    setAnimating(false);

    const writer = HanziWriter.create(containerRef.current, char, {
      width: size,
      height: size,
      padding: 8,
      showOutline: true,
      showCharacter: true,
      strokeColor: '#1b4332',
      outlineColor: '#d8f3dc',
      drawingColor: '#40916c',
      strokeAnimationSpeed: 1.5,
      delayBetweenStrokes: 200,
      onLoadCharDataSuccess: () => setReady(true),
      onLoadCharDataError: () => setError(true),
    });

    writerRef.current = writer;

    if (autoAnimate) {
      writer.loopCharacterAnimation();
      setAnimating(true);
    }

    return () => {
      try { writer.cancelAnimation(); } catch (_) {}
    };
  }, [char, size, autoAnimate]);

  const handleAnimate = () => {
    if (!writerRef.current || !ready) return;
    setAnimating(true);
    writerRef.current.animateCharacter({
      onComplete: () => setAnimating(false),
    });
  };

  const handleQuiz = () => {
    if (!writerRef.current || !ready) return;
    writerRef.current.quiz({
      onComplete: () => setAnimating(false),
    });
  };

  return (
    <div className="stroke-order-widget">
      <div
        ref={containerRef}
        className="stroke-canvas"
        style={{ width: size, height: size }}
        title={error ? 'Caractere não disponível' : char}
      />
      {error && (
        <div className="stroke-error">
          <span className="stroke-char-fallback" style={{ fontSize: size * 0.6 }}>{char}</span>
        </div>
      )}
      {!error && (
        <div className="stroke-controls">
          <button
            className="stroke-btn"
            onClick={handleAnimate}
            disabled={!ready || animating}
            title="Animar traços"
          >
            ▶ Traços
          </button>
          <button
            className="stroke-btn stroke-btn-quiz"
            onClick={handleQuiz}
            disabled={!ready || animating}
            title="Praticar escrita"
          >
            ✏ Praticar
          </button>
        </div>
      )}
    </div>
  );
}
