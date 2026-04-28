import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import LoginModal from '../auth/LoginModal';

const FEATURES = [
  {
    icon: '✍️',
    title: 'Editor de texto',
    desc: 'Escreve em Mandarim com pinyin automático acima de cada caractere e tradução em tempo real ao lado.',
    tag: 'Grátis',
  },
  {
    icon: '📖',
    title: 'Curso estruturado',
    desc: 'Lições progressivas com vocabulário, gramática, diálogos, exercícios e ordem dos traços.',
    tag: 'Conta necessária',
  },
  {
    icon: '🃏',
    title: 'Flashcards',
    desc: 'Memoriza vocabulário com flashcards animados, pinyin, áudio e modo aleatório.',
    tag: '10 cards/dia grátis',
  },
  {
    icon: '完',
    title: 'Complete os textos',
    desc: 'Exercícios de preenchimento de lacunas com textos de diferentes níveis e dificuldade ajustável.',
    tag: '1 texto/dia grátis',
  },
  {
    icon: '🔊',
    title: 'Áudio nativo',
    desc: 'Pronunciação de cada caractere, frase ou diálogo com vozes nativas e velocidade ajustável.',
    tag: 'Grátis',
  },
  {
    icon: '⌨️',
    title: 'IME integrado',
    desc: 'Escreve pinyin e converte automaticamente para hanzi sem sair do teclado.',
    tag: 'Grátis',
  },
];

