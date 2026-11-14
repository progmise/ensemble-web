import { useCallback, useEffect, useState } from 'react';
import { getApplication, addApplicationMember }
  from '../../../infrastructure/api/catalogApi.js';

const ROLES = ['developer', 'technical-lead', 'product-owner'];
const initials = (s = '') =>
  (s.split(/[\s-_]+/).filter(Boolean).map((w) => w[0]).join('') || s || '?')
    .slice(0, 2).toUpperCase();

// "Miembros de la aplicación" — per-app roles. Platform access comes from
// the members registry; here each member gets a role scoped to this app.
export default function ApplicationMembers({ name, members = [], onGoMembers }) {
  const [row, setRow] = useState(null);   // null = loading, false = not found
  const [showForm, setShowForm] = useState(false);

  const reload = useCallback(
    () => getApplication(name).then(setRow).catch(() => setRow(false)), [name]);
  useEffect(() => { reload(); }, [reload]);

  if (row === false)
    return <div className="card"><p className="alert-error">Aplicación no encontrada.</p></div>;
  if (!row)
    return <div className="card"><p className="muted">Cargando…</p></div>;

  const ams = row.application_members || [];
  const inApp = new Set(ams.map((am) => am.github_username));
  const candidates = members.filter((m) => !inApp.has(m.github_username));

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Miembros de la aplicación</h2>
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
          {ams.map((am) => (
            <tr key={am.github_username}>
              <td>
                <span className="member-name">
                  <span className="avatar">{initials(am.members?.full_name || am.github_username)}</span>
                  <strong>{am.members?.full_name || am.github_username}</strong>
                </span>
              </td>
              <td><code>{am.github_username}</code></td>
              <td>{am.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!ams.length && <p className="muted">La aplicación aún no tiene miembros.</p>}
      {showForm && (
        <MemberModal appName={name} candidates={candidates}
          onGoMembers={onGoMembers}
          onClose={() => setShowForm(false)} onAdded={reload} />
      )}
    </div>
  );
}

function MemberModal({ appName, candidates, onGoMembers, onClose, onAdded }) {
  const [form, setForm] = useState({ github_username: '', role: 'developer' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await addApplicationMember(appName, form);
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
              <small className="muted">
                Sin miembros disponibles — primero hay que darles acceso a la
                plataforma.{' '}
                <a className="linklike" onClick={onGoMembers}>Registrarlos en Miembros</a>
              </small>}
          </label>
          <label className="field">
            <span>Rol *</span>
            <select value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <small className="muted">
              developer: cert/pre · technical-lead y product-owner: también pro
            </small>
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
