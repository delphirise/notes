import modalities from '../../data/darp/modalities.json';
import mseSchema from '../../data/mse/schema.json';
import { copyText } from '../../services/clipboard.js';
import { buildDarpNote, buildMseSummary } from '../../services/note-engine.js';
import { getFeatureState } from '../../state/store.js';
import { escapeHtml } from '../../utils/dom.js';

export const defaultState = {
  sessionContent: '',
  mentalStatus: '',
  response: '',
  goals: '',
  plan: '',
  interventions: [],
};

function createState(featureState) {
  return {
    sessionContent: featureState.sessionContent ?? '',
    mentalStatus: featureState.mentalStatus ?? '',
    response: featureState.response ?? '',
    goals: featureState.goals ?? '',
    plan: featureState.plan ?? '',
    interventions: [...(featureState.interventions ?? [])],
  };
}

function renderInterventionGroup(group, selectedItems) {
  return `
    <article class="panel stack-sm">
      <div class="section-heading compact-heading">
        <h3 class="panel-title small-title">${escapeHtml(group.name)}</h3>
      </div>
      <div class="check-grid">
        ${group.items
          .map((item) => {
            const checked = selectedItems.includes(item) ? 'checked' : '';
            return `
              <label class="check-card">
                <input type="checkbox" data-intervention value="${escapeHtml(item)}" ${checked} />
                <span>${escapeHtml(item)}</span>
              </label>
            `;
          })
          .join('')}
      </div>
    </article>
  `;
}

export async function mount(container, { featureState, replaceFeatureState }) {
  const page = document.createElement('div');
  page.className = 'stack-lg';
  container.append(page);

  const state = createState(featureState);

  const updatePreview = () => {
    const output = buildDarpNote(state);
    const outputField = page.querySelector('#darp-output');
    if (outputField) {
      outputField.value = output;
    }
  };

  const syncState = () => {
    replaceFeatureState(state);
    updatePreview();
  };

  page.innerHTML = `
    <section class="hero-grid">
      <article class="panel accent-panel stack-sm">
        <p class="eyebrow">Progress note</p>
        <h3 class="panel-title">DARP can pull directly from other features.</h3>
        <p class="panel-copy">This route shows the main benefit of removing iframes: a progress note can use the current MSE summary with one button because every feature is in the same stateful app.</p>
        <div class="actions-row wrap-row">
          <button class="ghost-button" type="button" data-use-mse>Pull current MSE summary</button>
          <button class="ghost-button" type="button" data-clear-darp>Clear note</button>
        </div>
      </article>
      <article class="panel stack-sm">
        <p class="eyebrow">Generated DARP</p>
        <textarea id="darp-output" rows="14" readonly></textarea>
        <div class="actions-row">
          <button class="primary-button" type="button" data-copy-darp>Copy DARP</button>
        </div>
      </article>
    </section>

    <section class="two-column-grid">
      <article class="panel stack-sm">
        <label class="field-block">
          <span class="field-label">Session content and problems addressed</span>
          <textarea id="darp-session-content" rows="5" placeholder="Client presentation, themes, and stressors">${escapeHtml(state.sessionContent)}</textarea>
        </label>
        <label class="field-block">
          <span class="field-label">Mental status</span>
          <textarea id="darp-mental-status" rows="4" placeholder="Pull from the MSE route or summarize here">${escapeHtml(state.mentalStatus)}</textarea>
        </label>
        <label class="field-block">
          <span class="field-label">Client response</span>
          <textarea id="darp-response" rows="4" placeholder="Engagement, insight, barriers, and progress">${escapeHtml(state.response)}</textarea>
        </label>
        <label class="field-block">
          <span class="field-label">Progress toward goals</span>
          <textarea id="darp-goals" rows="4" placeholder="Which treatment goals moved during the session?">${escapeHtml(state.goals)}</textarea>
        </label>
        <label class="field-block">
          <span class="field-label">Plan</span>
          <textarea id="darp-plan" rows="4" placeholder="Next session focus, referrals, follow-up, or homework">${escapeHtml(state.plan)}</textarea>
        </label>
      </article>

      <section class="stack-sm">
        ${modalities.map((group) => renderInterventionGroup(group, state.interventions)).join('')}
      </section>
    </section>
  `;

  page.addEventListener('click', async (event) => {
    if (event.target.closest('[data-use-mse]')) {
      const mseState = getFeatureState('mse', { selections: {}, notes: {} });
      state.mentalStatus = buildMseSummary(mseSchema.sections, mseState);
      const field = page.querySelector('#darp-mental-status');
      if (field) {
        field.value = state.mentalStatus;
      }
      syncState();
      return;
    }

    if (event.target.closest('[data-clear-darp]')) {
      Object.assign(state, createState(defaultState));
      page.querySelectorAll('textarea').forEach((textarea) => {
        if (textarea.id !== 'darp-output') {
          textarea.value = '';
        }
      });
      page.querySelectorAll('[data-intervention]').forEach((checkbox) => {
        checkbox.checked = false;
      });
      syncState();
      return;
    }

    if (event.target.closest('[data-copy-darp]')) {
      await copyText(buildDarpNote(state));
    }
  });

  page.addEventListener('input', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLTextAreaElement)) {
      return;
    }

    if (target.id === 'darp-session-content') {
      state.sessionContent = target.value;
    }
    if (target.id === 'darp-mental-status') {
      state.mentalStatus = target.value;
    }
    if (target.id === 'darp-response') {
      state.response = target.value;
    }
    if (target.id === 'darp-goals') {
      state.goals = target.value;
    }
    if (target.id === 'darp-plan') {
      state.plan = target.value;
    }

    syncState();
  });

  page.addEventListener('change', (event) => {
    const checkbox = event.target.closest('[data-intervention]');
    if (!checkbox) {
      return;
    }

    const selected = new Set(state.interventions);
    if (checkbox.checked) {
      selected.add(checkbox.value);
    } else {
      selected.delete(checkbox.value);
    }

    state.interventions = Array.from(selected);
    syncState();
  });

  updatePreview();
}
