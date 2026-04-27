import { useEffect, useState } from 'react';
import HanziWriter from 'hanzi-writer';

// HanziWriter stroke path coordinate space: 0–1024, Y-origin at bottom.
// SVG default Y-origin is at top, so we need to flip: scale(1,-1) translate(0,-900).
const VIEWBOX = '0 0 1024 1024';
const TRANSFORM = 'scale(1,-1) translate(0,-900)';

const STROKE_COLOR   = '#1b4332';
const DONE_COLOR     = '#40916c';
const OUTLINE_COLOR  = '#d1fae5';

export default function StrokeOrderSteps({ char, stepSize = 72 }) {
  const [strokes, setStrokes] = useState(null);
  const [error, setError]     = useState(false);

  useEffect(() => {
    if (!char) return;
    setStrokes(null);
    setError(false);

    HanziWriter.loadCharacterData(char)
      .then(data => {
        // data.strokes is an array of SVG path strings
        if (!data?.strokes?.length) { setError(true); return; }
        setStrokes(data.strokes);
      })
      .catch(() => setError(true));
  }, [char]);

  if (error) return null;
  if (!strokes) return <div className="stroke-steps-loading">A carregar traços...</div>;

  return (
    <div className="stroke-steps-wrap">
      <div className="stroke-steps">
        {strokes.map((_, stepIdx) => (
          <div key={stepIdx} className="stroke-step">
            <svg
              viewBox={VIEWBOX}
              width={stepSize}
              height={stepSize}
              style={{ display: 'block' }}
            >
              {strokes.map((path, strokeIdx) => {
                const isDone    = strokeIdx < stepIdx;
                const isCurrent = strokeIdx === stepIdx;
                return (
                  <path
                    key={strokeIdx}
                    d={path}
                    transform={TRANSFORM}
                    fill={
                      isCurrent ? STROKE_COLOR :
                      isDone    ? DONE_COLOR   :
                                  OUTLINE_COLOR
                    }
                  />
                );
              })}
            </svg>
            <span className="stroke-step-num">{stepIdx + 1}</span>
          </div>
        ))}
      </div>
      <div className="stroke-steps-label">{strokes.length} traços</div>
    </div>
  );
}
