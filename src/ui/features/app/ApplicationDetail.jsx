import { useEffect, useState } from 'react';
import { getApplication } from '../../../infrastructure/api/catalogApi.js';
import { GhIcon, Ico, ICON } from '../../components/Icons.jsx';

const initials = (s = '') =>
  (s.split(/[\s-_]+/).map((w) => w[0]).join('') || s || '?').slice(0, 2).toUpperCase();

const appStatus = (components = []) => {
  if (!components.length) return null;
  const states = components.map((c) => c.status);
  if (states.includes('failed')) return 'failed';
  const pending = states.find((s) => s !== 'ready');
  return pending || 'ready';
};

// Estado is an icon, not text — green check / red alert / muted clock.
const StatusIco = ({ status }) => {
  const [d, cls] = status === 'ready' ? [ICON.checkCircle, 'ok']
    : status === 'failed' ? [ICON.alertCircle, 'bad']
    : [ICON.clock, 'wait'];
  return <span className={`st-ico ${cls}`} title={status}><Ico d={d} /></span>;
};

// Application detail ("Detalles de la aplicación") — identity + description
// + useful links on the left; platform metadata, responsables and work
// tools on the right. Components live under the Componentes nav.
export default function ApplicationDetail({ name, onGoMembers }) {
  const [row, setRow] = useState(null);   // null = loading, false = not found
  const [toolsOpen, setToolsOpen] = useState(false);

  useEffect(() => {
    getApplication(name).then(setRow).catch(() => setRow(false));
  }, [name]);

  if (row === false)
    return <div className="card"><p className="alert-error">Aplicación no encontrada.</p></div>;
  if (!row)
    return <div className="card"><p className="muted">Cargando…</p></div>;

  const ams = row.application_members || [];
  const repos = (row.components || []).map((c) => c.repo).filter(Boolean);
  const status = appStatus(row.components);

  return (
    <>
      <div className="detail-head">
        <h2 className="detail-title">Detalles de la aplicación</h2>
      </div>
      <div className="card app-detail">
        <section className="app-main">
          <div className="app-hero">
            <span className="avatar big sq">{initials(row.alias || row.name)}</span>
            <h2>{(row.name || name).toUpperCase()}</h2>
          </div>
          <div className="app-attrs">
            <span><label>Código de aplicación</label><strong>{row.id ?? '—'}</strong></span>
            <span><label>Alias</label><strong>{row.alias || '—'}</strong></span>
            <span><label>Estado</label>
              {status ? <StatusIco status={status} /> : <strong>—</strong>}
            </span>
          </div>
          <div className="app-desc">
            <label>Descripción</label>
            <p>{row.description || '—'}</p>
          </div>
          <div className="app-links">
            <label>Enlaces útiles</label>
            <div className="link-chips">
              <a href="https://github.com/progmise/deploy-manifest#readme"
                target="_blank" rel="noreferrer">
                Documentación <Ico d={ICON.extLink} /></a>
              <a href="https://github.com/progmise/ensemble-web/issues"
                target="_blank" rel="noreferrer">
                Soporte <Ico d={ICON.extLink} /></a>
            </div>
          </div>
        </section>
        <section className="app-side">
          <div className="app-id">
            <div><label>Compañía</label><strong>Personal</strong></div>
            <div><label>Ciclo de vida</label><strong>{row.lifecycle || '—'}</strong></div>
          </div>
          <div className="app-owners">
            <label>Responsables de Aplicación <span className="badge">{ams.length}</span></label>
            <div className="owner-chips">
              {ams.map((am) => (
                <span key={am.github_username} className="owner-chip"
                  title={(am.roles || []).join(' · ')}>
                  <span className="avatar">
                    {initials(am.members?.full_name || am.github_username)}
                  </span>
                  {am.members?.full_name || am.github_username}
                  <Ico d={ICON.chevronDown} />
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
            <p className="tools-note">
              <Ico d={ICON.info} /> Las herramientas de trabajo se habilitan por aplicación.
            </p>
            <div className="tools-btns">
              <button className="btn btn-outline" onClick={() => setToolsOpen((o) => !o)}>
                {GhIcon} GitHub <Ico d={ICON.chevronDown} />
              </button>
              {toolsOpen && (
                <>
                  <div className="menu-overlay" onClick={() => setToolsOpen(false)} />
                  <div className="tools-pop">
                    {repos.map((r) => (
                      <a key={r} href={`https://github.com/${r}`}
                        target="_blank" rel="noreferrer">{GhIcon} {r}</a>
                    ))}
                    {!repos.length && <a className="muted">Sin repositorios</a>}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