const STEPS = [
  { num: '1', title: 'Começa pelo editor', desc: 'Experimenta escrever em Mandarim sem criar conta. Pinyin e tradução aparecem automaticamente.' },
  { num: '2', title: 'Cria a tua conta grátis', desc: 'Desbloqueia todas as lições do curso, flashcards ilimitados e exercícios sem limite.' },
  { num: '3', title: 'Evolui ao teu ritmo', desc: 'Acompanha o teu progresso e pratica diariamente com os exercícios e flashcards.' },
];

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [modal, setModal] = useState(null); // null | 'login' | 'signup'

  function goToApp() {
    navigate('/app');
  }

  return (
    <div className="lp-root">
      {/* ── Nav ──────────────────────────────────────────────────── */}
      <header className="lp-nav">
        <div className="lp-nav-inner">
          <div className="lp-nav-logo" onClick={goToApp} style={{ cursor: 'pointer' }}>
            <span className="lp-nav-logo-zh">当代中文</span>
            <span className="lp-nav-logo-pt">Wordarin</span>
          </div>
          <div className="lp-nav-actions">
            {user ? (
              <>
                <span className="lp-nav-user">Olá, {user.name}</span>
                <button className="lp-btn-primary" onClick={goToApp}>Ir para o app</button>
              </>
            ) : (
              <>
                <button className="lp-btn-ghost" onClick={() => setModal('login')}>Entrar</button>
                <button className="lp-btn-primary" onClick={() => setModal('signup')}>Criar conta grátis</button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="lp-hero">
        <div className="lp-hero-bg" aria-hidden />
        <div className="lp-hero-inner">
          <div className="lp-hero-badge">当代中文 · Chinês Contemporâneo</div>
          <h1 className="lp-hero-title">
            Aprende Mandarim.<br />
            <span className="lp-hero-title-accent">Do zero ao conversacional.</span>
          </h1>
          <p className="lp-hero-sub">
            Plataforma interactiva com editor de texto, curso estruturado, flashcards e exercícios.
            Começa grátis — sem cartão de crédito.
          </p>
          <div className="lp-hero-actions">
            <button className="lp-hero-cta" onClick={goToApp}>
              {user ? 'Continuar a aprender' : 'Começar grátis'}
            </button>
          </div>
          <p className="lp-hero-note">Editor completamente livre · Sem registo necessário</p>
        </div>

        {/* Floating hanzi preview */}
        <div className="lp-hero-preview" aria-hidden>
          <div className="lp-preview-card">
            <div className="lp-preview-ruby">
              {[
                { hz: '你', py: 'nǐ' },
                { hz: '好', py: 'hǎo' },
                { hz: '，', py: '' },
                { hz: '世', py: 'shì' },
                { hz: '界', py: 'jiè' },
                { hz: '！', py: '' },
              ].map((c, i) => (
                c.py
                  ? <span key={i} className="lp-preview-char"><span className="lp-preview-py">{c.py}</span><span>{c.hz}</span></span>
                  : <span key={i} className="lp-preview-punc">{c.hz}</span>
              ))}
            </div>
            <div className="lp-preview-tr">Olá, Mundo!</div>
          </div>
          <div className="lp-preview-tag">Editor · Tradução automática</div>
        </div>
      </section>

      {/* ── Features bento ───────────────────────────────────────── */}
      <section className="lp-bento">
        <div className="lp-section-inner">
          <div className="lp-bento-label">O que está incluído</div>
          <div className="lp-bento-grid">

            {/* Editor — destaque */}
            <div className="lp-bento-card lp-bento-editor" onClick={goToApp}>
              <span className="lp-bento-glyph">写</span>
              <div className="lp-bento-body">
                <div className="lp-bento-access lp-access-free">sempre grátis</div>
                <h3>Editor de texto</h3>
                <p>Escreve em Mandarim. Pinyin aparece automaticamente acima de cada caractere. Tradução ao lado, em tempo real.</p>
              </div>
              <div className="lp-bento-arrow">→</div>
            </div>

            {/* Curso */}
            <div className="lp-bento-card lp-bento-curso">
              <span className="lp-bento-glyph">课</span>
              <div className="lp-bento-body">
                <div className="lp-bento-access lp-access-account">conta necessária</div>
                <h3>Curso estruturado</h3>
                <p>Vocabulário, gramática, diálogos e exercícios por lição. Traços dos caracteres incluídos.</p>
              </div>
            </div>

            {/* Flashcards */}
            <div className="lp-bento-card lp-bento-flash">
              <span className="lp-bento-glyph">卡</span>
              <div className="lp-bento-body">
                <div className="lp-bento-access lp-access-limited">10 por dia grátis</div>
                <h3>Flashcards</h3>
                <p>Cartões com pinyin e áudio. Modo aleatório para variar.</p>
              </div>
            </div>

            {/* IME + Áudio — dois pequenos */}
            <div className="lp-bento-card lp-bento-small">
              <span className="lp-bento-glyph lp-bento-glyph-sm">声</span>
              <div className="lp-bento-body">
                <div className="lp-bento-access lp-access-free">grátis</div>
                <h3>Áudio nativo</h3>
                <p>Pronúncia caractere a caractere ou por frase.</p>
              </div>
            </div>

            <div className="lp-bento-card lp-bento-small">
              <span className="lp-bento-glyph lp-bento-glyph-sm">拼</span>
              <div className="lp-bento-body">
                <div className="lp-bento-access lp-access-free">grátis</div>
                <h3>IME integrado</h3>
                <p>Escreve pinyin, converte para hanzi no teclado.</p>
              </div>
            </div>

            {/* Fill blanks */}
            <div className="lp-bento-card lp-bento-fill">
              <span className="lp-bento-glyph">完</span>
              <div className="lp-bento-body">
                <div className="lp-bento-access lp-access-limited">1 texto/dia grátis</div>
                <h3>Complete os textos</h3>
                <p>Preenche lacunas em textos reais. Dificuldade ajustável.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section className="lp-steps">
        <div className="lp-section-inner">
          <h2 className="lp-section-title">Como funciona</h2>
          <div className="lp-steps-row">
            {STEPS.map((s, i) => (
              <div key={i} className="lp-step">
                <div className="lp-step-num">{s.num}</div>
                <h3 className="lp-step-title">{s.title}</h3>
                <p className="lp-step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA band ─────────────────────────────────────────────── */}
      <section className="lp-cta-band">
        <div className="lp-section-inner lp-cta-band-inner">
          <div>
            <h2 className="lp-cta-band-title">Começa agora. É grátis.</h2>
            <p className="lp-cta-band-sub">Editor ilimitado, lições de introdução e 10 flashcards por dia — sem registo.</p>
          </div>
          <div className="lp-cta-band-actions">
            <button className="lp-hero-cta" onClick={user ? goToApp : () => setModal('signup')}>
              {user ? 'Ir para o app' : 'Criar conta grátis'}
            </button>
            <button className="lp-btn-ghost-dark" onClick={goToApp}>Explorar sem conta</button>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-logo">
            <span className="lp-footer-logo-zh">当代中文</span>
            <span className="lp-footer-logo-pt">Wordarin</span>
          </div>
          <p className="lp-footer-copy">Plataforma de aprendizagem de Mandarim · Chinês Contemporâneo Básico 1</p>
        </div>
      </footer>

      {modal && <LoginModal onClose={() => setModal(null)} initialTab={modal} />}
    </div>
  );
}
