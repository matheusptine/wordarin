import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { useState } from 'react';
import LoginModal from '../auth/LoginModal';

const CARDS = [
  {
    id: 'curso',
    icon: '📖',
    title: 'Curso',
    zh: '课程',
    desc: 'Lições progressivas: vocabulário, gramática, diálogos e exercícios.',
    color: '#52b788',
    free: false,
    cta: 'Ir para o Curso',
  },
  {
    id: 'editor',
    icon: '✍️',
    title: 'Editor',
    zh: '编辑器',
    desc: 'Escreve em Mandarim com pinyin automático e tradução em tempo real.',
    color: '#40916c',
    free: true,
    cta: 'Abrir Editor',
  },
  {
    id: 'flashcards',
    icon: '🃏',
    title: 'Flashcards',
    zh: '卡片',
    desc: 'Revê vocabulário com cartões interactivos, áudio e modo aleatório.',
    color: '#2d6a4f',
    free: '10/dia',
    cta: 'Estudar Flashcards',
  },
  {
    id: 'extra',
    icon: '完',
    title: 'Complete os Textos',
    zh: '完形填空',
    desc: 'Exercícios de preenchimento de lacunas em textos de nível variado.',
    color: '#7c3aed',
    free: '1/dia',
    cta: 'Fazer exercício',
  },
];

const PHRASES = [
  { hz: '加油！', py: 'Jiā yóu!', pt: 'Vai em frente!' },
  { hz: '慢慢来', py: 'Màn màn lái', pt: 'Devagar se vai longe' },
  { hz: '学无止境', py: 'Xué wú zhǐ jìng', pt: 'O saber não tem fim' },
  { hz: '坚持就是胜利', py: 'Jiānchí jiùshì shènglì', pt: 'Persistir é vencer' },
];

export default function HomePage({ onNavigate }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [modal, setModal] = useState(null);
  const phrase = PHRASES[new Date().getDay() % PHRASES.length];

  function handleCard(id) {
    onNavigate(id === 'extra' ? 'curso' : id, id === 'extra' ? 'extra' : null);
  }

  return (
    <div className="home-root">
      {/* ── Welcome banner ─────────────────────────────────────── */}
      <section className="home-hero">
        <div className="home-hero-inner">
          <div className="home-hero-text">
            <h1 className="home-hero-greeting">
              {user ? `Olá, ${user.name} 👋` : 'Bem-vindo ao Wordarin'}
            </h1>
            <p className="home-hero-sub">
              {user
                ? 'Continua o teu progresso em Mandarim.'
                : 'Aprende Mandarim de forma estruturada e interactiva.'}
            </p>
            {!user && (
              <div className="home-hero-auth">
                <button className="home-cta-primary" onClick={() => setModal('signup')}>
                  Criar conta grátis
                </button>
                <button className="home-cta-ghost" onClick={() => setModal('login')}>
                  Já tenho conta
                </button>
              </div>
            )}
          </div>
          <div className="home-phrase-card">
            <div className="home-phrase-zh">{phrase.hz}</div>
            <div className="home-phrase-py">{phrase.py}</div>
            <div className="home-phrase-pt">"{phrase.pt}"</div>
          </div>
        </div>
      </section>

      {/* ── Feature cards ────────────────────────────────────────── */}
      <section className="home-cards-section">
        <h2 className="home-section-title">O que queres praticar hoje?</h2>
        <div className="home-cards-grid">
          {CARDS.map((card) => {
            const locked = !user && !card.free;
            return (
              <div
                key={card.id}
                className={`home-card ${locked ? 'locked' : ''}`}
                style={{ '--card-color': card.color }}
                onClick={() => locked ? setModal('signup') : handleCard(card.id)}
              >
                <div className="home-card-header">
                  <span className="home-card-icon">{card.icon}</span>
                  <span className="home-card-zh">{card.zh}</span>
                </div>
                <h3 className="home-card-title">{card.title}</h3>
                <p className="home-card-desc">{card.desc}</p>
                <div className="home-card-footer">
                  {locked ? (
                    <span className="home-card-lock">🔒 Conta necessária</span>
                  ) : card.free === true ? (
                    <span className="home-card-free">Totalmente livre</span>
                  ) : card.free ? (
                    <span className="home-card-limited">{card.free} sem conta</span>
                  ) : null}
                  <span className="home-card-cta">{locked ? 'Criar conta →' : `${card.cta} →`}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── About strip ──────────────────────────────────────────── */}
      <section className="home-about">
        <div className="home-about-inner">
          <div className="home-about-block">
            <span className="home-about-num">6+</span>
            <span className="home-about-label">Lições estruturadas</span>
          </div>
          <div className="home-about-sep" />
          <div className="home-about-block">
            <span className="home-about-num">300+</span>
            <span className="home-about-label">Flashcards incluídos</span>
          </div>
          <div className="home-about-sep" />
          <div className="home-about-block">
            <span className="home-about-num">∞</span>
            <span className="home-about-label">Editor sempre grátis</span>
          </div>
          <div className="home-about-sep" />
          <div className="home-about-block">
            <span className="home-about-num">HSK 1</span>
            <span className="home-about-label">Nível de referência</span>
          </div>
        </div>
      </section>

      {!user && (
        <div className="home-landing-link">
          <button onClick={() => navigate('/')}>← Ver página de apresentação</button>
        </div>
      )}

      {modal && <LoginModal onClose={() => setModal(null)} initialTab={modal} />}
    </div>
  );
}
