import { useState } from 'react';
import { Lock } from 'lucide-react';
import LoginModal from '../auth/LoginModal';

/**
 * Shows children when unlocked; otherwise shows a lock overlay.
 * @param {boolean}  locked       Whether the gate is active
 * @param {string}   reason       Short message shown to the user
 * @param {string}   cta          Button label (default: 'Criar conta grátis')
 * @param {'modal'|'inline'} variant  'modal' (default) or 'inline' for inline banners
 */
export default function ProtectedFeature({ locked, reason, cta = 'Criar conta grátis', variant = 'modal', children }) {
  const [showModal, setShowModal] = useState(false);

  if (!locked) return children;

  if (variant === 'inline') {
    return (
      <>
        {children}
        <div className="pf-inline-banner">
          <Lock size={14} />
          <span>{reason}</span>
          <button className="pf-inline-btn" onClick={() => setShowModal(true)}>{cta}</button>
          {showModal && <LoginModal onClose={() => setShowModal(false)} initialTab="signup" />}
        </div>
      </>
    );
  }

  return (
    <div className="pf-gate">
      <div className="pf-overlay">
        <div className="pf-lock-icon"><Lock size={32} /></div>
        <p className="pf-reason">{reason}</p>
        <button className="pf-cta" onClick={() => setShowModal(true)}>{cta}</button>
        <p className="pf-or">ou <button className="pf-login-link" onClick={() => setShowModal(true)}>já tenho conta</button></p>
      </div>
      <div className="pf-blur-content" aria-hidden>{children}</div>
      {showModal && <LoginModal onClose={() => setShowModal(false)} initialTab="signup" />}
    </div>
  );
}
