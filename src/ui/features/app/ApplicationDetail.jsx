import { useEffect, useState } from 'react';
import { getApplication } from '../../../infrastructure/api/catalogApi.js';
import { StatusPill } from '../../components/Feedback.jsx';
import { GhIcon } from '../../components/Icons.jsx';

const dateOnly = (iso) => (iso ? new Date(iso).toLocaleDateString() : '—');
const initials = (s = '') =>
  (s.split(/[\s-_]+/).map((w) => w[0]).join('') || s || '?').slice(0, 2).toUpperCase();

const appStatus = (components = []) => {
  if (!components.length) return null;
  const states = components.map((c) => c.status);
  if (states.includes('failed')) return 'failed';
  const pending = states.find((s) => s !== 'ready');
  return pending || 'ready';
};

// Application detail — identity on the left, component list on
// the right; each row opens the component detail.
export default function ApplicationDetail({ name, onOpenComponent, onNewComponent }) {
  const [row, setRow] = useState(null);   // null = loading, false = not found

  useEffect(() => {
    getApplication(name).then(setRow).catch(() => setRow(false));
  }, [name]);

  if (row === false)
    return <div className="card"><p className="alert-error">Aplicación no encontrada.</p></div>;
  if (!row)
    return <div className="card"><p className="muted">Cargando…</p></div>;

  const components = row.components || [];

  return (
    <div className="card app-detail">
      <section className="app-main">
        <div className="app-hero">
          <span className="avatar big sq">{initials(row.alias || name)}</span>
          <h2>{name.toUpperCase()}</h2>
        </div>
        <div className="app-id">
          <div><label>ID</label><strong>{row.id ?? '—'}</strong></div>
          <div><label>Aplicación</label><strong>{name}</strong></div>
          <div><label>Alias</label><strong>{row.alias || '—'}</strong></div>
          <div><label>Unidad de negocio</label><strong>{row.business_unit || '—'}</strong></div>
          <div><label>Ciclo de vida</label><strong>{row.lifecycle || '—'}</strong></div>
          <div><label>Estado</label>
            {appStatus(components)
              ? <StatusPill status={appStatus(components)} /> : <strong>—</strong>}
          </div>
        </div>
        <div className="app-desc">
          <label>Descripción</label>
          <p>{row.description || '—'}</p>
        </div>
        <div className="app-meta" style={{ marginTop: 18 }}>
          <div><label>Creada</label><strong>{dateOnly(row.created_at)}</strong></div>
          <div><label>Registrada por</label><strong>{row.created_by || '—'}</strong></div>
        </div>
      </section>
      <section className="app-side">
        <div className="app-owners">
          <label>Componentes <span className="badge">{components.length}</span>
            {onNewComponent &&
              <button className="btn btn-primary app-comp-add"
                onClick={onNewComponent}>Nuevo componente +</button>}
          </label>
          <table className="app-comp-table">
            <tbody>
              {components.map((c) => (
                <tr key={c.name}>
                  <td>
                    <button className="linklike member-name"
                      onClick={() => onOpenComponent(c.name)}>
                      <span className="avatar sq">{initials(c.shortname || c.name)}</span>
                      <strong>{c.name}</strong>
                    </button>
                  </td>
                  <td><code>{c.shortname || '—'}</code></td>
                  <td>{c.lifecycle || '—'}</td>
                  <td><StatusPill status={c.status} /></td>
                  <td>
                    {c.repo &&
                      <a href={`https://github.com/${c.repo}`} target="_blank" rel="noreferrer"
                         title={c.repo}>{GhIcon}</a>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!components.length &&
            <span className="muted">Sin componentes — creá uno desde Componentes.</span>}
        </div>
      </section>
    </div>
  );
}
