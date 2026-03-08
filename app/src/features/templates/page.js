import noteCatalog from '../../data/templates/note-catalog.json';
import staffRoles from '../../data/templates/staff-roles.json';
import { renderFields } from '../../components/dynamic-form.js';
import { copyText } from '../../services/clipboard.js';
import { buildTemplateNote } from '../../services/note-engine.js';
import { escapeHtml } from '../../utils/dom.js';

export const defaultState = {
  role: staffRoles[0]?.id ?? '',
  noteId: '',
  values: {},
};

function getNotesForRole(role) {
  return noteCatalog.filter((note) => note.role === role);
}

function normalizeState(state) {
  const notes = getNotesForRole(state.role);
  const noteIsValid = notes.some((note) => note.id === state.noteId);

  if (!noteIsValid) {
    state.noteId = notes[0]?.id ?? '';
    state.values = {};
  }
}

function getActiveNote(state) {
  return noteCatalog.find((note) => note.id === state.noteId) ?? null;
}

export async function mount(container, { featureState, replaceFeatureState }) {
  const page = document.createElement('div');
  page.className = 'stack-lg';
  container.append(page);

  const state = {
    role: featureState.role || defaultState.role,
    noteId: featureState.noteId || defaultState.noteId,
    values: { ...(featureState.values ?? {}) },
  };

  const updatePreview = () => {
    const activeNote = getActiveNote(state);
    const output = buildTemplateNote(activeNote, state.values);
    const outputField = page.querySelector('#template-output');
    if (outputField) {
      outputField.value = output;
    }
  };

  const persist = () => {
    replaceFeatureState(state);
    updatePreview();
  };

  const render = () => {
    normalizeState(state);
    const notes = getNotesForRole(state.role);
    const activeNote = getActiveNote(state);

    page.innerHTML = `
      <section class="hero-grid">
        <article class="panel accent-panel stack-sm">
          <p class="eyebrow">Template engine</p>
          <h3 class="panel-title">Role-based notes are now data, not a 4,000-line script.</h3>
          <p class="panel-copy">The role list, note catalog, fields, and output blocks all come from JSON. That makes it realistic to add a new note type without editing a monolithic JavaScript file.</p>
        </article>
        <article class="panel stack-sm">
          <p class="eyebrow">Generated note</p>
          <textarea id="template-output" rows="14" readonly placeholder="Select a role and note type to build a template-based note."></textarea>
          <div class="actions-row">
            <button class="primary-button" type="button" data-copy-template>Copy note</button>
          </div>
        </article>
      </section>

      <section class="two-column-grid">
        <article class="panel stack-sm">
          <label class="field-block">
            <span class="field-label">Staff role</span>
            <select id="template-role-select">
              ${staffRoles
                .map((role) => {
                  const selected = role.id === state.role ? 'selected' : '';
                  return `<option value="${escapeHtml(role.id)}" ${selected}>${escapeHtml(role.label)}</option>`;
                })
                .join('')}
            </select>
          </label>
          <label class="field-block">
            <span class="field-label">Note type</span>
            <select id="template-note-select">
              ${notes
                .map((note) => {
                  const selected = note.id === state.noteId ? 'selected' : '';
                  return `<option value="${escapeHtml(note.id)}" ${selected}>${escapeHtml(note.label)}</option>`;
                })
                .join('')}
            </select>
          </label>
          <div class="field-grid">
            ${activeNote ? renderFields(activeNote.fields, state.values) : '<p class="empty-state">No notes available for the selected role.</p>'}
          </div>
        </article>

        <article class="panel stack-sm">
          <p class="eyebrow">How this replaces the old structure</p>
          <div class="info-list">
            <div>
              <span class="mini-label">Old pattern</span>
              <p>HTML markup and branching logic tightly coupled in one file.</p>
            </div>
            <div>
              <span class="mini-label">New pattern</span>
              <p>One page module renders any note from JSON field definitions and a tokenized output string.</p>
            </div>
            <div>
              <span class="mini-label">Next extension</span>
              <p>Add validation rules or alternate outputs in JSON without touching the router or shell.</p>
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

    if (target.id === 'template-role-select') {
      state.role = target.value;
      state.noteId = '';
      state.values = {};
      replaceFeatureState(state);
      render();
      return;
    }

    if (target.id === 'template-note-select') {
      state.noteId = target.value;
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
    if (event.target.closest('[data-copy-template]')) {
      const activeNote = getActiveNote(state);
      await copyText(buildTemplateNote(activeNote, state.values));
    }
  });

  render();
}
