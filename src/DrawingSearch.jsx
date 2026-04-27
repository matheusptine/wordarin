import { useRef, useState, useEffect, useCallback } from 'react';

// HanziLookupJS (MIT) – gugray/HanziLookupJS
// We implement our own canvas (DrawingBoard requires jQuery).
const HL_SCRIPT   = '/hanzilookup.min.js';
const HL_DATA_KEY = 'mmah';
const HL_DATA_URL = '/mmah.json';

// HanziLookup's DrawingBoard uses a 256×256 canvas — match that coordinate space.
const COORD     = 256;
const CANVAS_PX = 280; // larger canvas = more room to draw precisely

// Minimum distance (in COORD units) between consecutive recorded points.
// DrawingBoard throttles at 50 ms; at 60 fps that's ~3 events ≈ ~4 coord units moved.
// Filtering dense points gives the pivot-detection algorithm cleaner input.
const MIN_DIST = 4;

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
      const e = new Error('Script load failed');
      hlWaiters.forEach(w => w.reject(e));
      hlWaiters.length = 0;
    };
    document.head.appendChild(script);
  });
}

function getXY(canvas, e) {
  const rect = canvas.getBoundingClientRect();
  const src  = e.touches ? e.touches[0] : e;
  return [
    Math.round(((src.clientX - rect.left) / rect.width)  * COORD),
    Math.round(((src.clientY - rect.top)  / rect.height) * COORD),
  ];
}

function dist2(a, b) {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
}

export default function DrawingSearch({ onResult }) {
  const canvasRef  = useRef(null);
  const matcherRef = useRef(null);
  const strokes    = useRef([]);    // [[x,y],...] per completed stroke
  const curStroke  = useRef(null);  // current stroke being drawn
  const isDown     = useRef(false);

  const [status, setStatus]           = useState('idle');
  const [candidates, setCandidates]   = useState([]);
  const [strokeCount, setStrokeCount] = useState(0);

  useEffect(() => {
    setStatus('loading');
    loadHanziLookup()
      .then(() => {
        // looseness 0.5 — more tolerant than the default 0.15
        matcherRef.current = new window.HanziLookup.Matcher(HL_DATA_KEY, 0.5);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  // ── Canvas drawing ─────────────────────────────────────────────────────────

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const s   = CANVAS_PX;
    ctx.clearRect(0, 0, s, s);

    // Grid guide matching DrawingBoard visual (diagonal + cross lines)
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth   = 0.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.rect(0, 0, s, s);
    ctx.moveTo(0, 0);   ctx.lineTo(s, s);
    ctx.moveTo(s, 0);   ctx.lineTo(0, s);
    ctx.moveTo(s/2, 0); ctx.lineTo(s/2, s);
    ctx.moveTo(0, s/2); ctx.lineTo(s, s/2);
    ctx.stroke();
    ctx.setLineDash([]);

    const scale = s / COORD;
    ctx.lineCap  = 'round';
    ctx.lineJoin = 'round';

    // Completed strokes
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth   = 3;
    for (const stroke of strokes.current) {
      if (stroke.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0][0] * scale, stroke[0][1] * scale);
      for (let i = 1; i < stroke.length; i++) ctx.lineTo(stroke[i][0] * scale, stroke[i][1] * scale);
      ctx.stroke();
    }

    // Current stroke in green
    if (curStroke.current?.length >= 2) {
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth   = 3;
      ctx.beginPath();
      ctx.moveTo(curStroke.current[0][0] * scale, curStroke.current[0][1] * scale);
      for (let i = 1; i < curStroke.current.length; i++) ctx.lineTo(curStroke.current[i][0] * scale, curStroke.current[i][1] * scale);
      ctx.stroke();
    }
  }, []);

  // ── Recognition ───────────────────────────────────────────────────────────

  const recognize = useCallback(() => {
    if (!matcherRef.current || strokes.current.length === 0) return;
    try {
      const analyzed = new window.HanziLookup.AnalyzedCharacter(strokes.current);
      matcherRef.current.match(analyzed, 20, (matches) => {
        setCandidates(matches.map(m => m.character));
      });
    } catch (err) {
      console.error('Recognition error:', err);
    }
  }, []);

  // ── Event handlers ────────────────────────────────────────────────────────

  const onDown = useCallback((e) => {
    e.preventDefault();
    if (status !== 'ready') return;
    isDown.current    = true;
    curStroke.current = [getXY(canvasRef.current, e)];
    redraw();
  }, [status, redraw]);

  const onMove = useCallback((e) => {
    e.preventDefault();
    if (!isDown.current || !curStroke.current) return;
    const pt   = getXY(canvasRef.current, e);
    const last = curStroke.current[curStroke.current.length - 1];
    // Only record point if mouse moved at least MIN_DIST coords — mirrors
    // DrawingBoard's 50 ms throttle and avoids over-dense point clouds.
    if (dist2(pt, last) < MIN_DIST * MIN_DIST) return;
    curStroke.current.push(pt);
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

  const undo = useCallback(() => {
    if (strokes.current.length === 0) return;
    strokes.current.pop();
    setStrokeCount(strokes.current.length);
    redraw();
    if (strokes.current.length > 0) recognize();
    else setCandidates([]);
  }, [redraw, recognize]);

  const clear = useCallback(() => {
    strokes.current   = [];
    curStroke.current = null;
    isDown.current    = false;
    setStrokeCount(0);
    setCandidates([]);
    redraw();
  }, [redraw]);

  // ── Render ────────────────────────────────────────────────────────────────

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
            className="drawing-undo-btn"
            onClick={undo}
            disabled={status !== 'ready' || strokeCount === 0}
            title="Desfazer último traço"
          >
            ↩ Desfazer
          </button>
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
          {status === 'loading' && <span className="drawing-status">A carregar...</span>}
          {status === 'error'   && <span className="drawing-status drawing-error">Erro ao carregar</span>}
        </div>
      </div>

      {status === 'ready' && strokeCount === 0 && (
        <div className="drawing-hint">
          Desenhe um hanzi — use o espaço todo e siga a ordem correcta dos traços
        </div>
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
