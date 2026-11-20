// Session feature — the screens and widgets around the signed-in user.
import { useState } from 'react';
import { CenterCard } from '../../components/Feedback.jsx';
import { GhIcon } from '../../components/Icons.jsx';

const initials = (s = '') =>
  (s.split(/[\s-_]+/).map((w) => w[0]).join('') || s || '?').slice(0, 2).toUpperCase();

export function Login() {
  return (
    <CenterCard title="Deploy Orchestrator" sub="progmise release orchestration">
      <a className="login-btn" href="/api/auth/login">{GhIcon} Sign in with GitHub</a>
    </CenterCard>
  );
}

export function Unauthorized() {
  return (
    <CenterCard title="No autorizado" sub="Tu usuario de GitHub no tiene acceso a esta herramienta.">
      <a className="btn btn-outline" href="/api/logout">Cerrar sesión</a>
    </CenterCard>
  );
}

export function UserMenu({ me }) {
  const [open, setOpen] = useState(false);
  const fullName = me?.member?.full_name || me.login;
  return (
    <div className="user">
      <button className="avatar-btn" onClick={() => setOpen((o) => !o)}>
        {me.avatar_url
          ? <img src={me.avatar_url} alt="" width="26" height="26" />
          : <span className="avatar">{initials(fullName)}</span>}
      </button>
      {open && (
        <>
          <div className="menu-overlay" onClick={() => setOpen(false)} />
          <div className="user-pop">
            <strong>{fullName}</strong>
            {me.member?.email && <small>{me.member.email}</small>}
            <small className="muted">User ID: {me.member?.github_username || me.login}</small>
            <a className="user-logout" href="/api/logout">Salir</a>
          </div>
        </>
      )}
    </div>
  );
}
