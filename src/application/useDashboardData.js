// Use case: dashboard data — manifest + releases + orchestration runs load
// once a session is confirmed; the component catalog reloads on demand.
import { useCallback, useEffect, useState } from 'react';
import { getManifest, getOrchRuns } from '../infrastructure/api/githubApi.js';
import { getApplications, getComponents, getDeployments, getTemplates }
  from '../infrastructure/api/catalogApi.js';

export const useDashboardData = (me) => {
  const [manifest, setManifest] = useState(null);
  const [runs, setRuns] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState(null);

  const reloadCatalog = useCallback(
    () => getComponents().then(setCatalog).catch(() => setCatalog([])),
    [],
  );
  const reloadTemplates = useCallback(
    () => getTemplates().then(setTemplates).catch(() => setTemplates([])),
    [],
  );
  const reloadApplications = useCallback(
    () => getApplications().then(setApplications).catch(() => setApplications([])),
    [],
  );

  useEffect(() => {
    if (!me || me.forbidden) return;
    Promise.all([
      getManifest(),
      getOrchRuns().catch(() => []),
      getDeployments().catch(() => []),
    ])
      .then(([m, o, d]) => { setManifest(m); setRuns(o); setDeployments(d); })
      .catch((e) => setError(e.message));
    reloadCatalog();
    reloadTemplates();
    reloadApplications();
  }, [me, reloadCatalog, reloadTemplates, reloadApplications]);

  return { manifest, runs, deployments, catalog, templates, applications, error,
    reloadCatalog, reloadTemplates, reloadApplications };
};
