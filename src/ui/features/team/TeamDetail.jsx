import { useEffect, useState } from 'react';
import { getTeam } from '../../../infrastructure/api/catalogApi.js';

const initials = (s = '') =>
  (s.split(/[\s-_]+/).filter(Boolean).map((w) => w[0]).join('') || s || '?')
    .slice(0, 2).toUpperCase();

const chips = (list) => list.map((tm) => {
  const m = tm.members || {};
  const label = m.full_name || tm.github_username;
  return (
    <span key={tm.github_username} className="owner-chip">
      <span className="avatar">{initials(label)}</span>
      {label}
    </span>
  );
});

// Team detail — identity card on the left, owners/members on the right.
export default function TeamDetail({ name }) {
  const [row, setRow] = useState(null);   // null = loading, false = not found

  useEffect(() => {
    getTeam(name).then(setRow).catch(() => setRow(false));
  }, [name]);

  if (row === false)
    return <div className="card"><p className="alert-error">Equipo no encontrado.</p></div>;
  if (!row)
    return <div className="card"><p className="muted">Cargando…</p></div>;

  const members = row.team_members || [];
  const owners = members.filter((tm) => tm.owner);
  const regulars = members.filter((tm) => !tm.owner);

  return (
    <div className="card app-detail">
      <section className="app-main">
        <div className="app-hero">
          <span className="avatar big">{initials(row.shortname || name)}</span>
          <h2>{name}</h2>
        </div>
        <div className="app-id">
          <div><label>Nombre corto</label><strong>{row.shortname || '—'}</strong></div>
          <div><label>Tipo</label><strong>{row.type || '—'}</strong></div>
        </div>
        <div className="app-desc">
          <label>Descripción</label>
          <p>{row.description || '—'}</p>
        </div>
      </section>
      <section className="app-side">
        <div className="app-owners">
          <label>Propietarios <span className="badge">{owners.length}</span></label>
          <div className="owner-chips">{owners.length ? chips(owners) : <span className="muted">—</span>}</div>
        </div>
        <div className="app-owners">
          <label>Miembros <span className="badge">{regulars.length}</span></label>
          <div className="owner-chips">{regulars.length ? chips(regulars) : <span className="muted">—</span>}</div>
        </div>
      </section>
    </div>
  );
}
