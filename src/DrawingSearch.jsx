import { useRef, useState, useEffect, useCallback } from 'react';

// HanziLookup (MIT) – gugray/HanziLookupJS
// Files served from public/ to avoid MIME-type CORS issues with CDNs.
const HL_SCRIPT   = '/hanzilookup.min.js';
const HL_DATA_KEY = 'mmah';
const HL_DATA_URL = '/mmah.json';

const COORD_MAX = 256; // HanziLookupJS uses 0-256 coordinate space
const CANVAS_PX = 220;

let hlState = 'idle'; // idle | loading | ready | error
const hlWaiters = [];

function loadHanziLookup() {
  return new Promise((resolve, reject) => {
    if (hlState === 'ready')  { resolve(); return; }
    if (hlState === 'error')  { reject(new Error('Previously failed')); return; }
    hlWaiters.push({ resolve, reject });
    if (hlState === 'loading') return;
    hlState = 'loading';

    const script    = document.createElement('script');
    script.src      = HL_SCRIPT;
    script.onload   = () => {
      // HanziLookup.init loads the JSON via XHR internally
      window.HanziLookup.init(HL_DATA_KEY, HL_DATA_URL, () => {
        hlState = 'ready';
        hlWaiters.forEach(w => w.resolve());
        hlWaiters.length = 0;
      });
    };
    script.onerror  = () => {
      hlState = 'error';
      const err = new Error('Failed to load HanziLookup script');
      hlWaiters.forEach(w => w.reject(err));
      hlWaiters.length = 0;
    };
    document.head.appendChild(script);
  });
}

function canvasPt(canvas, e) {
  const rect = canvas.getBoundingClientRect();
  const src  = e.touches ? e.touches[0] : e;
  return [
    Math.round(((src.clientX - rect.left) / rect.width)  * COORD_MAX),
    Math.round(((src.clientY - rect.top)  / rect.height) * COORD_MAX),
  ];
}

export default function DrawingSearch({ onResult }) {
  const canvasRef   = useRef(null);
  const matcherRef  = useRef(null);
  const strokes     = useRef([]);      // completed strokes: [[[x,y],...], ...]
  const curStroke   = useRef(null);    // current stroke points while drawing
  const isDown      = useRef(false);
  const [status, setStatus]           = useState('idle');
  const [candidates, setCandidates]   = useState([]);
  const [strokeCount, setStrokeCount] = useState(0);

  useEffect(() => {
    setStatus('loading');
    loadHanziLookup()
      .then(() => {
        matcherRef.current = new window.HanziLookup.Matcher(HL_DATA_KEY, 0.25);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const s   = CANVAS_PX;
    ctx.clearRect(0, 0, s, s);

    // Guide lines
    ctx.strokeStyle = '#d1fae5';
    ctx.lineWidth   = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(s / 2, 0); ctx.lineTo(s / 2, s);
    ctx.moveTo(0, s / 2); ctx.lineTo(s, s / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    const scale = s / COORD_MAX;

    // Draw committed strokes
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth   = 3;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    for (const stroke of strokes.current) {
      if (stroke.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0][0] * scale, stroke[0][1] * scale);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i][0] * scale, stroke[i][1] * scale);
      }
      ctx.stroke();
    }

    // Draw current stroke in green
    if (curStroke.current && curStroke.current.length >= 2) {
      ctx.strokeStyle = '#15803d';
      ctx.beginPath();
      ctx.moveTo(curStroke.current[0][0] * scale, curStroke.current[0][1] * scale);
      for (let i = 1; i < curStroke.current.length; i++) {
        ctx.lineTo(curStroke.current[i][0] * scale, curStroke.current[i][1] * scale);
      }
      ctx.stroke();
    }
  }, []);

  const recognize = useCallback(() => {
    if (!matcherRef.current || strokes.current.length === 0) return;
    try {
      const analyzed = new window.HanziLookup.AnalyzedCharacter(strokes.current);
      const results  = [];
      matcherRef.current.match(analyzed, 12, (match) => {
        results.push(match.character);
      });
      setCandidates(results);
    } catch (_) {}
  }, []);

  const onDown = useCallback((e) => {
    e.preventDefault();
    if (status !== 'ready') return;
    isDown.current  = true;
    curStroke.current = [canvasPt(canvasRef.current, e)];
    redraw();
  }, [status, redraw]);

  const onMove = useCallback((e) => {
    e.preventDefault();
    if (!isDown.current) return;
    curStroke.current.push(canvasPt(canvasRef.current, e));
    redraw();
  }, [redraw]);

  const onUp = useCallback((e) => {
    e.preventDefault();
    if (!isDown.current) return;
    isDown.current = false;
    if (curStroke.current && curStroke.current.length > 0) {
      strokes.current.push(curStroke.current);
      setStrokeCount(strokes.current.length);
    }
    curStroke.current = null;
    redraw();
    recognize();
  }, [redraw, recognize]);

  const clear = useCallback(() => {
    strokes.current   = [];
    curStroke.current = null;
    isDown.current    = false;
    setStrokeCount(0);
    setCandidates([]);
    redraw();
  }, [redraw]);

  // Attach with { passive: false } so preventDefault works on touch
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const o = { passive: false };
    canvas.addEventListener('mousedown',  onDown, o);
    canvas.addEventListener('mousemove',  onMove, o);
    canvas.addEventListener('mouseup',    onUp,   o);
    canvas.addEventListener('mouseleave', onUp,   o);
    canvas.addEventListener('touchstart', onDown, o);
    canvas.addEventListener('touchmove',  onMove, o);
    canvas.addEventListener('touchend',   onUp,   o);
    return () => {
      canvas.removeEventListener('mousedown',  onDown);
      canvas.removeEventListener('mousemove',  onMove);
      canvas.removeEventListener('mouseup',    onUp);
      canvas.removeEventListener('mouseleave', onUp);
      canvas.removeEventListener('touchstart', onDown);
      canvas.removeEventListener('touchmove',  onMove);
      canvas.removeEventListener('touchend',   onUp);
    };
  }, [onDown, onMove, onUp]);

  useEffect(() => { if (status === 'ready') redraw(); }, [status, redraw]);

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
              title="Clique para buscar"
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
