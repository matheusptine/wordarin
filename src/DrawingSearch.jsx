import { useRef, useState, useEffect, useCallback } from 'react';

// HanziLookup (MIT) – gugray/HanziLookupJS – served from public/
const HL_SCRIPT   = '/hanzilookup.min.js';
const HL_DATA_KEY = 'mmah';
const HL_DATA_URL = '/mmah.json';
const CANVAS_PX   = 220;

let hlState = 'idle';
const hlWaiters = [];

function loadHanziLookup() {
  return new Promise((resolve, reject) => {
    if (hlState === 'ready')  { resolve(); return; }
    if (hlState === 'error')  { reject(new Error('load failed')); return; }
    hlWaiters.push({ resolve, reject });
    if (hlState === 'loading') return;
    hlState = 'loading';

    const script  = document.createElement('script');
    script.src    = HL_SCRIPT;
    script.onload = () => {
      window.HanziLookup.init(HL_DATA_KEY, HL_DATA_URL, () => {
        hlState = 'ready';
        hlWaiters.forEach(w => w.resolve());
        hlWaiters.length = 0;
      });
    };
    script.onerror = () => {
      hlState = 'error';
      const e = new Error('Failed to load HanziLookup');
      hlWaiters.forEach(w => w.reject(e));
      hlWaiters.length = 0;
    };
    document.head.appendChild(script);
  });
}

export default function DrawingSearch({ onResult }) {
  const canvasRef   = useRef(null);
  const boardRef    = useRef(null);   // HanziLookup.DrawingBoard instance
  const matcherRef  = useRef(null);  // HanziLookup.Matcher instance
  const [status, setStatus]           = useState('idle');
  const [candidates, setCandidates]   = useState([]);
  const [strokeCount, setStrokeCount] = useState(0);

  const recognize = useCallback(() => {
    if (!boardRef.current || !matcherRef.current) return;
    try {
      const strokes = boardRef.current.cloneStrokes();
      if (!strokes || strokes.length === 0) return;
      setStrokeCount(strokes.length);
      const analyzed = new window.HanziLookup.AnalyzedCharacter(strokes);
      const chars = [];
      matcherRef.current.match(analyzed, 12, (match) => {
        chars.push(match.character);
      });
      setCandidates(chars);
    } catch (err) {
      console.error('HanziLookup recognition error:', err);
    }
  }, []);

  // Initialize DrawingBoard once library is ready
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setStatus('loading');
    loadHanziLookup()
      .then(() => {
        // DrawingBoard manages its own mouse/touch listeners on the canvas
        boardRef.current  = new window.HanziLookup.DrawingBoard(canvas, {});
        matcherRef.current = new window.HanziLookup.Matcher(HL_DATA_KEY, 0.25);
        setStatus('ready');

        // Hook into stroke-end events to trigger recognition.
        // DrawingBoard draws internally; we listen on the same element.
        const onUp = () => setTimeout(recognize, 30);
        canvas.addEventListener('mouseup',  onUp);
        canvas.addEventListener('touchend', onUp, { passive: true });
        return () => {
          canvas.removeEventListener('mouseup',  onUp);
          canvas.removeEventListener('touchend', onUp);
        };
      })
      .catch(() => setStatus('error'));
  // recognize is stable (useCallback with no deps that change)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clear = useCallback(() => {
    if (!boardRef.current) return;
    // DrawingBoard.redraw() redraws the grid but keeps strokes.
    // We need to reset the board by re-creating it.
    const canvas = canvasRef.current;
    if (!canvas) return;
    boardRef.current = new window.HanziLookup.DrawingBoard(canvas, {});
    setCandidates([]);
    setStrokeCount(0);
  }, []);

  return (
    <div className="drawing-search">
      <div className="drawing-area">
        <canvas
          ref={canvasRef}
          width={CANVAS_PX}
          height={CANVAS_PX}
          className="drawing-canvas"
          style={{ cursor: status === 'ready' ? 'crosshair' : 'default' }}
        />
        <div className="drawing-controls">
          <button
            className="drawing-clear-btn"
            onClick={clear}
            disabled={status !== 'ready' || strokeCount === 0}
          >
            Limpar
          </button>
          {strokeCount > 0 && (
            <span className="drawing-strokes">
              {strokeCount} traço{strokeCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {status === 'loading' && (
        <div className="drawing-status">A carregar reconhecimento...</div>
      )}
      {status === 'error' && (
        <div className="drawing-status drawing-error">
          Falha ao carregar. Verifique a conexão.
        </div>
      )}
      {status === 'ready' && strokeCount === 0 && (
        <div className="drawing-hint">Desenhe um hanzi no quadrado acima</div>
      )}
      {candidates.length > 0 && (
        <div className="drawing-candidates">
          {candidates.map((c, i) => (
            <button
              key={i}
              className={`drawing-cand-btn ${i === 0 ? 'drawing-cand-top' : ''}`}
              onClick={() => onResult(c)}
              title="Clique para pesquisar"
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
