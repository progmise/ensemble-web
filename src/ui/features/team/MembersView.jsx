import { useMemo, useState } from 'react';
import { createMember } from '../../../infrastructure/api/catalogApi.js';
import { SearchRow } from '../../components/Feedback.jsx';
import { SortIco } from '../../components/Icons.jsx';

const dateOnly = (iso) => (iso ? new Date(iso).toLocaleDateString() : '—');
const initials = (name) =>
  (name || '?').split(/\s+/).filter(Boolean).slice(0, 2)
    .map((w) => w[0].toUpperCase()).join('');

const COLUMNS = [
  { key: 'full_name', label: 'Nombre completo', value: (m) => m.full_name },
  { key: 'email', label: 'Email', value: (m) => m.email },
  { key: 'github_username', label: 'Usuario', value: (m) => m.github_username },
  { key: 'created_at', label: 'Fecha de registro', value: (m) => m.created_at },
];

// Member registry — platform access only. What a member can do is defined
// per application (roles) and per team (ownership).
export default function MembersView({ members, onChanged }) {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState({ key: 'full_name', dir: 1 });
  const [showForm, setShowForm] = useState(false);

  const rows = useMemo(() => {
    const lq = q.toLowerCase();
    const list = (members || []).filter((m) => !lq
      || m.full_name.toLowerCase().includes(lq)
      || m.email.toLowerCase().includes(lq)
      || m.github_username.includes(lq));
    const col = COLUMNS.find((c) => c.key === sort.key);
    if (col?.value)
      list.sort((a, b) => String(col.value(a)).localeCompare(String(col.value(b))) * sort.dir);
    return list;
  }, [members, q, sort]);

  const cycle = (key) => setSort((s) =>
    s.key !== key ? { key, dir: 1 } : s.dir === 1 ? { key, dir: -1 } : { key: null, dir: 1 });

  return (
    <div className="card">
      <h2>Buscar miembro</h2>
      <SearchRow q={q} setQ={setQ} placeholder="Nombre, email o usuario de GitHub"
        action={
          <button className="btn btn-primary" style={{ marginLeft: 'auto' }}
            onClick={() => setShowForm(true)}>Nuevo miembro +</button>
        } />
      <p className="tbl-legend">Miembros de la plataforma</p>
      <table>
        <thead>
          <tr>
            {COLUMNS.map((c) => (
              <th key={c.key} className={c.value ? 'th-sort' : ''}
                onClick={c.value ? () => cycle(c.key) : undefined}>
                {c.label}{c.value && <SortIco column={c.key} sort={sort} />}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => (
            <tr key={m.github_username}>
              <td>
                <span className="member-name">
                  <span className="avatar">{initials(m.full_name)}</span>
                  {m.full_name}
                </span>
              </td>
              <td><span className="muted">{m.email}</span></td>
              <td><code>{m.github_username}</code></td>
              <td><span className="muted">{dateOnly(m.created_at)}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
      {members && !rows.length && <p className="muted">Sin miembros para esa búsqueda.</p>}
      {showForm && <MemberModal onClose={() => setShowForm(false)} onCreated={onChanged} />}
    </div>
  );
}

function MemberModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    github_username: '', full_name: '', email: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const ok = form.github_username.trim() && form.full_name.trim()
    && /\S+@\S+\.\S+/.test(form.email);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await createMember(form);
      onCreated?.();
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
          <h2>Nuevo miembro</h2>
          <button className="btn btn-outline" onClick={onClose}>✕</button>
        </div>
        {error && <div className="alert-error">{error}</div>}
        <div className="form">
          <label className="field">
            <span>Usuario de GitHub *</span>
            <input value={form.github_username} placeholder="octocat"
              onChange={(e) => setForm((f) => ({ ...f, github_username: e.target.value.trim() }))} />
            <small className="muted">Es su identidad de login — tiene que existir en GitHub</small>
          </label>
          <label className="field">
            <span>Nombre completo *</span>
            <input value={form.full_name} placeholder="Nombre y apellido"
              onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} />
          </label>
          <label className="field">
            <span>Email *</span>
            <input value={form.email} placeholder="usuario@ejemplo.com"
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            <small className="muted">El de su cuenta de GitHub</small>
          </label>
          <small className="muted">
            El alta solo habilita el acceso a la plataforma — los roles se
            asignan por aplicación.
          </small>
        </div>
        <div className="modal-foot">
          <button className="btn-text btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-text btn-next" disabled={!ok || busy} onClick={submit}>
            {busy ? 'Registrando…' : 'Dar de alta'}
          </button>
        </div>
      </div>
    </div>
  );
}
