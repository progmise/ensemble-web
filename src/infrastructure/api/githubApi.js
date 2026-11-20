// GitHub reads proxied by the backend (/api/gh/*) + the rendered manifest.
import * as yaml from 'js-yaml';
import { apiGet } from './client.js';

const MANIFEST_REPO = 'progmise/ensemble-app-model';

export function getRepo(repo = MANIFEST_REPO) {
  return apiGet(`/api/gh/repos/${repo}`);
}

export async function getManifest(application) {
  const url = application
    ? `/api/manifest?application=${encodeURIComponent(application)}` : '/api/manifest';
  const res = await fetch(url);
  const manifest = yaml.load(await res.text());
  // The API resolves the app's app-model repo — it travels with the manifest.
  manifest.repo = res.headers.get('x-manifest-repo') || MANIFEST_REPO;
  return manifest;
}

export function getOrchRuns(repo = MANIFEST_REPO) {
  return apiGet(
    `/api/gh/repos/${repo}/actions/workflows/deploy.yml/runs?per_page=10`,
  ).then((d) => d.workflow_runs);
}

export function getComponentRuns(repo, workflow = 'deploy.yml') {
  return apiGet(
    `/api/gh/repos/${repo}/actions/workflows/${workflow}/runs?per_page=5`,
  ).then((d) => d.workflow_runs);
}
