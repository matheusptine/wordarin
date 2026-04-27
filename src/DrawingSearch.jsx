import { useRef, useState, useEffect, useCallback } from 'react';

// HanziLookupJS (MIT) – gugray/HanziLookupJS
// NOTE: HanziLookup.DrawingBoard requires jQuery — we implement our own canvas
// drawing and call AnalyzedCharacter + Matcher directly.
const HL_SCRIPT   = '/hanzilookup.min.js';
const HL_DATA_KEY = 'mmah';
const HL_DATA_URL = '/mmah.json';

// Coordinate range HanziLookup uses internally (matches its DrawingBoard canvas size)
const COORD = 256;
const CANVAS_PX = 220;

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
      // init() fetches mmah.json via XHR and populates HanziLookup.data
      window.HanziLookup.init(HL_DATA_KEY, HL_DATA_URL, () => {
        hlState = 'ready';
        hlWaiters.forEach(w => w.resolve());
        hlWaiters.length = 0;
      });
    };
    script.onerror = () => {
      hlState = 'error';
      const e = new Error('Script load failed');
      hlWaiters.forEach(w => w.reject(e));
      hlWaiters.length = 0;
    };
    document.head.appendChild(script);
  });
}

// Convert canvas pixel coords to 0–256 range
function toCoord(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return [
    Math.round(((clientX - rect.left) / rect.width)  * COORD),
    Math.round(((clientY - rect.top)  / rect.height) * COORD),
  ];
}

function getXY(canvas, e) {
  const src = e.touches ? e.touches[0] : e;
  return toCoord(canvas, src.clientX, src.clientY);
}

export default function DrawingSearch({ onResult }) {
  const canvasRef   = useRef(null);
  const matcherRef  = useRef(null);
  const strokes     = useRef([]);     // completed: [[[x,y],...], ...]
  const curStroke   = useRef(null);   // in-progress: [[x,y],...]
  const isDown      = useRef(false);

  const [status, setStatus]           = useState('idle');
  const [candidates, setCandidates]   = useState([]);
  const [strokeCount, setStrokeCount] = useState(0);

  // Load library once
  useEffect(() => {
    setStatus('loading');
    loadHanziLookup()
      .then(() => {
        matcherRef.current = new window.HanziLookup.Matcher(HL_DATA_KEY, 0.25);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  // Draw everything on the canvas
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const s   = CANVAS_PX;
    ctx.clearRect(0, 0, s, s);

    // Grid guide (matches DrawingBoard's visual style)
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth   = 0.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.rect(0, 0, s, s);
    ctx.moveTo(0, 0); ctx.lineTo(s, s);
    ctx.moveTo(s, 0); ctx.lineTo(0, s);
    ctx.moveTo(s / 2, 0); ctx.lineTo(s / 2, s);
    ctx.moveTo(0, s / 2); ctx.lineTo(s, s / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    const scale = s / COORD;
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth   = 3;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';

    for (const stroke of strokes.current) {
      if (stroke.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0][0] * scale, stroke[0][1] * scale);
      for (let i = 1; i < stroke.length; i++) ctx.lineTo(stroke[i][0] * scale, stroke[i][1] * scale);
      ctx.stroke();
    }

    if (curStroke.current && curStroke.current.length >= 2) {
      ctx.strokeStyle = '#15803d';
      ctx.beginPath();
      ctx.moveTo(curStroke.current[0][0] * scale, curStroke.current[0][1] * scale);
      for (let i = 1; i < curStroke.current.length; i++) ctx.lineTo(curStroke.current[i][0] * scale, curStroke.current[i][1] * scale);
      ctx.stroke();
    }
  }, []);

  // Recognition: pass strokes to HanziLookup
  const recognize = useCallback(() => {
    if (!matcherRef.current || strokes.current.length === 0) return;
    try {
      const analyzed = new window.HanziLookup.AnalyzedCharacter(strokes.current);
      // match() calls the callback ONCE with the full results array
      matcherRef.current.match(analyzed, 12, (matches) => {
        setCandidates(matches.map(m => m.character));
      });
    } catch (err) {
      console.error('Recognition error:', err);
    }
  }, []);

  const onDown = useCallback((e) => {
    e.preventDefault();
    if (status !== 'ready') return;
    isDown.current    = true;
    curStroke.current = [getXY(canvasRef.current, e)];
    redraw();
  }, [status, redraw]);

  const onMove = useCallback((e) => {
    e.preventDefault();
    if (!isDown.current) return;
    curStroke.current.push(getXY(canvasRef.current, e));
    redraw();
  }, [redraw]);

  const onUp = useCallback((e) => {
    e.preventDefault();
    if (!isDown.current) return;
    isDown.current = false;
    if (curStroke.current?.length > 0) {
      strokes.current.push([...curStroke.current]);
      setStrokeCount(strokes.current.length);
    }
    curStroke.current = null;
    redraw();
    recognize();
  }, [redraw, recognize]);

  // Attach with { passive: false } so we can call preventDefault on touch
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

  // Initial grid
  useEffect(() => { if (status === 'ready') redraw(); }, [status, redraw]);

  const clear = useCallback(() => {
    strokes.current   = [];
    curStroke.current = null;
    isDown.current    = false;
    setStrokeCount(0);
    setCandidates([]);
    redraw();
  }, [redraw]);

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
            <span className="drawing-strokes">{strokeCount} traço{strokeCount !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>

      {status === 'loading' && <div className="drawing-status">A carregar reconhecimento...</div>}
      {status === 'error'   && <div className="drawing-status drawing-error">Falha ao carregar. Verifique a conexão.</div>}
      {status === 'ready' && strokeCount === 0 && <div className="drawing-hint">Desenhe um hanzi no quadrado acima</div>}

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
