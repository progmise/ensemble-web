import { useEffect, useMemo, useState } from 'react';
import { NAME_RE, SHORTNAME_RE, APP_LIFECYCLES } from '../../../domain/component.js';
import { createApplication } from '../../../infrastructure/api/catalogApi.js';
import { SearchRow } from '../../components/Feedback.jsx';
import ChecklistFilter from '../../components/ChecklistFilter.jsx';
import { SortIco } from '../../components/Icons.jsx';

const initials = (s = '') =>
  (s.split(/[\s-_]+/).map((w) => w[0]).join('') || s || '?').slice(0, 2).toUpperCase();

const COLUMNS = [
  { key: 'name', label: 'Aplicación', value: (a) => a.name },
  { key: 'alias', label: 'Alias', value: (a) => a.alias },
  { key: 'id', label: 'ID', value: (a) => a.id },
  { key: 'componentes', label: 'Componentes', value: (a) => (a.components || []).length },
  { key: 'lifecycle', label: 'Ciclo de vida', value: (a) => a.lifecycle },
];

// "Lista de aplicaciones" — search + lifecycle filters + register +
// sortable table.
export default function ApplicationsView({ applications = [], me,
                                           onChanged, onOpen }) {
  const [q, setQ] = useState('');
  const [cycles, setCycles] = useState([]);
  const [mine, setMine] = useState(false);
  const [sort, setSort] = useState({ key: 'name', dir: 1 });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showForm, setShowForm] = useState(false);

  const login = me?.user?.login || me?.member?.github_username || '';
  const rows = useMemo(() => {
    const lq = q.toLowerCase();
    const list = (applications || []).filter((a) =>
      (!cycles.length || cycles.includes(a.lifecycle))
      && (!mine || a.created_by === login)
      && (!lq
        || a.name.toLowerCase().includes(lq)
        || (a.alias || '').toLowerCase().includes(lq)
        || (a.business_unit || '').toLowerCase().includes(lq)));
    const col = COLUMNS.find((c) => c.key === sort.key);
    if (col?.value)
      list.sort((a, b) => String(col.value(a)).localeCompare(String(col.value(b))) * sort.dir);
    return list;
  }, [applications, q, cycles, mine, login, sort]);

  const cycle = (key) => setSort((s) =>
    s.key !== key ? { key, dir: 1 } : s.dir === 1 ? { key, dir: -1 } : { key: null, dir: 1 });

  // oxlint-disable-next-line react-hooks/set-state-in-effect — deliberate reset
  useEffect(() => setPage(1), [q, cycles, pageSize]);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pages);
  const visible = rows.slice((safePage - 1) * pageSize, safePage * pageSize);
  const from = rows.length ? (safePage - 1) * pageSize + 1 : 0;
  const to = (safePage - 1) * pageSize + visible.length;

  return (
    <div className="card">
      <p className="card-label">Buscar aplicación</p>
      <SearchRow q={q} setQ={setQ} placeholder="Nombre, alias o código"
        action={
          <>
            <button className={`btn btn-outline${mine ? ' on' : ''}`}
              onClick={() => setMine((m) => !m)}>Mis aplicaciones</button>
            <ChecklistFilter title="Filtrar por ciclo de vida"
              options={APP_LIFECYCLES} applied={cycles} onApply={setCycles}
              placeholder="Selecciona un ciclo de vida" />
            <button className="btn btn-primary" style={{ marginLeft: 'auto' }}
              onClick={() => setShowForm(true)}>Registrar la aplicación +</button>
          </>
        } />
      <p className="tbl-legend">Lista de aplicaciones</p>
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
          {visible.map((a) => (
            <tr key={a.name}>
              <td>
                <button className="linklike member-name" onClick={() => onOpen(a.id ?? a.name)}>
                  <span className="avatar sq">{initials(a.alias || a.name)}</span>
                  <strong>{a.name.toUpperCase()}</strong>
                </button>
              </td>
              <td><code>{a.alias || '—'}</code></td>
              <td>{a.id ?? '—'}</td>
              <td>{(a.components || []).length}</td>
              <td>{a.lifecycle || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <p className="muted">Sin aplicaciones para esa búsqueda.</p>}
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
        <ApplicationModal onClose={() => setShowForm(false)} onCreated={onChanged} />
      )}
    </div>
  );
}

function ApplicationModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', alias: '', description: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const ok = NAME_RE.test(form.name)
    && (!form.alias.trim() || SHORTNAME_RE.test(form.alias));

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await createApplication(form);
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
          <h2>Registrar la aplicación</h2>
          <button className="btn btn-outline" onClick={onClose}>✕</button>
        </div>
        {error && <div className="alert-error">{error}</div>}
        <div className="form">
          <label className="field">
            <span>Nombre *</span>
            <input value={form.name} placeholder="ejemplo: loans"
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value.toLowerCase() }))} />
            <small className="muted">minúsculas, dígitos y guiones</small>
          </label>
          <label className="field">
            <span>Alias</span>
            <input value={form.alias} placeholder="ejemplo: LOANS"
              onChange={(e) => setForm((f) => ({ ...f, alias: e.target.value.toUpperCase() }))} />
            <small className="muted">mayúsculas y dígitos — abreviatura corta del nombre (ej. ENS); se deduce del nombre si queda vacío</small>
          </label>
          <label className="field">
            <span>Descripción</span>
            <textarea rows="3" value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </label>
        </div>
        <div className="modal-foot">
          <button className="btn-text btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-text btn-next" disabled={!ok || busy} onClick={submit}>
            {busy ? 'Registrando…' : 'Registrar'}
          </button>
        </div>
      </div>
    </div>
  );
}
