import diagnoses from '../../data/diagnostics/sud-diagnoses.json';
import { copyText } from '../../services/clipboard.js';
import { buildDiagnosticSummary } from '../../services/note-engine.js';
import { escapeHtml } from '../../utils/dom.js';

export const defaultState = {
  diagnosisId: diagnoses[0]?.id ?? '',
  selectedCriteria: [],
};

function getActiveDiagnosis(state) {
  return diagnoses.find((diagnosis) => diagnosis.id === state.diagnosisId) ?? diagnoses[0] ?? null;
}

function renderCriteria(activeDiagnosis, selectedCriteria) {
  if (!activeDiagnosis) {
    return '<p class="empty-state">No diagnostic data configured yet.</p>';
  }

  return activeDiagnosis.criteria
    .map((criterion) => {
      const checked = selectedCriteria.includes(criterion) ? 'checked' : '';
      return `
        <label class="check-card">
          <input type="checkbox" data-diagnostic-criterion value="${escapeHtml(criterion)}" ${checked} />
          <span>${escapeHtml(criterion)}</span>
        </label>
      `;
    })
    .join('');
}

export async function mount(container, { featureState, replaceFeatureState }) {
  const page = document.createElement('div');
  page.className = 'stack-lg';
  container.append(page);

  const state = {
    diagnosisId: featureState.diagnosisId || defaultState.diagnosisId,
    selectedCriteria: [...(featureState.selectedCriteria ?? [])],
  };

  const updatePreview = () => {
    const activeDiagnosis = getActiveDiagnosis(state);
    const outputField = page.querySelector('#diagnostic-output');
    if (outputField) {
      outputField.value = buildDiagnosticSummary(activeDiagnosis, state.selectedCriteria);
    }
  };

  const persist = () => {
    replaceFeatureState(state);
    updatePreview();
  };

  const render = () => {
    const activeDiagnosis = getActiveDiagnosis(state);

    page.innerHTML = `
      <section class="hero-grid">
        <article class="panel accent-panel stack-sm">
          <p class="eyebrow">Diagnostics</p>
          <h3 class="panel-title">Structured criteria can live in JSON too.</h3>
          <p class="panel-copy">The current repo embeds large diagnostic content directly inside HTML files. Here, the diagnosis catalog is data and the summary logic is reusable application code.</p>
        </article>
        <article class="panel stack-sm">
          <p class="eyebrow">Diagnostic summary</p>
          <textarea id="diagnostic-output" rows="12" readonly></textarea>
          <div class="actions-row">
            <button class="primary-button" type="button" data-copy-diagnostic>Copy summary</button>
          </div>
        </article>
      </section>

      <section class="two-column-grid">
        <article class="panel stack-sm">
          <label class="field-block">
            <span class="field-label">Diagnosis</span>
            <select id="diagnosis-select">
              ${diagnoses
                .map((diagnosis) => {
                  const selected = diagnosis.id === state.diagnosisId ? 'selected' : '';
                  return `<option value="${escapeHtml(diagnosis.id)}" ${selected}>${escapeHtml(diagnosis.name)}</option>`;
                })
                .join('')}
            </select>
          </label>
          <div class="pill-row">
            ${(activeDiagnosis?.icd ?? []).map((code) => `<span class="pill">${escapeHtml(code)}</span>`).join('')}
          </div>
        </article>
        <article class="panel stack-sm">
          <div class="section-heading compact-heading">
            <h3 class="panel-title small-title">Criteria</h3>
          </div>
          <div class="check-grid">
            ${renderCriteria(activeDiagnosis, state.selectedCriteria)}
          </div>
        </article>
      </section>
    `;

    updatePreview();
  };

  page.addEventListener('change', (event) => {
    const select = event.target.closest('#diagnosis-select');
    if (select) {
      state.diagnosisId = select.value;
      state.selectedCriteria = [];
      replaceFeatureState(state);
      render();
      return;
    }

    const checkbox = event.target.closest('[data-diagnostic-criterion]');
    if (!checkbox) {
      return;
    }

    const nextSelection = new Set(state.selectedCriteria);
    if (checkbox.checked) {
      nextSelection.add(checkbox.value);
    } else {
      nextSelection.delete(checkbox.value);
    }
    state.selectedCriteria = Array.from(nextSelection);
    persist();
  });

  page.addEventListener('click', async (event) => {
    if (event.target.closest('[data-copy-diagnostic]')) {
      const activeDiagnosis = getActiveDiagnosis(state);
      await copyText(buildDiagnosticSummary(activeDiagnosis, state.selectedCriteria));
    }
  });

  render();
}
