import navigation from '../data/navigation.json';

const pageLoaders = {
  dashboard: () => import('../features/dashboard/page.js'),
  mse: () => import('../features/mse/page.js'),
  darp: () => import('../features/darp/page.js'),
  templates: () => import('../features/templates/page.js'),
  diagnostics: () => import('../features/diagnostics/page.js'),
  planner: () => import('../features/planner/page.js'),
  letters: () => import('../features/letters/page.js'),
  'safety-plan': () => import('../features/safety-plan/page.js'),
};

export function getNavigation() {
  return navigation;
}

export function isKnownRoute(route) {
  return Object.hasOwn(pageLoaders, route);
}

export async function loadPage(route) {
  const loader = pageLoaders[route] ?? pageLoaders.dashboard;
  return loader();
}
