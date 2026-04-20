export function loadState() {
  // PHI safety default: no generic client-side persistence.
  return null;
}

export function saveState(state) {
  // Preserve API shape; persistence intentionally disabled.
  void state;
}
