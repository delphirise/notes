import library from '../../data/planner/goal-library.json';
import { copyText } from '../../services/clipboard.js';
import { buildPlanSummary } from '../../services/note-engine.js';
import { escapeHtml } from '../../utils/dom.js';

const domains = library.domains;

export const defaultState = {
  domainId: domains[0]?.id ?? '',
  objectives: [],
  interventions: [],
  targetDate: '',
};

function getDomain(state) {
  return domains.find((domain) => domain.id === state.domainId) ?? domains[0] ?? null;
}

function renderChecklist(items, selectedValues, kind) {
  return items
    .map((item) => {
      const checked = selectedValues.includes(item) ? 'checked' : '';
      return `
        <label class="check-card">
          <input type="checkbox" data-plan-kind="${escapeHtml(kind)}" value="${escapeHtml(item)}" ${checked} />
          <span>${escapeHtml(item)}</span>
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
    domainId: featureState.domainId || defaultState.domainId,
    objectives: [...(featureState.objectives ?? [])],
    interventions: [...(featureState.interventions ?? [])],
    targetDate: featureState.targetDate ?? '',
  };

  const updatePreview = () => {
    const domain = getDomain(state);
    const outputField = page.querySelector('#planner-output');
    if (outputField) {
      outputField.value = buildPlanSummary({
        domain: domain?.name,
        objectives: state.objectives,
        interventions: state.interventions,
        targetDate: state.targetDate,
      });
    }
  };

  const persist = () => {
    replaceFeatureState(state);
    updatePreview();
  };

  const render = () => {
    const activeDomain = getDomain(state);

    page.innerHTML = `
      <section class="hero-grid">
        <article class="panel accent-panel stack-sm">
          <p class="eyebrow">Treatment planning</p>
          <h3 class="panel-title">Goals, objectives, and interventions belong in data libraries.</h3>
          <p class="panel-copy">The current planner can be broken into configurable domain libraries so staff can update content without rewriting page markup.</p>
        </article>
        <article class="panel stack-sm">
          <p class="eyebrow">Plan summary</p>
          <textarea id="planner-output" rows="12" readonly></textarea>
          <div class="actions-row">
            <button class="primary-button" type="button" data-copy-plan>Copy plan</button>
          </div>
        </article>
      </section>

      <section class="three-column-grid">
        <article class="panel stack-sm">
          <label class="field-block">
            <span class="field-label">Goal domain</span>
            <select id="plan-domain-select">
              ${domains
                .map((domain) => {
                  const selected = domain.id === state.domainId ? 'selected' : '';
                  return `<option value="${escapeHtml(domain.id)}" ${selected}>${escapeHtml(domain.name)}</option>`;
                })
                .join('')}
            </select>
          </label>
          <label class="field-block">
            <span class="field-label">Review date</span>
            <input id="plan-target-date" type="date" value="${escapeHtml(state.targetDate)}" />
          </label>
        </article>
        <article class="panel stack-sm">
          <div class="section-heading compact-heading">
            <h3 class="panel-title small-title">Objectives</h3>
          </div>
          <div class="check-grid">
            ${activeDomain ? renderChecklist(activeDomain.objectives, state.objectives, 'objective') : ''}
          </div>
        </article>
        <article class="panel stack-sm">
          <div class="section-heading compact-heading">
            <h3 class="panel-title small-title">Interventions</h3>
          </div>
          <div class="check-grid">
            ${activeDomain ? renderChecklist(activeDomain.interventions, state.interventions, 'intervention') : ''}
          </div>
        </article>
      </section>
    `;

    updatePreview();
  };

  page.addEventListener('change', (event) => {
    const domainSelect = event.target.closest('#plan-domain-select');
    if (domainSelect) {
      state.domainId = domainSelect.value;
      state.objectives = [];
      state.interventions = [];
      replaceFeatureState(state);
      render();
      return;
    }

    const targetDate = event.target.closest('#plan-target-date');
    if (targetDate) {
      state.targetDate = targetDate.value;
      persist();
      return;
    }

    const checkbox = event.target.closest('[data-plan-kind]');
    if (!checkbox) {
      return;
    }

    const kind = checkbox.dataset.planKind === 'objective' ? 'objectives' : 'interventions';
    const selected = new Set(state[kind]);
    if (checkbox.checked) {
      selected.add(checkbox.value);
    } else {
      selected.delete(checkbox.value);
    }

    state[kind] = Array.from(selected);
    persist();
  });

  page.addEventListener('click', async (event) => {
    if (event.target.closest('[data-copy-plan]')) {
      const domain = getDomain(state);
      await copyText(
        buildPlanSummary({
          domain: domain?.name,
          objectives: state.objectives,
          interventions: state.interventions,
          targetDate: state.targetDate,
        }),
      );
    }
  });

  render();
}
