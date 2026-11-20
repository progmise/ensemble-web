import { useEffect, useState } from 'react';
import { useSession } from '../application/useSession.js';
import { useDashboardData } from '../application/useDashboardData.js';
import { filter } from '../domain/component.js';
import { CenterCard, SearchRow } from '../ui/components/Feedback.jsx';
import { Ico, ICON } from '../ui/components/Icons.jsx';
import { Login, Unauthorized, UserMenu } from '../ui/features/session/Gate.jsx';
import ReleasesView from '../ui/features/releases/ReleasesView.jsx';
import ReleaseDetail from '../ui/features/releases/ReleaseDetail.jsx';
import { useReleases } from '../application/useReleases.js';
import { getManifest } from '../infrastructure/api/githubApi.js';
import ComponentsTable from '../ui/features/components/ComponentsTable.jsx';
import ComponentDetail from '../ui/features/components/ComponentDetail.jsx';
import ApplicationView from '../ui/features/app/ApplicationView.jsx';
import ApplicationsView from '../ui/features/app/ApplicationsView.jsx';
import ApplicationDetail from '../ui/features/app/ApplicationDetail.jsx';
import ApplicationMembers from '../ui/features/app/ApplicationMembers.jsx';
import HomeView from '../ui/features/app/HomeView.jsx';
import FiltersMenu from '../ui/features/components/FiltersMenu.jsx';
import DependencyGraph from '../ui/features/components/DependencyGraph.jsx';
import ComponentWizard from '../ui/features/components/ComponentWizard.jsx';
import TemplateGallery from '../ui/features/components/TemplateGallery.jsx';
import OrchRuns from '../ui/features/deployments/OrchRuns.jsx';
import MembersView from '../ui/features/team/MembersView.jsx';
import TeamsView from '../ui/features/team/TeamsView.jsx';
import TeamDetail from '../ui/features/team/TeamDetail.jsx';
import TeamMembers from '../ui/features/team/TeamMembers.jsx';
import SecurityView from '../ui/features/security/SecurityView.jsx';
import { useMembers } from '../application/useMembers.js';
import { useTeams } from '../application/useTeams.js';

const NAV = [
  { id: 'home', label: 'Inicio', icon: ICON.home },
  { id: 'aplicaciones', label: 'Aplicaciones', icon: ICON.componentes },
  { id: 'aplicacion', label: 'Aplicación', icon: ICON.logo },
  { id: 'componentes', label: 'Componentes', icon: ICON.componentes },
  { id: 'equipo', label: 'Equipos', icon: ICON.equipo },
  { id: 'miembros', label: 'Miembros', icon: ICON.equipo },
  { id: 'seguridad', label: 'Seguridad', icon: ICON.seguridad },
  { id: 'despliegues', label: 'Despliegues', icon: ICON.despliegues },
  { id: 'releases', label: 'Releases', icon: ICON.releases },
];

// Sidebar — top level shows only the settled sections; inside an
// application the sidebar switches to the app-scoped nav.
const SIDEBAR = ['aplicaciones', 'equipo', 'miembros'];
const APP_NAV = [
  { id: 'app-detail', label: 'Aplicación', icon: ICON.logo },
  { id: 'app-members', label: 'Equipo', icon: ICON.equipo },
  { id: 'app-components', label: 'Componentes', icon: ICON.componentes },
  { id: 'app-security', label: 'Seguridad', icon: ICON.seguridad },
  { id: 'app-releases', label: 'Releases', icon: ICON.releases },
];
const APP_VIEWS = ['app-detail', 'app-members', 'app-components',
  'app-security', 'app-releases', 'component-detail', 'nuevo-componente'];
const TEAM_NAV = [
  { id: 'team-detail', label: 'Equipo', icon: ICON.equipo },
  { id: 'team-members', label: 'Miembros del equipo', icon: ICON.equipo },
];
const TEAM_VIEWS = ['team-detail', 'team-members'];

// URL routing — /ensemble/<slug>[/<app>/components[/<id|new>]].
const SLUG_TOP = {
  home: '', aplicaciones: 'applications', aplicacion: 'personal',
  componentes: 'components', equipo: 'teams', miembros: 'members',
  seguridad: 'security', despliegues: 'deployments', releases: 'releases',
};
const enc = encodeURIComponent;

