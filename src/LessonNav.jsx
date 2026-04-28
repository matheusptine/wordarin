const SECTION_ORDER = [
  { key: 'audio',      label: 'Listening',           check: l => l.audio?.student },
  { key: 'phonetics',  label: 'Fonética',            check: l => l.phonetics },
  { key: 'characters', label: 'Caracteres & Traços', check: l => l.characters },
  { key: 'sections',   label: 'Expressões',          check: l => l.sections?.length > 0 },
  { key: 'vocabulary', label: 'Vocabulário',         check: l => l.vocabulary || l.supplementaryVocabulary || l.referenceVocabulary },
  { key: 'texts',      label: 'Textos / Diálogos',  check: l => l.texts?.length > 0 },
  { key: 'grammar',    label: 'Gramática',           check: l => l.grammar?.length > 0 },
  { key: 'exercises',  label: 'Exercícios',          check: l => l.exercises?.length > 0 },
];

function getSubsections(lesson) {
  if (!lesson) return [];
  return SECTION_ORDER.filter(({ check }) => check(lesson));
}

function scrollToSection(key) {
  const el = document.getElementById('section-' + key);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Lessons with index > FREE_LESSON_COUNT require a login.
const FREE_LESSON_COUNT = 2;

export default function LessonNav({ lessons, activeId, onSelect, user, onLoginRequest }) {
  const isExtraActive = activeId === 'extra';
  return (
    <nav className="lesson-nav">
      <div className="lesson-nav-header">
        <span className="lesson-nav-book">当代中文</span>
        <span className="lesson-nav-subtitle">Chinês Contemporâneo · Básico 1</span>
      </div>
      <ul className="lesson-nav-list">
        {lessons.map((lesson, idx) => {
          const isActive = activeId === lesson.id;
          const subs = isActive ? getSubsections(lesson) : [];
          const locked = !user && idx >= FREE_LESSON_COUNT;
          return (
            <li key={lesson.id}>
              <button
                className={`lesson-nav-item ${isActive ? 'active' : ''} ${locked ? 'locked' : ''}`}
                onClick={() => locked ? onLoginRequest?.() : onSelect(lesson.id)}
                style={{ '--lesson-color': lesson.color || '#52b788' }}
                title={locked ? 'Cria uma conta gratuita para aceder' : undefined}
              >
                <span className="lesson-nav-number">
                  {locked ? '🔒' : lesson.number}
                </span>
                <div className="lesson-nav-text">
                  <span className="lesson-nav-title">{lesson.title}</span>
                  {lesson.chineseTitle && (
                    <span className="lesson-nav-chinese">{lesson.chineseTitle}</span>
                  )}
                </div>
              </button>
              {isActive && subs.length > 0 && (
                <ul className="lesson-nav-sub">
                  {subs.map(({ key, label }) => (
                    <li key={key}>
                      <button
                        className="lesson-nav-sub-item"
                        onClick={() => scrollToSection(key)}
                      >
                        {label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      {/* Extra section separator + FillBlanks entry */}
      <div className="lesson-nav-extra-sep" />
      <ul className="lesson-nav-list">
        <li>
          <button
            className={`lesson-nav-item lesson-nav-extra ${isExtraActive ? 'active' : ''}`}
            onClick={() => onSelect('extra')}
            style={{ '--lesson-color': '#7c3aed' }}
          >
            <span className="lesson-nav-number">✦</span>
            <div className="lesson-nav-text">
              <span className="lesson-nav-title">Complete os Textos</span>
              <span className="lesson-nav-chinese">练习</span>
            </div>
          </button>
        </li>
      </ul>
    </nav>
  );
}
