export function getRoute() {
  const route = window.location.hash.replace(/^#\/?/, '').trim();
  return route || 'dashboard';
}

export function navigate(route) {
  const nextHash = `#/${route}`;
  if (window.location.hash === nextHash) {
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    return;
  }

  window.location.hash = nextHash;
}

export function watchRoutes(onRouteChange) {
  const handleRouteChange = () => onRouteChange(getRoute());
  window.addEventListener('hashchange', handleRouteChange);
  handleRouteChange();

  return () => window.removeEventListener('hashchange', handleRouteChange);
}
