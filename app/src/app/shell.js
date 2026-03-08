import { copyText } from '../services/clipboard.js';
import { getFeatureState, replaceFeatureState, setRoute, updateFeatureState } from '../state/store.js';
import { getNavigation, isKnownRoute, loadPage } from './page-registry.js';
import { getRoute, navigate, watchRoutes } from './router.js';
import { escapeHtml } from '../utils/dom.js';

const navigation = getNavigation();

function renderShellMarkup() {
  const navItems = navigation
    .map(
      (item) => `
        <button class="nav-link" data-route="${escapeHtml(item.route)}">
          <span class="nav-eyebrow">${escapeHtml(item.eyebrow)}</span>
          <span class="nav-label">${escapeHtml(item.label)}</span>
        </button>
      `,
    )
    .join('');

  return `
    <div class="app-shell">
      <aside class="shell-sidebar">
        <div>
          <p class="brand-kicker">Notes Reworked</p>
          <h1 class="brand-title">One clinical workspace, not a cluster of iframes.</h1>
          <p class="brand-copy">Each tool is a feature module backed by JSON data, shared services, and one persisted app state.</p>
        </div>
        <nav class="shell-nav">${navItems}</nav>
      </aside>
      <main class="shell-main">
        <header class="shell-header">
          <div>
            <p class="page-kicker" id="pageEyebrow"></p>
            <h2 class="page-title" id="pageTitle"></h2>
          </div>
          <button class="ghost-button" id="copyRouteButton" type="button">Copy route</button>
        </header>
        <section class="page-surface" id="pageMount"></section>
      </main>
    </div>
  `;
}

function setActiveNav(root, route) {
  root.querySelectorAll('[data-route]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.route === route);
  });
}

function setPageHeader(root, route) {
  const current = navigation.find((item) => item.route === route) ?? navigation[0];
  root.querySelector('#pageEyebrow').textContent = current.eyebrow;
  root.querySelector('#pageTitle').textContent = current.label;
}

export function createShell(root) {
  root.innerHTML = renderShellMarkup();

  root.querySelector('.shell-nav').addEventListener('click', (event) => {
    const button = event.target.closest('[data-route]');
    if (!button) {
      return;
    }

    navigate(button.dataset.route);
  });

  root.querySelector('#copyRouteButton').addEventListener('click', async () => {
    const route = getRoute();
    await copyText(`${window.location.origin}${window.location.pathname}#/${route}`);
  });

  const mountNode = root.querySelector('#pageMount');

  watchRoutes(async (route) => {
    const safeRoute = isKnownRoute(route) ? route : 'dashboard';
    setRoute(safeRoute);
    setActiveNav(root, safeRoute);
    setPageHeader(root, safeRoute);
    mountNode.innerHTML = '<div class="loading-state">Loading module...</div>';

    const pageModule = await loadPage(safeRoute);
    const defaultState = pageModule.defaultState ?? {};
    const featureState = getFeatureState(safeRoute, defaultState);

    mountNode.innerHTML = '';
    await pageModule.mount(mountNode, {
      route: safeRoute,
      featureState,
      navigate,
      updateFeatureState: (partial) => updateFeatureState(safeRoute, partial),
      replaceFeatureState: (nextState) => replaceFeatureState(safeRoute, nextState),
    });
  });
}
