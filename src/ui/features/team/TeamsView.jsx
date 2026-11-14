import { useEffect, useMemo, useState } from 'react';
import { SHORTNAME_RE } from '../../../domain/component.js';
import { createTeam } from '../../../infrastructure/api/catalogApi.js';
import { SearchRow } from '../../components/Feedback.jsx';

const initials = (s = '') =>
  (s.split(/[\s-_]+/).filter(Boolean).map((w) => w[0]).join('') || s || '?')
    .slice(0, 2).toUpperCase();

const COLUMNS = [
  { key: 'name', label: 'Nombre equipo', value: (t) => t.name },
  { key: 'shortname', label: 'Nombre corto equipo', value: (t) => t.shortname },
  { key: 'type', label: 'Tipo equipo', value: (t) => t.type || '-' },
];

// "Buscar equipo" — list of high-level teams owning functionality.
export default function TeamsView({ teams = [], members = [], onChanged, onOpen }) {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState({ key: 'name', dir: 1 });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showForm, setShowForm] = useState(false);

  const rows = useMemo(() => {
    const lq = q.toLowerCase();
    const list = (teams || []).filter((t) => !lq
      || t.name.toLowerCase().includes(lq)
      || (t.shortname || '').toLowerCase().includes(lq));
    const col = COLUMNS.find((c) => c.key === sort.key);
    if (col?.value)
      list.sort((a, b) => String(col.value(a)).localeCompare(String(col.value(b))) * sort.dir);
    return list;
  }, [teams, q, sort]);

  const cycle = (key) => setSort((s) =>
    s.key !== key ? { key, dir: 1 } : s.dir === 1 ? { key, dir: -1 } : { key: null, dir: 1 });
  const arrow = (key) =>
    sort.key !== key ? ' ⇅' : sort.dir === 1 ? ' ↑' : ' ↓';

  // oxlint-disable-next-line react-hooks/set-state-in-effect — deliberate reset
  useEffect(() => setPage(1), [q, pageSize]);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pages);
  const visible = rows.slice((safePage - 1) * pageSize, safePage * pageSize);
  const from = rows.length ? (safePage - 1) * pageSize + 1 : 0;
  const to = (safePage - 1) * pageSize + visible.length;

  return (
    <div className="card">
      <h2>Buscar equipo</h2>
      <SearchRow q={q} setQ={setQ} placeholder="Buscar equipo"
        action={
          <button className="btn btn-primary" style={{ marginLeft: 'auto' }}
            onClick={() => setShowForm(true)}>Crear equipo +</button>
        } />
      <p className="tbl-legend">Buscar por nombre o nombre corto</p>
      <table>
        <thead>
          <tr>
            {COLUMNS.map((c) => (
              <th key={c.key} className={c.value ? 'th-sort' : ''}
                onClick={c.value ? () => cycle(c.key) : undefined}>
                {c.label}{c.value && <span className="sort-arrow">{arrow(c.key)}</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visible.map((t) => (
            <tr key={t.name}>
              <td>
                <button className="linklike member-name" onClick={() => onOpen(t.name)}>
                  <span className="avatar">{initials(t.shortname || t.name)}</span>
                  <strong>{t.name}</strong>
                </button>
              </td>
              <td><code>{t.shortname || '—'}</code></td>
              <td>{t.type || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <p className="muted">Sin equipos para esa búsqueda.</p>}
      <div className="tbl-foot">
        <select className="page-size" value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}>
          {[10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <span className="pager">
          <span className="muted">{from} a {to} de {rows.length} Elementos</span>
          <button disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>‹ Ant</button>
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button key={p} className={p === safePage ? 'active' : ''}
              onClick={() => setPage(p)}>{p}</button>
          ))}
          <button disabled={safePage >= pages} onClick={() => setPage(safePage + 1)}>Sig ›</button>
        </span>
      </div>
      {showForm && (
        <TeamModal teams={teams} members={members}
          onClose={() => setShowForm(false)} onCreated={onChanged} />
      )}
    </div>
  );
}

function TeamModal({ teams, members, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', shortname: '', type: '', description: '' });
  const [owners, setOwners] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // Existing types feed the datalist — new ones emerge as functionality
  // demands its own team.
  const types = [...new Set((teams || []).map((t) => t.type).filter(Boolean))];
  const toggle = (u) => setOwners((o) =>
    o.includes(u) ? o.filter((x) => x !== u) : [...o, u]);

  const ok = form.name.trim()
    && (!form.shortname.trim() || SHORTNAME_RE.test(form.shortname));

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await createTeam({ ...form, owners });
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
          <h2>Crear equipo</h2>
          <button className="btn btn-outline" onClick={onClose}>✕</button>
        </div>
        {error && <div className="alert-error">{error}</div>}
        <div className="form">
          <label className="field">
            <span>Nombre del equipo *</span>
            <input value={form.name} placeholder="ejemplo: Templates Team"
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </label>
          <label className="field">
            <span>Nombre corto</span>
            <input value={form.shortname} placeholder="ejemplo: TPLT"
              onChange={(e) => setForm((f) => ({ ...f, shortname: e.target.value.toUpperCase() }))} />
            <small className="muted">mayúsculas y dígitos — se deduce del nombre si queda vacío</small>
          </label>
          <label className="field">
            <span>Tipo</span>
            <input list="team-types" value={form.type} placeholder="ejemplo: templates"
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} />
            <datalist id="team-types">
              {types.map((t) => <option key={t} value={t} />)}
            </datalist>
            <small className="muted">Funcionalidad que agrupa — libre, los tipos van apareciendo</small>
          </label>
          <label className="field">
            <span>Descripción</span>
            <textarea rows="3" value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </label>
          <span className="field">
            <span>Propietarios</span>
            <span className="chips">
              {(members || []).map((m) => (
                <button key={m.github_username} type="button"
                  className={`chip role-toggle${owners.includes(m.github_username) ? ' chip-teal on' : ''}`}
                  onClick={() => toggle(m.github_username)}>
                  {m.full_name || m.github_username}
                </button>
              ))}
              {!(members || []).length &&
                <small className="muted">Sin miembros registrados</small>}
            </span>
          </span>
        </div>
        <div className="modal-foot">
          <button className="btn-text btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-text btn-next" disabled={!ok || busy} onClick={submit}>
            {busy ? 'Creando…' : 'Crear'}
          </button>
        </div>
      </div>
    </div>
  );
}
