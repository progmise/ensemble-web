import { useCallback, useEffect, useMemo, useState } from 'react';
import { getTeam, addTeamMember } from '../../../infrastructure/api/catalogApi.js';
import { SearchRow } from '../../components/Feedback.jsx';
import { SortIco } from '../../components/Icons.jsx';

const initials = (s = '') =>
  (s.split(/[\s-_]+/).filter(Boolean).map((w) => w[0]).join('') || s || '?')
    .slice(0, 2).toUpperCase();

const COLUMNS = [
  { key: 'name', label: 'Miembro',
    value: (tm) => tm.members?.full_name || tm.github_username },
  { key: 'username', label: 'Usuario', value: (tm) => tm.github_username },
  { key: 'role', label: 'Rol', value: (tm) => (tm.owner ? 'Propietario' : 'Miembro') },
];

// "Miembros del equipo" — member list of one team + add-member flow.
export default function TeamMembers({ id, members = [], onGoMembers }) {
  const [row, setRow] = useState(null);   // null = loading, false = not found
  const [showForm, setShowForm] = useState(false);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState({ key: 'name', dir: 1 });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const reload = useCallback(
    () => getTeam(id).then(setRow).catch(() => setRow(false)), [id]);
  useEffect(() => { reload(); }, [reload]);

  const rows = useMemo(() => {
    const lq = q.toLowerCase();
    const list = (row?.team_members || []).filter((tm) => !lq
      || (tm.members?.full_name || '').toLowerCase().includes(lq)
      || tm.github_username.toLowerCase().includes(lq));
    const col = COLUMNS.find((c) => c.key === sort.key);
    if (col)
      list.sort((a, b) => String(col.value(a)).localeCompare(String(col.value(b))) * sort.dir);
    return list;
  }, [row, q, sort]);

  const cycle = (key) => setSort((s) =>
    s.key !== key ? { key, dir: 1 } : s.dir === 1 ? { key, dir: -1 } : { key: null, dir: 1 });

  // oxlint-disable-next-line react-hooks/set-state-in-effect — deliberate reset
  useEffect(() => setPage(1), [q, pageSize]);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pages);
  const visible = rows.slice((safePage - 1) * pageSize, safePage * pageSize);
  const from = rows.length ? (safePage - 1) * pageSize + 1 : 0;
  const to = (safePage - 1) * pageSize + visible.length;

  if (row === false)
    return <div className="card"><p className="alert-error">Equipo no encontrado.</p></div>;
  if (!row)
    return <div className="card"><p className="muted">Cargando…</p></div>;

  const tms = row.team_members || [];
  const inTeam = new Set(tms.map((t) => t.github_username));
  const candidates = members.filter((m) => !inTeam.has(m.github_username));

  return (
    <div className="card">
      <p className="card-label">Buscar miembro del equipo</p>
      <SearchRow q={q} setQ={setQ} placeholder="Buscar miembro"
        action={
          <button className="btn btn-primary" style={{ marginLeft: 'auto' }}
            onClick={() => setShowForm(true)}>Agregar miembro +</button>
        } />
      <p className="tbl-legend">Buscar por nombre o usuario</p>
      <table>
        <thead>
          <tr>
            {COLUMNS.map((c) => (
              <th key={c.key} className="th-sort" onClick={() => cycle(c.key)}>
                {c.label}<SortIco column={c.key} sort={sort} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visible.map((tm) => (
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
      {!rows.length &&
        <p className="muted">{tms.length
          ? 'Sin miembros para esa búsqueda.' : 'El equipo aún no tiene miembros.'}</p>}
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
        <MemberModal teamId={row.id} candidates={candidates}
          onGoMembers={onGoMembers}
          onClose={() => setShowForm(false)} onAdded={reload} />
      )}
    </div>
  );
}

function MemberModal({ teamId, candidates, onGoMembers, onClose, onAdded }) {
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
              <small className="muted">
                Sin miembros disponibles — los equipos solo adjuntan miembros del
                registro.{' '}
                <a className="linklike" onClick={onGoMembers}>Registrarlos en Miembros</a>
              </small>}
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
