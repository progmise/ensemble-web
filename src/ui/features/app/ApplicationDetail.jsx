import { useEffect, useState } from 'react';
import { getApplication } from '../../../infrastructure/api/catalogApi.js';
import { StatusPill } from '../../components/Feedback.jsx';

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

// Application detail ("Detalles de la aplicación") — identity + description
// on the left; platform metadata, responsables and tool links on the right.
// Components live under the Componentes nav, not here.
export default function ApplicationDetail({ name, onGoMembers }) {
  const [row, setRow] = useState(null);   // null = loading, false = not found

  useEffect(() => {
    getApplication(name).then(setRow).catch(() => setRow(false));
  }, [name]);

  if (row === false)
    return <div className="card"><p className="alert-error">Aplicación no encontrada.</p></div>;
  if (!row)
    return <div className="card"><p className="muted">Cargando…</p></div>;

  const ams = row.application_members || [];
  const repoQuery = `https://github.com/orgs/progmise/repositories?q=${
    encodeURIComponent(row.repo_prefix || row.name)}`;

  return (
    <div className="card app-detail">
      <h2 className="app-detail-title">Detalles de la aplicación</h2>
      <section className="app-main">
        <div className="app-hero">
          <span className="avatar big sq">{initials(row.alias || row.name)}</span>
          <h2>{(row.name || name).toUpperCase()}</h2>
        </div>
        <div className="app-id">
          <div><label>Código de aplicación</label><strong>{row.id ?? '—'}</strong></div>
          <div><label>Alias</label><strong>{row.alias || '—'}</strong></div>
          <div><label>Estado</label>
            {appStatus(row.components)
              ? <StatusPill status={appStatus(row.components)} /> : <strong>—</strong>}
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
        <div className="app-id app-id-side">
          <div><label>Compañía</label><strong>Personal</strong></div>
          <div><label>Unidad de negocio</label><strong>{row.business_unit || '—'}</strong></div>
          <div><label>Ciclo de vida</label><strong>{row.lifecycle || '—'}</strong></div>
        </div>
        <div className="app-owners">
          <label>Responsables de Aplicación <span className="badge">{ams.length}</span></label>
          <div className="owner-chips">
            {ams.map((am) => (
              <span key={am.github_username} className="owner-chip" title={am.role}>
                <span className="avatar">
                  {initials(am.members?.full_name || am.github_username)}
                </span>
                {am.members?.full_name || am.github_username}
                <small className="muted">{am.role}</small>
              </span>
            ))}
            {!ams.length && (
              <span className="muted">Sin responsables —{' '}
                <a className="linklike" onClick={onGoMembers}>sumalos desde Equipo</a>.
              </span>
            )}
          </div>
        </div>
        <div className="app-tools">
          <label>Herramientas</label>
          <div className="tools-btns">
            <a className="btn btn-outline" href={repoQuery}
              target="_blank" rel="noreferrer">GitHub</a>
          </div>
        </div>
      </section>
    </div>
  );
}
