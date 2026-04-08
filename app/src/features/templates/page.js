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

  function computeDuration(values) {
    const start = values.startTime || '';
    const end = values.endTime || '';
    if (!start || !end) {
      values.duration = '';
      return;
    }
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    if ([sh, sm, eh, em].some(Number.isNaN)) {
      values.duration = '';
      return;
    }
    let mins = (eh * 60 + em) - (sh * 60 + sm);
    if (mins < 0) mins += 24 * 60;
    values.duration = `${mins} minute${mins === 1 ? '' : 's'}`;
  }

  function minutesFromValues(values) {
    const start = values.startTime || '';
    const end = values.endTime || '';
    if (!start || !end) return null;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    if ([sh, sm, eh, em].some(Number.isNaN)) return null;
    let mins = (eh * 60 + em) - (sh * 60 + sm);
    if (mins < 0) mins += 24 * 60;
    return mins;
  }

  function computeBilling(minutes, patientStatus, serviceMode) {
    let code = 'Undetermined';
    let reason = [];
    let badgeClass = 'warn';
    let modifier = 'No automatic modifier suggestion';

    if (serviceMode === 'telephone') {
      modifier = 'Audio-only telehealth: verify current payer requirements.';
    } else if (serviceMode === 'telehealth') {
      modifier = 'Interactive audio-video telehealth: verify whether 95 or GT applies for the code on the claim.';
    }

    if (minutes == null || minutes <= 0) {
      reason.push('Enter start and end times to calculate a billing recommendation.');
      return { code, units: '', reason, badgeClass, modifier };
    }

    if (minutes < 15) {
      reason.push('Below the 15-minute minimum published for H2011.');
      return { code, units: '', reason, badgeClass: 'bad', modifier };
    }

    if (minutes <= 90) {
      code = 'H2011';
      const units = Math.min(6, Math.ceil(minutes / 15));
      reason.push(`15-minute units. Suggested units: ${units}. H2011 is available to new or existing patients, with a max of 6 units per service date.`);
      return { code, units: `${units} unit${units === 1 ? '' : 's'}`, reason, badgeClass: 'good', modifier };
    }

    if (patientStatus !== 'existing') {
      reason.push('Duration exceeds H2011 daily maximum, and complex crisis codes are limited to existing patients in the OASAS manual. Manual review needed.');
      return { code: 'Manual review required', units: '', reason, badgeClass: 'bad', modifier };
    }

    if (minutes >= 60 && minutes <= 150) {
      code = 'S9484';
      reason.push('Single hourly-complex crisis unit for 1 to 2.5 hours. Existing patients only.');
      return { code, units: '1 unit', reason, badgeClass: 'good', modifier };
    }

    if (minutes >= 180) {
      code = 'S9485';
      reason.push('Single per-diem complex crisis unit for 3 or more hours. Existing patients only.');
      return { code, units: '1 unit', reason, badgeClass: 'good', modifier };
    }

    reason.push('Entered duration falls between published thresholds for S9484 (up to 2.5 hours) and S9485 (3 or more hours). Manual billing review is needed.');
    return { code: 'Manual review required', units: '', reason, badgeClass: 'warn', modifier };
  }

  function renderCrisisForm(values) {
    const v = values || {};
    return `
      <div class="panel oasas-crisis-form">
        <div class="panel-header">
          <h2>OASAS Crisis Intervention</h2>
          <p class="sub">Structured form based on OASAS crisis intervention clinical guidance and APG billing guidance.</p>
        </div>
        <div class="body">
        <label class="field-block">
          <span class="field-label">Start time</span>
          <input type="time" data-field-key="startTime" value="${escapeHtml(v.startTime || '')}" />
        </label>

        <label class="field-block">
          <span class="field-label">End time</span>
          <input type="time" data-field-key="endTime" value="${escapeHtml(v.endTime || '')}" />
        </label>

        <label class="field-block">
          <span class="field-label">Patient status</span>
          <select data-field-key="patientStatus">
            <option value="">Select</option>
            <option value="new" ${v.patientStatus === 'new' ? 'selected' : ''}>New patient</option>
            <option value="existing" ${v.patientStatus === 'existing' ? 'selected' : ''}>Existing patient</option>
          </select>
        </label>

        <label class="field-block">
          <span class="field-label">Service mode</span>
          <select data-field-key="serviceMode">
            <option value="">Select</option>
            <option value="telephone" ${v.serviceMode === 'telephone' ? 'selected' : ''}>Telephone / audio-only</option>
            <option value="telehealth" ${v.serviceMode === 'telehealth' ? 'selected' : ''}>Telehealth audio-video</option>
            <option value="in_person" ${v.serviceMode === 'in_person' ? 'selected' : ''}>In person</option>
            <option value="community" ${v.serviceMode === 'community' ? 'selected' : ''}>In community / onsite response</option>
          </select>
        </label>

        <label class="field-block">
          <span class="field-label">Location</span>
          <input type="text" data-field-key="location" value="${escapeHtml(v.location || '')}" placeholder="Clinic, home, phone, community, etc." />
        </label>

        <div style="margin-top:8px;">
          <div class="field-label">Qualifying crisis indicators</div>
          <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:8px; margin-top:6px;">
            <label class="checkbox-container"><input type="checkbox" data-field-key="qualifier_self_harm_statement" value="reported or stated intent to harm self" ${v.qualifier_self_harm_statement ? 'checked' : ''} /> Stated or was reported to have stated intent to harm self</label>
            <label class="checkbox-container"><input type="checkbox" data-field-key="qualifier_harm_others_statement" value="reported or stated intent to harm others" ${v.qualifier_harm_others_statement ? 'checked' : ''} /> Stated or was reported to have stated intent to harm others</label>
            <label class="checkbox-container"><input type="checkbox" data-field-key="qualifier_overdose_risk" value="substance-related overdose risk" ${v.qualifier_overdose_risk ? 'checked' : ''} /> Substance use places client at risk for overdose</label>
            <label class="checkbox-container"><input type="checkbox" data-field-key="qualifier_mh_crisis_due_to_substance" value="substance-related mental health crisis risk that may require hospitalization" ${v.qualifier_mh_crisis_due_to_substance ? 'checked' : ''} /> Substance use places client at risk for mental health crisis that may require hospitalization</label>
            <label class="checkbox-container"><input type="checkbox" data-field-key="qualifier_mh_deterioration_without_use" value="deteriorating mental health with risk for hospitalization" ${v.qualifier_mh_deterioration_without_use ? 'checked' : ''} /> Mental health is deteriorating, with or without substance use</label>
            <label class="checkbox-container"><input type="checkbox" data-field-key="qualifier_history_at_risk_behavior" value="history of non-fatal overdose, self-injury, or similar at-risk behavior" ${v.qualifier_history_at_risk_behavior ? 'checked' : ''} /> History of at-risk behavior such as non-fatal overdose or self-injury</label>
          </div>
        </div>

        <label class="field-block">
          <span class="field-label">Presenting problem(s)</span>
          <textarea data-field-key="presentingProblem" rows="4" placeholder="Describe the acute event, precipitating factors, observed behavior, symptoms, collateral information...">${escapeHtml(v.presentingProblem || '')}</textarea>
        </label>

        <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:12px;">
          <label class="field-block">
            <span class="field-label">Suicide risk</span>
            <div class="radio-group">
              <label><input type="radio" name="suicideRisk_radio" data-field-key="suicideRisk" value="none" ${v.suicideRisk === 'none' ? 'checked' : ''} /> None</label>
              <label><input type="radio" name="suicideRisk_radio" data-field-key="suicideRisk" value="low" ${v.suicideRisk === 'low' ? 'checked' : ''} /> Low</label>
              <label><input type="radio" name="suicideRisk_radio" data-field-key="suicideRisk" value="moderate" ${v.suicideRisk === 'moderate' ? 'checked' : ''} /> Moderate</label>
              <label><input type="radio" name="suicideRisk_radio" data-field-key="suicideRisk" value="high" ${v.suicideRisk === 'high' ? 'checked' : ''} /> High</label>
            </div>
          </label>

          <label class="field-block">
            <span class="field-label">Homicide risk</span>
            <div class="radio-group">
              <label><input type="radio" name="homicideRisk_radio" data-field-key="homicideRisk" value="none" ${v.homicideRisk === 'none' ? 'checked' : ''} /> None</label>
              <label><input type="radio" name="homicideRisk_radio" data-field-key="homicideRisk" value="low" ${v.homicideRisk === 'low' ? 'checked' : ''} /> Low</label>
              <label><input type="radio" name="homicideRisk_radio" data-field-key="homicideRisk" value="moderate" ${v.homicideRisk === 'moderate' ? 'checked' : ''} /> Moderate</label>
              <label><input type="radio" name="homicideRisk_radio" data-field-key="homicideRisk" value="high" ${v.homicideRisk === 'high' ? 'checked' : ''} /> High</label>
            </div>
          </label>
        </div>

        <label class="field-block">
          <span class="field-label">Intoxication / overdose risk</span>
          <div class="radio-group">
            <label><input type="radio" name="odRisk_radio" data-field-key="odRisk" value="none" ${v.odRisk === 'none' ? 'checked' : ''} /> None</label>
            <label><input type="radio" name="odRisk_radio" data-field-key="odRisk" value="low" ${v.odRisk === 'low' ? 'checked' : ''} /> Low</label>
            <label><input type="radio" name="odRisk_radio" data-field-key="odRisk" value="moderate" ${v.odRisk === 'moderate' ? 'checked' : ''} /> Moderate</label>
            <label><input type="radio" name="odRisk_radio" data-field-key="odRisk" value="high" ${v.odRisk === 'high' ? 'checked' : ''} /> High</label>
          </div>
        </label>

        <label class="field-block">
          <span class="field-label">Mental status examination</span>
          <textarea data-field-key="mse" rows="4" placeholder="Appearance, behavior, speech, mood/affect, thought process/content, orientation, insight/judgment...">${escapeHtml(v.mse || '')}</textarea>
        </label>

        <label class="field-block">
          <span class="field-label">Immediate emergency services needed?</span>
          <div class="radio-group">
            <label><input type="radio" name="emergencyNeed_radio" data-field-key="emergencyNeed" value="no" ${v.emergencyNeed === 'no' ? 'checked' : ''} /> No</label>
            <label><input type="radio" name="emergencyNeed_radio" data-field-key="emergencyNeed" value="yes" ${v.emergencyNeed === 'yes' ? 'checked' : ''} /> Yes</label>
          </div>
        </label>

        <label class="field-block">
          <span class="field-label">Emergency response details</span>
          <textarea data-field-key="emergencyDetails" rows="3" placeholder="Police, EMS, ED, CPEP, mobile team dispatch, naloxone, hospitalization...">${escapeHtml(v.emergencyDetails || '')}</textarea>
        </label>

        <label class="field-block">
          <span class="field-label">Collateral contacts / family / others involved</span>
          <textarea data-field-key="collaterals" rows="2" placeholder="Who provided collateral information or participated...">${escapeHtml(v.collaterals || '')}</textarea>
        </label>

        <div style="margin-top:8px;">
          <div class="field-label">Interventions / initial plan</div>
          <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:8px; margin-top:6px;">
            <label class="checkbox-container"><input type="checkbox" data-field-key="intervention_therapeutic_communication" value="therapeutic communication and de-escalation" ${v.intervention_therapeutic_communication ? 'checked' : ''} /> Therapeutic communication and symptom-focused de-escalation provided</label>
            <label class="checkbox-container"><input type="checkbox" data-field-key="intervention_safety_plan" value="safety / crisis prevention planning" ${v.intervention_safety_plan ? 'checked' : ''} /> Safety plan or crisis prevention plan developed or updated</label>
            <label class="checkbox-container"><input type="checkbox" data-field-key="intervention_referral_linkage" value="referral and linkage to supports or services" ${v.intervention_referral_linkage ? 'checked' : ''} /> Referral and linkage to behavioral health or community services completed</label>
            <label class="checkbox-container"><input type="checkbox" data-field-key="intervention_dispatch_crisis" value="crisis dispatch or escalation decision" ${v.intervention_dispatch_crisis ? 'checked' : ''} /> Crisis service dispatch / escalation decision made</label>
            <label class="checkbox-container"><input type="checkbox" data-field-key="intervention_med_related" value="urgent medical or medication-related intervention considered or facilitated" ${v.intervention_med_related ? 'checked' : ''} /> Onsite or urgent medical intervention considered or facilitated</label>
            <label class="checkbox-container"><input type="checkbox" data-field-key="intervention_followup_arranged" value="follow-up related to this crisis episode arranged" ${v.intervention_followup_arranged ? 'checked' : ''} /> Follow-up contact arranged related to this crisis episode</label>
          </div>
        </div>

        <label class="field-block">
          <span class="field-label">Intervention details</span>
          <textarea data-field-key="interventionsNarrative" rows="4" placeholder="Describe what was done during the encounter and how client responded">${escapeHtml(v.interventionsNarrative || '')}</textarea>
        </label>

        <label class="field-block">
          <span class="field-label">Disposition / outcome</span>
          <textarea data-field-key="disposition" rows="3" placeholder="Stabilized in place, transferred to ED, mobile crisis dispatched...">${escapeHtml(v.disposition || '')}</textarea>
        </label>

        <label class="field-block">
          <span class="field-label">Follow-up date (if arranged)</span>
          <input type="date" data-field-key="followupDate" value="${escapeHtml(v.followupDate || '')}" />
        </label>

        <label class="field-block">
          <span class="field-label">Follow-up plan</span>
          <input type="text" data-field-key="followupPlan" value="${escapeHtml(v.followupPlan || '')}" placeholder="Phone follow-up, in person, referral confirmation..." />
        </label>

        <label class="field-block">
          <span class="field-label">Calculated duration</span>
          <input type="text" data-field-key="duration" readonly value="${escapeHtml(v.duration || '')}" placeholder="Calculated from start and end time" />
        </label>
        </label>
        </div>
      </div>
    `;
  }

  const updatePreview = () => {
    const activeNote = getActiveNote(state);
    let valuesForRender = { ...(state.values || {}) };

    if (activeNote && activeNote.id === 'crisis-intervention-oasas') {
      // consolidate qualifier checkboxes into a single qualifiers string
      const qualifierKeys = Object.keys(state.values || {}).filter((k) => k.startsWith('qualifier_'));
      const qualifierValues = qualifierKeys.map((k) => state.values[k]).filter(Boolean);
      if (state.values.qualifiers) qualifierValues.push(state.values.qualifiers);
      valuesForRender.qualifiers = qualifierValues.join('; ');

      // consolidate intervention checkboxes into a single interventions string
      const interventionKeys = Object.keys(state.values || {}).filter((k) => k.startsWith('intervention_'));
      const interventionValues = interventionKeys.map((k) => state.values[k]).filter(Boolean);
      if (state.values.interventions) interventionValues.push(state.values.interventions);
      valuesForRender.interventions = interventionValues.join('; ');
    }

    const output = buildTemplateNote(activeNote, valuesForRender);
    const outputField = page.querySelector('#template-output');
    if (outputField) {
      outputField.value = output;
    }

    // If this is the OASAS crisis template, also compute eligibility, billing, and validation boxes
    if (activeNote && activeNote.id === 'crisis-intervention-oasas') {
      const v = state.values || {};
      const mins = minutesFromValues(v);

      // qualifiers and interventions arrays
      const qualifierKeys = Object.keys(v).filter((k) => k.startsWith('qualifier_'));
      const qualifiers = qualifierKeys.map((k) => v[k]).filter(Boolean);
      if (v.qualifiers) qualifiers.push(...String(v.qualifiers).split(';').map(s => s.trim()).filter(Boolean));

      const interventionKeys = Object.keys(v).filter((k) => k.startsWith('intervention_'));
      const interventions = interventionKeys.map((k) => v[k]).filter(Boolean);
      if (v.interventions) interventions.push(...String(v.interventions).split(';').map(s => s.trim()).filter(Boolean));

      const suicideRisk = v.suicideRisk || '';
      const homicideRisk = v.homicideRisk || '';
      const odRisk = v.odRisk || '';
      const emergencyNeed = v.emergencyNeed || '';

      const validationIssues = [];
      const clinicalFlags = [];

      if (!qualifiers.length) validationIssues.push('At least one qualifying crisis indicator should be selected.');
      if (!v.presentingProblem) validationIssues.push('Presenting problem is required.');
      if (!suicideRisk) validationIssues.push('Suicide risk assessment is required.');
      if (!homicideRisk) validationIssues.push('Homicide risk assessment is required.');
      if (!odRisk) validationIssues.push('Intoxication or overdose risk assessment is required.');
      if (!v.mse) validationIssues.push('Mental status examination is required.');
      if (!emergencyNeed) validationIssues.push('Document whether emergency services were immediately needed.');
      if (emergencyNeed === 'yes' && !v.emergencyDetails) validationIssues.push('Emergency response details are required when emergency services were needed.');
      if (!interventions.length) validationIssues.push('Document at least one crisis intervention or initial plan component.');
      if (!v.interventionsNarrative) validationIssues.push('Intervention details are required.');
      if (!v.disposition) validationIssues.push('Disposition or outcome is required.');
      if (mins != null && mins < 15) validationIssues.push('Encounter duration is below the 15-minute minimum for H2011.');

      if (suicideRisk === 'high' || homicideRisk === 'high' || odRisk === 'high') clinicalFlags.push('High risk identified. Confirm emergency escalation, safety measures, and transfer or monitoring decision are clearly documented.');
      if (emergencyNeed === 'yes') clinicalFlags.push('Immediate emergency intervention documented or required.');

      let eligibilityLabel = 'Documentation incomplete';
      let eligibilityClass = 'warn';
      let eligibilitySummary = 'Complete the required clinical elements to determine whether the encounter is well-supported as crisis intervention.';
      if (!validationIssues.length && qualifiers.length) {
        eligibilityLabel = 'Likely appropriate for crisis intervention';
        eligibilityClass = 'good';
        eligibilitySummary = 'The record includes at least one qualifying crisis indicator and the core triage and initial-plan elements described in the OASAS guidance.';
      } else if (validationIssues.length && qualifiers.length) {
        eligibilityLabel = 'Potentially appropriate, but documentation gaps remain';
        eligibilityClass = 'warn';
        eligibilitySummary = 'A crisis indicator is present, but one or more required assessment or intervention elements are missing or unclear.';
      } else if (!qualifiers.length) {
        eligibilityLabel = 'Not yet supported as crisis intervention';
        eligibilityClass = 'bad';
        eligibilitySummary = 'No qualifying crisis indicator has been selected. Review whether the encounter fits another service category instead.';
      }

      const billing = computeBilling(mins, v.patientStatus, v.serviceMode);

      const eligibilityBox = page.querySelector('#template-eligibility');
      if (eligibilityBox) {
        eligibilityBox.innerHTML = `
          <div class="status-title">Eligibility review</div>
          <div class="badge ${eligibilityClass}">${eligibilityLabel}</div>
          <div>${eligibilitySummary}</div>
          ${clinicalFlags.length ? `<ul>${clinicalFlags.map(x => `<li>${x}</li>`).join('')}</ul>` : '<div class="small">No high-acuity flag generated from the current inputs.</div>'}
        `;
      }

      const billingBox = page.querySelector('#template-billing');
      if (billingBox) {
        billingBox.innerHTML = `
          <div class="status-title">Billing support</div>
          <div class="badge ${billing.badgeClass}">${billing.code}</div>
          <div class="kv"><b>Duration</b><span>${mins == null ? 'Not calculated' : mins + ' minute' + (mins === 1 ? '' : 's')}</span></div>
          <div class="kv"><b>Units</b><span>${billing.units || 'Not determined'}</span></div>
          <div class="kv"><b>Modifier note</b><span>${billing.modifier}</span></div>
          <ul>${billing.reason.map(x => `<li>${x}</li>`).join('')}</ul>
        `;
      }

      const validationBox = page.querySelector('#template-validation');
      if (validationBox) {
        validationBox.innerHTML = `
          <div class="status-title">Validation check</div>
          <div class="badge ${validationIssues.length ? 'warn' : 'good'}">${validationIssues.length ? validationIssues.length + ' issue' + (validationIssues.length === 1 ? '' : 's') : 'No validation issues'}</div>
          ${validationIssues.length ? `<ul>${validationIssues.map(x => `<li>${x}</li>`).join('')}</ul>` : '<div class="small">Required documentation fields appear complete based on this form.</div>'}
        `;
      }
    } else {
      // Clear specialized boxes for non-crisis notes
      const eligibilityBox = page.querySelector('#template-eligibility'); if (eligibilityBox) eligibilityBox.innerHTML = '';
      const billingBox = page.querySelector('#template-billing'); if (billingBox) billingBox.innerHTML = '';
      const validationBox = page.querySelector('#template-validation'); if (validationBox) validationBox.innerHTML = '';
    }
  };

  const persist = () => {
    replaceFeatureState(state);
    computeDuration(state.values);
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
          <p class="eyebrow">Eligibility, billing support, and generated note</p>
          <div id="template-eligibility" class="status-box"></div>
          <div id="template-billing" class="status-box"></div>
          <div id="template-validation" class="status-box"></div>

          <div class="section" style="background: #eef4ff;">
            <h3>Generated crisis note</h3>
            <textarea id="template-output" class="note-box" rows="14" readonly placeholder="Select a role and note type to build a template-based note."></textarea>
            <div class="btn-row">
              <button class="primary-button" type="button" data-copy-template>Copy note</button>
              <button class="ghost" type="button" id="template-reset-crisis">Reset form</button>
            </div>
            <div class="footer-note">Billing suggestion logic includes the OASAS-published thresholds for H2011, S9484, and S9485. A manual review warning appears when the entered duration lands outside a clean published threshold or when the patient status conflicts with the code rules.</div>
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
            ${activeNote ? (activeNote.id === 'crisis-intervention-oasas' ? renderCrisisForm(state.values) : renderFields(activeNote.fields, state.values)) : '<p class="empty-state">No notes available for the selected role.</p>'}
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
      const key = target.dataset.fieldKey;
      if (target.type === 'checkbox') {
        state.values[key] = target.checked ? target.value : '';
      } else {
        state.values[key] = target.value;
      }
      computeDuration(state.values);
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
      computeDuration(state.values);
      persist();
    }
  });

  page.addEventListener('click', async (event) => {
    if (event.target.closest('[data-copy-template]')) {
      const activeNote = getActiveNote(state);
      await copyText(buildTemplateNote(activeNote, state.values));
      return;
    }

    // Reset crisis form (dynamic renderer)
    if (event.target.id === 'template-reset-crisis' || event.target.closest('#template-reset-crisis')) {
      if (!confirm('Reset crisis form values?')) return;
      state.values = {};
      replaceFeatureState(state);
      render();
      return;
    }
  });

  render();
}