const pathFor = ({ view, appRef, componentName, teamId, releaseNo }) => {
  if (view === 'app-detail')
    return `/ensemble/applications/${enc(appRef)}/detail/info`;
  if (view === 'app-components')
    return `/ensemble/applications/${enc(appRef)}/components`;
  if (view === 'app-members')
    return `/ensemble/applications/${enc(appRef)}/team/members`;
  if (view === 'app-security')
    return `/ensemble/applications/${enc(appRef)}/security`;
  if (view === 'app-releases')
    return `/ensemble/applications/${enc(appRef)}/releases`;
  if (view === 'component-detail')
    return appRef
      ? `/ensemble/applications/${enc(appRef)}/components/${enc(componentName)}`
      : `/ensemble/components/${enc(componentName)}`;
  if (view === 'nuevo-componente')
    return appRef
      ? `/ensemble/applications/${enc(appRef)}/components/new`
      : '/ensemble/components/new';
  if (view === 'team-detail') return `/ensemble/teams/${enc(teamId)}/detail`;
  if (view === 'team-members') return `/ensemble/teams/${enc(teamId)}/members`;
  if (view === 'release-detail') return `/ensemble/releases/${releaseNo}`;
  return `/ensemble/${SLUG_TOP[view] || ''}`;
};

const parsePath = () => {
  const seg = window.location.pathname.replace(/^\/ensemble\/?/, '')
    .split('/').filter(Boolean).map(decodeURIComponent);
  if (seg[0] === 'applications' && seg[1]) {
    if (seg[2] === 'components' && seg[3] === 'new')
      return { view: 'nuevo-componente', appRef: seg[1] };
    if (seg[2] === 'components' && seg[3])
      return { view: 'component-detail', appRef: seg[1], componentName: seg[3] };
    if (seg[2] === 'components')
      return { view: 'app-components', appRef: seg[1] };
    if (seg[2] === 'members' || (seg[2] === 'team' && seg[3] === 'members'))
      return { view: 'app-members', appRef: seg[1] };
    if (seg[2] === 'security') return { view: 'app-security', appRef: seg[1] };
    if (seg[2] === 'releases') return { view: 'app-releases', appRef: seg[1] };
    return { view: 'app-detail', appRef: seg[1] };
  }
  if (seg[0] === 'components') {
    if (seg[1] === 'new') return { view: 'nuevo-componente' };
    if (seg[1]) return { view: 'component-detail', componentName: seg[1] };
    return { view: 'componentes' };
  }
  if (seg[0] === 'teams' && seg[2] === 'members')
    return { view: 'team-members', teamId: seg[1] };
  if (seg[0] === 'teams' && seg[1]) return { view: 'team-detail', teamId: seg[1] };
  if (seg[0] === 'releases' && seg[1]) return { view: 'release-detail', releaseNo: seg[1] };
  const view = Object.keys(SLUG_TOP).find((v) => SLUG_TOP[v] === seg[0]) || 'home';
  return { view };
};

// ☰ menu groups — global nav, available from every view
const MENU = [
  { title: null, items: ['home'] },
  { title: 'Gestión', items: ['aplicaciones'] },
];

