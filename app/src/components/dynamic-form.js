import { escapeHtml } from '../utils/dom.js';

function renderOptions(field, value) {
  return field.options
    .map((option) => {
      const selected = option.value === value ? 'selected' : '';
      return `<option value="${escapeHtml(option.value)}" ${selected}>${escapeHtml(option.label)}</option>`;
    })
    .join('');
}

export function renderFields(fields, values = {}) {
  return fields
    .map((field) => {
      const value = values[field.key] ?? '';
      const helpText = field.helpText ? `<p class="field-help">${escapeHtml(field.helpText)}</p>` : '';

      if (field.type === 'textarea') {
        return `
          <label class="field-block">
            <span class="field-label">${escapeHtml(field.label)}</span>
            <textarea data-field-key="${escapeHtml(field.key)}" rows="${field.rows ?? 4}" placeholder="${escapeHtml(field.placeholder ?? '')}">${escapeHtml(value)}</textarea>
            ${helpText}
          </label>
        `;
      }

      if (field.type === 'select') {
        return `
          <label class="field-block">
            <span class="field-label">${escapeHtml(field.label)}</span>
            <select data-field-key="${escapeHtml(field.key)}">
              <option value="">${escapeHtml(field.placeholder ?? 'Select an option')}</option>
              ${renderOptions(field, value)}
            </select>
            ${helpText}
          </label>
        `;
      }

      return `
        <label class="field-block">
          <span class="field-label">${escapeHtml(field.label)}</span>
          <input data-field-key="${escapeHtml(field.key)}" type="${escapeHtml(field.type ?? 'text')}" value="${escapeHtml(value)}" placeholder="${escapeHtml(field.placeholder ?? '')}" />
          ${helpText}
        </label>
      `;
    })
    .join('');
}

export function collectFieldValues(scope) {
  return Array.from(scope.querySelectorAll('[data-field-key]')).reduce((values, element) => {
    values[element.dataset.fieldKey] = element.value;
    return values;
  }, {});
}
