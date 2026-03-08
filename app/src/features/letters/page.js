import letterTypes from '../../data/letters/letter-types.json';
import { renderFields } from '../../components/dynamic-form.js';
import { copyText } from '../../services/clipboard.js';
import { buildLetter } from '../../services/note-engine.js';
import { escapeHtml } from '../../utils/dom.js';

export const defaultState = {
  letterId: letterTypes[0]?.id ?? '',
  values: {},
};

function getLetter(state) {
  return letterTypes.find((letter) => letter.id === state.letterId) ?? letterTypes[0] ?? null;
}

export async function mount(container, { featureState, replaceFeatureState }) {
  const page = document.createElement('div');
  page.className = 'stack-lg';
  container.append(page);

  const state = {
    letterId: featureState.letterId || defaultState.letterId,
    values: { ...(featureState.values ?? {}) },
  };

  const updatePreview = () => {
    const activeLetter = getLetter(state);
    const outputField = page.querySelector('#letter-output');
    if (outputField) {
      outputField.value = buildLetter(activeLetter, state.values);
    }
  };

  const persist = () => {
    replaceFeatureState(state);
    updatePreview();
  };

  const render = () => {
    const activeLetter = getLetter(state);

    page.innerHTML = `
      <section class="hero-grid">
        <article class="panel accent-panel stack-sm">
          <p class="eyebrow">Letters and referrals</p>
          <h3 class="panel-title">Letter drafting can use the same template engine as notes.</h3>
          <p class="panel-copy">Instead of a separate app with its own storage strategy, letters now share the shell, styling, and token replacement service.</p>
        </article>
        <article class="panel stack-sm">
          <p class="eyebrow">Generated letter</p>
          <textarea id="letter-output" rows="14" readonly></textarea>
          <div class="actions-row">
            <button class="primary-button" type="button" data-copy-letter>Copy letter</button>
          </div>
        </article>
      </section>

      <section class="two-column-grid">
        <article class="panel stack-sm">
          <label class="field-block">
            <span class="field-label">Letter type</span>
            <select id="letter-type-select">
              ${letterTypes
                .map((letter) => {
                  const selected = letter.id === state.letterId ? 'selected' : '';
                  return `<option value="${escapeHtml(letter.id)}" ${selected}>${escapeHtml(letter.label)}</option>`;
                })
                .join('')}
            </select>
          </label>
          <div class="field-grid">
            ${activeLetter ? renderFields(activeLetter.fields, state.values) : ''}
          </div>
        </article>

        <article class="panel stack-sm">
          <p class="eyebrow">Structure</p>
          <div class="info-list">
            <div>
              <span class="mini-label">Shared service</span>
              <p>Letter outputs use the same token replacement logic as note templates.</p>
            </div>
            <div>
              <span class="mini-label">Shared state</span>
              <p>Any saved values persist in the same app state bucket instead of a separate iframe-local store.</p>
            </div>
          </div>
        </article>
      </section>
    `;

    updatePreview();
  };

  page.addEventListener('change', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement)) {
      return;
    }

    if (target.id === 'letter-type-select') {
      state.letterId = target.value;
      state.values = {};
      replaceFeatureState(state);
      render();
      return;
    }

    if (target.dataset.fieldKey) {
      state.values[target.dataset.fieldKey] = target.value;
      persist();
    }
  });

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

  page.addEventListener('click', async (event) => {
    if (event.target.closest('[data-copy-letter]')) {
      const activeLetter = getLetter(state);
      await copyText(buildLetter(activeLetter, state.values));
    }
  });

  render();
}
