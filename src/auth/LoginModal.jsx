import { useState } from 'react';
import { useAuth } from './useAuth';
import { X } from 'lucide-react';

export default function LoginModal({ onClose, initialTab = 'login' }) {
  const { login, signup } = useAuth();
  const [tab, setTab] = useState(initialTab);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (tab === 'login') {
        await login(email, password);
      } else {
        if (password.length < 6) throw new Error('A senha deve ter pelo menos 6 caracteres.');
        await signup(email, password, name);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="auth-modal">
        <button className="auth-close" onClick={onClose} aria-label="Fechar">
          <X size={18} />
        </button>

        <div className="auth-logo">
          <span className="auth-logo-zh">当代中文</span>
          <span className="auth-logo-pt">Wordarin</span>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); setError(''); }}>
            Entrar
          </button>
          <button className={`auth-tab ${tab === 'signup' ? 'active' : ''}`} onClick={() => { setTab('signup'); setError(''); }}>
            Criar conta
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {tab === 'signup' && (
            <div className="auth-field">
              <label>Nome</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="O teu nome"
                autoFocus
              />
            </div>
          )}
          <div className="auth-field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="exemplo@email.com"
              required
              autoFocus={tab === 'login'}
            />
          </div>
          <div className="auth-field">
            <label>Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={tab === 'signup' ? 'Mínimo 6 caracteres' : '••••••••'}
              required
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'A processar…' : tab === 'login' ? 'Entrar' : 'Criar conta grátis'}
          </button>
        </form>

        <p className="auth-switch">
          {tab === 'login' ? (
            <>Ainda não tens conta? <button onClick={() => { setTab('signup'); setError(''); }}>Cria uma</button></>
          ) : (
            <>Já tens conta? <button onClick={() => { setTab('login'); setError(''); }}>Entra aqui</button></>
          )}
        </p>
      </div>
    </div>
  );
}
