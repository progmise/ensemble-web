import { useEffect, useState } from 'react';
import { getTeam, addTeamMember } from '../../../infrastructure/api/catalogApi.js';

const initials = (s = '') =>
  (s.split(/[\s-_]+/).filter(Boolean).map((w) => w[0]).join('') || s || '?')
    .slice(0, 2).toUpperCase();

// "Miembros del equipo" — member list of one team + add-member flow.
export default function TeamMembers({ id, members = [] }) {
  const [row, setRow] = useState(null);   // null = loading, false = not found
  const [showForm, setShowForm] = useState(false);

  const reload = () => getTeam(id).then(setRow).catch(() => setRow(false));
  useEffect(() => { reload(); }, [id]);

  if (row === false)
    return <div className="card"><p className="alert-error">Equipo no encontrado.</p></div>;
  if (!row)
    return <div className="card"><p className="muted">Cargando…</p></div>;

  const tms = row.team_members || [];
  const inTeam = new Set(tms.map((t) => t.github_username));
  const candidates = members.filter((m) => !inTeam.has(m.github_username));

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Miembros del equipo</h2>
        <button className="btn btn-primary" style={{ marginLeft: 'auto' }}
          onClick={() => setShowForm(true)}>Agregar miembro +</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Miembro</th>
            <th>Usuario</th>
            <th>Rol</th>
          </tr>
        </thead>
        <tbody>
          {tms.map((tm) => (
            <tr key={tm.github_username}>
              <td>
                <span className="member-name">
                  <span className="avatar">{initials(tm.members?.full_name || tm.github_username)}</span>
                  <strong>{tm.members?.full_name || tm.github_username}</strong>
                </span>
              </td>
              <td><code>{tm.github_username}</code></td>
              <td>{tm.owner ? 'Propietario' : 'Miembro'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!tms.length && <p className="muted">El equipo aún no tiene miembros.</p>}
      {showForm && (
        <MemberModal teamId={row.id} candidates={candidates}
          onClose={() => setShowForm(false)} onAdded={reload} />
      )}
    </div>
  );
}

function MemberModal({ teamId, candidates, onClose, onAdded }) {
  const [form, setForm] = useState({ github_username: '', owner: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await addTeamMember(teamId, form);
      onAdded?.();
      onClose();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Agregar miembro</h2>
          <button className="btn btn-outline" onClick={onClose}>✕</button>
        </div>
        {error && <div className="alert-error">{error}</div>}
        <div className="form">
          <label className="field">
            <span>Miembro *</span>
            <select value={form.github_username}
              onChange={(e) => setForm((f) => ({ ...f, github_username: e.target.value }))}>
              <option value="">Seleccionar…</option>
              {candidates.map((m) => (
                <option key={m.github_username} value={m.github_username}>
                  {m.full_name} ({m.github_username})
                </option>
              ))}
            </select>
            {!candidates.length &&
              <small className="muted">Todos los miembros registrados ya están en el equipo</small>}
          </label>
          <label className="field">
            <span>
              <input type="checkbox" checked={form.owner}
                onChange={(e) => setForm((f) => ({ ...f, owner: e.target.checked }))} />
              {' '}Propietario
            </span>
          </label>
        </div>
        <div className="modal-foot">
          <button className="btn-text btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-text btn-next"
            disabled={!form.github_username || busy} onClick={submit}>
            {busy ? 'Agregando…' : 'Agregar'}
          </button>
        </div>
      </div>
    </div>
  );
}
