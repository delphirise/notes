import { loadState, saveState } from '../services/storage.js';

const fallbackState = {
  activeRoute: 'dashboard',
  features: {},
};

const state = {
  ...fallbackState,
  ...(loadState() ?? {}),
  features: {
    ...fallbackState.features,
    ...(loadState()?.features ?? {}),
  },
};

const listeners = new Set();

function emit() {
  saveState(state);
  listeners.forEach((listener) => listener(getState()));
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getState() {
  return structuredClone(state);
}

export function getFeatureState(featureKey, defaults = {}) {
  if (!state.features[featureKey]) {
    state.features[featureKey] = structuredClone(defaults);
    emit();
  }

  return structuredClone(state.features[featureKey]);
}

export function setRoute(route) {
  state.activeRoute = route;
  emit();
}

export function updateFeatureState(featureKey, partial) {
  state.features[featureKey] = {
    ...(state.features[featureKey] ?? {}),
    ...structuredClone(partial),
  };
  emit();
}

export function replaceFeatureState(featureKey, nextState) {
  state.features[featureKey] = structuredClone(nextState);
  emit();
}
