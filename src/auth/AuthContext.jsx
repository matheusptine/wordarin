import { useState, useEffect } from 'react';
import { AuthContext } from './_context';

// Auth persisted in localStorage — swap this service object for Supabase later.
const AUTH_KEY = 'wordarin-auth';
const USERS_KEY = 'wordarin-users';

function loadUser() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY)); } catch { return null; }
}

function loadUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || {}; } catch { return {}; }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Very simple hash — NOT cryptographically secure, replace with real auth for production.
async function hashPassword(pw) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser);

  useEffect(() => {
    if (user) localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    else localStorage.removeItem(AUTH_KEY);
  }, [user]);

  async function signup(email, password, name) {
    const users = loadUsers();
    const key = email.toLowerCase();
    if (users[key]) throw new Error('Este email já está registado.');
    const hash = await hashPassword(password);
    const newUser = { id: crypto.randomUUID(), email: key, name: name || email.split('@')[0], createdAt: new Date().toISOString() };
    users[key] = { ...newUser, hash };
    saveUsers(users);
    setUser(newUser);
    return newUser;
  }

  async function login(email, password) {
    const users = loadUsers();
    const key = email.toLowerCase();
    const stored = users[key];
    if (!stored) throw new Error('Email não encontrado.');
    const hash = await hashPassword(password);
    if (hash !== stored.hash) throw new Error('Senha incorrecta.');
    const u = { id: stored.id, email: stored.email, name: stored.name, createdAt: stored.createdAt };
    setUser(u);
    return u;
  }

  function logout() {
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

