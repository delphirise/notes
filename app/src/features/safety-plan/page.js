import sections from '../../data/safety-plan/sections.json';
import { renderFields } from '../../components/dynamic-form.js';
import { copyText } from '../../services/clipboard.js';
import { buildSafetyPlan } from '../../services/note-engine.js';

export const defaultState = {
  values: {},
};

function createFields() {
  return sections.map((section) => ({
    key: section.id,
    label: section.label,
    type: 'textarea',
    rows: 3,
    placeholder: section.placeholder,
  }));
}

export async function mount(container, { featureState, replaceFeatureState }) {
  const page = document.createElement('div');
  page.className = 'stack-lg';
  container.append(page);

  const state = {
    values: { ...(featureState.values ?? {}) },
  };

  const fields = createFields();

  const updatePreview = () => {
    const outputField = page.querySelector('#safety-plan-output');
    if (outputField) {
      outputField.value = buildSafetyPlan(sections, state.values);
    }
  };

  const persist = () => {
    replaceFeatureState(state);
    updatePreview();
  };

  page.innerHTML = `
    <section class="hero-grid">
      <article class="panel accent-panel stack-sm">
        <p class="eyebrow">Safety planning</p>
        <h3 class="panel-title">Crisis planning can share the same form infrastructure.</h3>
        <p class="panel-copy">This route uses the generic dynamic field renderer and the shared note engine, so the safety plan is just another structured feature instead of a one-off page.</p>
      </article>
      <article class="panel stack-sm">
        <p class="eyebrow">Generated safety plan</p>
        <textarea id="safety-plan-output" rows="14" readonly></textarea>
        <div class="actions-row">
          <button class="primary-button" type="button" data-copy-safety-plan>Copy plan</button>
        </div>
      </article>
    </section>

    <section class="two-column-grid">
      <article class="panel stack-sm">
        <div class="field-grid">
          ${renderFields(fields, state.values)}
        </div>
      </article>
      <article class="panel stack-sm">
        <p class="eyebrow">Shared architecture</p>
        <div class="info-list">
          <div>
            <span class="mini-label">Data source</span>
            <p>Plan sections come from JSON, so wording and order can change without editing the router.</p>
          </div>
          <div>
            <span class="mini-label">Reuse</span>
            <p>The same dynamic form renderer could support CSSRS, discharge planning, or screening tools next.</p>
          </div>
        </div>
      </article>
    </section>
  `;

  page.addEventListener('input', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
      return;
    }

    if (target.dataset.fieldKey) {
      state.values[target.dataset.fieldKey] = target.value;
      persist();
    }
  });

  page.addEventListener('change', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
      return;
    }

    if (target.dataset.fieldKey) {
      state.values[target.dataset.fieldKey] = target.value;
      persist();
    }
  });

  page.addEventListener('click', async (event) => {
    if (event.target.closest('[data-copy-safety-plan]')) {
      await copyText(buildSafetyPlan(sections, state.values));
    }
  });

  updatePreview();
}
