import schema from '../../data/mse/schema.json';
import { copyText } from '../../services/clipboard.js';
import { buildMseSummary } from '../../services/note-engine.js';
import { escapeHtml } from '../../utils/dom.js';

export const defaultState = {
  selections: {},
  notes: {},
};

function renderSection(section, state) {
  const selectedChoices = state.selections[section.id] ?? [];
  const customNote = state.notes[section.id] ?? '';

  return `
    <article class="panel stack-sm">
      <div class="section-heading compact-heading">
        <h3 class="panel-title small-title">${escapeHtml(section.label)}</h3>
      </div>
      <div class="check-grid">
        ${section.choices
          .map((choice) => {
            const checked = selectedChoices.includes(choice) ? 'checked' : '';
            return `
              <label class="check-card">
                <input type="checkbox" data-mse-option data-section-id="${escapeHtml(section.id)}" value="${escapeHtml(choice)}" ${checked} />
                <span>${escapeHtml(choice)}</span>
              </label>
            `;
          })
          .join('')}
      </div>
      <label class="field-block">
        <span class="field-label">Custom note</span>
        <textarea data-mse-note data-section-id="${escapeHtml(section.id)}" rows="2" placeholder="Add detail for ${escapeHtml(section.label.toLowerCase())}">${escapeHtml(customNote)}</textarea>
      </label>
    </article>
  `;
}

function createState(featureState) {
  return {
    selections: { ...(featureState.selections ?? {}) },
    notes: { ...(featureState.notes ?? {}) },
  };
}

export async function mount(container, { featureState, replaceFeatureState }) {
  const page = document.createElement('div');
  page.className = 'stack-lg';
  container.append(page);

  let state = createState(featureState);

  const updatePreview = () => {
    const output = buildMseSummary(schema.sections, state);
    const outputField = page.querySelector('#mse-output');
    if (outputField) {
      outputField.value = output;
    }
  };

  const saveState = () => {
    replaceFeatureState(state);
    updatePreview();
  };

  const render = () => {
    page.innerHTML = `
      <section class="hero-grid">
        <article class="panel accent-panel stack-sm">
          <p class="eyebrow">Assessment</p>
          <h3 class="panel-title">MSE is now a schema-driven feature page.</h3>
          <p class="panel-copy">Sections and preset bundles live in JSON, while the summary builder lives in a shared note service. That means the wording logic can be reused by other notes without scraping an iframe.</p>
          <div class="actions-row wrap-row">
            ${schema.presets
              .map(
                (preset) => `<button class="ghost-button" type="button" data-preset-id="${escapeHtml(preset.id)}">${escapeHtml(preset.label)}</button>`,
              )
              .join('')}
            <button class="ghost-button" type="button" data-clear-mse>Clear</button>
          </div>
        </article>
        <article class="panel stack-sm">
          <p class="eyebrow">Generated summary</p>
          <textarea id="mse-output" rows="12" readonly placeholder="Choose findings to build the MSE summary."></textarea>
          <div class="actions-row">
            <button class="primary-button" type="button" data-copy-mse>Copy MSE</button>
          </div>
        </article>
      </section>
      <section class="stack-md">
        ${schema.sections.map((section) => renderSection(section, state)).join('')}
      </section>
    `;

    updatePreview();
  };

  page.addEventListener('click', async (event) => {
    const presetButton = event.target.closest('[data-preset-id]');
    if (presetButton) {
      const preset = schema.presets.find((item) => item.id === presetButton.dataset.presetId);
      if (!preset) {
        return;
      }

      state = {
        selections: structuredClone(preset.values),
        notes: {},
      };
      replaceFeatureState(state);
      render();
      return;
    }

    if (event.target.closest('[data-clear-mse]')) {
      state = createState(defaultState);
      replaceFeatureState(state);
      render();
      return;
    }

    if (event.target.closest('[data-copy-mse]')) {
      await copyText(buildMseSummary(schema.sections, state));
    }
  });

  page.addEventListener('change', (event) => {
    const checkbox = event.target.closest('[data-mse-option]');
    if (!checkbox) {
      return;
    }

    const sectionId = checkbox.dataset.sectionId;
    const currentValues = new Set(state.selections[sectionId] ?? []);

    if (checkbox.checked) {
      currentValues.add(checkbox.value);
    } else {
      currentValues.delete(checkbox.value);
    }

    state.selections[sectionId] = Array.from(currentValues);
    saveState();
  });

  page.addEventListener('input', (event) => {
    const noteField = event.target.closest('[data-mse-note]');
    if (!noteField) {
      return;
    }

    state.notes[noteField.dataset.sectionId] = noteField.value;
    saveState();
  });

  render();
}