export default function App() {
  const me = useSession();
  const { manifest, runs, deployments, catalog, templates, applications, error,
    reloadCatalog, reloadTemplates, reloadApplications } = useDashboardData(me);
  const [wizardTemplate, setWizardTemplate] = useState(null);
  const [view, setView] = useState('home');
  const [releaseNo, setReleaseNo] = useState(null);
  const [componentName, setComponentName] = useState(null);
  const [appRef, setAppRef] = useState(null);   // id or name — URL slug
  const [teamId, setTeamId] = useState(null);
  const [q, setQ] = useState('');
  const [filters, setFilters] = useState({ plantilla: '', estado: '' });
  const [collapsed, setCollapsed] = useState(false);
  const [menu, setMenu] = useState(false);
  const teamCtx = teamId && TEAM_VIEWS.includes(view);
  const { members, reload: reloadMembers } = useMembers(
    ['equipo', 'miembros', 'app-members'].includes(view) || teamCtx);
  const { teams, reload: reloadTeams } = useTeams(view === 'equipo' || teamCtx);

  // URL → state: initial load + back/forward.
  useEffect(() => {
    const apply = () => {
      const s = parsePath();
      setView(s.view || 'home');
      setAppRef(s.appRef || null);
      setComponentName(s.componentName || null);
      setTeamId(s.teamId || null);
      setReleaseNo(s.releaseNo || null);
    };
    apply();
    window.addEventListener('popstate', apply);
    return () => window.removeEventListener('popstate', apply);
  }, []);

  // state → URL.
  useEffect(() => {
    const path = pathFor({ view, appRef, componentName, teamId, releaseNo });
    if (window.location.pathname !== path)
      window.history.pushState(null, '', path);
  }, [view, appRef, componentName, teamId, releaseNo]);

  const appCtx = appRef && APP_VIEWS.includes(view);
  const app = (applications || []).find(
    (a) => String(a.id) === String(appRef) || a.name === appRef);
  const appLabel = app?.name || appRef;
  const team = (teams || []).find((t) => String(t.id) === String(teamId));
  const { releases, reload: reloadReleases } = useReleases(
    ['releases', 'app-releases'].includes(view));

  // Inside an application the manifest is the app's own OAM definition —
  // fetched from its app-model repo (falls back to the global one when the
  // app has no app-model component yet).
  const [appManifestData, setAppManifestData] = useState(null);
  useEffect(() => {
    if (!appCtx || !appLabel) return undefined;
    let dead = false;
    getManifest(appLabel)
      .then((m) => { if (!dead) setAppManifestData(m); })
      .catch(() => { if (!dead) setAppManifestData(null); });
    return () => { dead = true; };
  }, [appCtx, appLabel]);

  if (me === undefined) return <CenterCard title="Ensemble" sub="Cargando…" />;
  if (me?.forbidden) return <Unauthorized />;
  if (!me) return <Login />;
  if (error) return <CenterCard title="Ensemble" sub={error} />;
  if (!manifest) return <CenterCard title="Ensemble" sub="Cargando…" />;

  const detailLabels = {
    'app-detail': 'Detalle de Aplicación',
    'app-members': 'Equipo',
    'app-components': 'Componentes',
    'app-security': 'Seguridad',
    'app-releases': 'Releases',
    'nuevo-componente': 'Componentes / Nuevo componente',
    'release-detail': 'Releases / Detalle',
    'team-detail': 'Detalle de Equipo',
    'team-members': 'Miembros del Equipo',
    'component-detail': 'Componentes / Detalles del componente',
  };
  const viewLabel = view === 'home'
    ? 'Ensemble'
    : detailLabels[view] || NAV.find((n) => n.id === view)?.label || '';
  const lower = q.toLowerCase();
  const appComponentNames = appCtx
    ? catalog.filter((c) => c.application === appLabel).map((c) => c.name) : [];
  const appReleases = appCtx ? (releases || []).filter((r) =>
    r.application ? r.application === appLabel
      : !r.components || r.components.some((c) => appComponentNames.includes(c))) : [];
  const appManifestSrc = appManifestData || manifest;
  const appManifest = appCtx ? {
    ...appManifestSrc,
    components: (appManifestSrc.components || [])
      .filter((c) => appComponentNames.includes(c.name)),
  } : manifest;

  return (
    <>
      <div className="topbar">
        <span className="logo">
          <Ico d={ICON.logo} />
          ENSEMBLE
        </span>
        <span className="title">{view === 'home' ? '' : viewLabel}</span>
        <button className="menu-btn" title="Menú" onClick={() => setMenu(true)}>☰</button>
        <UserMenu me={me} />
      </div>
      {view !== 'home' && (
        <div className="crumbs">
          <a href="/ensemble">⌂</a><span className="sep">/</span>
          <a onClick={() => setView('home')}>Compañías</a><span className="sep">/</span>
          <a onClick={() => setView('aplicaciones')}>Personal</a>
          <span className="sep">/</span>
          {appCtx ? (
            <>
              <a onClick={() => setView('aplicaciones')}>Aplicaciones</a>
              <span className="sep">/</span>
              <a onClick={() => setView('app-detail')}>{appLabel}</a>
              {view === 'app-members' && (
                <><span className="sep">/</span><span>Equipo</span></>
              )}
              {view === 'app-security' && (
                <><span className="sep">/</span><span>Seguridad</span></>
              )}
              {view === 'app-releases' && (
                <><span className="sep">/</span><span>Releases</span></>
              )}
              {['app-components', 'component-detail', 'nuevo-componente'].includes(view) && (
                <>
                  <span className="sep">/</span>
                  <a onClick={() => setView('app-components')}>Componentes</a>
                  {view === 'component-detail' && (
                    <><span className="sep">/</span><span>{componentName}</span></>
                  )}
                  {view === 'nuevo-componente' && (
                    <><span className="sep">/</span><span>Nuevo componente</span></>
                  )}
                </>
              )}
            </>
          ) : view === 'release-detail' ? (
            <>
              <a onClick={() => { setView('releases'); reloadReleases(); }}>Releases</a>
              <span className="sep">/</span><span>Detalle</span>
            </>
          ) : teamCtx ? (
            <>
              <a onClick={() => { setView('equipo'); setTeamId(null); }}>Equipos</a>
              <span className="sep">/</span>
              <a onClick={() => setView('team-detail')}>{team?.name || teamId}</a>
              {view === 'team-members' && (
                <><span className="sep">/</span><span>Miembros del equipo</span></>
              )}
            </>
          ) : view === 'component-detail' ? (
            <>
              <a onClick={() => { setView('componentes'); setQ(''); }}>Componentes</a>
              <span className="sep">/</span><span>{componentName}</span>
            </>
          ) : (
            <span>{viewLabel}</span>
          )}
        </div>
      )}
      <div className="layout">
        {view !== 'home' && (
          <nav className={`sidebar${collapsed ? ' collapsed' : ''}`}>
            {teamCtx && (
              <a className="sidebar-back"
                onClick={() => { setView('equipo'); setTeamId(null); }}>
                ‹ {!collapsed && 'Volver'}
              </a>
            )}
            {appCtx && (
              <a className="sidebar-back"
                onClick={() => { setView('aplicaciones'); setAppRef(null); }}>
                ‹ {!collapsed && 'Volver'}
              </a>
            )}
            {(teamCtx ? TEAM_NAV
              : appCtx ? APP_NAV
              : SIDEBAR.map((id) => NAV.find((n) => n.id === id)))
              .map((n) => (
              <a key={n.id}
                 className={view === n.id
                   || (n.id === 'app-components'
                     && ['component-detail', 'nuevo-componente'].includes(view))
                   ? 'active' : ''}
                 title={n.label}
                 onClick={() => { setView(n.id); setQ(''); }}>
                <Ico d={n.icon} />{!collapsed && n.label}
              </a>
            ))}
            <button className="sidebar-toggle" onClick={() => setCollapsed((c) => !c)}
              title={collapsed ? 'Expandir' : 'Colapsar'}>{collapsed ? '›' : '‹'}</button>
          </nav>
        )}
        <div className="content">

          {view === 'releases' && (
            <ReleasesView releases={releases} me={me} onChanged={reloadReleases}
              onOpen={(n) => { setReleaseNo(n); setView('release-detail'); }} />
          )}

          {view === 'release-detail' && (
            <ReleaseDetail number={releaseNo} />
          )}

          {view === 'component-detail' && (
            <ComponentDetail name={componentName} templates={templates}
              manifest={manifest} onChanged={reloadCatalog} />
          )}

          {view === 'aplicaciones' && (
            <ApplicationsView applications={applications} me={me}
              onChanged={reloadApplications}
              onOpen={(n) => { setAppRef(String(n)); setView('app-detail'); }} />
          )}

          {view === 'app-detail' && (
            <ApplicationDetail name={appRef}
              onGoMembers={() => setView('app-members')} />
          )}

          {view === 'app-members' && (
            <ApplicationMembers name={appRef} members={members || []}
              onGoMembers={() => { setAppRef(null); setView('miembros'); }} />
          )}

          {view === 'app-security' && (
            <SecurityView me={me} app={appLabel} />
          )}

          {view === 'app-releases' && (
            <ReleasesView releases={appReleases} me={me} app={appLabel}
              onChanged={reloadReleases}
              onOpen={(n) => { setReleaseNo(n); setView('release-detail'); }} />
          )}

          {view === 'home' && (
            <HomeView me={me} applications={applications}
              onOpen={(n) => { setAppRef(String(n)); setView('app-detail'); }} />
          )}

          {/* Platform card kept but unlinked — reachable only by direct
              /ensemble/personal while we decide whether to drop it. */}
          {view === 'aplicacion' && (
            <ApplicationView manifest={manifest} />
          )}

          {view === 'app-components' && (
            <>
              <div className="card">
                <p className="card-label">Buscar componente</p>
                <SearchRow q={q} setQ={setQ} placeholder="Mi componente favorito"
                  action={
                    <>
                      <FiltersMenu templates={templates} filters={filters} setFilters={setFilters} />
                      <button className="btn btn-primary" style={{ marginLeft: 'auto' }}
                        onClick={() => { setView('nuevo-componente'); setQ(''); }}>Nuevo componente +</button>
                    </>
                  } />
                <p className="muted" style={{ fontSize: 12, margin: '-8px 0 14px' }}>
                  Buscar por nombre, nombre corto o plantilla</p>
                <ComponentsTable manifest={appManifest}
                  catalog={catalog.filter((c) => c.application === appLabel)}
                  templates={templates} q={lower} filters={filters} onChanged={reloadCatalog}
                  onOpen={(n) => { setComponentName(n); setView('component-detail'); setQ(''); }} />
              </div>
              <div className="card">
                <h2>Grafo de dependencias</h2>
                <DependencyGraph components={appManifest.components} />
              </div>
            </>
          )}

          {view === 'componentes' && (
            <>
              <div className="card">
                <p className="card-label">Buscar componente</p>
                <SearchRow q={q} setQ={setQ} placeholder="Mi componente favorito"
                  action={
                    <>
                      <FiltersMenu templates={templates} filters={filters} setFilters={setFilters} />
                      <button className="btn btn-primary" style={{ marginLeft: 'auto' }}
                        onClick={() => { setView('nuevo-componente'); setQ(''); }}>Nuevo componente +</button>
                    </>
                  } />
                <p className="muted" style={{ fontSize: 12, margin: '-8px 0 14px' }}>
                  Buscar por nombre, nombre corto o plantilla</p>
                <ComponentsTable manifest={manifest} catalog={catalog} templates={templates}
                  q={lower} filters={filters} onChanged={reloadCatalog}
                  onOpen={(n) => { setComponentName(n); setView('component-detail'); setQ(''); }} />
              </div>
              <div className="card">
                <h2>Grafo de dependencias</h2>
                <DependencyGraph components={manifest.components} />
              </div>
            </>
          )}

          {view === 'equipo' && (
            <TeamsView teams={teams} members={members} onChanged={reloadTeams}
              onOpen={(id) => { setTeamId(id); setView('team-detail'); }} />
          )}

          {view === 'team-detail' && (
            <TeamDetail id={teamId} />
          )}

          {view === 'team-members' && (
            <TeamMembers id={teamId} members={members}
              onGoMembers={() => { setTeamId(null); setView('miembros'); }} />
          )}

          {view === 'miembros' && (
            <MembersView members={members} onChanged={reloadMembers} />
          )}

          {view === 'seguridad' && (
            <SecurityView me={me} />
          )}

          {view === 'nuevo-componente' && (
            <TemplateGallery templates={templates} onPick={setWizardTemplate}
              onChanged={reloadTemplates} />
          )}

          {view === 'despliegues' && (
            <div className="card">
              <h2>Despliegues orquestados</h2>
              <SearchRow q={q} setQ={setQ} placeholder="Buscar run…" />
              <OrchRuns runs={filter(runs, lower, ['display_title'])}
                deployments={deployments} />
            </div>
          )}

        </div>
      </div>
      <footer className="footer">
        <span className="footer-links">
          <span>progmise</span>
          <span className="footer-sep">|</span>
          <span>v{manifest.version}</span>
          {['localhost', '127.0.0.1'].includes(window.location.hostname) && (
            <><span className="footer-sep">|</span><span>Entorno local</span></>
          )}
        </span>
        <span className="footer-links">
          <a href="/api/health" target="_blank" rel="noreferrer">Estado del sistema</a>
          <span className="footer-sep">|</span>
          <a href={`https://github.com/${manifest.repo}#readme`}
            target="_blank" rel="noreferrer">Documentación</a>
          <span className="footer-sep">|</span>
          <a href="https://github.com/progmise/ensemble-web/issues"
            target="_blank" rel="noreferrer">Reportar un problema</a>
        </span>
      </footer>
      {menu && (
        <>
          <div className="menu-overlay" onClick={() => setMenu(false)} />
          <nav className="menu-pop">
            {MENU.map((sec, i) => (
              <div key={i} className="menu-sec">
                {sec.title && <span className="menu-sec-title">{sec.title}</span>}
                {sec.items.map((id) => {
                  const n = NAV.find((x) => x.id === id);
                  return (
                    <a key={n.id}
                       onClick={() => { setView(n.id); setQ(''); setMenu(false); }}>
                      <Ico d={n.icon} />
                      {n.id === 'home' ? 'Página principal Ensemble' : n.label}
                    </a>
                  );
                })}
              </div>
            ))}
          </nav>
        </>
      )}
      {wizardTemplate && (
        <ComponentWizard template={wizardTemplate}
          applications={applications}
          defaultApplication={app?.name || null}
          components={(manifest.components || [])
            .filter((c) => !c.type || c.type === 'app').map((c) => c.name)}
          onClose={() => setWizardTemplate(null)}
          onBack={() => setWizardTemplate(null)}
          onCreated={reloadCatalog} />
      )}
    </>
  );
}
