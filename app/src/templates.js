
        // --- Staff-Role driven Note Type population ---
        const staffTypeSelect = document.getElementById('staff-type-select');
        const noteTypeSelect = document.getElementById('note-type-select');

        const staffNoteOptions = {
            counseling: [
                { value: 'closing-note-admitted', label: 'Closing Note - Admitted' },
                { value: 'closing-note-non-admitted', label: 'Closing Note - Non-Admitted' },
                { value: 'complex-coordination-of-care', label: 'Complex Coordination of Care' },
                { value: 'discharge-plan', label: 'Discharge Plan' },
                { value: 'drug-treatment-court-report', label: 'Drug Treatment Court Report' },
                { value: 'entry-cd', label: 'Entry Session - Chemical Dependency' },
                { value: 'entry-so', label: 'Entry Session - Significant Other' },
                { value: 'eval-cd', label: 'Evaluation - Chemical Dependency' },
                { value: 'eval-so', label: 'Evaluation - Significant Other' },
                { value: 'mat-education', label: 'MAT Education' },
                { value: 'mdt', label: 'MDT Note' },
                { value: 'narcan-kit', label: 'Narcan Education & Kit' },
                { value: 'telehealth', label: 'Telehealth' },
                    { value: 'crisis-intervention', label: 'Crisis Intervention' },
                { value: 'time-off-coverage', label: 'Time Off Coverage' }
            ],
            medical: [
                { value: 'injections', label: 'Injections' },
                { value: 'mat-education', label: 'MAT Education' },
                { value: 'medical-screening', label: 'Medical Screening' },
                { value: 'complex-coordination-of-care', label: 'Complex Coordination of Care' },
                { value: 'crisis-intervention', label: 'Crisis Intervention' },
                { value: 'nurse-smoking-initial', label: 'Smoking Cessation - Nurse - Initial' },
                { value: 'nurse-smoking-followup', label: 'Smoking Cessation - Nurse - Follow Up' },
                { value: 'prescriber-smoking-initial', label: 'Smoking Cessation - Prescriber - Initial' },
                { value: 'prescriber-smoking-followup', label: 'Smoking Cessation - Prescriber - Follow Up' },
                { value: 'med-mgmt-follow-up', label: 'Medication Management Follow-up' },
                { value: 'narcan-kit', label: 'Narcan Education & Kit' },
                { value: 'nurse-follow-up', label: 'Nurse Follow Up' },
                { value: 'op-alcohol-detox', label: 'OP Alcohol Detox' },
                { value: 'ciwa-ar-assessment', label: 'CIWA-Ar Assessment' },
                { value: 'opioid-use-disorder-short', label: 'Opioid Use Disorder Short' },
                { value: 'stimulant-use-disorder-short', label: 'Stimulant Use Disorder Short' },
                { value: 'alcohol-use-disorder-short', label: 'Alcohol Use Disorder Short' },
                { value: 'telehealth', label: 'Telehealth' }
            ],
            psychiatric: [
                { value: 'psychiatric-assessment', label: 'Psychiatric Assessment' },
                { value: 'psychiatric-followup', label: 'Psychiatric Follow-Up' },
                { value: 'crisis-intervention', label: 'Crisis Intervention' },
                { value: 'complex-coordination-of-care', label: 'Complex Coordination of Care' }
            ]
        };

        // Helper: format date strings used in final copy to MM/DD/YYYY
    function formatDateForOutput(val) {
            if (!val) return val;
            const s = String(val).trim();
            const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (m) return `${m[2]}/${m[3]}/${m[1]}`;
            const d = new Date(s);
            if (!isNaN(d.getTime())) {
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                const yyyy = d.getFullYear();
                return `${mm}/${dd}/${yyyy}`;
            }
            return val;
        }

        function getCheckedValue(name) {
            return document.querySelector(`input[name="${name}"]:checked`)?.value || '';
        }

        function esc(text) {
            return (text || '').trim();
        }

        function durationMinutes(start, end) {
            if (!start || !end) return null;
            const [sh, sm] = start.split(':').map(Number);
            const [eh, em] = end.split(':').map(Number);
            if ([sh, sm, eh, em].some(Number.isNaN)) return null;
            let mins = (eh * 60 + em) - (sh * 60 + sm);
            if (mins < 0) mins += 24 * 60;
            return mins;
        }

        function prettyRisk(v) {
            if (!v) return 'Not documented';
            return v.charAt(0).toUpperCase() + v.slice(1);
        }

        function qualifierLabels(values) {
            const map = {
                'reported or stated intent to harm self': 'reported or stated intent to harm self',
                'reported or stated intent to harm others': 'reported or stated intent to harm others',
                'substance-related overdose risk': 'substance-related overdose risk',
                'substance-related mental health crisis risk that may require hospitalization': 'substance-related mental health crisis risk that may require hospitalization',
                'deteriorating mental health with risk for hospitalization': 'deteriorating mental health with risk for hospitalization',
                'history of non-fatal overdose, self-injury, or similar at-risk behavior': 'history of non-fatal overdose, self-injury, or similar at-risk behavior'
            };
            return values.map(v => map[v] || v);
        }

        function interventionLabels(values) {
            const map = {
                'therapeutic communication and de-escalation': 'therapeutic communication and de-escalation',
                'safety / crisis prevention planning': 'safety / crisis prevention planning',
                'referral and linkage to supports or services': 'referral and linkage to supports or services',
                'crisis dispatch or escalation decision': 'crisis dispatch or escalation decision',
                'urgent medical or medication-related intervention considered or facilitated': 'urgent medical or medication-related intervention considered or facilitated',
                'follow-up related to this crisis episode arranged': 'follow-up related to this crisis episode arranged'
            };
            return values.map(v => map[v] || v);
        }

        function computeBilling(minutes, patientStatus, serviceMode) {
            let code = 'Undetermined';
            let reason = [];
            let badgeClass = 'warn';
            let modifier = 'No automatic modifier suggestion';

            if (serviceMode === 'telephone') {
                modifier = 'Audio-only telehealth: verify current payer requirements. OASAS 2025 manual generally points to FQ or 93 for audio-only telehealth and GT where 95 cannot be used.';
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

        function populateNoteTypesForRole(role) {
            // clear current options
            noteTypeSelect.innerHTML = '';
            const placeholder = document.createElement('option');
            placeholder.value = '';
            placeholder.disabled = true;
            placeholder.selected = true;
            placeholder.textContent = 'Select a note type...';
            noteTypeSelect.appendChild(placeholder);

            const options = staffNoteOptions[role] || [];
            options.forEach(opt => {
                const o = document.createElement('option');
                o.value = opt.value;
                o.textContent = opt.label;
                noteTypeSelect.appendChild(o);
            });
            noteTypeSelect.disabled = options.length === 0;
        }

        // When staff role changes, populate allowed note types and reset selection
        staffTypeSelect.addEventListener('change', () => {
            const role = staffTypeSelect.value;
            populateNoteTypesForRole(role);
            sortSelectOptions(noteTypeSelect);
            noteTypeSelect.value = '';
            // hide all containers and clear generated note area
            noteContainers.forEach(c => c.classList.add('hidden'));
            updateFinalNote();
        });

    // Get all interactive elements
    const finalNoteCopy = document.getElementById('final-note-copy');
    const copyButton = document.getElementById('copy-button');
    const dtcProgressCopyButton = document.getElementById('dtc-progress-copy-button');
    const dtcCourtCopyButton = document.getElementById('dtc-court-copy-button');
    const crisisGeneratedNote = document.getElementById('ci-generated-note');
    const crisisCopyButton = document.getElementById('ci-copy-btn');
    const crisisCopyHint = document.getElementById('ci-copy-hint');
    const crisisResetButton = document.getElementById('ci-reset-btn');

    // Eval-CD elements
    const diagnosisContainer = document.getElementById('diagnosis-container');
    const detailsTextarea = document.getElementById('details-criteria');
    const mandateCheckbox = document.getElementById('mandate-checkbox');
    const cdHasMhProviderTextCheckbox = document.getElementById('cd-has-mh-provider-text');
    const cdSafetyPlanHasProviderCheckbox = document.getElementById('cd-safety-plan-has-provider');
    const cdNoMhProviderTextCheckbox = document.getElementById('cd-no-mh-provider-text');
    const cdSafetyPlanNoProviderCheckbox = document.getElementById('cd-safety-plan-no-provider');
    const cdOverdoseRiskCheckbox = document.getElementById('cd-overdose-risk');
    const cdGamblingRiskCheckbox = document.getElementById('cd-gambling-risk');

    // Eval-SO elements
    const soDiagnosisSelect = document.getElementById('so-diagnosis-select');
    const soDetailsTextarea = document.getElementById('so-details-criteria');
    const soHasMhProviderTextCheckbox = document.getElementById('so-has-mh-provider-text');
    const soSafetyPlanHasProviderCheckbox = document.getElementById('so-safety-plan-has-provider');
    const soNoMhProviderTextCheckbox = document.getElementById('so-no-mh-provider-text');
    const soSafetyPlanNoProviderCheckbox = document.getElementById('so-safety-plan-no-provider');
    const soOverdoseRiskCheckbox = document.getElementById('so-overdose-risk');
    const soGamblingRiskCheckbox = document.getElementById('so-gambling-risk');

    // Bind copy actions for dual copy area buttons
    if (dtcProgressCopyButton) {
        dtcProgressCopyButton.addEventListener('click', () => copyDtcText('dtc-progress-note-copy', dtcProgressCopyButton));
    }
    if (dtcCourtCopyButton) {
        dtcCourtCopyButton.addEventListener('click', () => copyDtcText('dtc-court-note-copy', dtcCourtCopyButton));
    }
    
    // Entry-CD elements
    const clientGoalsContainer = document.getElementById('client-goals-container');
    const treatmentGoalsContainer = document.getElementById('treatment-goals-container');
    
    // Entry-SO elements
    const soClientGoalsContainer = document.getElementById('so-client-goals-container');
    const soTreatmentGoalsContainer = document.getElementById('so-treatment-goals-container');

    // Narcan elements
    const narcanProvidedCheckbox = document.getElementById('narcan-provided-checkbox');
    const narcanDeclinedCheckbox = document.getElementById('narcan-declined-checkbox');

    // MAT elements
    const matEducationType = document.getElementById('mat-education-type');
    const matNotTakingSection = document.getElementById('mat-not-taking-section');
    const matAlreadyTakingSection = document.getElementById('mat-already-taking-section');
    const matResponseDropdown = document.getElementById('mat-response-dropdown');
    const matFormFields = document.getElementById('mat-form-fields');
    const matSubstancesTextbox = document.getElementById('mat-substances-textbox');
    const matExploredOptionsDropdown = document.getElementById('mat-explored-options-dropdown');
    const matOptionsDetailsSection = document.getElementById('mat-options-details-section');
    const matSpecificOptionsCheckboxes = document.getElementById('mat-specific-options-checkboxes');
    const matNicotineUseDropdown = document.getElementById('mat-nicotine-use-dropdown');
    const matNicotineResourcesSection = document.getElementById('mat-nicotine-resources-section');
    const matNicotineReplacementCheckbox = document.getElementById('mat-nicotine-replacement-checkbox');
    const matNicotineCounselingCheckbox = document.getElementById('mat-nicotine-counseling-checkbox');
    const matNicotineReferralCheckbox = document.getElementById('mat-nicotine-referral-checkbox');
    const matNicotineOtherCheckbox = document.getElementById('mat-nicotine-other-checkbox');
    const matNicotineOtherTextbox = document.getElementById('mat-nicotine-other-textbox');
    
    // Telehealth elements
    const telehealthVisitType = document.getElementById('telehealth-visit-type');
    const telehealthReason = document.getElementById('telehealth-reason');
    const telehealthReasonOther = document.getElementById('telehealth-reason-other');
    const telehealthDisruption = document.getElementById('telehealth-disruption');
    const telehealthDisruptionFollowup = document.getElementById('telehealth-disruption-followup');
    const telehealthDisruptionPlan = document.getElementById('telehealth-disruption-plan');
    const telehealthClientLocation = document.getElementById('telehealth-client-location');
    const telehealthPractitionerLocation = document.getElementById('telehealth-practitioner-location');
    const telehealthPresenceDropdown = document.getElementById('telehealth-presence-dropdown');
    const telehealthOthersPresent = document.getElementById('telehealth-others-present');
    const telehealthSatisfaction = document.getElementById('telehealth-satisfaction');
    const telehealthSatisfactionConcerns = document.getElementById('telehealth-satisfaction-concerns');

    // Discharge Plan elements
    const dischargeMedicationBody = document.getElementById('discharge-medications-body');
    const dischargeMedicationsNoneCheckbox = document.getElementById('discharge-medications-none');
    const dischargeAddMedicationBtn = document.getElementById('discharge-add-medication-btn');
    const dischargeReferralDropdown = document.getElementById('discharge-referral-dropdown');
    const dischargeReferralLocation = document.getElementById('discharge-referral-location');
    const dischargeOverdoseDropdown = document.getElementById('discharge-overdose-dropdown');
    const dischargeContinuingCareDropdown = document.getElementById('discharge-continuing-care-dropdown');
    const dischargeOverdoseOfferedDropdown = document.getElementById('discharge-overdose-offered-dropdown');
    const dischargeReasonInput = document.getElementById('discharge-reason');
    const dischargeAppointmentsDropdown = document.getElementById('discharge-appointments-dropdown');
    const dischargeSummaryTextbox = document.getElementById('discharge-other-needs-summary');
    const dischargeSummaryCopyBtn = document.getElementById('copy-discharge-other-needs-btn');

    // Closing Note (Admitted) elements
    const closingDischargeStatus = document.getElementById('closing-discharge-status');
    const closingDisposition = document.getElementById('closing-disposition');
    const closingRecommendations = document.getElementById('closing-recommendations');
    const closingMedsDropdown = document.getElementById('closing-meds-dropdown');
    const closingMedsActionsContainer = document.getElementById('closing-meds-actions-container');
    const closingMedsActions = document.getElementById('closing-meds-actions');
    const closingReferrals = document.getElementById('closing-referrals');
    const closingOfferedToDropdown = document.getElementById('closing-offered-to-dropdown');
    const closingClientResponse = document.getElementById('closing-client-response');
    const closingAdmittedRegularFields = document.getElementById('closing-admitted-regular-fields');
    const closingAdmittedLossOfContactFields = document.getElementById('closing-admitted-loss-of-contact-fields');
    const closingAdmittedLossSessions = document.getElementById('closing-admitted-loss-sessions');
    const closingAdmittedLossStartDate = document.getElementById('closing-admitted-loss-start-date');
    const closingAdmittedLossEndDate = document.getElementById('closing-admitted-loss-end-date');
    const closingAdmittedLossEntryOnly = document.getElementById('closing-admitted-loss-entry-only');
    const closingAdmittedLossSessionsRadio = document.getElementById('closing-admitted-loss-sessions-radio');
    const closingAdmittedLossSessionsContainer = document.getElementById('closing-admitted-loss-sessions-container');
    
    // Closing Note (Loss of Contact) elements
    const closingLossSessions = document.getElementById('closing-loss-sessions');
    const closingLossStartDate = document.getElementById('closing-loss-start-date');
    const closingLossEndDate = document.getElementById('closing-loss-end-date');
    const closingLossEntryOnly = document.getElementById('closing-loss-entry-only');
    const closingLossSessionsRadio = document.getElementById('closing-loss-sessions-radio');
    const closingLossSessionsContainer = document.getElementById('closing-loss-sessions-container');

    // Sync visibility for loss-of-contact options
    function syncClosingLossVisibility() {
        if (!closingLossSessionsContainer || !closingLossEntryOnly || !closingLossSessionsRadio) return;
        const showSessions = closingLossSessionsRadio.checked;
        closingLossSessionsContainer.classList.toggle('hidden', !showSessions);
    }
    if (closingLossEntryOnly || closingLossSessionsRadio) {
        if (closingLossEntryOnly) closingLossEntryOnly.addEventListener('change', () => { syncClosingLossVisibility(); updateFinalNote(); });
        if (closingLossSessionsRadio) closingLossSessionsRadio.addEventListener('change', () => { syncClosingLossVisibility(); updateFinalNote(); });
        // run once on load
        syncClosingLossVisibility();
    }

    // Sync visibility for closing-note-admitted with loss of contact disposition
    function syncClosingAdmittedDispositionVisibility() {
        if (!closingDisposition || !closingAdmittedRegularFields || !closingAdmittedLossOfContactFields) return;
        const isLostToContact = closingDisposition.value === 'Left against clinical advice: Lost to contact (no referral possible)' || closingDisposition.value === 'Loss of Contact';
        closingAdmittedRegularFields.classList.toggle('hidden', isLostToContact);
        closingAdmittedLossOfContactFields.classList.toggle('hidden', !isLostToContact);
        if (isLostToContact && closingAdmittedLossSessionsContainer) {
            const showSessions = closingAdmittedLossSessionsRadio.checked;
            closingAdmittedLossSessionsContainer.classList.toggle('hidden', !showSessions);
        }
    }
    if (closingDisposition) {
        closingDisposition.addEventListener('change', () => { syncClosingAdmittedDispositionVisibility(); updateFinalNote(); });
        syncClosingAdmittedDispositionVisibility();
    }
    if (closingAdmittedLossEntryOnly || closingAdmittedLossSessionsRadio) {
        if (closingAdmittedLossEntryOnly) closingAdmittedLossEntryOnly.addEventListener('change', () => { syncClosingAdmittedDispositionVisibility(); updateFinalNote(); });
        if (closingAdmittedLossSessionsRadio) closingAdmittedLossSessionsRadio.addEventListener('change', () => { syncClosingAdmittedDispositionVisibility(); updateFinalNote(); });
    }
    
    // Closing Note (Non-Admitted) elements
    const nonAdmittedClientType = document.getElementById('non-admitted-client-type');
    const nonAdmittedNoEngageSection = document.getElementById('non-admitted-no-engage-section');
    const nonAdmittedHigherLocSection = document.getElementById('non-admitted-higher-loc-section');
    const nonAdmittedNoCriteriaSection = document.getElementById('non-admitted-no-criteria-section');
    const nonAdmittedEfforts = document.getElementById('non-admitted-efforts');
    const nonAdmittedProvidedTo1 = document.getElementById('non-admitted-provided-to-1');
    const nonAdmittedLocadtr = document.getElementById('non-admitted-locadtr');
    const nonAdmittedEfforts2 = document.getElementById('non-admitted-efforts-2');
    const nonAdmittedProvidedTo2 = document.getElementById('non-admitted-provided-to-2');
    const nonAdmittedProvidedTo3 = document.getElementById('non-admitted-provided-to-3');
    const nonAdmittedUrineScreen = document.getElementById('non-admitted-urine-screen');

    // Injections elements
    const injectionTypeSelect = document.getElementById('injection-type-select');
    const vivitrolSection = document.getElementById('vivitrol-section');
    const sublocadeSection = document.getElementById('sublocade-section');
    const brixadiSection = document.getElementById('brixadi-section');
    const vivitrolSite = document.getElementById('vivitrol-site');
    const vivitrolLot = document.getElementById('vivitrol-lot');
    const vivitrolExp = document.getElementById('vivitrol-exp');
    const vivitrolSn = document.getElementById('vivitrol-sn');
    const vivitrolNextInjection = document.getElementById('vivitrol-next-injection');
    const sublocadeSite = document.getElementById('sublocade-site');
    const sublocadeLot = document.getElementById('sublocade-lot');
    const sublocadeExp = document.getElementById('sublocade-exp');
    const sublocadeSn = document.getElementById('sublocade-sn');
    const sublocadeNextInjection = document.getElementById('sublocade-next-injection');
    const brixadiSite = document.getElementById('brixadi-site');
    const brixadiLot = document.getElementById('brixadi-lot');
    const brixadiExp = document.getElementById('brixadi-exp');
    const brixadiSn = document.getElementById('brixadi-sn');
    const brixadiNextInjection = document.getElementById('brixadi-next-injection');

    // MDT elements
    const mdtDiagnosisContainer = document.getElementById('mdt-diagnosis-container');
    const mdtReasonHighRisk = document.getElementById('mdt-reason-high-risk');
    const mdtCriteriaOffHighRisk = document.getElementById('mdt-criteria-off-high-risk');
    const mdtRiskFactors = document.getElementById('mdt-risk-factors');
    const mdtProtectiveFactors = document.getElementById('mdt-protective-factors');
    const mdtCareCoordination = document.getElementById('mdt-care-coordination');
    const mdtStageOfChange = document.getElementById('mdt-stage-of-change');
    const mdtStageOfChangeOther = document.getElementById('mdt-stage-of-change-other');
    const mdtSafetyPlanCompleted = document.getElementById('mdt-safety-plan-completed');
    const mdtSafetyPlanApplicable = document.getElementById('mdt-safety-plan-applicable');
    const mdtMatStatus = document.getElementById('mdt-mat-status');
    const mdtLastToxDate = document.getElementById('mdt-last-tox-date');
    const mdtToxResult = document.getElementById('mdt-tox-result');
    const mdtClientEngaging = document.getElementById('mdt-client-engaging');
    const mdtMostRecentAppt = document.getElementById('mdt-most-recent-appt');
    const mdtNextAppt = document.getElementById('mdt-next-appt');
    const mdtProgressRecommendations = document.getElementById('mdt-progress-recommendations');
    const mdtGuidingQuestions = document.getElementById('mdt-guiding-questions');

    // Medication Management Follow-up elements
    const mmfuNicotineUse = document.getElementById('mmfu-nicotine-use');
    const mmfuNicotineDetailsSection = document.getElementById('mmfu-nicotine-details-section');
    const mmfuNicotineInterest = document.getElementById('mmfu-nicotine-interest');
    const mmfuNicotineDetails = document.getElementById('mmfu-nicotine-details');

    // Opioid Use Disorder Short elements
    const oudsActiveUseRadios = document.querySelectorAll('input[name="ouds-active-use"]');
    const oudsLastUseDateRow = document.getElementById('ouds-last-use-date-row');
    const oudsLastUseDateLabel = oudsLastUseDateRow.querySelector('label'); // Get the label
    const oudsPharmRadios = document.querySelectorAll('input[name="ouds-pharmacotherapy"]');
    const oudsPharmFields = document.getElementById('ouds-pharm-fields');
    const oudsSubstances = [
        'alcohol', 'amphet', 'benzodiazepines', 'cannabis', 'cocaine', 'hallucinogens', 'illicit-opioids', 'ivdu', 'kratom', 'mdma', 'nicotine', 'prescription-opioids', 'other'
    ];


    // Get containers
    const noteContainers = document.querySelectorAll('.note-container');

    // Complex Coordination of Care elements
    const cccNonRoutineCheckbox = document.getElementById('ccc-non-routine');
    const cccBody = document.getElementById('ccc-body');
    const cccServiceByInput = document.getElementById('ccc-service-by');
    const cccBlockable = document.getElementById('ccc-blockable');
    const cccCoordinationWithInput = document.getElementById('ccc-coordination-with');
    const cccCategorySelect = document.getElementById('ccc-category');
    const cccSupportNextSteps = document.getElementById('ccc-support-next-steps');
    const cccExampleToggle = document.getElementById('ccc-example-toggle');
    const cccExample = document.getElementById('ccc-example');
    const cccNoteTextarea = document.getElementById('ccc-note-text');
    const cccVerifyNextSteps = document.getElementById('ccc-verify-next-steps');
    const cccVerifyGoals = document.getElementById('ccc-verify-goals');
    const cccVerificationWarning = document.getElementById('ccc-verification-warning');

    const diagnosisOptionsHTML = `
        <option value="" selected disabled>Select a diagnosis...</option>
        <optgroup label="F10: Alcohol Use Disorder"><option value="F10.10: Alcohol use disorder, mild">F10.10: Alcohol use disorder, mild</option><option value="F10.20: Alcohol use disorder, moderate">F10.20: Alcohol use disorder, moderate</option><option value="F10.20: Alcohol use disorder, severe">F10.20: Alcohol use disorder, severe</option></optgroup>
        <optgroup label="F11: Opioid Use Disorder"><option value="F11.10: Opioid use disorder, mild">F11.10: Opioid use disorder, mild</option><option value="F11.20: Opioid use disorder, moderate">F11.20: Opioid use disorder, moderate</option><option value="F11.20: Opioid use disorder, severe">F11.20: Opioid use disorder, severe</option></optgroup>
        <optgroup label="F12: Cannabis Use Disorder"><option value="F12.10: Cannabis use disorder, mild">F12.10: Cannabis use disorder, mild</option><option value="F12.20: Cannabis use disorder, moderate">F12.20: Cannabis use disorder, moderate</option><option value="F12.20: Cannabis use disorder, severe">F12.20: Cannabis use disorder, severe</option></optgroup>
        <optgroup label="F13: Sedative, Hypnotic, or Anxiolytic Use Disorder"><option value="F13.10: Sedative, hypnotic, or anxiolytic use disorder, mild">F13.10: Sedative, hypnotic, or anxiolytic use disorder, mild</option><option value="F13.20: Sedative, hypnotic, or anxiolytic use disorder, moderate">F13.20: Sedative, hypnotic, or anxiolytic use disorder, moderate</option><option value="F13.20: Sedative, hypnotic, or anxiolytic use disorder, severe">F13.20: Sedative, hypnotic, or anxiolytic use disorder, severe</option></optgroup>
        <optgroup label="F14: Cocaine Use Disorder"><option value="F14.10: Stimulant Use Disorder Cocaine, mild">F14.10: Stimulant Use Disorder Cocaine, mild</option><option value="F14.20: Stimulant Use Disorder Cocaine, moderate">F14.20: Stimulant Use Disorder Cocaine, moderate</option><option value="F14.20: Stimulant Use Disorder Cocaine, severe">F14.20: Stimulant Use Disorder Cocaine, severe</option></optgroup>
        <optgroup label="F15: Other Stimulant Use Disorder"><option value="F15.10: Other stimulant use disorder, mild">F15.10: Other stimulant use disorder, mild</option><option value="F15.20: Other stimulant use disorder, moderate">F15.20: Other stimulant use disorder, moderate</option><option value="F15.20: Other stimulant use disorder, severe">F15.20: Other stimulant use disorder, severe</option></optgroup>
        <optgroup label="F16: Hallucinogen Use Disorder"><option value="F16.10: Hallucinogen use disorder, mild">F16.10: Hallucinogen use disorder, mild</option><option value="F16.10: Hallucinogen use disorder, moderate">F16.10: Hallucinogen use disorder, moderate</option><option value="F16.10: Hallucinogen use disorder, severe">F16.10: Hallucinogen use disorder, severe</option></optgroup>
        <optgroup label="F17: Tobacco Use Disorder"><option value="F17.200: Nicotine dependence, unspecified">F17.200: Nicotine dependence, unspecified</option><option value="F17.210: Nicotine dependence, cigarettes, uncomplicated">F17.210: Nicotine dependence, cigarettes, uncomplicated</option><option value="F17.220: Nicotine dependence, chewing tobacco, uncomplicated">F17.220: Nicotine dependence, chewing tobacco, uncomplicated</option><option value="F17.290: Nicotine dependence, other tobacco product, uncomplicated">F17.290: Nicotine dependence, other tobacco product, uncomplicated</option></optgroup>
        <optgroup label="F18: Inhalant Use Disorder"><option value="F18.10: Inhalant use disorder, mild">F18.10: Inhalant use disorder, mild</option><option value="F18.20: Inhalant use disorder, moderate">F18.20: Inhalant use disorder, moderate</option><option value="F18.20: Inhalant use disorder, severe">F18.20: Inhalant use disorder, severe</option></optgroup>
        <optgroup label="F19: Other (or Unknown) Psychoactive Substance Use Disorder"><option value="F19.10: Other psychoactive substance use disorder, mild">F19.10: Other psychoactive substance use disorder, mild</option><option value="F19.20: Other psychoactive substance use disorder, moderate">F19.20: Other psychoactive substance use disorder, moderate</option><option value="F19.20: Other psychoactive substance use disorder, severe">F19.20: Other psychoactive substance use disorder, severe</option></optgroup>
        <optgroup label="No Criteria Met"><option value="F19.99 - Unspecified or Other Unknown Substance Use Disorder">F19.99 - Unspecified or Other Unknown Substance Use Disorder</option></optgroup>
    `;
    
    function createDynamicRow(container, placeholder) {
        const row = document.createElement('div');
        row.className = 'dynamic-row';
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = placeholder;
        input.addEventListener('input', updateFinalNote);
        const button = document.createElement('button');
        button.type = 'button';

        if (container.children.length === 0) {
            button.className = 'add-btn';
            button.textContent = '+';
            button.onclick = () => createDynamicRow(container, placeholder);
        } else {
            button.className = 'remove-btn';
            button.textContent = '-';
            button.onclick = () => { row.remove(); updateFinalNote(); };
        }
        row.appendChild(input);
        row.appendChild(button);
        container.appendChild(row);
        updateFinalNote();
    }

    function syncCccVisibility() {
        if (!cccNonRoutineCheckbox || !cccBody) return;

        const showBody = cccNonRoutineCheckbox.checked;
        cccBody.classList.toggle('hidden', !showBody);

        if (!showBody) {
            if (cccVerifyNextSteps) cccVerifyNextSteps.checked = false;
            if (cccVerifyGoals) cccVerifyGoals.checked = false;
            if (cccVerificationWarning) cccVerificationWarning.classList.add('hidden');
            if (cccRoleWarning) cccRoleWarning.classList.add('hidden');
            if (cccBlockable) cccBlockable.classList.remove('ccc-blocked');
        }
    }
    
    function createClientGoalRow(container, placeholder) {
        const row = document.createElement('div');
        row.className = 'goal-row-with-quotes';
        
        const openQuote = document.createElement('div');
        openQuote.className = 'quote-mark';
        openQuote.textContent = '\u201c';
        
        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'goal-input-wrapper';
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = placeholder;
        input.addEventListener('input', updateFinalNote);
        inputWrapper.appendChild(input);
        
        const closeQuote = document.createElement('div');
        closeQuote.className = 'quote-mark';
        closeQuote.textContent = '\u201d';
        
        const buttonWrapper = document.createElement('div');
        buttonWrapper.className = 'goal-button-wrapper';
        const button = document.createElement('button');
        button.type = 'button';
        
        if (container.children.length === 0) {
            button.className = 'add-btn';
            button.textContent = '+';
            button.onclick = () => createClientGoalRow(container, placeholder);
        } else {
            button.className = 'remove-btn';
            button.textContent = '-';
            button.onclick = () => { row.remove(); updateFinalNote(); };
        }
        buttonWrapper.appendChild(button);
        
        row.appendChild(openQuote);
        row.appendChild(inputWrapper);
        row.appendChild(closeQuote);
        row.appendChild(buttonWrapper);
        container.appendChild(row);
        updateFinalNote();
    }
    
    function addDiagnosisRow() {
        const row = document.createElement('div');
        row.className = 'dynamic-row';
        const select = document.createElement('select');
        select.innerHTML = diagnosisOptionsHTML;
        select.addEventListener('change', updateFinalNote);
        const button = document.createElement('button');
        button.type = 'button';
        if (diagnosisContainer.children.length === 0) {
            button.className = 'add-btn';
            button.textContent = '+';
            button.onclick = addDiagnosisRow;
        } else {
            button.className = 'remove-btn';
            button.textContent = '-';
            button.onclick = () => { row.remove(); updateFinalNote(); };
        }
        row.appendChild(select);
        row.appendChild(button);
        diagnosisContainer.appendChild(row);
        updateFinalNote();
    }

    function addMmfuDiagnosisRow() {
        const container = document.getElementById('mmfu-diagnosis-container');
        const row = document.createElement('div');
        row.className = 'dynamic-row';
        const select = document.createElement('select');
        select.innerHTML = diagnosisOptionsHTML;
        select.addEventListener('change', updateFinalNote);
        const button = document.createElement('button');
        button.type = 'button';
        if (container.children.length === 0) {
            button.className = 'add-btn';
            button.textContent = '+';
            button.onclick = addMmfuDiagnosisRow;
        } else {
            button.className = 'remove-btn';
            button.textContent = '-';
            button.onclick = () => { row.remove(); updateFinalNote(); };
        }
        row.appendChild(select);
        row.appendChild(button);
        container.appendChild(row);
        updateFinalNote();
    }

    function addMdtDiagnosisRow() {
        const row = document.createElement('div');
        row.className = 'dynamic-row';
        const select = document.createElement('select');
        select.innerHTML = diagnosisOptionsHTML;
        select.addEventListener('change', updateFinalNote);
        const button = document.createElement('button');
        button.type = 'button';
        if (mdtDiagnosisContainer.children.length === 0) {
            button.className = 'add-btn';
            button.textContent = '+';
            button.onclick = addMdtDiagnosisRow;
        } else {
            button.className = 'remove-btn';
            button.textContent = '-';
            button.onclick = () => { row.remove(); updateFinalNote(); };
        }
        row.appendChild(select);
        row.appendChild(button);
        mdtDiagnosisContainer.appendChild(row);
        updateFinalNote();
    }
const nurseInterventionOptions = `
        <option value="" selected disabled>Select an intervention...</option>
        <optgroup label="Monitoring">
            <option value="Observed and recorded medication adherence and any side effects.">Observed and recorded medication adherence and any side effects.</option>
            <option value="Monitored clients' responses to treatment and symptom changes.">Monitored clients' responses to treatment and symptom changes.</option>
            <option value="Assessed for signs of adverse reactions or complications related to medications.">Assessed for signs of adverse reactions or complications related to medications.</option>
        </optgroup>
        <optgroup label="Education">
            <option value="Provided instruction on proper medication administration and dosing.">Provided instruction on proper medication administration and dosing.</option>
            <option value="Taught clients about potential side effects and how to manage them.">Taught clients about potential side effects and how to manage them.</option>
            <option value="Educated on lifestyle strategies to support overall health and recovery.">Educated on lifestyle strategies to support overall health and recovery.</option>
            <option value="Reviewed the importance of attending follow-up appointments and lab tests.">Reviewed the importance of attending follow-up appointments and lab tests.</option>
            <option value="Explained warning signs that required immediate medical attention.">Explained warning signs that required immediate medical attention.</option>
            <option value="Educated on harm reduction strategies.">Educated on harm reduction strategies.</option>
        </optgroup>
        <optgroup label="Referrals">
            <option value="(Pending guidance/direction from MD/NP) identified need for specialty care (e.g., cardiology, psychiatry) and facilitated referrals.">(Pending guidance/direction from MD/NP) identified need for specialty care (e.g., cardiology, psychiatry) and facilitated referrals.</option>
            <option value="Identified community resources for primary care, dental needs, and communicable disease treatment and symptom management.">Identified community resources for primary care, dental needs, and communicable disease treatment and symptom management.</option>
            <option value="Encouraged engagement with medical providers for additional support services and assessed client need for assistance in completing referrals.">Encouraged engagement with medical providers for additional support services and assessed client need for assistance in completing referrals.</option>
            <option value="Provided contact information and guidance for support programs.">Provided contact information and guidance for support programs.</option>
        </optgroup>
        <optgroup label="Screening">
            <option value="Conducted initial medical screenings to establish baseline health status.">Conducted initial medical screenings to establish baseline health status.</option>
            <option value="Screened for medication side effects and adverse reactions.">Screened for medication side effects and adverse reactions.</option>
            <option value="Assessed for comorbid conditions that could impact treatment.">Assessed for comorbid conditions that could impact treatment.</option>
            <option value="Reassessed risk factors (e.g., substance use, falls, infection) at each visit.">Reassessed risk factors (e.g., substance use, falls, infection) at each visit.</option>
        </optgroup>
        <optgroup label="Plan/Next Steps">
            <option value="Continued current medication regimen.">Continued current medication regimen.</option>
            <option value="Encouraged continued attendance in counseling/group.">Encouraged continued attendance in counseling/group.</option>
            <option value="Referred to RN/NP/MD for [e.g., medication concerns, side effects].">Referred to RN/NP/MD for [e.g., medication concerns, side effects].</option>
            <option value="Scheduled next appointment for [date].">Scheduled next appointment for [date].</option>
        </optgroup>
        <option value="custom">Other (Type Custom)...</option>
    `;

function addNurseInterventionRow(isFirstRow = false) {
        const container = document.getElementById('nurse-interventions-container');
        const rowWrapper = document.createElement('div'); // Wrapper for dropdown row + textarea
        rowWrapper.style.marginBottom = '15px'; // Add space between intervention blocks

        const row = document.createElement('div');
        row.className = 'dynamic-row';

        const select = document.createElement('select');
        select.innerHTML = nurseInterventionOptions;
        select.style.marginBottom = '5px'; // Add small space below dropdown

        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '5px';

        const addButton = document.createElement('button');
        addButton.type = 'button';
        addButton.className = 'add-btn';
        addButton.textContent = '+';
        addButton.onclick = () => addNurseInterventionRow();
        buttonContainer.appendChild(addButton);

        if (!isFirstRow) { // Only add remove button if it's not the first row
            const removeButton = document.createElement('button');
            removeButton.type = 'button';
            removeButton.className = 'remove-btn';
            removeButton.textContent = '-';
            removeButton.onclick = () => {
                rowWrapper.remove();
                updateFinalNote();
            };
            buttonContainer.appendChild(removeButton);
        }

        row.appendChild(select);
        row.appendChild(buttonContainer);
        rowWrapper.appendChild(row); // Add dropdown row to wrapper

        // Textarea initially hidden, shown on selection
        const textarea = document.createElement('textarea');
        textarea.placeholder = "Customize or enter new intervention...";
        textarea.rows = 2;
        textarea.classList.add('hidden'); // Start hidden
        textarea.style.width = 'calc(100% - 58px)'; // Adjust width to align roughly under dropdown
        textarea.style.marginLeft = '0px'; // Align left
        textarea.style.marginTop = '0px'; // Remove top margin
        textarea.addEventListener('input', () => {
            autoResize(textarea);
            updateFinalNote();
        });
        rowWrapper.appendChild(textarea); // Add textarea to wrapper

        select.addEventListener('change', () => {
            const selectedValue = select.value;
            if (selectedValue) { // If something valid is selected (not the placeholder)
                textarea.value = selectedValue === 'custom' ? '' : selectedValue;
                textarea.classList.remove('hidden'); // Show the textarea
                autoResize(textarea);
            } else {
                textarea.classList.add('hidden'); // Hide if placeholder selected again
            }
            updateFinalNote();
        });

        container.appendChild(rowWrapper);
        updateFinalNote(); // Update note after adding row initially
    }

    function resetDiagnosisRows() {
        diagnosisContainer.innerHTML = '';
        addDiagnosisRow();
    }
    
    function resetGoalRows(clientContainer, treatmentContainer) {
        clientContainer.innerHTML = '';
        treatmentContainer.innerHTML = '';
        // Use createClientGoalRow for client goals (which have quotation marks)
        if (clientContainer.id === 'client-goals-container' || clientContainer.id === 'so-client-goals-container') {
            createClientGoalRow(clientContainer, 'Enter client goal in their own words...');
        } else {
            createDynamicRow(clientContainer, 'Enter client goal...');
        }
        createDynamicRow(treatmentContainer, 'Enter treatment plan goal...');
    }

    function autoResize(element) {
        element.style.height = 'auto';
        element.style.height = (element.scrollHeight) + 'px';
    }

    function autoResizeDtcTextareas(progressElement, courtElement) {
        if (progressElement) {
            progressElement.style.height = 'auto';
            progressElement.style.height = (progressElement.scrollHeight) + 'px';
        }
        if (courtElement) {
            courtElement.style.height = 'auto';
            courtElement.style.height = (courtElement.scrollHeight) + 'px';
        }
    }

    function addDischargeMedicationRow(data = {}) {
        if (!dischargeMedicationBody) return null;
        const escapeValue = (value = '') => value.replace(/"/g, '&quot;');
        const safeName = escapeValue(data.name || '');
        const safeFrequency = escapeValue(data.frequency || '');
        const safeDose = escapeValue(data.dose || '');
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="text" class="discharge-medication-name" placeholder="Medication Name" value="${safeName}"></td>
            <td><input type="text" class="discharge-medication-frequency" placeholder="Frequency" value="${safeFrequency}"></td>
            <td><input type="text" class="discharge-medication-dose" placeholder="Dose" value="${safeDose}"></td>
            <td class="discharge-medication-row-actions"><button type="button" class="remove-medication-row-btn">Remove</button></td>
        `;
        row.querySelectorAll('input').forEach(input => input.addEventListener('input', updateDischargeOtherNeedsSummary));
        const removeBtn = row.querySelector('.remove-medication-row-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                row.remove();
                updateDischargeMedicationRowButtons();
                updateDischargeOtherNeedsSummary();
            });
        }
        dischargeMedicationBody.appendChild(row);
        updateDischargeMedicationRowButtons();
        toggleDischargeMedicationInputs();
        return row;
    }

    function updateDischargeMedicationRowButtons() {
        if (!dischargeMedicationBody) return;
        const rows = Array.from(dischargeMedicationBody.querySelectorAll('tr'));
        rows.forEach(row => {
            const btn = row.querySelector('.remove-medication-row-btn');
            if (btn) {
                btn.disabled = rows.length === 1;
            }
        });
    }

    function toggleDischargeMedicationInputs() {
        if (!dischargeMedicationBody) return;
        const disable = dischargeMedicationsNoneCheckbox?.checked;
        dischargeMedicationBody.querySelectorAll('input').forEach(input => {
            input.disabled = Boolean(disable);
        });
        const rows = Array.from(dischargeMedicationBody.querySelectorAll('tr'));
        rows.forEach(row => {
            const btn = row.querySelector('.remove-medication-row-btn');
            if (btn) {
                btn.disabled = Boolean(disable) || rows.length === 1;
            }
        });
    }

    function getDischargeMedicationList() {
        if (!dischargeMedicationBody) return [];
        return Array.from(dischargeMedicationBody.querySelectorAll('tr'))
            .map(row => {
                const name = row.querySelector('.discharge-medication-name')?.value.trim() || '';
                const frequency = row.querySelector('.discharge-medication-frequency')?.value.trim() || '';
                const dose = row.querySelector('.discharge-medication-dose')?.value.trim() || '';
                return { name, frequency, dose };
            })
            .filter(entry => entry.name || entry.frequency || entry.dose);
    }

    function updateDischargeOtherNeedsSummary() {
        const parts = [];

        // Reason for discharge
        const reasonValue = dischargeReasonInput?.value.trim();
        if (reasonValue) {
            parts.push(`Reason for Discharge: ${reasonValue}`);
        }

        // Current medications
        if (dischargeMedicationsNoneCheckbox?.checked) {
            parts.push('Current Medications: Patient is not currently using medications.');
        } else {
            const meds = getDischargeMedicationList();
            if (meds.length > 0) {
                const medLines = meds.map(med => {
                    const fragments = [];
                    if (med.name) fragments.push(med.name);
                    if (med.frequency) fragments.push(`Frequency: ${med.frequency}`);
                    if (med.dose) fragments.push(`Dose: ${med.dose}`);
                    return fragments.length > 0 ? `- ${fragments.join(' | ')}` : '- [Medication details]';
                });
                parts.push(`Current Medications:\n${medLines.join('\n')}`);
            }
        }

        // Referral for medication management
        if (dischargeReferralDropdown && dischargeReferralDropdown.value) {
            let referralText = dischargeReferralDropdown.value;
            if (dischargeReferralDropdown.value === 'Yes') {
                const location = dischargeReferralLocation?.value.trim();
                referralText += location ? ` (Referred to ${location})` : ' (Referred location: [specify])';
            }
            parts.push(`Referral for Medication Management: ${referralText}`);
        }

        // Existing overdose dropdown (legacy field)
        if (dischargeOverdoseDropdown && dischargeOverdoseDropdown.value) {
            parts.push(`Overdose prevention education and naloxone kit offered: ${dischargeOverdoseDropdown.value}`);
        }

        // Continuing care
        if (dischargeContinuingCareDropdown && dischargeContinuingCareDropdown.value) {
            parts.push(`Continuing care discussed and offered: ${dischargeContinuingCareDropdown.value}`);
        }

        // Scheduled appointments
        if (dischargeAppointmentsDropdown && dischargeAppointmentsDropdown.value) {
            const option = dischargeAppointmentsDropdown.options[dischargeAppointmentsDropdown.selectedIndex];
            const appointmentText = option ? option.text : dischargeAppointmentsDropdown.value;
            parts.push(`Scheduled appointments with Mental Health, Physical Health, Probation, Parole, Continuing Care, or other providers: ${appointmentText}`);
        }

        // New overdose/naloxone offered dropdown
        if (dischargeOverdoseOfferedDropdown && dischargeOverdoseOfferedDropdown.value) {
            const opt = dischargeOverdoseOfferedDropdown.options[dischargeOverdoseOfferedDropdown.selectedIndex];
            if (opt && opt.text) parts.push(opt.text);
        }

        const summary = parts.length ? parts.join('\n\n') : '';
        if (dischargeSummaryTextbox) {
            dischargeSummaryTextbox.value = summary;
            autoResize(dischargeSummaryTextbox);
        }
        return summary;
    }

    function initializeDischargeMedicationRows() {
        if (!dischargeMedicationBody) return;
        if (dischargeMedicationBody.children.length === 0) {
            addDischargeMedicationRow();
        }
    }

    // Drug Treatment Court Report Helper Functions
    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString + 'T00:00:00');
        return new Intl.DateTimeFormat('en-US').format(date);
    }

    function handleDtcLudVisibility() {
        const ludInput = document.getElementById('dtc-lud').value;
        const initialCourtDateInput = document.getElementById('dtc-initialCourtDate').value;
        const ludExtraDiv = document.getElementById('dtc-ludExtra');

        if (!ludInput || !initialCourtDateInput) {
            ludExtraDiv.style.display = 'none';
            return;
        }
        const ludDate = new Date(ludInput);
        const initialCourtDate = new Date(initialCourtDateInput);
        if (ludDate >= initialCourtDate) {
            ludExtraDiv.style.display = 'block';
        } else {
            ludExtraDiv.style.display = 'none';
        }
    }

    function updateDtcMissedStatus() {
        const individualAttended = Number(document.getElementById('dtc-individualAttended').value) || 0;
        const individualTotal = Number(document.getElementById('dtc-individualTotal').value) || 0;
        document.getElementById('dtc-individualMissedContainer').style.display = (individualAttended >= individualTotal) ? 'none' : 'block';

        const groupAttended = Number(document.getElementById('dtc-groupAttended').value) || 0;
        const groupTotal = Number(document.getElementById('dtc-groupTotal').value) || 0;
        document.getElementById('dtc-groupMissedContainer').style.display = (groupAttended >= groupTotal) ? 'none' : 'block';

        const medAttended = Number(document.getElementById('dtc-medAttended').value) || 0;
        const medTotal = Number(document.getElementById('dtc-medTotal').value) || 0;
        document.getElementById('dtc-medMissedContainer').style.display = (medAttended >= medTotal) ? 'none' : 'block';
    }

    function toggleDtcSubstance(selectElem) {
        const row = selectElem.closest('.dynamic-row');
        const substanceInput = row.querySelector('.substance-input');
        if (substanceInput) {
            substanceInput.style.display = (selectElem.value === "positive") ? "block" : "none";
            if (selectElem.value !== "positive") {
                substanceInput.value = "";
            }
        }
    }

    function copyDtcText(elementId, button) {
        const textarea = document.getElementById(elementId);
        textarea.select();
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(textarea.value).then(() => {
                const originalText = button.innerText;
                button.innerText = 'Copied!';
                setTimeout(() => { button.innerText = originalText; }, 2000);
            }).catch(err => {
                console.error('Could not copy text: ', err);
                fallbackCopyText(textarea.value, button);
            });
        } else {
            fallbackCopyText(textarea.value, button);
        }
    }

    function fallbackCopyText(text, button) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                const originalText = button.innerText;
                button.innerText = 'Copied!';
                setTimeout(() => { button.innerText = originalText; }, 2000);
            }
        } catch (err) {
            console.error('Fallback: Oops, unable to copy', err);
        }
        document.body.removeChild(textArea);
    }

    function copyTocGrid() {
        const table = document.getElementById('toc-grid-table');
        const button = document.getElementById('toc-copy-button');
        
        // Create a clean HTML table optimized for email with equal width columns
        let cleanHtml = '<table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse; width: 600px; font-family: Arial, sans-serif;">\n';
        
        // Header row with grid lines and equal width
        cleanHtml += '<tr style="background-color: #f0f0f0; border: 1px solid #000;"><td style="border: 1px solid #000; width: 50%; font-weight: bold;"><strong>TASK:</strong></td><td style="border: 1px solid #000; width: 50%; font-weight: bold;"><strong>STATUS/ASSIGNMENT:</strong></td></tr>\n';
        
        // Data rows - extract values from inputs with grid lines and equal width
        const rows = table.querySelectorAll('tr');
        for (let i = 1; i < rows.length; i++) {
            const cells = rows[i].querySelectorAll('td');
            if (cells.length >= 2) {
                const task = cells[0].textContent.trim();
                const input = cells[1].querySelector('input');
                const status = input ? input.value : cells[1].textContent.trim();
                cleanHtml += `<tr style="border: 1px solid #000;"><td style="border: 1px solid #000; width: 50%; vertical-align: top;">${task}</td><td style="border: 1px solid #000; width: 50%; vertical-align: top;">${status}</td></tr>\n`;
            }
        }
        
        cleanHtml += '</table>';
        
        if (navigator.clipboard) {
            // Create blob for HTML and text versions
            const htmlBlob = new Blob([cleanHtml], { type: 'text/html' });
            
            // Also create tab-separated text for Excel
            const textContent = Array.from(rows).slice(1).map(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 2) {
                    const task = cells[0].textContent.trim();
                    const input = cells[1].querySelector('input');
                    const status = input ? input.value : cells[1].textContent.trim();
                    return `${task}\t${status}`;
                }
            }).join('\n');
            
            const textBlob = new Blob([textContent], { type: 'text/plain' });
            
            const data = new ClipboardItem({ 
                'text/html': htmlBlob,
                'text/plain': textBlob 
            });
            
            navigator.clipboard.write([data]).then(() => {
                const originalText = button.innerText;
                button.innerText = 'Copied!';
                setTimeout(() => { button.innerText = originalText; }, 2000);
            }).catch(() => {
                // Fallback if write fails
                navigator.clipboard.writeText(cleanHtml).then(() => {
                    const originalText = button.innerText;
                    button.innerText = 'Copied!';
                    setTimeout(() => { button.innerText = originalText; }, 2000);
                });
            });
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = cleanHtml;
            textArea.style.top = '0';
            textArea.style.left = '0';
            textArea.style.position = 'fixed';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                const originalText = button.innerText;
                button.innerText = 'Copied!';
                setTimeout(() => { button.innerText = originalText; }, 2000);
            } catch (err) {
                console.error('Could not copy grid', err);
            }
            document.body.removeChild(textArea);
        }
    }

    function validateDtcRequiredFields() {
        const requiredFields = [
            { id: 'dtc-clientName', label: 'Client Name' },
            { id: 'dtc-initialCourtDate', label: 'Last Court Date' },
            { id: 'dtc-courtPrepDate', label: 'Next Court Date' },
            { id: 'dtc-checkingIn', label: 'Checking In with Case Manager' },
            { id: 'dtc-treatmentSchedule', label: 'Treatment Schedule' },
            { id: 'dtc-hasNotHas', label: 'Overall Appointment Attendance' },
            { id: 'dtc-nextDate', label: 'Next Appointment Date' },
            { id: 'dtc-appointmentType', label: 'Next Appointment Type' },
            { id: 'dtc-lud', label: 'Last Use Date' }
        ];

        const missingFields = [];
        
        requiredFields.forEach(field => {
            const element = document.getElementById(field.id);
            const value = element?.value || '';
            if (!value || value.trim() === '') {
                missingFields.push(field.label);
            }
        });

        // Check if at least one toxicology screen is filled or checkbox is marked
        const toxNotScreenedCheckbox = document.getElementById('dtc-toxNotScreened');
        const toxContainer = document.getElementById('dtc-toxContainer');
        const hasToxData = toxNotScreenedCheckbox.checked || Array.from(toxContainer.querySelectorAll('input[type="date"]')).some(input => input.value);
        if (!hasToxData) {
            missingFields.push('Toxicology Screens at Treatment');
        }

        // Check if at least one random screen is filled or checkbox is marked
        const randomNotScreenedCheckbox = document.getElementById('dtc-randomNotScreened');
        const randomContainer = document.getElementById('dtc-randomContainer');
        const hasRandomData = randomNotScreenedCheckbox.checked || Array.from(randomContainer.querySelectorAll('input[type="date"]')).some(input => input.value);
        if (!hasRandomData) {
            missingFields.push('Random Screens');
        }

        // Show or hide warning
        const warningDiv = document.getElementById('dtc-validation-warning');
        const missingFieldsList = document.getElementById('dtc-missing-fields');
        
        if (missingFields.length > 0) {
            warningDiv.style.display = 'block';
            missingFieldsList.innerHTML = missingFields.map(field => `<li>${field}</li>`).join('');
        } else {
            warningDiv.style.display = 'none';
            missingFieldsList.innerHTML = '';
        }

        return missingFields.length === 0;
    }

    function clearDrugTreatmentCourtReport() {
        // Clear all text inputs and text areas
        const textInputIds = [
            'dtc-clientName',
            'dtc-careCoordination',
            'dtc-treatmentSchedule',
            'dtc-appointmentType',
            'dtc-ludSubstance',
            'dtc-probation',
            'dtc-mentalHealth',
            'dtc-additionalNotes',
            'dtc-individualMissed',
            'dtc-groupMissed',
            'dtc-medMissed'
        ];
        textInputIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.value = '';
            }
        });

        // Clear all date inputs
        const dateInputIds = [
            'dtc-initialCourtDate',
            'dtc-courtPrepDate',
            'dtc-nextDate',
            'dtc-lud'
        ];
        dateInputIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.value = '';
            }
        });

        // Clear all select dropdowns
        const selectIds = [
            'dtc-checkingIn',
            'dtc-hasNotHas',
            'dtc-ludResponse',
            'dtc-matAttendance'
        ];
        selectIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.value = '';
            }
        });

        // Clear all number inputs
        const numberInputIds = [
            'dtc-individualAttended',
            'dtc-individualTotal',
            'dtc-groupAttended',
            'dtc-groupTotal',
            'dtc-medAttended',
            'dtc-medTotal'
        ];
        numberInputIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.value = '';
            }
        });

        // Clear all checkboxes
        const checkboxIds = [
            'dtc-toxNotScreened',
            'dtc-randomNotScreened'
        ];
        checkboxIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.checked = false;
            }
        });

        // Clear toxicology and random screen rows
        document.getElementById('dtc-toxContainer').innerHTML = '';
        document.getElementById('dtc-randomContainer').innerHTML = '';

        // Reset form visibility
        handleDtcLudVisibility();
        updateDtcMissedStatus();

        // Clear the copy boxes
        document.getElementById('dtc-progress-note-copy').value = '';
        document.getElementById('dtc-court-note-copy').value = '';

        // Clear validation warning
        document.getElementById('dtc-validation-warning').style.display = 'none';
        document.getElementById('dtc-missing-fields').innerHTML = '';

        // Reinitialize with empty rows
        addDtcToxRow();
        addDtcRandomRow();

        // Trigger update
        updateFinalNote();
    }

    const smokingProductFields = [
        { id: 'cigarettes', label: 'Cigarettes (regular or light)' },
        { id: 'cigars', label: 'Cigars (large cigars, cigarillos, little cigars)' },
        { id: 'pipe', label: 'Pipe tobacco' },
        { id: 'hookah', label: 'Hookah / waterpipe' },
        { id: 'bidis', label: 'Bidis or kreteks (clove cigarettes)' },
        { id: 'ryo', label: 'Roll-your-own cigarettes' },
        { id: 'chew', label: 'Chewing tobacco / leaf tobacco' },
        { id: 'snuff', label: 'Snuff (dry or moist)' },
        { id: 'snus', label: 'Snus (small pouches)' },
        { id: 'dissolvable', label: 'Dissolvable tobacco products (lozenges, strips, sticks)' },
        { id: 'ecig', label: 'E-cigarettes / vaping devices (nicotine-containing)' },
        { id: 'htp', label: 'Heated tobacco products (HTPs, e.g., IQOS)' }
    ];

    const smokingQuitMethods = [
        { key: 'patch', label: 'Nicotine patch' },
        { key: 'gum', label: 'Nicotine gum' },
        { key: 'lozenge', label: 'Nicotine lozenge' },
        { key: 'nasal', label: 'Nicotine nasal spray' },
        { key: 'inhaler', label: 'Nicotine inhaler' },
        { key: 'bupropion', label: 'Bupropion SR' },
        { key: 'varenicline', label: 'Varenicline' },
        { key: 'other', label: 'Other' }
    ];

    const smokingWithdrawalItems = [
        { key: 'cravings', label: 'Strong cravings for nicotine' },
        { key: 'irritability', label: 'Irritability, anger, or frustration' },
        { key: 'anxiety', label: 'Anxiety, restlessness, or feeling on edge' },
        { key: 'mood', label: 'Depressed mood or low motivation' },
        { key: 'concentration', label: 'Difficulty concentrating or mental fog' },
        { key: 'headaches', label: 'Headaches' },
        { key: 'fatigue', label: 'Fatigue or low energy' },
        { key: 'sleep', label: 'Sleep problems (insomnia or vivid dreams)' },
        { key: 'appetite', label: 'Increased appetite or weight gain' },
        { key: 'gi', label: 'Gastrointestinal discomfort (e.g., constipation, stomach upset)' },
        { key: 'cough', label: 'Cough or sore throat' },
        { key: 'other', label: 'Other' }
    ];

    const smokingStageItems = [
        { key: 'precontemplation', label: 'Precontemplation' },
        { key: 'contemplation', label: 'Contemplation' },
        { key: 'preparation', label: 'Preparation' },
        { key: 'action', label: 'Action' },
        { key: 'maintenance', label: 'Maintenance' },
        { key: 'relapse', label: 'Relapse (or Recycling)' }
    ];

    function collectSmokingProducts(prefix) {
        return smokingProductFields.map(field => {
            const val = (document.getElementById(`${prefix}-prod-${field.id}`)?.value || '').trim();
            return val ? `${field.label}: ${val}` : '';
        }).filter(Boolean);
    }

    function collectSmokingQuitMethods(prefix) {
        const result = { past: [], current: [] };
        const otherText = (document.getElementById(`${prefix}-method-other-text`)?.value || '').trim();
        smokingQuitMethods.forEach(method => {
            const pastId = `${prefix}-method-${method.key}-past`;
            const nowId = `${prefix}-method-${method.key}-now`;
            const pastChecked = document.getElementById(pastId)?.checked;
            const nowChecked = document.getElementById(nowId)?.checked;
            let label = method.label;
            if (method.key === 'other' && otherText) {
                label = `${method.label}: ${otherText}`;
            }
            if (pastChecked) result.past.push(label);
            if (nowChecked) result.current.push(label);
        });
        return result;
    }

    function collectSmokingWithdrawal(prefix, allowNone = false) {
        const selections = smokingWithdrawalItems.map(item => {
            if (item.key === 'other') {
                const checked = document.getElementById(`${prefix}-withdrawal-other`)?.checked;
                const text = (document.getElementById(`${prefix}-withdrawal-other-text`)?.value || '').trim();
                if (checked) {
                    return text ? `Other: ${text}` : 'Other: [specify]';
                }
                return '';
            }
            const checked = document.getElementById(`${prefix}-withdrawal-${item.key}`)?.checked;
            return checked ? item.label : '';
        }).filter(Boolean);

        if (allowNone && document.getElementById(`${prefix}-withdrawal-none`)?.checked) {
            return ['None'];
        }
        return selections;
    }

    function collectSmokingStages(prefix) {
        return smokingStageItems
            .map(item => ({ label: item.label, checked: document.getElementById(`${prefix}-stage-${item.key}`)?.checked }))
            .filter(item => item.checked)
            .map(item => item.label);
    }

    function collectComorbidities(selectOrContainerId, otherId) {
        const node = document.getElementById(selectOrContainerId);
        let selected = [];
        if (node) {
            if (node.tagName && node.tagName.toLowerCase() === 'select') {
                selected = Array.from(node.selectedOptions).map(opt => opt.value || opt.textContent || '').filter(Boolean);
            } else {
                selected = Array.from(node.querySelectorAll('input[type="checkbox"]:checked')).map(cb => (cb.dataset.text || cb.value || cb.parentElement?.textContent || '').trim()).filter(Boolean);
            }
        }
        const other = (document.getElementById(otherId)?.value || '').trim();
        if (other) selected.push(other);
        return selected;
    }

    function collectCheckedTexts(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return [];
        return Array.from(container.querySelectorAll('input[type="checkbox"]:checked')).map(cb => {
            const fallback = cb.parentElement ? cb.parentElement.textContent.trim() : '';
            return (cb.dataset.text || fallback || '').replace(/\s+/g, ' ').trim();
        }).filter(Boolean);
    }

    function collectResources(containerId, otherTextId) {
        const items = collectCheckedTexts(containerId);
        const otherText = (document.getElementById(otherTextId)?.value || '').trim();
        if (otherText) {
            const otherIndex = items.findIndex(item => item.toLowerCase().startsWith('other'));
            const otherValue = `Other: ${otherText}`;
            if (otherIndex >= 0) {
                items[otherIndex] = otherValue;
            } else {
                items.push(otherValue);
            }
        }
        return items;
    }

    function formatSmokingResourceList(resources) {
        const prefix = 'The following smoking cessation resources were provided:';
        if (resources.length === 1 && resources[0].startsWith(prefix)) {
            const listPortion = resources[0].slice(prefix.length).trim();
            const items = listPortion.split(';').map(part => part.trim()).filter(Boolean);
            return { heading: prefix, items };
        }
        return null;
    }

    function openHsiModal(prefix) {
        const modal = document.getElementById(`${prefix}-hsi-modal`);
        if (modal) modal.classList.remove('hidden');
    }

    function closeHsiModal(prefix) {
        const modal = document.getElementById(`${prefix}-hsi-modal`);
        if (modal) modal.classList.add('hidden');
    }

    function saveHsiModal(prefix) {
        const q1 = document.querySelector(`input[name="${prefix}-hsi-q1"]:checked`);
        const q2 = document.querySelector(`input[name="${prefix}-hsi-q2"]:checked`);
        const score1 = q1 ? parseInt(q1.value, 10) : 0;
        const score2 = q2 ? parseInt(q2.value, 10) : 0;
        const total = score1 + score2;

        let level = 'Low';
        if (total >= 5) level = 'High';
        else if (total >= 3) level = 'Medium';

        const q1Text = q1?.dataset.label || 'n/a';
        const q2Text = q2?.dataset.label || 'n/a';

        const input = document.getElementById(`${prefix}-hsi-score`);
        if (input) {
            input.value = `${total} (${level})  TTFC: ${q1Text}; CPD: ${q2Text}`;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
        }

        closeHsiModal(prefix);
        updateFinalNote();
    }

    function formatDateValue(raw) {
        if (!raw) return '';
        const dt = new Date(`${raw}T00:00:00`);
        if (Number.isNaN(dt.getTime())) return raw;
        return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    function buildSmokingNote({ prefix, phase, role }) {
        const val = (suffix) => (document.getElementById(`${prefix}-${suffix}`)?.value || '').trim();
        const sections = [];

        const diagnosis = val('diagnosis');
        if (diagnosis) sections.push(`Diagnosis:\n${diagnosis}`);

        const goal = val('goal');
        if (goal) sections.push(`Goal:\n${goal}`);

        const chief = val('chief');
        if (chief) sections.push(`Chief Complaint/Reason for visit:\n${chief}`);

        if (phase === 'initial') {
            const productLines = collectSmokingProducts(prefix);
            const comorbidities = collectComorbidities(`${prefix}-comorbidities`, `${prefix}-comorbid-other`);
            const historyParts = [];
            if (productLines.length > 0) historyParts.push(productLines.join('\n'));
            if (comorbidities.length > 0) historyParts.push(`Client medical co-morbidities include: ${comorbidities.join(', ')}`);
            if (historyParts.length > 0) sections.push(`TOBACCO USE HISTORY:\n${historyParts.join('\n')}`);

            const quitAttempts = val('quit-attempts');
            const quitMethods = collectSmokingQuitMethods(prefix);
            const reasonsPast = val('reasons-past');
            const reasonsNow = val('reasons-now');
            const liked = val('liked');
            const disliked = val('disliked');
            const withdrawal = collectSmokingWithdrawal(prefix, false);
            const relapseReasons = val('relapse-reasons');

            const treatmentParts = [];
            if (quitAttempts) treatmentParts.push(`Client reports the following quit attempts:\n${quitAttempts}`);
            if (quitMethods.past.length > 0) treatmentParts.push(`Quit aids used (past): ${quitMethods.past.join(', ')}`);
            if (quitMethods.current.length > 0) treatmentParts.push(`Quit aids used (now): ${quitMethods.current.join(', ')}`);
            if (reasonsPast) treatmentParts.push(`Reasons to quit in the past:\n${reasonsPast}`);
            if (reasonsNow) treatmentParts.push(`Reasons to quit now:\n${reasonsNow}`);
            if (liked) treatmentParts.push(`Liked effects when using tobacco:\n${liked}`);
            if (disliked) treatmentParts.push(`Disliked effects when using tobacco:\n${disliked}`);
            if (withdrawal.length > 0) treatmentParts.push(`Withdrawal symptoms struggled with in past quit attempts:\n ${withdrawal.join('\n ')}`);
            if (relapseReasons) treatmentParts.push(`Past reasons for relapse:\n${relapseReasons}`);
            if (treatmentParts.length > 0) sections.push(`TOBACCO TREATMENT HISTORY:\n${treatmentParts.join('\n\n')}`);
        } else {
            const progress = val('progress');
            const reasonsContinue = val('reasons-continue');
            if (progress) sections.push(`Client report since last visit:\n${progress}`);
            if (reasonsContinue) sections.push(`Reasons to continue working towards quitting:\n${reasonsContinue}`);
            const liked = val('liked');
            const disliked = val('disliked');
            if (liked) sections.push(`Liked effects when using tobacco:\n${liked}`);
            if (disliked) sections.push(`Disliked effects when using tobacco:\n${disliked}`);
            const withdrawal = collectSmokingWithdrawal(prefix, true);
            if (withdrawal.length > 0) sections.push(`Withdrawal symptoms:\n ${withdrawal.join('\n ')}`);
            const relapseReason = val('relapse-reason');
            if (relapseReason) sections.push(`Relapse reason (most recent attempt):\n${relapseReason}`);
        }

        const willingness = val('willingness');
        const ability = val('ability');
        if (willingness || ability) {
            const ratings = [];
            if (willingness) ratings.push(`Willingness to stop using tobacco: ${willingness}/10`);
            if (ability) ratings.push(`Ability to stop using tobacco: ${ability}/10`);
            sections.push(ratings.join('\n'));
        }

        const stages = collectSmokingStages(prefix);
        if (stages.length > 0) sections.push(`Stage of Change:\n ${stages.join('\n ')}`);

        const interventions = collectCheckedTexts(`${prefix}-interventions`);
        const interventionsOther = val('interventions-other');
        if (role === 'prescriber') {
            const hsi = val('hsi-score');
            if (hsi) interventions.push(`HSI score: ${hsi}`);
            const pharma = collectCheckedTexts(`${prefix}-pharma-options`);
            const pharmaOther = val('pharma-other-text');
            if (pharmaOther) {
                const otherIndex = pharma.findIndex(item => item.toLowerCase().startsWith('other'));
                const replacement = `Other pharmacotherapy option discussed: ${pharmaOther}`;
                if (otherIndex >= 0) {
                    pharma[otherIndex] = replacement;
                } else {
                    pharma.push(replacement);
                }
            }
            if (pharma.length > 0) interventions.push(`Pharmacotherapy options discussed: ${pharma.join('; ')}`);
        }
        if (interventionsOther) interventions.push(interventionsOther);
        if (interventions.length > 0) sections.push(`Interventions used:\n ${interventions.join('\n ')}`);

        const resources = collectResources(`${prefix}-resources`, `${prefix}-res-other-text`);
        const smokingResources = formatSmokingResourceList(resources);
        if (smokingResources) {
            const bullets = smokingResources.items.length > 0 ? `\n ${smokingResources.items.join('\n ')}` : '';
            sections.push(`Resources provided:\n${smokingResources.heading}${bullets}`);
        } else if (resources.length > 0) {
            sections.push(`Resources provided:\n ${resources.join('\n ')}`);
        }

        const response = val('response');
        if (response) sections.push(`Client Response:\n${response}`);

        const planItems = [];
        if (role === 'prescriber') {
            const medPlan = collectCheckedTexts(`${prefix}-med-plan-options`);
            const medPlanOther = val('med-plan-other');
            if (medPlanOther && medPlan.findIndex(item => item.toLowerCase().startsWith('other')) >= 0) {
                // Replace generic Other with specific text
                const idx = medPlan.findIndex(item => item.toLowerCase().startsWith('other'));
                medPlan[idx] = `Other: ${medPlanOther}`;
            } else if (medPlanOther) {
                medPlan.push(`Other: ${medPlanOther}`);
            }
            if (medPlan.length > 0) planItems.push(`Medication Plan: ${medPlan.join(', ')}`);
        }

        const attendancePlan = document.getElementById(`${prefix}-plan-attendance`);
        if (attendancePlan?.checked) planItems.push('Encourage continued attendance to counseling and/or groups');

        const prescriberPlan = document.getElementById(`${prefix}-plan-prescriber`);
        if (prescriberPlan?.checked) planItems.push('Referred to Prescriber for medication management');

        const lpnPlan = document.getElementById(`${prefix}-plan-lpn`);
        if (lpnPlan?.checked) planItems.push('Referred to LPN for monitoring and support');

        const nextPlan = document.getElementById(`${prefix}-plan-next`);
        if (nextPlan?.checked) {
            const dateVal = formatDateValue(val('plan-next-date')) || '[date]';
            planItems.push(`Scheduled next appointment for: ${dateVal}`);
        }

        const planOther = val('plan-other');
        if (planOther) planItems.push(planOther);

        if (planItems.length > 0) sections.push(`Plan/Next Steps:\n ${planItems.join('\n ')}`);

        return sections.join('\n\n');
    }

    function addDtcToxRow() {
        const container = document.getElementById('dtc-toxContainer');
        const row = document.createElement('div');
        row.className = 'dynamic-row dtc-tox-row';
        row.style.cssText = 'display:flex; align-items:center; gap:10px; margin-bottom:8px; padding:10px; background-color:#f9f9f9; border-radius:4px;';
        row.innerHTML = `
            <input type="date" class="input-field dtcToxDate" onchange="updateFinalNote()" style="flex-grow:1; margin:0; padding:8px;">
            <select class="select-field dtcToxResult" onchange="toggleDtcSubstance(this); updateFinalNote()" style="flex-grow:1; margin:0; padding:8px;">
                <option value="negative">Negative</option>
                <option value="positive">Positive</option>
                <option value="pending">Pending</option>
            </select>
            <input type="text" class="input-field substance-input dtcToxSubstance" placeholder="Substance(s)" style="flex-grow:1; margin:0; padding:8px; display:none;" onchange="updateFinalNote()">
            <button type="button" style="flex-shrink:0; width:38px; height:38px; padding:0; background-color:#dc3545; color:white; border:none; border-radius:4px; cursor:pointer; font-weight:bold;" onclick="this.parentElement.remove(); updateFinalNote();">X</button>
        `;
        container.appendChild(row);
    }

    function addDtcRandomRow() {
        const container = document.getElementById('dtc-randomContainer');
        const row = document.createElement('div');
        row.className = 'dynamic-row dtc-random-row';
        row.style.cssText = 'display:flex; align-items:center; gap:10px; margin-bottom:8px; padding:10px; background-color:#f9f9f9; border-radius:4px;';
        row.innerHTML = `
            <input type="date" class="input-field dtcRandomDate" onchange="updateFinalNote()" style="flex-grow:1; margin:0; padding:8px;">
            <select class="select-field dtcRandomResult" onchange="toggleDtcSubstance(this); updateFinalNote()" style="flex-grow:1; margin:0; padding:8px;">
                <option value="negative">Negative</option>
                <option value="positive">Positive</option>
                <option value="missed random">Missed Random</option>
            </select>
            <input type="text" class="input-field substance-input dtcRandomSubstance" placeholder="Substance(s)" style="flex-grow:1; margin:0; padding:8px; display:none;" onchange="updateFinalNote()">
            <button type="button" style="flex-shrink:0; width:38px; height:38px; padding:0; background-color:#dc3545; color:white; border:none; border-radius:4px; cursor:pointer; font-weight:bold;" onclick="this.parentElement.remove(); updateFinalNote();">X</button>
        `;
        container.appendChild(row);
    }

    // Psychiatric Assessment Listeners
    const psychAssessmentDetails = document.getElementById('psych-assessment-details');
    if (psychAssessmentDetails) {
        psychAssessmentDetails.addEventListener('input', () => {
            autoResize(psychAssessmentDetails);
            updateFinalNote();
        });
    }

    // Setup psychiatric assessment form listeners
    function initPsychiatricAssessmentListeners() {
        // All textareas and inputs
        const psychInputs = document.querySelectorAll('[id^="psych-"]');
        psychInputs.forEach(input => {
            if (input.id !== 'psych-mse-output' && input.id !== 'psych-tool-other-specify') {
                input.addEventListener('input', updateFinalNote);
                input.addEventListener('change', updateFinalNote);
                if (input.tagName.toLowerCase() === 'textarea') {
                    input.addEventListener('input', () => autoResize(input));
                }
            }
        });

        // Income source other
        const incomeSourceSelect = document.getElementById('psych-income-source');
        const incomeSourceOther = document.getElementById('psych-income-source-other');
        if (incomeSourceSelect && incomeSourceOther) {
            incomeSourceSelect.addEventListener('change', () => {
                incomeSourceOther.style.display = (incomeSourceSelect.value === 'other') ? 'block' : 'none';
                updateFinalNote();
            });
        }

        // Relationship status other
        const relationshipSelect = document.getElementById('psych-relationship-status');
        const relationshipOther = document.getElementById('psych-relationship-other');
        if (relationshipSelect && relationshipOther) {
            relationshipSelect.addEventListener('change', () => {
                relationshipOther.style.display = (relationshipSelect.value === 'other') ? 'block' : 'none';
                updateFinalNote();
            });
        }

        // Other assessment tool checkbox
        const otherToolCheckbox = document.getElementById('psych-tool-other');
        const otherToolSpecify = document.getElementById('psych-tool-other-specify');
        if (otherToolCheckbox && otherToolSpecify) {
            otherToolCheckbox.addEventListener('change', () => {
                otherToolSpecify.style.display = (otherToolCheckbox.checked) ? 'inline' : 'none';
                updateFinalNote();
            });
        }
    }

    function initPsychiatricFollowupListeners() {
        // All textareas and inputs for follow-up
        const psychFuInputs = document.querySelectorAll('[id^="psych-fu-"]');
        psychFuInputs.forEach(input => {
            if (input.id !== 'psych-fu-mse-output' && input.id !== 'psych-fu-tool-other-specify') {
                input.addEventListener('input', updateFinalNote);
                input.addEventListener('change', updateFinalNote);
                if (input.tagName.toLowerCase() === 'textarea') {
                    input.addEventListener('input', () => autoResize(input));
                }
            }
        });

        // Income source other
        const incomeSourceSelect = document.getElementById('psych-fu-income-source');
        const incomeSourceOther = document.getElementById('psych-fu-income-source-other');
        if (incomeSourceSelect && incomeSourceOther) {
            incomeSourceSelect.addEventListener('change', () => {
                incomeSourceOther.style.display = (incomeSourceSelect.value === 'other') ? 'block' : 'none';
                updateFinalNote();
            });
        }

        // Relationship status other
        const relationshipSelect = document.getElementById('psych-fu-relationship-status');
        const relationshipOther = document.getElementById('psych-fu-relationship-other');
        if (relationshipSelect && relationshipOther) {
            relationshipSelect.addEventListener('change', () => {
                relationshipOther.style.display = (relationshipSelect.value === 'other') ? 'block' : 'none';
                updateFinalNote();
            });
        }

        // Other assessment tool checkbox
        const otherToolCheckbox = document.getElementById('psych-fu-tool-other');
        const otherToolSpecify = document.getElementById('psych-fu-tool-other-specify');
        if (otherToolCheckbox && otherToolSpecify) {
            otherToolCheckbox.addEventListener('change', () => {
                otherToolSpecify.style.display = (otherToolCheckbox.checked) ? 'inline' : 'none';
                updateFinalNote();
            });
        }
    }

    function wireSmokingForm(prefix, containerId, allowWithdrawalNone = false) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const inputs = container.querySelectorAll('input, select, textarea');
        inputs.forEach(el => {
            el.addEventListener('input', updateFinalNote);
            el.addEventListener('change', updateFinalNote);
            if (el.tagName.toLowerCase() === 'textarea') {
                el.addEventListener('input', () => autoResize(el));
            }
        });

        if (allowWithdrawalNone) {
            const withdrawalContainer = document.getElementById(`${prefix}-withdrawal-options`);
            const noneCheckbox = document.getElementById(`${prefix}-withdrawal-none`);
            if (withdrawalContainer && noneCheckbox) {
                const checkboxes = withdrawalContainer.querySelectorAll('input[type="checkbox"]');
                checkboxes.forEach(cb => {
                    cb.addEventListener('change', () => {
                        if (cb === noneCheckbox && noneCheckbox.checked) {
                            checkboxes.forEach(other => {
                                if (other !== noneCheckbox) other.checked = false;
                            });
                        } else if (cb !== noneCheckbox && cb.checked && noneCheckbox.checked) {
                            noneCheckbox.checked = false;
                        }
                        updateFinalNote();
                    });
                });
            }
        }
    }

    function initSmokingCessationListeners() {
        [
            { prefix: 'nsi', containerId: 'nurse-smoking-initial-container', allowWithdrawalNone: false },
            { prefix: 'nsf', containerId: 'nurse-smoking-followup-container', allowWithdrawalNone: true },
            { prefix: 'psi', containerId: 'prescriber-smoking-initial-container', allowWithdrawalNone: false },
            { prefix: 'psf', containerId: 'prescriber-smoking-followup-container', allowWithdrawalNone: true }
        ].forEach(cfg => wireSmokingForm(cfg.prefix, cfg.containerId, cfg.allowWithdrawalNone));
    }

    function updateFinalNote() {
        const selectedNoteType = noteTypeSelect.value;
        let finalNote = '';

        // Hide all containers first
        noteContainers.forEach(c => c.classList.add('hidden'));
        
        // Show the relevant container
        const activeContainer = document.getElementById(`${selectedNoteType}-container`);
        if (activeContainer) {
            activeContainer.classList.remove('hidden');
        }
        document.body.classList.toggle('crisis-wide', selectedNoteType === 'crisis-intervention');

        if (selectedNoteType === 'eval-cd') {
            const diagnosisElements = diagnosisContainer.querySelectorAll('select');
            const selectedOptions = Array.from(diagnosisElements).map(select => select.value).filter(val => val);
            const diagnosis = selectedOptions.length > 0 ? selectedOptions.join(', ') : '[SPECIFY DIAGNOSIS]';

            // Hide "as evidenced by" and details textbox if F19.99 is selected
            const evidencedByLabel = document.getElementById('eval-cd-evidenced-by-label');
            const detailsCriteria = document.getElementById('details-criteria');
            const isF1999 = selectedOptions.includes('F19.99 - Unspecified or Other Unknown Substance Use Disorder');
            if (evidencedByLabel && detailsCriteria) {
                evidencedByLabel.style.display = isF1999 ? 'none' : '';
                detailsCriteria.style.display = isF1999 ? 'none' : '';
            }

            // Compose note
            let baseNote = `The client presented for services and meets diagnostic criteria for a substance use disorder, specifically ${diagnosis}`;
            if (!isF1999) {
                const details = detailsCriteria.value || '[DETAILS OF CRITERIA MET]';
                baseNote += `, as evidenced by: \n\n${details}`;
            } else {
                baseNote += '.';
            }
            baseNote += `\n\nThe clinician reviewed: Program expectations, rules, and attendance policies; Delphi Rises policy as a tobacco, nicotine, alcohol, and drug-free environment; and Client rights and responsibilities, including HIPAA and 42 CFR Part 2 confidentiality protections.\n\nThe clinician confirmed client understanding and emphasized the collaborative nature of recovery, highlighting the agencys role in supporting the clients treatment goals. The client demonstrated an understanding that participation in services is voluntary and may be discontinued at any time${mandateCheckbox.checked ? ' The clinician clarified the implications of external mandates, noting that mandated status does not override the clients right to voluntary engagement in treatment or toxicology screenings. Corresponding handouts were provided.' : ''}\n\nThe clinician reviewed the clients Behavioral Health and Chemical Dependency screening results and supported the client in understanding their scores. A comprehensive review of the clients presenting concerns, referral reason, psychosocial needs, and current and historical functioning was conducted to assess eligibility for Outpatient services. The client's initial treatment goal is to complete the evaluation process; additional goals will be developed collaboratively in future sessions inclusive of discussions during evaluation session.`;

            let scenariosText = [];
            if (cdHasMhProviderTextCheckbox.checked) {
                let text = cdHasMhProviderTextCheckbox.nextElementSibling.textContent;
                if (cdSafetyPlanHasProviderCheckbox.checked) {
                    text += ' ' + cdSafetyPlanHasProviderCheckbox.nextElementSibling.textContent;
                }
                scenariosText.push(text);
            }
            if (cdNoMhProviderTextCheckbox.checked) {
                let text = cdNoMhProviderTextCheckbox.nextElementSibling.textContent;
                if (cdSafetyPlanNoProviderCheckbox.checked) {
                    text += ' ' + cdSafetyPlanNoProviderCheckbox.nextElementSibling.textContent;
                }
                scenariosText.push(text);
            }
            if (cdOverdoseRiskCheckbox.checked) {
                scenariosText.push(cdOverdoseRiskCheckbox.nextElementSibling.textContent);
            }
            if (cdGamblingRiskCheckbox.checked) {
                scenariosText.push(cdGamblingRiskCheckbox.nextElementSibling.textContent);
            }

            if (scenariosText.length > 0) {
                finalNote = baseNote + "\n\n" + scenariosText.join("\n\n");
            } else {
                finalNote = baseNote;
            }
        } else if (selectedNoteType === 'crisis-intervention') {
            // Build Crisis Intervention note from ci-* fields
            const start = document.getElementById('ci-start-time')?.value || '';
            const end = document.getElementById('ci-end-time')?.value || '';
            let durationStr = '';
            if (start && end) {
                const [sh, sm] = start.split(':').map(Number);
                const [eh, em] = end.split(':').map(Number);
                if (![sh, sm, eh, em].some(Number.isNaN)) {
                    let mins = (eh * 60 + em) - (sh * 60 + sm);
                    if (mins < 0) mins += 24 * 60;
                    durationStr = `${mins} minute${mins === 1 ? '' : 's'}`;
                }
            }
            const durEl = document.getElementById('ci-duration'); if (durEl) durEl.value = durationStr;

            const qualifierIds = ['ci-qualifier-self-harm','ci-qualifier-harm-others','ci-qualifier-overdose','ci-qualifier-mh-substance','ci-qualifier-mh-deterioration','ci-qualifier-history-at-risk'];
            const qualifiers = qualifierIds.map(id => { const el = document.getElementById(id); return el && el.checked ? (el.value || (el.nextElementSibling && el.nextElementSibling.textContent) || '') : ''; }).filter(Boolean);

            const interventionIds = ['ci-intervention-therapeutic','ci-intervention-safety-plan','ci-intervention-referral','ci-intervention-dispatch','ci-intervention-med-related','ci-intervention-followup'];
            const interventions = interventionIds.map(id => { const el = document.getElementById(id); return el && el.checked ? (el.value || (el.nextElementSibling && el.nextElementSibling.textContent) || '') : ''; }).filter(Boolean);

            const serviceMode = document.getElementById('ci-service-mode')?.value || '';
            const location = document.getElementById('ci-location')?.value || '';
            const presentingProblem = document.getElementById('ci-presenting-problem')?.value || '';
            const suicideRisk = getCheckedValue('ci-suicide-risk');
            const suicideThoughts = getCheckedValue('ci-suicide-thoughts');
            const suicidePlan = getCheckedValue('ci-suicide-plan');
            const suicideIntent = getCheckedValue('ci-suicide-intent');
            const homicideRisk = getCheckedValue('ci-homicide-risk');
            const odRisk = getCheckedValue('ci-od-risk');
            const mse = document.getElementById('ci-mse')?.value || '';
            const emergencyNeed = getCheckedValue('ci-emergency-need');
            const emergencyDetails = document.getElementById('ci-emergency-details')?.value || '';
            const collaterals = document.getElementById('ci-collaterals')?.value || '';
            const interventionsNarrative = document.getElementById('ci-interventions-narrative')?.value || '';
            const disposition = document.getElementById('ci-disposition')?.value || '';
            const followupDateRaw = document.getElementById('ci-followup-date')?.value || '';
            const followupDate = followupDateRaw;
            const followupPlan = document.getElementById('ci-followup-plan')?.value || '';

            const validationIssues = [];
            const clinicalFlags = [];

            if (!qualifiers.length) validationIssues.push('At least one qualifying crisis indicator should be selected.');
            if (!esc(presentingProblem)) validationIssues.push('Presenting problem is required.');
            if (!suicideRisk) validationIssues.push('Suicide risk assessment is required.');
            if (!homicideRisk) validationIssues.push('Homicide risk assessment is required.');
            if (!odRisk) validationIssues.push('Intoxication or overdose risk assessment is required.');
            if (!esc(mse)) validationIssues.push('Mental status examination is required.');
            if (!emergencyNeed) validationIssues.push('Document whether emergency services were immediately needed.');
            if (emergencyNeed === 'yes' && !esc(emergencyDetails)) validationIssues.push('Emergency response details are required when emergency services were needed.');
            if (!interventions.length) validationIssues.push('Document at least one crisis intervention or initial plan component.');
            if (!esc(interventionsNarrative)) validationIssues.push('Intervention details are required.');
            if (!esc(disposition)) validationIssues.push('Disposition or outcome is required.');
            if (durationMinutes(start, end) != null && durationMinutes(start, end) < 15) validationIssues.push('Encounter duration is below the 15-minute minimum for H2011.');

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

            const mins = durationMinutes(start, end);
            const billing = computeBilling(mins, '', serviceMode);

            const eligibilityBox = document.getElementById('ci-eligibility-box');
            const billingBox = document.getElementById('ci-billing-box');
            const validationBox = document.getElementById('ci-validation-box');
            if (eligibilityBox) {
                eligibilityBox.innerHTML = `
                    <div class="status-title">Eligibility review</div>
                    <div class="badge ${eligibilityClass}">${eligibilityLabel}</div>
                    <div>${eligibilitySummary}</div>
                    ${clinicalFlags.length ? `<ul>${clinicalFlags.map(x => `<li>${x}</li>`).join('')}</ul>` : '<div class="small">No high-acuity flag generated from the current inputs.</div>'}
                `;
            }
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
            if (validationBox) {
                validationBox.innerHTML = `
                    <div class="status-title">Validation check</div>
                    <div class="badge ${validationIssues.length ? 'warn' : 'good'}">${validationIssues.length ? validationIssues.length + ' issue' + (validationIssues.length === 1 ? '' : 's') : 'No validation issues'}</div>
                    ${validationIssues.length ? `<ul>${validationIssues.map(x => `<li>${x}</li>`).join('')}</ul>` : '<div class="small">Required documentation fields appear complete based on this form.</div>'}
                `;
            }
            const crisisCopyReady = validationIssues.length === 0;
            if (crisisCopyButton) crisisCopyButton.disabled = !crisisCopyReady;
            if (crisisCopyHint) crisisCopyHint.style.display = crisisCopyReady ? 'none' : 'block';

            const modeMap = {
                telephone: 'telephone / audio-only',
                telehealth: 'telehealth audio-video',
                in_person: 'in person',
                community: 'community / onsite response'
            };
            const mode = modeMap[serviceMode] || '[service mode]';
            const qualifierText = qualifierLabels(qualifiers).join('; ') || '[no qualifying indicator selected]';
            const interventionText = interventionLabels(interventions).join('; ') || '[no intervention selected]';
            const emergencyText = emergencyNeed === 'yes'
                ? `Immediate emergency services were required. ${esc(emergencyDetails) || '[details needed]'}`
                : emergencyNeed === 'no'
                  ? 'Immediate emergency services were assessed and not required at the time of this encounter.'
                  : 'Need for immediate emergency services was not documented.';
            const yesNo = (value) => value === 'yes' ? 'Yes' : value === 'no' ? 'No' : 'Not documented';

            const note = `Crisis Intervention Note\n\nService Mode: ${mode}${location ? ` | Location: ${location}` : ''}\nDuration: ${mins != null ? `${mins} minutes` : '[duration not calculated]'}\nSuggested Crisis Code: ${billing.code}${billing.units ? ` (${billing.units})` : ''}\n\nReason for Crisis Intervention / Qualifying Indicators:\nThis encounter was evaluated as crisis intervention based on the following qualifying indicator(s): ${qualifierText}.\n\nPresenting Problem:\n${esc(presentingProblem) || '[presenting problem required]'}\n\nTriage and Risk Assessment:\nSuicide risk: ${prettyRisk(suicideRisk)}.\nThoughts: ${yesNo(suicideThoughts)}. Plan: ${yesNo(suicidePlan)}. Intent: ${yesNo(suicideIntent)}.\nHomicide risk: ${prettyRisk(homicideRisk)}.\nIntoxication / overdose risk: ${prettyRisk(odRisk)}.\nMental Status Examination: ${esc(mse) || '[MSE required]'}\n${emergencyText}\n${esc(collaterals) ? `Collateral / family / other involved parties: ${esc(collaterals)}\n` : ''}\nInterventions Provided / Initial Plan of Services:\nDocumented crisis interventions included ${interventionText}.\nIntervention details: ${esc(interventionsNarrative) || '[intervention details required]'}\n\nDisposition / Outcome:\n${esc(disposition) || '[disposition required]'}\n\nFollow-Up:\n${esc(followupDate) || esc(followupPlan) ? `Follow-up related to this qualifying crisis episode is planned for ${esc(followupDate) || '[date not entered]'}${esc(followupPlan) ? ` with the following plan: ${esc(followupPlan)}` : '.'}` : 'No specific follow-up documented in this form.'}\n\nClinical Documentation Review Summary:\nEligibility status: ${eligibilityLabel}.\n${validationIssues.length ? `Documentation gaps still requiring review or completion: ${validationIssues.join(' ')}` : 'Required triage and intervention elements appear complete based on the form inputs.'}\n${billing.modifier ? `Telehealth / modifier note: ${billing.modifier}` : ''}`;

            finalNote = note;
            if (crisisGeneratedNote) {
                crisisGeneratedNote.value = note;
                autoResize(crisisGeneratedNote);
            }

        } else if (selectedNoteType === 'psychiatric-assessment') {
            const val = (id) => (document.getElementById(id)?.value || '').trim();
            const checkedLabel = (id) => {
                const el = document.getElementById(id);
                if (el && el.checked && el.nextElementSibling) return el.nextElementSibling.textContent.trim();
                if (el && el.checked) return '[Checked]';
                return '';
            };

            const sections = [];

            // Identifying Information
            const identifyingInfo = val('psych-identifying-info');
            if (identifyingInfo) sections.push(`IDENTIFYING INFORMATION:\n${identifyingInfo}`);

            // Chief Complaint
            const chiefComplaint = val('psych-chief-complaint');
            if (chiefComplaint) sections.push(`CHIEF COMPLAINT:\n${chiefComplaint}`);

            // HPI
            const hpiParts = [];
            const currentSymptoms = val('psych-current-symptoms');
            const psychosocialStressors = val('psych-psychosocial-stressors');
            const reasonPresenting = val('psych-reason-presenting');
            if (currentSymptoms) hpiParts.push(`Current Symptoms: ${currentSymptoms}`);
            if (psychosocialStressors) hpiParts.push(`Recent Psychosocial Stressors: ${psychosocialStressors}`);
            if (reasonPresenting) hpiParts.push(`Reason Patient is Presenting Now: ${reasonPresenting}`);
            if (hpiParts.length > 0) sections.push(`HPI (Historical Evidence Relevant to Current Presentation):\n${hpiParts.join('\n')}`);

            // Psychiatric ROS
            const rosItems = [
                { id: 'psych-ros-depression', label: 'Depression' },
                { id: 'psych-ros-mania', label: 'Mania' },
                { id: 'psych-ros-psychotic', label: 'Psychotic Disorder' },
                { id: 'psych-ros-anxiety', label: 'Anxiety' },
                { id: 'psych-ros-panic', label: 'Panic' },
                { id: 'psych-ros-ocd', label: 'OCD' },
                { id: 'psych-ros-ptsd', label: 'PTSD' },
                { id: 'psych-ros-social-phobia', label: 'Social Phobia' },
                { id: 'psych-ros-somatoform', label: 'Somatoform' },
                { id: 'psych-ros-eating-disorders', label: 'Eating Disorders' },
                { id: 'psych-ros-cognitive-disorders', label: 'Cognitive Disorders' },
                { id: 'psych-ros-learning-difficulties', label: 'Learning Difficulties' }
            ];
            const rosLines = rosItems
                .map(item => ({ label: item.label, val: val(item.id) }))
                .filter(item => item.val)
                .map(item => `${item.label}: ${item.val}`);
            if (rosLines.length > 0) sections.push(`PSYCHIATRIC ROS:\n${rosLines.join('\n')}`);

            // Past Psychiatric History
            const pastDiagnoses = val('psych-past-diagnoses');
            const treatmentHistory = val('psych-treatment-history');
            const medicationHistory = val('psych-medication-history');
            const substanceUse = val('psych-substance-use');
            const pphParts = [];
            if (pastDiagnoses) pphParts.push(`Previous Symptoms/Diagnoses: ${pastDiagnoses}`);
            if (treatmentHistory) pphParts.push(`History of Psychiatric Treatment: ${treatmentHistory}`);
            if (medicationHistory) pphParts.push(`History of Psychotropic Medication Use and Reactions: ${medicationHistory}`);
            if (substanceUse) pphParts.push(`Substance Use (Past and Present): ${substanceUse}`);
            if (pphParts.length > 0) sections.push(`PAST PSYCHIATRIC HISTORY:\n${pphParts.join('\n')}`);

            // Lethality
            const lethalityParts = [];
            const currentIdeation = val('psych-current-ideation');
            const previousIdeation = val('psych-previous-ideation');
            const previousAttempt = val('psych-previous-attempt');
            if (currentIdeation) lethalityParts.push(`Current Ideation: ${currentIdeation}`);
            if (previousIdeation) lethalityParts.push(`Previous Ideation: ${previousIdeation}`);
            if (previousAttempt) lethalityParts.push(`Previous Attempt: ${previousAttempt}`);
            if (lethalityParts.length > 0) sections.push(`LETHALITY:\n${lethalityParts.join('\n')}`);

            // Risk Factors
            const riskIds = [
                'psych-risk-advanced-age','psych-risk-active-ideation','psych-risk-recent-loss','psych-risk-passive-ideation','psych-risk-isolation','psych-risk-plan','psych-risk-poor-support','psych-risk-method-available','psych-risk-married','psych-risk-intent','psych-risk-impulsive-behaviors','psych-risk-command-hallucinations','psych-risk-chronic-mental-illness','psych-risk-history-assault'
            ];
            const riskChecked = riskIds.map(checkedLabel).filter(Boolean);
            const riskOtherInputs = Array.from(document.querySelectorAll('#psych-risk-other-container input[type="text"]'));
            const riskOtherValues = riskOtherInputs.map(inp => inp.value.trim()).filter(Boolean);
            const allRiskFactors = [...riskChecked, ...riskOtherValues];
            if (allRiskFactors.length > 0) sections.push(`RISK FACTORS:\n ${allRiskFactors.join('\n ')}`);

            // Protective Factors
            const protectIds = ['psych-protect-higher-power','psych-protect-married','psych-protect-suicide-wrong','psych-protect-support-system'];
            const protectChecked = protectIds.map(checkedLabel).filter(Boolean);
            const protectOtherInputs = Array.from(document.querySelectorAll('#psych-protect-other-container input[type="text"]'));
            const protectOtherValues = protectOtherInputs.map(inp => inp.value.trim()).filter(Boolean);
            const allProtectFactors = [...protectChecked, ...protectOtherValues];
            if (allProtectFactors.length > 0) sections.push(`PROTECTIVE FACTORS:\n ${allProtectFactors.join('\n ')}`);

            // Past Medical History
            const medParts = [];
            const medProblems = val('psych-medical-problems');
            const allergies = val('psych-allergies');
            const currentTreatment = val('psych-current-treatment');
            const pregnancyInfo = val('psych-pregnancy-info');
            const breastfeeding = (document.querySelector('input[name="psych-breastfeeding"]:checked')?.value || '').trim();
            const exercise = (document.querySelector('input[name="psych-exercise"]:checked')?.value || '').trim();
            const exerciseDetails = val('psych-exercise-details');
            if (medProblems) medParts.push(`Current/Previous Medical Problems or Surgeries: ${medProblems}`);
            if (allergies) medParts.push(`Allergies (Meds/Dyes/Food/Environmental): ${allergies}`);
            if (currentTreatment) medParts.push(`Type of Treatment (Prescription / OTC / Home Remedies): ${currentTreatment}`);
            if (pregnancyInfo) medParts.push(`Pregnant/Regular Periods/Breastfeeding: ${pregnancyInfo}`);
            if (breastfeeding) medParts.push(`Breastfeeding: ${breastfeeding}`);
            if (exercise) medParts.push(`Regular Exercise: ${exercise}`);
            if (exerciseDetails) medParts.push(`Exercise Method/Frequency: ${exerciseDetails}`);
            if (medParts.length > 0) sections.push(`PAST MEDICAL HISTORY:\n${medParts.join('\n')}`);

            // Family Psychiatric History
            const famParts = [];
            const famPsych = val('psych-family-psychiatric');
            const famSuicide = val('psych-family-suicide');
            const famSuicideAttempts = val('psych-family-suicide-attempts');
            const famAlcohol = val('psych-family-alcohol');
            const famSubstance = val('psych-family-substance');
            if (famPsych) famParts.push(`Psychiatric Disorders: ${famPsych}`);
            if (famSuicide) famParts.push(`Suicide: ${famSuicide}`);
            if (famSuicideAttempts) famParts.push(`Suicide Attempts: ${famSuicideAttempts}`);
            if (famAlcohol) famParts.push(`Alcohol Abuse: ${famAlcohol}`);
            if (famSubstance) famParts.push(`Substance Abuse: ${famSubstance}`);
            if (famParts.length > 0) sections.push(`FAMILY PSYCHIATRIC HISTORY:\n${famParts.join('\n')}`);

            // Social History
            const socialParts = [];
            const incomeSource = document.getElementById('psych-income-source');
            const incomeText = incomeSource && incomeSource.value ? incomeSource.options[incomeSource.selectedIndex].text : '';
            const incomeOther = val('psych-income-source-other');
            if (incomeOther || incomeText) socialParts.push(`Source of Income: ${incomeOther || incomeText}`);
            const occupationalHistory = val('psych-occupational-history');
            if (occupationalHistory) socialParts.push(`Occupational History: ${occupationalHistory}`);
            const educationSelectEl = document.getElementById('psych-education-level');
            const educationLevel = educationSelectEl && educationSelectEl.value ? educationSelectEl.options[educationSelectEl.selectedIndex].text.trim() : '';
            if (educationLevel) socialParts.push(`Level of Education Completed: ${educationLevel}`);
            const relationshipSelect = document.getElementById('psych-relationship-status');
            const relationshipText = relationshipSelect && relationshipSelect.value ? relationshipSelect.options[relationshipSelect.selectedIndex].text : '';
            if (relationshipText) socialParts.push(`Relationship Status: ${relationshipText}`);
            const numChildren = val('psych-num-children');
            if (numChildren) socialParts.push(`Number of Children: ${numChildren}`);
            const livesInHome = val('psych-lives-in-home');
            if (livesInHome) socialParts.push(`Who Lives in Home: ${livesInHome}`);
            const relationshipQuality = val('psych-relationship-quality');
            if (relationshipQuality) socialParts.push(`Quality of Significant Other Relationship: ${relationshipQuality}`);
            const supportNetwork = val('psych-support-network');
            if (supportNetwork) socialParts.push(`Support Network: ${supportNetwork}`);
            const legalIssues = val('psych-legal-issues');
            if (legalIssues) socialParts.push(`Legal Issues: ${legalIssues}`);
            if (socialParts.length > 0) sections.push(`SOCIAL HISTORY:\n${socialParts.join('\n')}`);

            // Developmental History
            const devParts = [];
            const raisedWhere = val('psych-raised-where');
            const raisedBy = val('psych-raised-by');
            const siblings = val('psych-siblings');
            const childhoodDesc = val('psych-childhood-description');
            const schoolPerformance = val('psych-school-performance');
            const hsFriends = val('psych-high-school-friends');
            const hsActivities = val('psych-high-school-activities');
            const currentHobbies = val('psych-current-hobbies');
            if (raisedWhere) devParts.push(`Raised Where: ${raisedWhere}`);
            if (raisedBy) devParts.push(`Raised By: ${raisedBy}`);
            if (siblings) devParts.push(`Siblings: ${siblings}`);
            if (childhoodDesc) devParts.push(`Childhood Description: ${childhoodDesc}`);
            if (schoolPerformance) devParts.push(`Performance at School: ${schoolPerformance}`);
            if (hsFriends) devParts.push(`High School Friends: ${hsFriends}`);
            if (hsActivities) devParts.push(`High School Activities: ${hsActivities}`);
            if (currentHobbies) devParts.push(`Current Hobbies: ${currentHobbies}`);
            if (devParts.length > 0) sections.push(`DEVELOPMENTAL HISTORY:\n${devParts.join('\n')}`);

            // DSM-5-TR Diagnosis
            const dsmDiagnosis = val('psych-dsm5-diagnosis');
            if (dsmDiagnosis) sections.push(`DSM-5-TR DIAGNOSES:\n${dsmDiagnosis}`);

            // Mental Status Exam
            const mseOutput = val('psych-mse-output');
            if (mseOutput) sections.push(`MENTAL STATUS EXAM:\n${mseOutput}`);

            // Add interventions if any are selected
            try {
                const interventionItems = [];

                const cbtChecked = document.querySelectorAll('input[name="CBT"]:checked');
                if (cbtChecked.length > 0) {
                    const cbtList = Array.from(cbtChecked).map(cb => cb.value);
                    const cbtOther = document.getElementById('CBTOther')?.value?.trim();
                    if (cbtOther) cbtList.push(cbtOther);
                    if (cbtList.length > 0) {
                        interventionItems.push('CBT:\n   ' + cbtList.join('\n   '));
                    }
                }

                const pcChecked = document.querySelectorAll('input[name="Person Centered"]:checked');
                if (pcChecked.length > 0) {
                    const pcList = Array.from(pcChecked).map(cb => cb.value);
                    const pcOther = document.getElementById('PersonCenteredOther')?.value?.trim();
                    if (pcOther) pcList.push(pcOther);
                    if (pcList.length > 0) {
                        interventionItems.push('Person Centered:\n   ' + pcList.join('\n   '));
                    }
                }

                const miChecked = document.querySelectorAll('input[name="Motivational Interviewing"]:checked');
                if (miChecked.length > 0) {
                    const miList = Array.from(miChecked).map(cb => cb.value);
                    const miOther = document.getElementById('MotivationalInterviewingOther')?.value?.trim();
                    if (miOther) miList.push(miOther);
                    if (miList.length > 0) {
                        interventionItems.push('Motivational Interviewing:\n   ' + miList.join('\n   '));
                    }
                }

                const customList = document.getElementById('customList');
                if (customList) {
                    const customItems = Array.from(customList.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.getAttribute('data-text') || cb.nextElementSibling?.textContent || cb.value).filter(Boolean);
                    if (customItems.length > 0) {
                        interventionItems.push('Interventions:\n   ' + customItems.join('\n   '));
                    }
                }

                if (interventionItems.length > 0) {
                    sections.push(`INTERVENTIONS USED:\n${interventionItems.join('\n\n')}`);
                }
            } catch (e) {
                // Silently fail if interventions can't be collected
            }

            // Clinical Assessment
            const assessment = val('psych-assessment');
            if (assessment) sections.push(`ASSESSMENT:\n${assessment}`);

            // Plan / Next Steps
            const planItems = [];
            const planCheckboxes = [
                'psych-plan-continue-treatment',
                'psych-plan-abstain-education',
                'psych-plan-med-substance',
                'psych-plan-med-education',
                'psych-plan-medication-timeline',
                'psych-plan-crisis-safety',
                'psych-plan-follow-up-importance',
                'psych-plan-contact-info'
            ];
            planCheckboxes.forEach(id => {
                const box = document.getElementById(id);
                if (box && box.checked) {
                    const label = box.nextElementSibling ? box.nextElementSibling.textContent : '';
                    if (label.trim()) planItems.push(label.trim());
                }
            });
            const planNotes = val('psych-plan-notes');
            if (planNotes) planItems.push(`Additional Plan Notes: ${planNotes}`);
            const followUp = val('psych-followup-timeframe');
            if (followUp) planItems.push(`Follow Up: F/u with me in ${followUp}`);
            if (planItems.length > 0) {
                sections.push(`PLAN / NEXT STEPS:\n ${planItems.join('\n ')}`);
            }

            // Time Statement
            const timeParts = [];
            const faceToFace = val('psych-time-face-to-face');
            const psychotherapyMinutes = (document.getElementById('psych-psychotherapy-minutes')?.value || '').trim();
            const psychotherapyWarning = document.getElementById('psych-psychotherapy-warning');
            if (psychotherapyWarning) {
                psychotherapyWarning.classList.toggle('hidden', psychotherapyMinutes !== '0-15');
            }
            const documentationTime = val('psych-time-documentation');
            const coordinationTime = val('psych-time-coordination');
            if (faceToFace) timeParts.push(`Face to Face/Telephonic Time: ${faceToFace}`);
            if (psychotherapyMinutes) timeParts.push(`Psychotherapy Time: ${psychotherapyMinutes} minutes were spent in psychotherapy.`);
            if (documentationTime) timeParts.push(`Documentation: ${documentationTime}`);
            if (coordinationTime) timeParts.push(`Coordination of Care: ${coordinationTime}`);
            if (timeParts.length > 0) sections.push(`TIME STATEMENT:\n${timeParts.join('\n')}`);

            // Assessment tools
            const toolEntries = [];
            const toolCheckboxes = [
                { id: 'psych-tool-depression', label: 'Depression Scale' },
                { id: 'psych-tool-anxiety', label: 'Anxiety Scale' },
                { id: 'psych-tool-mmse', label: 'MMSE' },
                { id: 'psych-tool-panic', label: 'Panic Attack Record' },
                { id: 'psych-tool-adhd', label: 'ADD/ADHD' },
                { id: 'psych-tool-bipolar', label: 'Bipolar Scale' },
                { id: 'psych-tool-geriatric', label: 'Geriatric Depression Scale' },
                { id: 'psych-tool-other', label: 'Other' }
            ];
            toolCheckboxes.forEach(tool => {
                const el = document.getElementById(tool.id);
                if (el && el.checked) {
                    if (tool.id === 'psych-tool-other') {
                        const other = (document.getElementById('psych-tool-other-specify').value || '').trim();
                        toolEntries.push(other ? `Other: ${other}` : 'Other: [Specify]');
                    } else {
                        toolEntries.push(tool.label);
                    }
                }
            });
            if (toolEntries.length > 0) {
                sections.push(`ASSESSMENT TOOLS NEEDED AT NEXT APPOINTMENT:\n ${toolEntries.join('\n ')}`);
            }

            finalNote = sections.length > 0 ? `DETAILED PSYCHIATRIC ASSESSMENT\n\n${sections.join('\n\n')}` : '';
        } else if (selectedNoteType === 'psychiatric-followup') {
            const val = (suffix) => (document.getElementById(`psych-fu-${suffix}`)?.value || '').trim();
            const checkedLabel = (id) => {
                const el = document.getElementById(id);
                return (el && el.checked) ? (el.nextElementSibling?.textContent.trim() || el.value) : '';
            };
            const sections = [];

            // Identifying Information
            const identifyingInfo = val('identifying-info');
            if (identifyingInfo) sections.push(`IDENTIFYING INFORMATION:\n${identifyingInfo}`);

            // Chief Complaint
            const chiefComplaint = val('chief-complaint');
            if (chiefComplaint) sections.push(`CHIEF COMPLAINT:\n${chiefComplaint}`);

            // HPI
            const hpiParts = [];
            const currentSymptoms = val('current-symptoms');
            const psychosocialStressors = val('psychosocial-stressors');
            const reasonPresenting = val('reason-presenting');
            if (currentSymptoms) hpiParts.push(`Current Symptoms: ${currentSymptoms}`);
            if (psychosocialStressors) hpiParts.push(`Recent Psychosocial Stressors: ${psychosocialStressors}`);
            if (reasonPresenting) hpiParts.push(`Reason Patient is Presenting Now: ${reasonPresenting}`);
            if (hpiParts.length > 0) sections.push(`HPI: HISTORICAL EVIDENCE RELEVANT TO CURRENT PRESENTATION:\n${hpiParts.join('\n')}`);

            // Psychiatric ROS
            const rosItems = [
                { field: 'depression', label: 'Depression' },
                { field: 'mania', label: 'Mania' },
                { field: 'psychotic', label: 'Psychotic Disorder' },
                { field: 'anxiety', label: 'Anxiety' },
                { field: 'panic', label: 'Panic' },
                { field: 'ocd', label: 'OCD' },
                { field: 'ptsd', label: 'PTSD' },
                { field: 'social-phobia', label: 'Social Phobia' },
                { field: 'somatoform', label: 'Somatoform' },
                { field: 'eating-disorders', label: 'Eating Disorders' },
                { field: 'cognitive-disorders', label: 'Cognitive Disorders' },
                { field: 'learning-difficulties', label: 'Learning Difficulties' }
            ];
            const rosEntries = [];
            rosItems.forEach(item => {
                const value = val(`ros-${item.field}`);
                if (value) rosEntries.push(`${item.label}: ${value}`);
            });
            if (rosEntries.length > 0) sections.push(`PSYCHIATRIC ROS:\n${rosEntries.join('\n')}`);

            // Past Psychiatric History
            const pphParts = [];
            const pastDiagnoses = val('past-diagnoses');
            const treatmentHistory = val('treatment-history');
            const medicationHistory = val('medication-history');
            const substanceUse = val('substance-use');
            if (pastDiagnoses) pphParts.push(`Previous Symptoms/Diagnoses: ${pastDiagnoses}`);
            if (treatmentHistory) pphParts.push(`History of Psychiatric Treatment: ${treatmentHistory}`);
            if (medicationHistory) pphParts.push(`History of Psychotropic Medication Use and Reactions: ${medicationHistory}`);
            if (substanceUse) pphParts.push(`Substance Use (Past and Present): ${substanceUse}`);
            if (pphParts.length > 0) sections.push(`PAST PSYCHIATRIC HISTORY:\n${pphParts.join('\n')}`);

            // Lethality
            const lethalityParts = [];
            const currentIdeation = val('current-ideation');
            const previousIdeation = val('previous-ideation');
            const previousAttempt = val('previous-attempt');
            if (currentIdeation) lethalityParts.push(`Current Ideation: ${currentIdeation}`);
            if (previousIdeation) lethalityParts.push(`Previous Ideation: ${previousIdeation}`);
            if (previousAttempt) lethalityParts.push(`Previous Attempt: ${previousAttempt}`);
            if (lethalityParts.length > 0) sections.push(`LETHALITY:\n${lethalityParts.join('\n')}`);

            // Risk Factors
            const riskIds = [
                'psych-fu-risk-advanced-age','psych-fu-risk-active-ideation','psych-fu-risk-recent-loss','psych-fu-risk-passive-ideation','psych-fu-risk-isolation','psych-fu-risk-plan','psych-fu-risk-poor-support','psych-fu-risk-method-available','psych-fu-risk-married','psych-fu-risk-intent','psych-fu-risk-impulsive-behaviors','psych-fu-risk-command-hallucinations','psych-fu-risk-chronic-mental-illness','psych-fu-risk-history-assault'
            ];
            const riskChecked = riskIds.map(checkedLabel).filter(Boolean);
            const riskOtherInputs = Array.from(document.querySelectorAll('#psych-fu-risk-other-container input[type="text"]'));
            const riskOtherValues = riskOtherInputs.map(inp => inp.value.trim()).filter(Boolean);
            const allRiskFactors = [...riskChecked, ...riskOtherValues];
            if (allRiskFactors.length > 0) sections.push(`RISK FACTORS:\n ${allRiskFactors.join('\n ')}`);

            // Protective Factors
            const protectIds = ['psych-fu-protect-higher-power','psych-fu-protect-married','psych-fu-protect-suicide-wrong','psych-fu-protect-support-system'];
            const protectChecked = protectIds.map(checkedLabel).filter(Boolean);
            const protectOtherInputs = Array.from(document.querySelectorAll('#psych-fu-protect-other-container input[type="text"]'));
            const protectOtherValues = protectOtherInputs.map(inp => inp.value.trim()).filter(Boolean);
            const allProtectFactors = [...protectChecked, ...protectOtherValues];
            if (allProtectFactors.length > 0) sections.push(`PROTECTIVE FACTORS:\n ${allProtectFactors.join('\n ')}`);

            // Past Medical History
            const medParts = [];
            const medProblems = val('medical-problems');
            const allergies = val('allergies');
            const currentTreatment = val('current-treatment');
            const pregnancyInfo = val('pregnancy-info');
            const breastfeeding = (document.querySelector('input[name="psych-fu-breastfeeding"]:checked')?.value || '').trim();
            const exercise = (document.querySelector('input[name="psych-fu-exercise"]:checked')?.value || '').trim();
            const exerciseDetails = val('exercise-details');
            if (medProblems) medParts.push(`Current/Previous Medical Problems or Surgeries: ${medProblems}`);
            if (allergies) medParts.push(`Allergies (Meds/Dyes/Food/Environmental): ${allergies}`);
            if (currentTreatment) medParts.push(`Type of Treatment (Prescription / OTC / Home Remedies): ${currentTreatment}`);
            if (pregnancyInfo) medParts.push(`Pregnant/Regular Periods/Breastfeeding: ${pregnancyInfo}`);
            if (breastfeeding) medParts.push(`Breastfeeding: ${breastfeeding}`);
            if (exercise) medParts.push(`Regular Exercise: ${exercise}`);
            if (exerciseDetails) medParts.push(`Exercise Method/Frequency: ${exerciseDetails}`);
            if (medParts.length > 0) sections.push(`PAST MEDICAL HISTORY:\n${medParts.join('\n')}`);

            // Social Factors
            const socialParts = [];
            const incomeSource = document.getElementById('psych-fu-income-source');
            const incomeText = incomeSource && incomeSource.value ? incomeSource.options[incomeSource.selectedIndex].text : '';
            const incomeOther = val('income-source-other');
            if (incomeOther || incomeText) socialParts.push(`Source of Income: ${incomeOther || incomeText}`);
            const occupation = val('occupation');
            if (occupation) socialParts.push(`Occupation: ${occupation}`);
            const relationshipSelect = document.getElementById('psych-fu-relationship-status');
            const relationshipText = relationshipSelect && relationshipSelect.value ? relationshipSelect.options[relationshipSelect.selectedIndex].text : '';
            if (relationshipText) socialParts.push(`Relationship Status: ${relationshipText}`);
            const numChildren = val('num-children');
            if (numChildren) socialParts.push(`Number of Children: ${numChildren}`);
            const livesInHome = val('lives-in-home');
            if (livesInHome) socialParts.push(`Who Lives in Home: ${livesInHome}`);
            const relationshipQuality = val('relationship-quality');
            if (relationshipQuality) socialParts.push(`Quality of Significant Other Relationship: ${relationshipQuality}`);
            const supportNetwork = val('support-network');
            if (supportNetwork) socialParts.push(`Support Network: ${supportNetwork}`);
            const legalIssues = val('legal-issues');
            if (legalIssues) socialParts.push(`Legal Issues: ${legalIssues}`);
            if (socialParts.length > 0) sections.push(`SOCIAL FACTORS:\n${socialParts.join('\n')}`);

            // DSM-5-TR Diagnosis
            const dsmDiagnosis = val('dsm5-diagnosis');
            if (dsmDiagnosis) sections.push(`DSM-5-TR DIAGNOSES:\n${dsmDiagnosis}`);

            // Mental Status Exam
            const mseOutput = val('mse-output');
            if (mseOutput) sections.push(`MENTAL STATUS EXAM:\n${mseOutput}`);

            // Add interventions if any are selected
            try {
                const interventionItems = [];

                const cbtChecked = document.querySelectorAll('input[name="CBT-FU"]:checked');
                if (cbtChecked.length > 0) {
                    const cbtList = Array.from(cbtChecked).map(cb => cb.value);
                    const cbtOther = document.getElementById('CBTOtherFU')?.value?.trim();
                    if (cbtOther) cbtList.push(cbtOther);
                    if (cbtList.length > 0) {
                        interventionItems.push('CBT:\n   ' + cbtList.join('\n   '));
                    }
                }

                const pcChecked = document.querySelectorAll('input[name="Person Centered-FU"]:checked');
                if (pcChecked.length > 0) {
                    const pcList = Array.from(pcChecked).map(cb => cb.value);
                    const pcOther = document.getElementById('PersonCenteredOtherFU')?.value?.trim();
                    if (pcOther) pcList.push(pcOther);
                    if (pcList.length > 0) {
                        interventionItems.push('Person Centered:\n   ' + pcList.join('\n   '));
                    }
                }

                const miChecked = document.querySelectorAll('input[name="Motivational Interviewing-FU"]:checked');
                if (miChecked.length > 0) {
                    const miList = Array.from(miChecked).map(cb => cb.value);
                    const miOther = document.getElementById('MotivationalInterviewingOtherFU')?.value?.trim();
                    if (miOther) miList.push(miOther);
                    if (miList.length > 0) {
                        interventionItems.push('Motivational Interviewing:\n   ' + miList.join('\n   '));
                    }
                }

                const customList = document.getElementById('customListFU');
                if (customList) {
                    const customItems = Array.from(customList.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.getAttribute('data-text') || cb.nextElementSibling?.textContent || cb.value).filter(Boolean);
                    if (customItems.length > 0) {
                        interventionItems.push('Interventions:\n   ' + customItems.join('\n   '));
                    }
                }

                if (interventionItems.length > 0) {
                    sections.push(`INTERVENTIONS USED:\n${interventionItems.join('\n\n')}`);
                }
            } catch (e) {
                // Silently fail if interventions can't be collected
            }

            // Clinical Assessment
            const assessment = val('assessment');
            if (assessment) sections.push(`ASSESSMENT:\n${assessment}`);

            // Plan / Next Steps
            const planItems = [];
            const planCheckboxes = [
                'psych-fu-plan-continue-treatment',
                'psych-fu-plan-abstain-education',
                'psych-fu-plan-med-substance',
                'psych-fu-plan-med-education',
                'psych-fu-plan-medication-timeline',
                'psych-fu-plan-crisis-safety',
                'psych-fu-plan-follow-up-importance',
                'psych-fu-plan-contact-info'
            ];
            planCheckboxes.forEach(id => {
                const box = document.getElementById(id);
                if (box && box.checked) {
                    const label = box.nextElementSibling ? box.nextElementSibling.textContent : '';
                    if (label.trim()) planItems.push(label.trim());
                }
            });
            const planNotes = val('plan-notes');
            if (planNotes) planItems.push(`Additional Plan Notes: ${planNotes}`);
            const followUp = val('followup-timeframe');
            if (followUp) planItems.push(`Follow Up: F/u with me in ${followUp}`);
            if (planItems.length > 0) {
                sections.push(`PLAN / NEXT STEPS:\n ${planItems.join('\n ')}`);
            }

            // Time Statement
            const timeParts = [];
            const faceToFace = val('time-face-to-face');
            const psychotherapyMinutes = (document.getElementById('psych-fu-psychotherapy-minutes')?.value || '').trim();
            const psychotherapyWarning = document.getElementById('psych-fu-psychotherapy-warning');
            if (psychotherapyWarning) {
                psychotherapyWarning.classList.toggle('hidden', psychotherapyMinutes !== '0-15');
            }
            const documentationTime = val('time-documentation');
            const coordinationTime = val('time-coordination');
            if (faceToFace) timeParts.push(`Face to Face/Telephonic Time: ${faceToFace}`);
            if (psychotherapyMinutes) timeParts.push(`Psychotherapy Time: ${psychotherapyMinutes} minutes were spent in psychotherapy.`);
            if (documentationTime) timeParts.push(`Documentation: ${documentationTime}`);
            if (coordinationTime) timeParts.push(`Coordination of Care: ${coordinationTime}`);
            if (timeParts.length > 0) sections.push(`TIME STATEMENT:\n${timeParts.join('\n')}`);

            // Assessment tools
            const toolEntries = [];
            const toolCheckboxes = [
                { id: 'psych-fu-tool-depression', label: 'Depression Scale' },
                { id: 'psych-fu-tool-anxiety', label: 'Anxiety Scale' },
                { id: 'psych-fu-tool-mmse', label: 'MMSE' },
                { id: 'psych-fu-tool-panic', label: 'Panic Attack Record' },
                { id: 'psych-fu-tool-adhd', label: 'ADD/ADHD' },
                { id: 'psych-fu-tool-bipolar', label: 'Bipolar Scale' },
                { id: 'psych-fu-tool-geriatric', label: 'Geriatric Depression Scale' },
                { id: 'psych-fu-tool-other', label: 'Other' }
            ];
            toolCheckboxes.forEach(tool => {
                const el = document.getElementById(tool.id);
                if (el && el.checked) {
                    if (tool.id === 'psych-fu-tool-other') {
                        const other = (document.getElementById('psych-fu-tool-other-specify').value || '').trim();
                        toolEntries.push(other ? `Other: ${other}` : 'Other: [Specify]');
                    } else {
                        toolEntries.push(tool.label);
                    }
                }
            });
            if (toolEntries.length > 0) {
                sections.push(`ASSESSMENT TOOLS NEEDED AT NEXT APPOINTMENT:\n ${toolEntries.join('\n ')}`);
            }

            finalNote = sections.length > 0 ? `PSYCHIATRIC FOLLOW-UP\n\n${sections.join('\n\n')}` : '';
        } else if (selectedNoteType === 'eval-so') {
            const diagnosis = soDiagnosisSelect.value || '[SELECT A DIAGNOSIS]';
            const details = soDetailsTextarea.value || '[DETAILS OF CRITERIA MET]';
            let baseNote = `The client presented for services due to experiencing stress related to supporting someone in their life who struggles with substance use. The client meets diagnostic criteria, specifically ${diagnosis}, as evidenced by: \n\n${details}\n\nThe clinician reviewed: Program expectations, rules, and attendance policies; Delphi Rises policy as a tobacco, nicotine, alcohol, and drug-free environment; and Client rights and responsibilities, including HIPAA and 42 CFR Part 2 confidentiality protections.\n\nThe clinician confirmed client understanding and emphasized the collaborative nature of treatment, highlighting the agencys role in supporting the clients treatment goals. The client demonstrated an understanding that participation in services is voluntary and may be discontinued at any time.\n\nThe clinician reviewed the clients Behavioral Health screening results and supported the client in understanding their scores. A comprehensive review of the clients presenting concerns, referral reason, psychosocial needs, and current and historical functioning was conducted to assess eligibility for Outpatient services. The client's initial treatment goal is to complete the evaluation process; additional goals will be developed collaboratively in future sessions inclusive of discussions during evaluation session.`;
            
            let scenariosText = [];
            if (soHasMhProviderTextCheckbox.checked) {
                let text = soHasMhProviderTextCheckbox.nextElementSibling.textContent;
                if (soSafetyPlanHasProviderCheckbox.checked) {
                    text += ' ' + soSafetyPlanHasProviderCheckbox.nextElementSibling.textContent;
                }
                scenariosText.push(text);
            }
            if (soNoMhProviderTextCheckbox.checked) {
                let text = soNoMhProviderTextCheckbox.nextElementSibling.textContent;
                if (soSafetyPlanNoProviderCheckbox.checked) {
                    text += ' ' + soSafetyPlanNoProviderCheckbox.nextElementSibling.textContent;
                }
                scenariosText.push(text);
            }
            if (soOverdoseRiskCheckbox.checked) {
                scenariosText.push(soOverdoseRiskCheckbox.nextElementSibling.textContent);
            }
            if (soGamblingRiskCheckbox.checked) {
                scenariosText.push(soGamblingRiskCheckbox.nextElementSibling.textContent);
            }

            if (scenariosText.length > 0) {
                finalNote = baseNote + "\n\n" + scenariosText.join("\n\n");
            } else {
                finalNote = baseNote;
            }

        } else if (selectedNoteType === 'entry-cd') {
            const clientGoals = Array.from(clientGoalsContainer.querySelectorAll('input')).map(input => input.value).filter(val => val);
            const treatmentGoals = Array.from(treatmentGoalsContainer.querySelectorAll('input')).map(input => input.value).filter(val => val);
            
            let clientGoalsText = clientGoals.length > 0 ? '\n' + clientGoals.map(goal => `"${goal}"`).join('\n') : ' [CLIENT-STATED GOALS / CLIENT VOICE/QUOTES]';
            let treatmentGoalsText = treatmentGoals.length > 0 ? '\n' + treatmentGoals.join('\n') : ' [TREATMENT PLAN GOALS]';

            finalNote = `The client has identified personal goals to support their recovery, including:${clientGoalsText}\n\nBased on the clients psychosocial needs, current presentation, and clinical history, the client is expected to benefit from the following treatment plan goals:${treatmentGoalsText}\n\nThe clinician reviewed all services available through the Outpatient clinic, with a focus on peer support, medication management, and therapeutic group offerings. Corresponding handouts were provided to support the clients engagement and alignment with their identified recovery goals.`;

        } else if (selectedNoteType === 'entry-so') {
            const clientGoals = Array.from(soClientGoalsContainer.querySelectorAll('input')).map(input => input.value).filter(val => val);
            const treatmentGoals = Array.from(soTreatmentGoalsContainer.querySelectorAll('input')).map(input => input.value).filter(val => val);
            
            let clientGoalsText = clientGoals.length > 0 ? '\n' + clientGoals.map(goal => `"${goal}"`).join('\n') : ' [CLIENT-STATED GOALS / CLIENT VOICE/QUOTES]';
            let treatmentGoalsText = treatmentGoals.length > 0 ? '\n' + treatmentGoals.join('\n') : ' [TREATMENT PLAN GOALS]';

            finalNote = `The client has identified personal goals to support their recovery, including:${clientGoalsText}\n\nBased on the clients psychosocial needs, current presentation, and clinical history, the client is expected to benefit from the following treatment plan goals:${treatmentGoalsText}\n\nThe clinician reviewed all services available through the Outpatient clinic, with a focus on peer support, medication management, and therapeutic group offerings. Corresponding handouts were provided to support the clients engagement and alignment with their identified recovery goals.`;
        
        } else if (selectedNoteType === 'narcan-kit') {
            if (narcanProvidedCheckbox.checked) {
                finalNote = "Writer provided Ct with an overview of Narcan, showed a brief video demonstrating how to use Narcan, and provided Ct with a Narcan kit.";
            } else if (narcanDeclinedCheckbox.checked) {
                finalNote = "Ct declined Narcan training when offered and declined to accept a Narcan kit.";
            } else {
                finalNote = "";
            }
        
        } else if (selectedNoteType === 'mat-education') {
            let noteParts = [];
            const educationType = matEducationType.value;

            if (educationType === 'not-taking') {
                noteParts.push("Medication Assisted Treatment (MAT) has been introduced, and education has been offered based on client's history and current presentation. Writer provided client with an overview of MATs benefits & risks and offered to connect client to medication management in our clinic");
            } else if (educationType === 'already-taking') {
                noteParts.push("Client is currently taking medication to manage their Substance Use Disorder");
            }
            
            if (matExploredOptionsDropdown.value) {
                noteParts.push(matExploredOptionsDropdown.options[matExploredOptionsDropdown.selectedIndex].text);

                if(matExploredOptionsDropdown.value === 'did') {
                    if (matSubstancesTextbox.value.trim() !== "") {
                        noteParts.push(`MAT is recommended for the following substance(s): ${matSubstancesTextbox.value.trim()}`);
                    }
                    const selectedOptions = Array.from(matSpecificOptionsCheckboxes.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
                    if(selectedOptions.length > 0){
                        noteParts.push(`Specific options explored include: ${selectedOptions.join(', ')}`);
                    }
                }
            }
            
            if (matResponseDropdown.value) {
                noteParts.push(matResponseDropdown.value);
            }

            if (matNicotineUseDropdown.value) {
                const nicotineUse = matNicotineUseDropdown.value === 'does' ? 'does' : 'does not';
                let nicotineSentence = `The client ${nicotineUse} report current nicotine use`;
                if (nicotineUse === 'does') {
                    let resources = [];
                    if (matNicotineReplacementCheckbox.checked) resources.push('nicotine replacement options');
                    if (matNicotineCounselingCheckbox.checked) resources.push('tobacco cessation counseling');
                    if (matNicotineReferralCheckbox.checked) resources.push('referral to a tobacco cessation program');
                    if (matNicotineOtherCheckbox.checked && matNicotineOtherTextbox.value) {
                        resources.push(matNicotineOtherTextbox.value);
                    }
                    if (resources.length > 0) {
                        nicotineSentence += `, and the following nicotine cessation resources were provided: ${resources.join(', ')}`;
                    }
                }
                noteParts.push(nicotineSentence);
            }
            
            const joinedNote = noteParts.filter(Boolean).join('. ');
            if (joinedNote) {
                finalNote = joinedNote + '.';
            }

        } else if (selectedNoteType === 'telehealth') {
            
            telehealthReasonOther.style.display = (telehealthReason.value === 'other') ? 'inline-block' : 'none';
            telehealthDisruptionFollowup.style.display = (telehealthDisruption.value === 'was a service disruption') ? 'inline-block' : 'none';
            telehealthSatisfactionConcerns.style.display = (telehealthSatisfaction.value === 'expressed the following concerns:') ? 'inline-block' : 'none';
            telehealthOthersPresent.style.display = (telehealthPresenceDropdown.value === 'others') ? 'inline-block' : 'none';

            let noteParts = [];
            
            if (telehealthVisitType.value) {
                noteParts.push(`This session was conducted via ${telehealthVisitType.value}, and client is clinically appropriate to receive services via telepractice`);
            }
            
            let reason = telehealthReason.value;
            if (reason) {
                if (reason === 'other') {
                    reason = telehealthReasonOther.value || '[specify]';
                }
                noteParts.push(`the use of telepractice was due to ${reason}`);
            }
            
            let disruption = telehealthDisruption.value;
            if (disruption) {
                let disruptionText = `there ${disruption}`;
                if (disruption === 'was a service disruption') {
                    const plan = telehealthDisruptionPlan.value || '[plan for follow-up]';
                    disruptionText += `. Writer will follow up by ${plan}`;
                }
                noteParts.push(disruptionText);
            }

            const clientLocation = telehealthClientLocation.value || '[client location]';
            const practitionerLocation = telehealthPractitionerLocation.value || '[practitioner location]';
            noteParts.push(`the client was located at ${clientLocation}, and the practitioner was located at ${practitionerLocation} at the time of the session`);
            
            let presence = telehealthPresenceDropdown.value;
            if (presence) {
                if (presence === 'only') {
                    noteParts.push('Provider and client were the only individuals present in the session');
                } else if (presence === 'others') {
                    const others = telehealthOthersPresent.value || '[specify]';
                    noteParts.push(`in addition to the provider and client, the following individual(s) were present with the client: ${others}`);
                }
            }

            let satisfaction = telehealthSatisfaction.value;
            if (satisfaction) {
                let satisfactionText = satisfaction;
                if (satisfaction.startsWith('expressed the following concerns')) {
                    const concerns = telehealthSatisfactionConcerns.value || '[specify]';
                    satisfactionText += ` ${concerns}`;
                }
                noteParts.push(`The client was asked about their satisfaction with receiving services via telepractice and ${satisfactionText}`);
            }

            const joinedNote = noteParts.filter(Boolean).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('. ');
            if(joinedNote) {
                finalNote = joinedNote + '.';
            }

        } else if (selectedNoteType === 'complex-coordination-of-care') {
            syncCccVisibility();

            const nonRoutine = cccNonRoutineCheckbox && cccNonRoutineCheckbox.checked;
            const serviceByFilled = !!(cccServiceByInput && cccServiceByInput.value.trim());
            const coordinatedWithFilled = !!(cccCoordinationWithInput && cccCoordinationWithInput.value.trim());
            const categoryFilled = !!(cccCategorySelect && cccCategorySelect.value);
            const supportFilled = !!(cccSupportNextSteps && cccSupportNextSteps.value.trim());
            const narrativeFilled = !!(cccNoteTextarea && cccNoteTextarea.value.trim());
            const verificationComplete = (cccVerifyNextSteps && cccVerifyNextSteps.checked) && (cccVerifyGoals && cccVerifyGoals.checked);

            const allComplete = nonRoutine && verificationComplete && serviceByFilled && coordinatedWithFilled && categoryFilled && supportFilled && narrativeFilled;
            const showWarning = (cccVerificationWarning && nonRoutine && !allComplete);

            if (cccVerificationWarning) {
                cccVerificationWarning.classList.toggle('hidden', !showWarning);
            }

            if (allComplete) {
                const serviceBy = cccServiceByInput.value.trim();
                const coordinatedWith = cccCoordinationWithInput.value.trim();
                const category = cccCategorySelect.value;
                const support = cccSupportNextSteps.value.trim();
                const narrative = cccNoteTextarea.value.trim();

                finalNote = `Complex Coordination of Care (non-routine).\n\nService completed by: ${serviceBy}.\nCoordinated with: ${coordinatedWith}.\nCategory of service: ${category}.\nHow this interaction supports the client's next steps: ${support}.\n\nNarrative:\n${narrative}`;
            } else {
                finalNote = '';
            }

        } else if (selectedNoteType === 'closing-note-admitted') {
            const dischargeStatus = document.getElementById('closing-discharge-status')?.value || '[discharge status]';
            const disposition = document.getElementById('closing-disposition')?.value || '[disposition]';
            
            // Check if this is a "Lost to contact" disposition
            const isLostToContact = disposition === 'Left against clinical advice: Lost to contact (no referral possible)' || disposition === 'Loss of Contact';
            
            if (isLostToContact) {
                // Generate Loss of Contact note
                const lossMode = document.querySelector('input[name="closing-admitted-loss-mode"]:checked')?.value || 'sessions';
                let lossNarrative = '';
                
                if (lossMode === 'sessions') {
                    const sessions = closingAdmittedLossSessions?.value || '0';
                    const startDate = closingAdmittedLossStartDate?.value || '[start date]';
                    const endDate = closingAdmittedLossEndDate?.value || '[end date]';
                    lossNarrative = `The client was seen for ${sessions} sessions from ${startDate} to ${endDate}. `;
                } else {
                    lossNarrative = 'The client engaged in their evaluation and entry session only. ';
                }
                
                lossNarrative += `Re-engagement efforts are documented in the chart. A discharge letter was sent to the client's last known address with the reason for their discharge, an invitation to re-engage in treatment when they are ready, and a recovery resource handout outlining community resources for urgent support, harm reduction resources, and referrals to MAT providers and recovery peer services.`;
                
                finalNote = `Client was discharged with a status of ${dischargeStatus} and a disposition of ${disposition}. ${lossNarrative}`;
            } else {
                // Generate regular Admitted note
                let noteParts = [];
                noteParts.push(`Client was discharged with a status of ${dischargeStatus} and a disposition of ${disposition}`);

                const recommendations = closingRecommendations.value || '[recommended treatment plan or next steps]';
                noteParts.push(`Treatment recommendations include ${recommendations}`);

                const meds = closingMedsDropdown.value;
                if (meds) {
                    let medsSentence = `The client ${meds} currently prescribed medications most recently prescribed at Delphi`;
                    if (meds === 'is') {
                        const actions = closingMedsActions.value || '[describe actions taken, e.g., medication reconciliation, prescription coordination, referral to prescriber, etc.]';
                        medsSentence += `. The following actions were taken to support the clients medication management: ${actions}`;
                    }
                    noteParts.push(medsSentence);
                }

                const referrals = closingReferrals.value || '[list referrals, e.g., outpatient counseling, primary care, housing support, etc.]';
                noteParts.push(`Referrals initiated to support the client post-discharge include: ${referrals}`);

                const offeredTo = closingOfferedToDropdown.value;
                if (offeredTo) {
                    noteParts.push(`The ${offeredTo} was offered a copy of their discharge plan, a recovery resource handout outlining community resources for urgent support, harm reduction resources, referrals to MAT providers and recovery peer services, and an overdose prevention/Narcan kit`);
                }
                
                const clientResponse = closingClientResponse.value;
                if (clientResponse) {
                    noteParts.push(`Client's Response to Resources Offered at Discharge: ${clientResponse}`);
                }
                
                const joinedNote = noteParts.filter(Boolean).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('. ');
                if (joinedNote) {
                    finalNote = joinedNote + '.';
                }
            }

        } else if (selectedNoteType === 'closing-note-non-admitted') {
            const clientType = nonAdmittedClientType.value;
            if (clientType === 'no-engage') {
                const efforts = nonAdmittedEfforts.value || '[list efforts]';
                const providedTo = nonAdmittedProvidedTo1.value ? ` and also provided to: ${nonAdmittedProvidedTo1.value}` : '';
                finalNote = `Client will not be admitted for treatment at this time due to not engaging in treatment beyond their evaluation(s). Engagement efforts included ${efforts}. The decision not to admit was provided via mail to client${providedTo}. Included in this letter is a recovery resource handout outlining community resources for urgent support, harm reduction resources, MAT providers, and recovery peer services.`;
            } else if (clientType === 'higher-loc') {
                const locadtr = nonAdmittedLocadtr.value || '[LOCADTR outcome]';
                const efforts = nonAdmittedEfforts2.value || '[list efforts made, e.g., coordination with other providers, referral outreach, discussion with client/family, etc.]';
                const providedTo = nonAdmittedProvidedTo2.value ? ` and also provided to: ${nonAdmittedProvidedTo2.value}` : '';
                finalNote = `The client will not be admitted for treatment at this time, as they meet criteria for a higher level of care ${locadtr}. Following a thorough review and discussion by the multidisciplinary team, it was determined that the clients needs would be more safely and appropriately addressed in a setting equipped to provide a higher intensity of services. Efforts to explore treatment options and identify appropriate referrals were made, including: ${efforts}. The decision not to admit was communicated to the client via mail${providedTo}. Included in the letter was a recovery resource handout outlining local options for urgent support, harm reduction services, MAT providers, and peer recovery resources.`;
            } else if (clientType === 'no-criteria') {
    const urineScreenResult = nonAdmittedUrineScreen.value || '[urine screen result]';
    const providedTo = nonAdmittedProvidedTo3.value ? ` and ${nonAdmittedProvidedTo3.value}` : '';
    finalNote = `Client will not be admitted for treatment at this time due to not meeting diagnostic criteria. Urine screen was ${urineScreenResult} and no concerns were reported by collateral contacts. An outcome letter was provided to the client${providedTo}.`;
}
        } else if (selectedNoteType === 'discharge-plan') {
            finalNote = updateDischargeOtherNeedsSummary();
        } else if (selectedNoteType === 'injections') {
            const injectionType = injectionTypeSelect.value;
            switch (injectionType) {
                case 'vivitrol': {
                    const next = formatDateForOutput(vivitrolNextInjection && vivitrolNextInjection.value) || '[Next Injection Date]';
                    const exp = formatDateForOutput(vivitrolExp && vivitrolExp.value) || (vivitrolExp && vivitrolExp.value) || '[Exp Date]';
                    finalNote = `Vivitrol 380mg Sus ER rec\nSuspension prepared as instructed with preparation needle.\nSite: ${vivitrolSite.value || '[Site]'}\nLot #: ${vivitrolLot.value || '[Lot #]'}\nExp date: ${exp}\nSN: ${vivitrolSn.value || '[SN]'}\nGluteal injection site identified by landmarks, prepped with alcohol swab. 2-inch admin needle used. 4.2 ml of suspension injected (Vivitrol 380 mg) with scant bleeding, Band-aid applied. Pt tolerated procedure well without complication. Reviewed with Pt medication side effects, signs/systems of infection at injection site. Encouraged PT to contact clinic for any concerns/ questions regarding injection.\nNext scheduled Injection: ${next}`;
                }
                    break;
                case 'sublocade':
                    {
                        const next = formatDateForOutput(sublocadeNextInjection && sublocadeNextInjection.value) || '[Next Injection Date]';
                        const exp = formatDateForOutput(sublocadeExp && sublocadeExp.value) || (sublocadeExp && sublocadeExp.value) || '[Exp Date]';
                        finalNote = `Sublocade SQ injection administered\nSite: ${sublocadeSite.value || '[Site]'}\nLot #: ${sublocadeLot.value || '[Lot #]'}\nExp date: ${exp}\nSN: ${sublocadeSn.value || '[SN]'}\nIce pack applied to site prior to administration Cold Spray applied to site. Site prepped with alcohol swab. Pt tolerated procedure well without complication. Reviewed with Pt medication side effects, signs/systems of infection at injection site. Encouraged PT to contact clinic for any concerns/ questions regarding injection. PT instructed on importance of medication adherence and follow appointments with providers.\nNext scheduled Injection: ${next}`;
                    }
                    break;
                case 'brixadi':
                    {
                        const next = formatDateForOutput(brixadiNextInjection && brixadiNextInjection.value) || '[Next Injection Date]';
                        const exp = formatDateForOutput(brixadiExp && brixadiExp.value) || (brixadiExp && brixadiExp.value) || '[Exp Date]';
                        finalNote = `Brixadi SQ injection administered\nSite: ${brixadiSite.value || '[Site]'}\nLot #: ${brixadiLot.value || '[Lot #]'}\nExp date: ${exp}\nSN: ${brixadiSn.value || '[SN]'}\nSite prepped with alcohol swab. Pt tolerated procedure. Reviewed with Pt medication side effects, signs/systems of infection at injection site. Encouraged PT to contact clinic for any concerns/ questions regarding injection.\nNext scheduled Injection: ${next}`;
                    }
                    break;
            }
        } else if (selectedNoteType === 'medical-screening') {
            // Logic for Medical Screening Note
            let pcpNarrative = [];
            let diseaseNarrative = [];
            let substanceNarrative = [];

            // Helper to get radio value
            const getRadioValue = (name) => {
                const radio = document.querySelector(`#medical-screening-container input[name="${name}"]:checked`);
                return radio ? radio.value : '';
            };

            // --- PCP and Physical Exams ---
            const hasPCP = getRadioValue('hasPCP');
            if (hasPCP === 'yes') {
                const pcpName = document.getElementById('pcpName').value || '[PCP Name Not Provided]';
                const lastPEDate = document.getElementById('lastPEDate').value || '[Date Not Provided]';
                pcpNarrative.push(`Client has a primary care physician, ${pcpName}. Their last physical exam was on ${lastPEDate}.`);
                if (document.getElementById('pcpDiscussed').checked) {
                    pcpNarrative.push("Writer and client discussed the importance of routine health maintenance and management of chronic conditions with their PCP.");
                }
            } else if (hasPCP === 'no') {
                pcpNarrative.push("Client does not have a primary care physician.");
                const hadPE = getRadioValue('hadPELastYear');
                if (hadPE === 'yes') {
                    const peLocation = document.getElementById('peLocation').value || '[Location Not Provided]';
                    const peConsent = document.querySelector('[name="peConsent"]').value;
                    let consentText = peConsent === 'yes' ? 'and consent was obtained to get PE records.' : 'and consent was declined to get PE records.';
                    if (!peConsent) consentText = "Consent to obtain records was not addressed.";
                    pcpNarrative.push(`Client reports having a physical exam within the last year at ${peLocation}, ${consentText}`);
                } else if (hadPE === 'no') {
                    if (document.getElementById('noPeDiscussed').checked) {
                        pcpNarrative.push("Client has not had a physical exam in the last year. Writer and client discussed the importance of routine health maintenance and management of chronic conditions with a PCP. Client was provided with information of local PCP offices that are taking new clients, and the writer offered to provide support in making a referral.");
                    }
                }
            }

            const pcpConsent = getRadioValue('pcpConsentCompleted');
            if (pcpConsent === 'yes') {
                pcpNarrative.push("PCP consent was completed. Writer reviewed with client OASAS guidelines regarding obtaining a recent physical exam review and the information that client is consenting to.");
            } else if (pcpConsent === 'no') {
                const declineReason = getRadioValue('declineReason');
                let reasonText = "Client declined consent for Delphi to contact their PCP.";
                if (declineReason === 'confidential') {
                    reasonText += " The reason provided was that the client does not want their PCP to know about their substance abuse treatment.";
                } else if (declineReason === 'other') {
                    const otherReason = document.querySelector('[name="declineReasonOtherText"]').value || '[Reason not specified]';
                    reasonText += ` The reason provided was: ${otherReason}.`;
                }
                pcpNarrative.push(reasonText);
                if (document.getElementById('oasasReviewedNoConsent').checked) {
                    pcpNarrative.push("Writer reviewed with client OASAS guidelines regarding obtaining a recent physical exam review, clarifying that the request would only be for the last PE and current medication list. Client understands and does not consent to PCP contact.");
                }
            }
            
            // --- Communicable Diseases ---
            const stdHepTest = getRadioValue('stdHepTest');
            if (stdHepTest === 'yes') {
                const status = document.getElementById('stdHepStatus').value;
                if (status === 'known_negative') {
                    diseaseNarrative.push("Client reports recent STD/HEP testing and states they are known to be negative, with no concerns from themselves or their PCP. Writer and client reviewed the importance of STD/communicable disease testing and prevention resources available to the client at Delphi and in the community.");
                } else if (status === 'known_positive') {
                    const positiveSpecify = document.getElementById('stdHepPositiveSpecify').value || '[Condition Not Specified]';
                    diseaseNarrative.push(`Client reports recent STD/HEP testing and is known to be positive for: ${positiveSpecify}.`);
                }
            } else if (stdHepTest === 'no') {
                diseaseNarrative.push("Client reports no recent STD/HEP testing.");
            }

            const tbTest = getRadioValue('tbTest');
            if (tbTest === 'yes') {
                const tbResult = getRadioValue('tbResult');
                if (tbResult === 'negative') {
                    diseaseNarrative.push("Client reports having been tested for TB and had a negative PPD. Writer offered to connect the client to resources to support their education, risk reduction, counseling, and testing services, and an overview of the benefits was provided.");
                } else if (tbResult === 'positive') {
                    const details = document.getElementById('tbPositiveDetails').value || '[Details not provided]';
                    diseaseNarrative.push(`Client reports a positive TB test. Details: ${details}.`);
                }
            } else if (tbTest === 'no') {
                diseaseNarrative.push("Client reports that they have not been tested for TB or do not remember getting tested.");
                const tbRisk = getRadioValue('tbRiskFactors');
                const tbReferral = document.getElementById('tbReferralStatus').value;
                let referralText = tbReferral ? `Client ${tbReferral} the offer for support with a referral.` : '';
                if (tbRisk === 'yes') {
                    diseaseNarrative.push(`Client presents with risk factors indicating the need for TB testing. The medical director was notified by the writer. The client has been offered connection to resources for education, risk reduction, counseling, and testing services. An overview of benefits and a warm hand-off referral has been offered. ${referralText}`);
                } else if (tbRisk === 'no') {
                    diseaseNarrative.push(`Client does not have risk factors/symptoms that indicate a need for TB testing. The client has been offered connection to resources for education, risk reduction, counseling, and testing services. An overview of benefits and a warm hand-off referral has been offered. ${referralText}`);
                }
            }

            // --- Substance Use ---
            const tobaccoUse = getRadioValue('tobaccoUse');
            if (tobaccoUse === 'yes') {
                const tobaccoAmount = document.getElementById('tobaccoAmount').value;
                const vapeAmount = document.getElementById('vapeAmount').value;
                let useText = "Client reports using tobacco";
                if (tobaccoAmount) useText += ` (${tobaccoAmount})`;
                if (vapeAmount) useText += ` and nicotine vape products (${vapeAmount})`;
                useText += ".";
                substanceNarrative.push(useText);

                const cessationInterest = getRadioValue('cessationInterest');
                if (cessationInterest === 'yes') {
                    substanceNarrative.push("Client is interested in quitting smoking. Writer and client discussed the NY State QUITS hotline, and information was provided. Writer also discussed that medication providers at Delphi could prescribe medications for smoking cessation.");
                    const scheduled = getRadioValue('medProviderScheduled');
                    if (scheduled === 'yes') {
                        substanceNarrative.push("Client is scheduled with a medication provider at Delphi.");
                    } else if (scheduled === 'no') {
                        substanceNarrative.push("Client declined an appointment with a medication provider but is aware they can schedule one in the future.");
                    }
                } else if (cessationInterest === 'no') {
                    substanceNarrative.push("Client is not currently interested in quitting smoking. Writer and client discussed the NY State QUITS hotline, and information was provided. Writer discussed that medication providers would be able to prescribe medications for smoking cessation if the client becomes interested in the future.");
                }
            } else if (tobaccoUse === 'no') {
                substanceNarrative.push("Client denies tobacco use.");
            }

            const onMAT = getRadioValue('onMAT');
            if (onMAT === 'yes') {
                substanceNarrative.push("Client is currently taking medication to manage their substance use disorder.");
                const matProviderStatus = getRadioValue('matProviderStatus');
                if (matProviderStatus === 'happy') {
                    substanceNarrative.push("Client reports they are happy with their current provider.");
                } else if (matProviderStatus === 'switch') {
                    substanceNarrative.push("Client would like to switch their MAT provider to Delphi and has been scheduled with a medication provider.");
                }
            } else if (onMAT === 'no') {
                substanceNarrative.push("Medication Assisted Treatment (MAT) was introduced, and education was offered based on the client's history and current presentation. An overview of MATs benefits and risks was provided, and the client was offered a connection to medication management in the clinic.");
                const matInterest = getRadioValue('matInterest');
                if (matInterest === 'declined') {
                    substanceNarrative.push("Client declined MAT at this time and is aware they can discuss it with their therapist or nurse in the future if interested.");
                } else if (matInterest === 'accepted') {
                    substanceNarrative.push("Client would like to see a medication provider for MAT and has been scheduled.");
                }
            }

            const narcanOffered = getRadioValue('narcanOffered');
            if (narcanOffered === 'yes') {
                substanceNarrative.push("Client was provided Narcan training, overdose prevention education, and given a Narcan kit.");
            } else if (narcanOffered === 'no') {
                substanceNarrative.push("Client declined Narcan training and a Narcan kit. Client was given overdose prevention education and resources for Narcan if they would like to be trained in the future.");
            }
            
            const pcpText = pcpNarrative.join(' ');
            const diseaseText = diseaseNarrative.join(' ');
            const substanceText = substanceNarrative.join(' ');

            let narrativeParts = [];
            if (pcpText.trim() !== '') {
                narrativeParts.push('[PCP AND PHYSICAL EXAMS]\n' + pcpText);
            }
            if (diseaseText.trim() !== '') {
                narrativeParts.push('[COMMUNICABLE DISEASES]\n' + diseaseText);
            }
            if (substanceText.trim() !== '') {
                narrativeParts.push('[SUBSTANCE USE]\n' + substanceText);
            }

            finalNote = narrativeParts.join('\n\n');
        } else if (selectedNoteType === 'mdt') {
            let noteParts = [];
            const diagnosisElements = mdtDiagnosisContainer.querySelectorAll('select');
            const selectedOptions = Array.from(diagnosisElements).map(select => select.value).filter(val => val);
            const diagnosis = selectedOptions.length > 0 ? selectedOptions.join(',\n') : '[SPECIFY DIAGNOSIS]';
            noteParts.push(`Diagnosis:\n${diagnosis}`);

            noteParts.push(`Reason on High Risk:\n${mdtReasonHighRisk.value || '[Reason]'}`);
            noteParts.push(`Criteria to Come Off High Risk:\n${mdtCriteriaOffHighRisk.value || '[Criteria]'}`);
            noteParts.push(`Risk Factors:\n${mdtRiskFactors.value || '[Factors]'}`);
            noteParts.push(`Protective Factors:\n${mdtProtectiveFactors.value || '[Factors]'}`);
            noteParts.push(`Care Coordination Needs:\n${mdtCareCoordination.value || '[Needs]'}`);

            let stageOfChange = mdtStageOfChange.value;
            if (stageOfChange === 'Other') {
                stageOfChange = mdtStageOfChangeOther.value || '[Other Stage]';
            }
            noteParts.push(`Stage of Change / Motivation Level:\n${stageOfChange || '[Stage]'}`);

            noteParts.push(`Safety Plan Completed:\n${mdtSafetyPlanCompleted.value || '[Yes/No]'}`);
            noteParts.push(`Safety Plan Applicable to Current Presentation:\n${mdtSafetyPlanApplicable.value || '[Details]'}`);
            noteParts.push(`MAT Status:\n${mdtMatStatus.value || '[Status]'}`);
            noteParts.push(`Date Last Urine Toxicology Collected:\n${formatDateForOutput(mdtLastToxDate && mdtLastToxDate.value) || '[Date]'}`);
            noteParts.push(`Result of Toxicology Screen:\n${mdtToxResult.value || '[Result]'}`);
            noteParts.push(`Is Client Engaging?:\n${mdtClientEngaging.value || '[Engaging Status]'}`);
            noteParts.push(`Most Recent Appointment Date:\n${formatDateForOutput(mdtMostRecentAppt && mdtMostRecentAppt.value) || '[Date]'}`);
            noteParts.push(`Next Appointment Date:\n${formatDateForOutput(mdtNextAppt && mdtNextAppt.value) || '[Date]'}`);
            noteParts.push(`Progress on Most Recent MDT Recommendations:\n${mdtProgressRecommendations.value || '[Progress]'}`);
            noteParts.push(`Guiding Question(s) for Todays MDT Discussion:\n${mdtGuidingQuestions.value || '[Questions]'}`);

            finalNote = noteParts.join('\n\n');
        } else if (selectedNoteType === 'nurse-smoking-initial') {
            finalNote = buildSmokingNote({ prefix: 'nsi', phase: 'initial', role: 'nurse' });
        } else if (selectedNoteType === 'nurse-smoking-followup') {
            finalNote = buildSmokingNote({ prefix: 'nsf', phase: 'followup', role: 'nurse' });
        } else if (selectedNoteType === 'prescriber-smoking-initial') {
            finalNote = buildSmokingNote({ prefix: 'psi', phase: 'initial', role: 'prescriber' });
        } else if (selectedNoteType === 'prescriber-smoking-followup') {
            finalNote = buildSmokingNote({ prefix: 'psf', phase: 'followup', role: 'prescriber' });
    } else if (selectedNoteType === 'med-mgmt-follow-up') {
        let noteParts = [];
        noteParts.push(`Chief Complaint:\n${document.getElementById('mmfu-chief-complaint').value || '[Clients statement]'}`);

        const diagnoses = Array.from(document.querySelectorAll('#mmfu-diagnosis-container select'))
            .map(select => select.value.trim()).filter(val => val);
        noteParts.push(`Diagnosis:\n${diagnoses.length > 0 ? diagnoses.join('\n') : '[Diagnosis]'}`);

        let subjectiveParts = [];
        const presentingConcern = document.getElementById('mmfu-presenting-concern').value || '[presenting concern]';
        const medRegimen = document.getElementById('mmfu-med-regimen').value || '[medication regimen]';
        subjectiveParts.push(`Client presents for ${presentingConcern}. Current medication regimen (${medRegimen}) addresses the presenting concern.`);
        subjectiveParts.push(`Symptoms/Cravings: ${document.getElementById('mmfu-symptoms').value || '[Not documented]'}`);
        subjectiveParts.push(`Substance Use: ${document.getElementById('mmfu-substance-use').value || '[Not documented]'}`);
        subjectiveParts.push(`Medication Adherence: ${document.getElementById('mmfu-adherence').value || '[Not documented]'}`);
        subjectiveParts.push(`Side Effects/Complications: ${document.getElementById('mmfu-side-effects').value || '[Not documented]'}`);
        subjectiveParts.push(`Psychosocial/Environmental Changes: ${document.getElementById('mmfu-psychosocial').value || '[Not documented]'}`);
        
        const nicotineUse = document.getElementById('mmfu-nicotine-use').value;
        if (nicotineUse) {
            let nicotineSentence = `The patient ${nicotineUse === 'yes' ? 'reports' : 'denies'} using nicotine.`;
            if (nicotineUse === 'yes') {
                const nicotineInterest = document.getElementById('mmfu-nicotine-interest').value;
                if (nicotineInterest) {
                    nicotineSentence += ` Client ${nicotineInterest === 'yes' ? 'is' : 'is not'} interested in reduction or cessation of nicotine.`;
                }
                const nicotineDetails = document.getElementById('mmfu-nicotine-details').value;
                if (nicotineDetails) {
                    nicotineSentence += `\n\nNicotine History: ${nicotineDetails}`;
                }
            }
            subjectiveParts.push(nicotineSentence);
        }

        noteParts.push(`Subjective:\n${subjectiveParts.join('\n\n')}`);

        let objectiveParts = [];
        objectiveParts.push(`I-STOP/Prescription Monitoring:\n${document.getElementById('mmfu-istop').value || '[Not documented]'}`);
        objectiveParts.push(`UDS Results (Reviewed):\n${document.getElementById('mmfu-uds').value || '[Not documented]'}`);
        noteParts.push(`Objective:\n${objectiveParts.join('\n\n')}`);

        let assessmentParts = [];
        assessmentParts.push(`Interventions: ${document.getElementById('mmfu-interventions').value || '[Not documented]'}`);
        assessmentParts.push(`Medication Plan: ${document.getElementById('mmfu-med-plan').value || '[Not documented]'}`);
        assessmentParts.push(`Client's Response: ${document.getElementById('mmfu-client-response').value || '[Not documented]'}`);
        assessmentParts.push(`Suicidality: ${document.getElementById('mmfu-suicidality').value}`);
        noteParts.push(`Assessment:\n${assessmentParts.join('\n\n')}`);

        let planParts = [];
        if (document.getElementById('mmfu-plan-continue-meds').checked) planParts.push('Continue medications as prescribed.');
        if (document.getElementById('mmfu-plan-attend-appts').checked) planParts.push('Attend all medication management appointments.');
        const followupTime = document.getElementById('mmfu-plan-followup-time').value || '[timeframe]';
        planParts.push(`Follow up in ${followupTime} for medication management.`);
        const followupProvider = document.getElementById('mmfu-plan-followup-provider').value || '[provider]';
        planParts.push(`Follow up with ${followupProvider} as scheduled.`);
        if (document.getElementById('mmfu-plan-call-911').checked) planParts.push('Client agrees to call 911 and contact staff with any SI/HI or urgent mental health concerns.');
        noteParts.push(`Plan:\n${planParts.join('\n\n')}`);

        // Medication Changes
        const medChanges = [
            { name: 'Buprenorphine extended-release injection (Brixadi)', id: 'brixadi' },
            { name: 'Buprenorphine extended-release injection (Sublocade)', id: 'sublocade' },
            { name: 'Naltrexone extended-release injectable (Vivitrol)', id: 'vivitrol' },
            { name: 'Buprenorphine/naloxone sublingual (Suboxone)', id: 'suboxone' },
            { name: 'Buprenorphine/naloxone sublingual (generics)', id: 'generics' },
            { name: 'Buprenorphine/naloxone sublingual (Zubsolv)', id: 'zubsolv' },
            { name: 'Buprenorphine/naloxone sublingual (Bunavail)', id: 'bunavail' },
            { name: 'Buprenorphine monoproduct (Subutex)', id: 'subutex' },
            { name: 'Naltrexone oral (Revia)', id: 'revia' },
            { name: 'Acamprosate (Campral)', id: 'campral' },
            { name: 'Disulfiram (Antabuse)', id: 'antabuse' }
        ];
        let medChangesParts = [];
        medChanges.forEach(med => {
            const initiatedEl = document.getElementById(`mmfu-med-${med.id}-initiated`);
            const removedEl = document.getElementById(`mmfu-med-${med.id}-removed`);
            if (initiatedEl && initiatedEl.checked) {
                medChangesParts.push(`${med.name}: Initiated`);
            }
            if (removedEl && removedEl.checked) {
                medChangesParts.push(`${med.name}: Removed (stopped)`);
            }
        });
        if (medChangesParts.length > 0) {
            noteParts.push(`Medication Changes:\n${medChangesParts.join('\n')}`);
        }

        finalNote = noteParts.join('\n\n');
    } else if (selectedNoteType === 'opioid-use-disorder-short') {
            let noteParts = [];
            noteParts.push("New patient visit.");
            noteParts.push(`Chief Complaint: Opioid Use Disorder`); // Static Chief Complaint

            let suh = [];
            if (document.getElementById('ouds-age-first-use').value) suh.push(`Age at first use: ${document.getElementById('ouds-age-first-use').value}`);
            if (document.getElementById('ouds-types-substance').value) suh.push(`Type(s) of substance: ${document.getElementById('ouds-types-substance').value}`);
            if (document.getElementById('ouds-frequency').value) suh.push(`Frequency of use: ${document.getElementById('ouds-frequency').value}`);
            if (document.getElementById('ouds-prev-treatment').value) suh.push(`Previous treatment programs: ${document.getElementById('ouds-prev-treatment').value}`);
            if (document.getElementById('ouds-prev-recovery').value) suh.push(`Previous periods in recovery: ${document.getElementById('ouds-prev-recovery').value}`);
            const activeUse = document.querySelector('input[name="ouds-active-use"]:checked');
            if (activeUse) {
                suh.push(`Current active use: ${activeUse.value}`);
                if (activeUse.value === 'yes' && document.getElementById('ouds-last-use-date').value) {
                    suh.push(`Date of last use: ${document.getElementById('ouds-last-use-date').value}`);
                }
            }
            if (suh.length > 0) noteParts.push(`Substance Use History\n${suh.join('\n')}`);

            let pharm = [];
            const onPharm = document.querySelector('input[name="ouds-pharmacotherapy"]:checked');
            if (onPharm) {
                pharm.push(`Patient current on pharmacotherapy for SUD: ${onPharm.value}`);
                if (onPharm.value === 'yes') {
                    if (document.getElementById('ouds-symptoms').value) pharm.push(`Symptoms/cravings: ${document.getElementById('ouds-symptoms').value}`);
                    if (document.getElementById('ouds-substance-use').value) pharm.push(`Substance use: ${document.getElementById('ouds-substance-use').value}`);
                    if (document.getElementById('ouds-adherence').value) pharm.push(`Medication adherence: ${document.getElementById('ouds-adherence').value}`);
                    if (document.getElementById('ouds-side-effects').value) pharm.push(`Side effects/complications: ${document.getElementById('ouds-side-effects').value}`);
                }
            }
            if (pharm.length > 0) noteParts.push(`Pharmacotherapy\n${pharm.join('\n')}`);

            let otherSubs = [];
            oudsSubstances.filter(key => key !== 'other').forEach(key => {
                const cb = document.getElementById(`ouds-sub-${key}`);
                if (cb && cb.checked) {
                    let detail = `${document.querySelector(`label[for="ouds-sub-${key}"]`).textContent}`;
                    const amt = document.getElementById(`ouds-amt-${key}`).value;
                    const date = document.getElementById(`ouds-date-${key}`).value;
                    if (amt) detail += ` - Amount used: ${amt}`;
                    if (date) detail += ` - Last date of use: ${date}`;
                    otherSubs.push(detail);
                }
            });
            if (document.getElementById('ouds-sub-other')?.checked) {
                document.querySelectorAll('#ouds-other-details .ouds-other-row').forEach(row => {
                    const substance = row.querySelector('.ouds-other-substance')?.value.trim();
                    const amount = row.querySelector('.ouds-other-amount')?.value.trim();
                    const date = row.querySelector('.ouds-other-date')?.value;
                    if (!substance && !amount && !date) return;
                    let detail = substance || 'Other';
                    if (amount) detail += ` - Amount used: ${amount}`;
                    if (date) detail += ` - Last date of use: ${date}`;
                    otherSubs.push(detail);
                });
            }
            if (otherSubs.length > 0) noteParts.push(`Any other substance use?\n${otherSubs.join('\n')}`);

            let medHistory = [];
            ['ivdu', 'shared', 'hep-c', 'hiv'].forEach(id => {
                if (document.getElementById(`ouds-med-${id}`).checked) {
                    medHistory.push(`${document.querySelector(`label[for="ouds-med-${id}"]`).textContent}`);
                }
            });
            if (medHistory.length > 0) noteParts.push(`Medical History Related to Substance Use:\n${medHistory.join('\n')}`);

            if (document.getElementById('ouds-pmh').value) noteParts.push(`PMH: ${document.getElementById('ouds-pmh').value}`);
            if (document.getElementById('ouds-psych').value) noteParts.push(`Psych History: ${document.getElementById('ouds-psych').value}`);
            if (document.getElementById('ouds-medications').value) noteParts.push(`Medications: ${document.getElementById('ouds-medications').value}`);
            if (document.getElementById('ouds-allergies').value) noteParts.push(`Allergies: ${document.getElementById('ouds-allergies').value}`);
            if (document.getElementById('ouds-pcp').value) noteParts.push(`PCP: ${document.getElementById('ouds-pcp').value}`);
            if (document.getElementById('ouds-last-pcp-visit').value) noteParts.push(`Last Visit with PCP: ${document.getElementById('ouds-last-pcp-visit').value}`);

            let ros = [];
            const gi = document.querySelector('input[name="ouds-gi-const"]:checked');
            if (gi) ros.push(`- GI: Constipation: ${gi.value}`);
           const psych = document.getElementById('ouds-psych-ideation');
      if (psych && psych.value) ros.push(`- Psychiatric: Suicidal or Homicidal Ideation: ${psych.value}`);
      
      // Check for the safety planning checkbox separately
      const safetyCheckbox = document.getElementById('ouds-safety-planning-checkbox');
      if (safetyCheckbox && safetyCheckbox.checked) {
        ros.push(`Staff provided safety planning.`);
      }
            if (ros.length > 0) noteParts.push(`Pertinent Review of Systems:\n${ros.join('\n')}`);

            if (document.getElementById('ouds-family').value) noteParts.push(`Family History: ${document.getElementById('ouds-family').value}`);
            if (document.getElementById('ouds-social').value) noteParts.push(`Social: ${document.getElementById('ouds-social').value}`);
            if (document.getElementById('ouds-living').value) noteParts.push(`Current Living Situation: ${document.getElementById('ouds-living').value}`);
            if (document.getElementById('ouds-employment').value) noteParts.push(`Employment: ${document.getElementById('ouds-employment').value}`);
            if (document.getElementById('ouds-leisure').value) noteParts.push(`Leisure: ${document.getElementById('ouds-leisure').value}`);

            let objective = []; // Re-declare 'objective' specifically for this section
                        if (document.getElementById('ouds-mse').value) objective.push(`MSE:\n${document.getElementById('ouds-mse').value}`);
                        if (objective.length > 0) noteParts.push(`Objective:\n${objective.join('\n')}`);

                        if (document.getElementById('ouds-istop').value) noteParts.push(`I-STOP/Prescription Monitoring:\n${document.getElementById('ouds-istop').value}`);
            if (document.getElementById('ouds-uds').value) noteParts.push(`UDS Results (Reviewed):\n${document.getElementById('ouds-uds').value}`);

            let assessmentText = [];
            if (document.getElementById('ouds-assess-purpose').checked) assessmentText.push("Medication Purpose & Use:\nDiscussed that buprenorphine is a partial opioid agonist used to treat opioid use disorder by reducing cravings and withdrawal symptoms. Explained the induction process and the need to be in mild to moderate withdrawal before first dose to avoid precipitated withdrawal. Reviewed dosing schedule, route of administration (typically sublingual or buccal), and importance of adherence.");
            if (document.getElementById('ouds-assess-side-effects').checked) assessmentText.push("Potential Side Effects:\nReviewed common side effects (e.g., headache, constipation, nausea, sedation) and rare but serious risks (e.g., respiratory depression when combined with other sedatives, hepatic injury).");
            if (document.getElementById('ouds-assess-overdose').checked) assessmentText.push("Overdose Risk & Safety:\nAdvised that risk of overdose is lower than full opioid agonists but present if combined with other CNS depressants (benzodiazepines, alcohol). Provided prescription for Naloxone and instructed patient/family on its use.");
            if (document.getElementById('ouds-assess-dental').checked) assessmentText.push("Dental Health Considerations:\nEducated patient that use of buprenorphine, especially in sublingual/buccal forms, has been associated with dental problems (tooth decay, cavities, oral infections).\nRecommended:\no Rinsing mouth with water after each dose\no Waiting at least 1 hour after taking medication before brushing teeth (to avoid enamel damage)\no Maintaining regular dental hygiene and biannual dental visits\no Notifying dentist about buprenorphine use");
            if (document.getElementById('ouds-assess-followup').checked) assessmentText.push("Follow-up & Monitoring:\nExplained need for regular follow-up appointments to assess response, side effects, urine drug testing, and support services (counseling, behavioral therapy).");
            if (document.getElementById('ouds-assess-consent').checked) assessmentText.push("Informed Consent:\nPatient expressed understanding of risks and benefits, and agreed to start buprenorphine treatment.");
            if (document.getElementById('ouds-assess-therapeutic-contract').checked) assessmentText.push("Therapeutic Contract:\nPatient reviewed and signed the therapeutic contract, acknowledging understanding of program expectations, responsibilities, and the collaborative nature of treatment.");
            if (assessmentText.length > 0) noteParts.push(`Assessment:\nOpioid Use Disorder appropriate for pharmacotherapy\n\n${assessmentText.join('\n\n')}`);

            let plan = [];
            
            // General Plan
            let oudsGeneral = [];
            ['ouds-plan-gen-start', 'ouds-plan-gen-labs', 'ouds-plan-gen-support', 'ouds-plan-gen-naloxone', 'ouds-plan-gen-fup', 'ouds-plan-gen-dental', 'ouds-plan-gen-pcp', 'ouds-plan-gen-stopped'].forEach(id => {
                const checkbox = document.getElementById(id);
                if (checkbox && checkbox.checked) {
                    const label = document.querySelector(`label[for="${id}"]`);
                    if (label) oudsGeneral.push(label.textContent.trim());
                }
            });
            if (oudsGeneral.length > 0) plan.push(`General Plan\n${oudsGeneral.join('\n')}`);
            
            // Buprenorphine/Naloxone Sublingual Plan
            let oudsSub = [];
            ['ouds-plan-sub-start', 'ouds-plan-sub-labs', 'ouds-plan-sub-fup', 'ouds-plan-sub-dental', 'ouds-plan-sub-pcp', 'ouds-plan-sub-stopped'].forEach(id => {
                const checkbox = document.getElementById(id);
                if (checkbox && checkbox.checked) {
                    const label = document.querySelector(`label[for="${id}"]`);
                    if (label) oudsSub.push(label.textContent.trim());
                }
            });
            if (oudsSub.length > 0) plan.push(`Buprenorphine/Naloxone Sublingual Plan\n${oudsSub.join('\n')}`);
            
            // Buprenorphine Extended-Release Injection Plan
            let oudsEr = [];
            ['ouds-plan-er-start', 'ouds-plan-er-labs', 'ouds-plan-er-fup', 'ouds-plan-er-pcp', 'ouds-plan-er-stopped'].forEach(id => {
                const checkbox = document.getElementById(id);
                if (checkbox && checkbox.checked) {
                    const label = document.querySelector(`label[for="${id}"]`);
                    if (label) oudsEr.push(label.textContent.trim());
                }
            });
            if (oudsEr.length > 0) plan.push(`Buprenorphine Extended-Release Injection Plan (Sublocade, Brixadi)\n${oudsEr.join('\n')}`);
            
            // Buprenorphine Monoproduct Plan
            let oudsMono = [];
            ['ouds-plan-mono-start', 'ouds-plan-mono-labs', 'ouds-plan-mono-fup', 'ouds-plan-mono-dental', 'ouds-plan-mono-pcp', 'ouds-plan-mono-stopped'].forEach(id => {
                const checkbox = document.getElementById(id);
                if (checkbox && checkbox.checked) {
                    const label = document.querySelector(`label[for="${id}"]`);
                    if (label) oudsMono.push(label.textContent.trim());
                }
            });
            if (oudsMono.length > 0) plan.push(`Buprenorphine Monoproduct Plan (Subutex)\n${oudsMono.join('\n')}`);
            
            if (plan.length > 0) noteParts.push(`Plan:\n${plan.join('\n\n')}`);

            let time = [];
            if (document.getElementById('ouds-time-face').checked) time.push(`Face to face/telephonic time: ${document.getElementById('ouds-time-face-txt').value}`);
            if (document.getElementById('ouds-time-doc').checked) time.push(`Documentation: ${document.getElementById('ouds-time-doc-txt').value}`);
            if (document.getElementById('ouds-time-coord').checked) time.push(`Coordination of care: ${document.getElementById('ouds-time-coord-txt').value}`);
            if (document.getElementById('ouds-time-total').checked) time.push(`Total visit time: ${document.getElementById('ouds-time-total-txt').value}`);
            if (time.length > 0) noteParts.push(`Time Statement\nToday's visit time consisted of the following:\n${time.join('\n')}`);

            finalNote = noteParts.join('\n\n');
} else if (selectedNoteType === 'stimulant-use-disorder-short') {
    let noteParts = [];
    noteParts.push("New patient visit.");
    
    const sudsChiefComplaint = document.getElementById('suds-chief-complaint').value;
    const sudsChiefComplaintOther = document.getElementById('suds-chief-complaint-other').value;
    if (sudsChiefComplaint === 'Other' && sudsChiefComplaintOther) {
        noteParts.push(`Chief Complaint: ${sudsChiefComplaintOther}`);
    } else if (sudsChiefComplaint) {
        noteParts.push(`Chief Complaint: ${sudsChiefComplaint}`);
    }

    let sudsSuh = [];
    if (document.getElementById('suds-primary-stimulant').value) sudsSuh.push(`Primary stimulant used: ${document.getElementById('suds-primary-stimulant').value}`);
    if (document.getElementById('suds-route').value) sudsSuh.push(`Route of use: ${document.getElementById('suds-route').value}`);
    if (document.getElementById('suds-frequency-amount').value) sudsSuh.push(`Frequency and amount: ${document.getElementById('suds-frequency-amount').value}`);
    if (document.getElementById('suds-last-use').value) sudsSuh.push(`Last use: ${document.getElementById('suds-last-use').value}`);
    if (document.getElementById('suds-duration').value) sudsSuh.push(`Duration of use: ${document.getElementById('suds-duration').value}`);
    if (document.getElementById('suds-triggers').value) sudsSuh.push(`Triggers / patterns of use: ${document.getElementById('suds-triggers').value}`);
    if (document.getElementById('suds-prior-treatment').value) sudsSuh.push(`Prior periods of abstinence / treatment history: ${document.getElementById('suds-prior-treatment').value}`);
    if (sudsSuh.length > 0) noteParts.push(`Substance Use History\n${sudsSuh.join('\n')}`);

    let sudsCouse = [];
    const sudsCoUseCheckboxes = ['suds-couse-alcohol', 'suds-couse-amphet', 'suds-couse-benzodiazepines', 'suds-couse-cannabis', 'suds-couse-cocaine', 'suds-couse-hallucinogens', 'suds-couse-illicit-opioids', 'suds-couse-ivdu', 'suds-couse-kratom', 'suds-couse-mdma', 'suds-couse-nicotine', 'suds-couse-prescription-opioids'];
    sudsCoUseCheckboxes.forEach(id => {
        if (document.getElementById(id).checked) {
            let detail = document.querySelector(`label[for="${id}"]`).textContent;
            const key = id.replace('suds-couse-', '');
            const amount = document.getElementById(`suds-couse-amt-${key}`)?.value.trim();
            const date = document.getElementById(`suds-couse-date-${key}`)?.value;
            if (amount) detail += ` - Amount used: ${amount}`;
            if (date) detail += ` - Last date of use: ${date}`;
            sudsCouse.push(detail);
        }
    });
    if (document.getElementById('suds-couse-other')?.checked) {
        document.querySelectorAll('#suds-other-details .suds-other-row').forEach(row => {
            const substance = row.querySelector('.suds-other-substance')?.value.trim();
            const amount = row.querySelector('.suds-other-amount')?.value.trim();
            const date = row.querySelector('.suds-other-date')?.value;
            if (!substance && !amount && !date) return;
            let detail = substance || 'Other';
            if (amount) detail += ` - Amount used: ${amount}`;
            if (date) detail += ` - Last date of use: ${date}`;
            sudsCouse.push(detail);
        });
    }
    if (sudsCouse.length > 0) noteParts.push(`Any other substance use?\n${sudsCouse.join('\n')}`);

    const sudsCravings = document.querySelector('input[name="suds-cravings"]:checked');
    if (sudsCravings) noteParts.push(`Cravings: ${sudsCravings.value}`);

    let sudsWithdrawal = [];
    const sudsWithdrawalCheckboxes = ['suds-withdrawal-none', 'suds-withdrawal-fatigue', 'suds-withdrawal-depression', 'suds-withdrawal-hypersomnia', 'suds-withdrawal-appetite', 'suds-withdrawal-anhedonia'];
    sudsWithdrawalCheckboxes.forEach(id => {
        if (document.getElementById(id).checked) {
            sudsWithdrawal.push(document.querySelector(`label[for="${id}"]`).textContent);
        }
    });
    if (sudsWithdrawal.length > 0) noteParts.push(`Withdrawal Symptoms\n${sudsWithdrawal.join('\n')}`);

    const sudsMotivation = document.querySelector('input[name="suds-motivation"]:checked');
    if (sudsMotivation) noteParts.push(`Motivation for Change: ${sudsMotivation.value}`);

    if (document.getElementById('suds-psych-symptoms').value) noteParts.push(`Psychiatric Symptoms\n${document.getElementById('suds-psych-symptoms').value}`);

    let sudsPsychosocial = [];
    if (document.getElementById('suds-housing').value) sudsPsychosocial.push(`Housing: ${document.getElementById('suds-housing').value}`);
    if (document.getElementById('suds-support-network').value) sudsPsychosocial.push(`Support network: ${document.getElementById('suds-support-network').value}`);
    if (document.getElementById('suds-employment').value) sudsPsychosocial.push(`Employment: ${document.getElementById('suds-employment').value}`);
    if (document.getElementById('suds-legal').value) sudsPsychosocial.push(`Legal issues: ${document.getElementById('suds-legal').value}`);
    if (document.getElementById('suds-safety-concerns').value) sudsPsychosocial.push(`Safety concerns: ${document.getElementById('suds-safety-concerns').value}`);
    if (document.getElementById('suds-goals').value) sudsPsychosocial.push(`Patient goals for today: ${document.getElementById('suds-goals').value}`);
    if (sudsPsychosocial.length > 0) noteParts.push(`Psychosocial\n${sudsPsychosocial.join('\n')}`);

    let sudsObjective = [];
    if (document.getElementById('suds-appearance').value) sudsObjective.push(`General appearance: ${document.getElementById('suds-appearance').value}`);
    if (document.getElementById('suds-speech-behavior').value) sudsObjective.push(`Speech / behavior: ${document.getElementById('suds-speech-behavior').value}`);
    if (document.getElementById('suds-mood-affect').value) sudsObjective.push(`Mood / affect: ${document.getElementById('suds-mood-affect').value}`);
    if (document.getElementById('suds-thought-process').value) sudsObjective.push(`Thought process / content: ${document.getElementById('suds-thought-process').value}`);
    if (document.getElementById('suds-insight-judgment').value) sudsObjective.push(`Insight / judgment: ${document.getElementById('suds-insight-judgment').value}`);
    if (sudsObjective.length > 0) noteParts.push(`Objective\n${sudsObjective.join('\n')}`);

    let sudsVitals = [];
    if (document.getElementById('suds-vs-bp').value) sudsVitals.push(`BP: ${document.getElementById('suds-vs-bp').value}`);
    if (document.getElementById('suds-vs-hr').value) sudsVitals.push(`HR: ${document.getElementById('suds-vs-hr').value}`);
    if (document.getElementById('suds-vs-rr').value) sudsVitals.push(`RR: ${document.getElementById('suds-vs-rr').value}`);
    if (document.getElementById('suds-vs-temp').value) sudsVitals.push(`Temp: ${document.getElementById('suds-vs-temp').value}`);
    if (sudsVitals.length > 0) noteParts.push(`Vitals\n${sudsVitals.join('\n')}`);

    const sudsUdsResult = document.querySelector('input[name="suds-uds-result"]:checked');
    if (sudsUdsResult) {
        if (sudsUdsResult.value === 'Positive') {
            const sudsUdsPositive = document.getElementById('suds-uds-positive').value;
            noteParts.push(`UDS (Urine Drug Screen): Positive for ${sudsUdsPositive || '[substances]'}`);
        } else {
            noteParts.push(`UDS (Urine Drug Screen): Negative`);
        }
    }

    let sudsAssessment = [];
    const sudsSeverity = document.querySelector('input[name="suds-severity"]:checked');
    if (sudsSeverity) sudsAssessment.push(`Stimulant Use Disorder, ${sudsSeverity.value}`);
    if (document.getElementById('suds-other-diagnoses').value) sudsAssessment.push(`Other diagnoses: ${document.getElementById('suds-other-diagnoses').value}`);
    if (sudsAssessment.length > 0) noteParts.push(`Assessment\n${sudsAssessment.join('\n')}`);
    if (document.getElementById('suds-assessment-summary').value) noteParts.push(`Summary\n${document.getElementById('suds-assessment-summary').value}`);

    let sudsPlan = [];
    
    // General Plan
    let sudsGeneral = [];
    if (document.getElementById('suds-plan-gen-start').checked) sudsGeneral.push("Start medication as discussed");
    if (document.getElementById('suds-plan-gen-psychoed').checked) sudsGeneral.push("Provided psychoeducation on stimulant use disorder, risks (cardiac, psychiatric, neurologic), and relapse prevention strategies");
    if (document.getElementById('suds-plan-gen-harm-reduction').checked) sudsGeneral.push("Discussed harm reduction strategies (hydration, nutrition, sleep hygiene, avoiding polysubstance use)");
    if (document.getElementById('suds-plan-gen-behavioral').checked) sudsGeneral.push("Encouraged engagement in behavioral therapies (CBT, contingency management, group therapy)");
    if (document.getElementById('suds-plan-gen-screen-depression').checked) sudsGeneral.push("Screen / treat for depression, anxiety, ADHD, and trauma-related symptoms");
    if (document.getElementById('suds-plan-gen-smoking-cessation').checked) sudsGeneral.push("Smoking cessation counseling provided if appropriate");
    if (document.getElementById('suds-plan-gen-si-denies').checked) sudsGeneral.push("Denies suicidal ideation or homicidal ideation");
    if (document.getElementById('suds-plan-gen-crisis-resources').checked) sudsGeneral.push("Crisis resources reviewed (988, ER if worsening)");
    if (document.getElementById('suds-plan-gen-fup').checked) sudsGeneral.push("Schedule follow-up in 24 weeks to assess response, side effects, adherence");
    if (document.getElementById('suds-plan-gen-stopped').checked) sudsGeneral.push("Stopped");
    if (sudsGeneral.length > 0) sudsPlan.push(`General Plan\n${sudsGeneral.join('\n')}`);
    
    // Bupropion Plan
    let sudsBup = [];
    sudsBup.push("May reduce cravings and improve mood/energy");
    if (document.getElementById('suds-plan-bup-start').checked) sudsBup.push("Start bupropion as discussed");
    if (document.getElementById('suds-plan-bup-labs').checked) sudsBup.push("Obtain baseline labs (LFTs, EKG if indicated)");
    if (document.getElementById('suds-plan-bup-fup').checked) sudsBup.push("Schedule follow-up in 24 weeks");
    if (document.getElementById('suds-plan-bup-stopped').checked) sudsBup.push("Stopped");
    if (sudsBup.length > 0) sudsPlan.push(`Bupropion (Wellbutrin) Plan\n${sudsBup.join('\n')}`);
    
    // Naltrexone Plan
    let sudsNal = [];
    sudsNal.push("May reduce stimulant reward response; can be used in combination with bupropion");
    if (document.getElementById('suds-plan-nal-start').checked) sudsNal.push("Start naltrexone as discussed");
    if (document.getElementById('suds-plan-nal-labs').checked) sudsNal.push("Obtain baseline LFTs");
    if (document.getElementById('suds-plan-nal-fup').checked) sudsNal.push("Schedule follow-up in 24 weeks");
    if (document.getElementById('suds-plan-nal-stopped').checked) sudsNal.push("Stopped");
    if (sudsNal.length > 0) sudsPlan.push(`Naltrexone (Vivitrol/Oral) Plan\n${sudsNal.join('\n')}`);
    
    // Mirtazapine Plan
    let sudsMir = [];
    sudsMir.push("May assist with sleep, mood, and decrease methamphetamine use in some studies");
    if (document.getElementById('suds-plan-mir-start').checked) sudsMir.push("Start mirtazapine as discussed");
    if (document.getElementById('suds-plan-mir-labs').checked) sudsMir.push("Obtain baseline labs as indicated");
    if (document.getElementById('suds-plan-mir-fup').checked) sudsMir.push("Schedule follow-up in 24 weeks");
    if (document.getElementById('suds-plan-mir-stopped').checked) sudsMir.push("Stopped");
    if (sudsMir.length > 0) sudsPlan.push(`Mirtazapine Plan\n${sudsMir.join('\n')}`);
    
    // Topiramate/Modafinil Plan
    let sudsTopo = [];
    sudsTopo.push("Off-label options with limited but emerging evidence");
    if (document.getElementById('suds-plan-topo-start').checked) sudsTopo.push("Start topiramate or modafinil as discussed");
    if (document.getElementById('suds-plan-topo-labs').checked) sudsTopo.push("Obtain baseline labs as indicated");
    if (document.getElementById('suds-plan-topo-fup').checked) sudsTopo.push("Schedule follow-up in 24 weeks");
    if (document.getElementById('suds-plan-topo-stopped').checked) sudsTopo.push("Stopped");
    if (sudsTopo.length > 0) sudsPlan.push(`Topiramate / Modafinil Plan\n${sudsTopo.join('\n')}`);
    
    // Other/Combination Plan
    let sudsOther = [];
    const sudsOtherMed = document.getElementById('suds-plan-other-med').value;
    if (document.getElementById('suds-plan-other-start').checked && sudsOtherMed) sudsOther.push(`Start ${sudsOtherMed} as discussed`);
    const sudsOtherNotesText = document.getElementById('suds-plan-other-notes-text').value;
    if (document.getElementById('suds-plan-other-notes').checked && sudsOtherNotesText) sudsOther.push(`Medication notes: ${sudsOtherNotesText}`);
    if (document.getElementById('suds-plan-other-labs').checked) sudsOther.push("Obtain baseline labs as indicated");
    if (document.getElementById('suds-plan-other-fup').checked) sudsOther.push("Schedule follow-up in 24 weeks");
    if (document.getElementById('suds-plan-other-stopped').checked) sudsOther.push("Stopped");
    if (sudsOther.length > 0) sudsPlan.push(`Other / Combination Plan\n${sudsOther.join('\n')}`);

    if (sudsPlan.length > 0) noteParts.push(`Plan\n${sudsPlan.join('\n\n')}`);

    let sudsTime = [];
    if (document.getElementById('suds-time-face').checked) sudsTime.push(`Face to face/telephonic time: ${document.getElementById('suds-time-face-txt').value}`);
    if (document.getElementById('suds-time-doc').checked) sudsTime.push(`Documentation: ${document.getElementById('suds-time-doc-txt').value}`);
    if (document.getElementById('suds-time-coord').checked) sudsTime.push(`Coordination of care: ${document.getElementById('suds-time-coord-txt').value}`);
    if (document.getElementById('suds-time-total').checked) sudsTime.push(`Total visit time: ${document.getElementById('suds-time-total-txt').value}`);
    if (sudsTime.length > 0) noteParts.push(`Time Statement\nToday's visit time consisted of the following:\n${sudsTime.join('\n')}`);

    finalNote = noteParts.join('\n\n');
} else if (selectedNoteType === 'alcohol-use-disorder-short') {
    let noteParts = [];
    noteParts.push("New patient visit.");
    noteParts.push(`Chief Complaint: Alcohol Use Disorder`);

    let audsSuh = [];
    if (document.getElementById('auds-age-first-use').value) audsSuh.push(`Age at first use: ${document.getElementById('auds-age-first-use').value}`);
    if (document.getElementById('auds-types-alcohol').value) audsSuh.push(`Type(s) of Alcohol: ${document.getElementById('auds-types-alcohol').value}`);
    if (document.getElementById('auds-frequency').value) audsSuh.push(`Frequency of use: ${document.getElementById('auds-frequency').value}`);
    if (document.getElementById('auds-prev-treatment').value) audsSuh.push(`Previous treatment programs: ${document.getElementById('auds-prev-treatment').value}`);
    if (document.getElementById('auds-prev-recovery').value) audsSuh.push(`Previous periods in recovery: ${document.getElementById('auds-prev-recovery').value}`);
    if (document.getElementById('auds-withdrawal-exp').value) audsSuh.push(`Experience of withdrawal symptoms in past: ${document.getElementById('auds-withdrawal-exp').value}`);
    if (document.getElementById('auds-withdrawal-severity').value) audsSuh.push(`Severity of withdrawal: ${document.getElementById('auds-withdrawal-severity').value}`);

    const audsActiveDrinking = document.querySelector('input[name="auds-active-drinking"]:checked');
    if (audsActiveDrinking) {
        audsSuh.push(`Current active drinking: ${audsActiveDrinking.value}`);
        if (audsActiveDrinking.value === 'yes' && document.getElementById('auds-last-drink-date').value) {
            audsSuh.push(`Last drink: ${document.getElementById('auds-last-drink-date').value}`);
        }
    }
    if (audsSuh.length > 0) noteParts.push(`Alcohol Use History\n${audsSuh.join('\n')}`);

    let audsPharm = [];
    const audsOnPharm = document.querySelector('input[name="auds-pharmacotherapy"]:checked');
    if (audsOnPharm) {
        audsPharm.push(`Patient current on pharmacotherapy for AUD: ${audsOnPharm.value}`);
        if (audsOnPharm.value === 'yes') {
            if (document.getElementById('auds-symptoms').value) audsPharm.push(`Symptoms/Cravings: ${document.getElementById('auds-symptoms').value}`);
            if (document.getElementById('auds-substance-use').value) audsPharm.push(`Substance Use: ${document.getElementById('auds-substance-use').value}`);
            if (document.getElementById('auds-adherence').value) audsPharm.push(`Medication Adherence: ${document.getElementById('auds-adherence').value}`);
            if (document.getElementById('auds-side-effects').value) audsPharm.push(`Side Effects/Complications: ${document.getElementById('auds-side-effects').value}`);
        }
    }
    if (audsPharm.length > 0) noteParts.push(`Pharmacotherapy\n${audsPharm.join('\n')}`);

    let audsOtherSubs = [];
    // Define audsSubstances directly within this block to ensure proper scope
    const audsSubstances = [
        'illicit-opioids', 'prescription-opioids', 'kratom', 'ivdu', 'benzodiazepines',
        'cocaine', 'amphet', 'hallucinogens', 'mdma', 'nicotine'
    ];
    audsSubstances.forEach(key => {
        const cb = document.getElementById(`auds-sub-${key}`);
        if (cb && cb.checked) {
            let detail = `${document.querySelector(`label[for="auds-sub-${key}"]`).textContent}`;
            const amt = document.getElementById(`auds-amt-${key}`).value;
            const date = document.getElementById(`auds-date-${key}`).value;
            if (amt) detail += ` - Amount used: ${amt}`;
            if (date) detail += ` - Last date of use: ${date}`;
            audsOtherSubs.push(detail);
        }
    });
    if (document.getElementById('auds-sub-other')?.checked) {
        document.querySelectorAll('#auds-other-details .auds-other-row').forEach(row => {
            const substance = row.querySelector('.auds-other-substance')?.value.trim();
            const amount = row.querySelector('.auds-other-amount')?.value.trim();
            const date = row.querySelector('.auds-other-date')?.value;
            if (!substance && !amount && !date) return;
            let detail = substance || 'Other';
            if (amount) detail += ` - Amount used: ${amount}`;
            if (date) detail += ` - Last date of use: ${date}`;
            audsOtherSubs.push(detail);
        });
    }

    if (audsOtherSubs.length > 0) noteParts.push(`Any other substance use?\n${audsOtherSubs.join('\n')}`);

    let audsMedHistory = [];
    ['ivdu', 'shared', 'hep-c', 'hiv'].forEach(id => {
        if (document.getElementById(`auds-med-${id}`).checked) {
            audsMedHistory.push(`${document.querySelector(`label[for="auds-med-${id}"]`).textContent}`);
        }
    });
    if (audsMedHistory.length > 0) noteParts.push(`Medical History Related to Substance Use:\n${audsMedHistory.join('\n')}`);

    if (document.getElementById('auds-pmh').value) noteParts.push(`PMH: ${document.getElementById('auds-pmh').value}`);
    if (document.getElementById('auds-psych').value) noteParts.push(`Psych History: ${document.getElementById('auds-psych').value}`);
    if (document.getElementById('auds-medications').value) noteParts.push(`Medications: ${document.getElementById('auds-medications').value}`);
    if (document.getElementById('auds-allergies').value) noteParts.push(`Allergies: ${document.getElementById('auds-allergies').value}`);
    if (document.getElementById('auds-pcp').value) noteParts.push(`PCP: ${document.getElementById('auds-pcp').value}`);
    if (document.getElementById('auds-last-pcp-visit').value) noteParts.push(`Last Visit with PCP: ${document.getElementById('auds-last-pcp-visit').value}`);
    if (document.getElementById('auds-pcp-referral').checked) noteParts.push("Client requires assistance securing a PCP.");

    let audsRos = [];
    const audsGi = document.querySelector('input[name="auds-gi-const"]:checked');
    if (audsGi) audsRos.push(`- GI: Constipation: ${audsGi.value}`);
    const audsPsychIdeation = document.getElementById('auds-psych-ideation');
    if (audsPsychIdeation && audsPsychIdeation.value) audsRos.push(`- Psychiatric: Suicidal or Homicidal Ideation: ${audsPsychIdeation.value}`);
    const audsSafetyCheckbox = document.getElementById('auds-safety-planning-checkbox');
    if (audsSafetyCheckbox && audsSafetyCheckbox.checked) {
        audsRos.push(`Staff provided safety planning.`);
    }
    if (audsRos.length > 0) noteParts.push(`Pertinent Review of Systems:\n${audsRos.join('\n')}`);

    if (document.getElementById('auds-family').value) noteParts.push(`Family History: ${document.getElementById('auds-family').value}`);
    if (document.getElementById('auds-social').value) noteParts.push(`Social: ${document.getElementById('auds-social').value}`);
    if (document.getElementById('auds-living').value) noteParts.push(`Current Living Situation: ${document.getElementById('auds-living').value}`);
    if (document.getElementById('auds-employment').value) noteParts.push(`Employment: ${document.getElementById('auds-employment').value}`);
    if (document.getElementById('auds-leisure').value) noteParts.push(`Leisure: ${document.getElementById('auds-leisure').value}`);

    let audsObjective = [];
        if (document.getElementById('auds-mse').value) audsObjective.push(`MSE:\n${document.getElementById('auds-mse').value}`);
        if (audsObjective.length > 0) noteParts.push(`Objective:\n${audsObjective.join('\n')}`);

    if (document.getElementById('auds-istop').value) noteParts.push(`I-STOP/Prescription Monitoring:\n${document.getElementById('auds-istop').value}`);
    if (document.getElementById('auds-uds').value) noteParts.push(`UDS Results (Reviewed):\n${document.getElementById('auds-uds').value}`);

    let audsAssessmentText = [];
    // General Counseling Provided
    if (document.getElementById('auds-assess-purpose').checked) audsAssessmentText.push("Medication Purpose & Use:\nDiscussed that medications can support recovery from alcohol use disorder by reducing cravings, reducing pleasurable effects of alcohol, and helping maintain abstinence. Reviewed that medication works best combined with counseling/behavioral therapy.");
    // Naltrexone General
    if (document.getElementById('auds-assess-naltrexone').checked) audsAssessmentText.push("Naltrexone (oral or injectable):\nBlocks opioid receptors to reduce rewarding effects of alcohol and decrease cravings. May cause nausea, headache, dizziness, fatigue. Should not be used if patient is currently using opioids or has acute hepatitis/liver failure. Importance of checking baseline liver function tests and periodic monitoring.");
    // Acamprosate General
    if (document.getElementById('auds-assess-acamprosate').checked) audsAssessmentText.push("Acamprosate:\nHelps restore brain chemical balance and reduce post-acute withdrawal symptoms/cravings. Generally well tolerated; may cause diarrhea. Requires dosing three times daily. Safe for use in liver disease but contraindicated in severe renal impairment  baseline kidney function to be checked.");
    // Disulfiram General
    if (document.getElementById('auds-assess-disulfiram').checked) audsAssessmentText.push("Disulfiram:\nCauses unpleasant reaction (flushing, nausea, vomiting, tachycardia) if alcohol is consumed. Must be fully abstinent before starting. Discussed risk of hepatotoxicity; will monitor liver function. Warned about avoiding alcohol-containing products (mouthwash, cough syrups, sauces, etc.).");
    // Safety & Monitoring General
    if (document.getElementById('auds-assess-safety-monitoring').checked) audsAssessmentText.push("Safety & Monitoring:\nEmphasized the need for medication adherence. Reviewed possible drug interactions and need to inform all healthcare providers of medication use. Arranged for baseline liver/kidney labs as appropriate, with periodic monitoring.");
    // Behavioral Support General
    if (document.getElementById('auds-assess-behavioral').checked) audsAssessmentText.push("Behavioral Support:\nReinforced that medication is most effective when combined with counseling, therapy, or mutual support groups (e.g., Alcoholics Anonymous). Provided resources for behavioral support.");
    // Informed Consent General
    if (document.getElementById('auds-assess-consent').checked) {
        const chosenMed = document.getElementById('auds-chosen-med').value || '[chosen medication]';
        audsAssessmentText.push(`Informed Consent:\nPatient verbalized understanding of medication options, side effects, and the importance of ongoing support. Patient agreed to start ${chosenMed}.`);
    }

    // Naltrexone Detailed Counseling
    if (document.getElementById('auds-naltrexone-purpose').checked) audsAssessmentText.push("Naltrexone Purpose & Mechanism:\nExplained that naltrexone blocks opioid receptors to reduce the pleasurable effects of alcohol and help decrease cravings.");
    if (document.getElementById('auds-naltrexone-dosing').checked) audsAssessmentText.push("Naltrexone Dosing & Administration:\nReviewed once-daily oral form or monthly injectable (Vivitrol) option. Patient to start on oral formulation first to confirm tolerability before long-acting injectable, if indicated.");
    if (document.getElementById('auds-naltrexone-side-effects').checked) audsAssessmentText.push("Naltrexone Side Effects:\nDiscussed common side effects (nausea, headache, dizziness, fatigue) and rare but serious risks (hepatotoxicity, allergic reaction).");
    if (document.getElementById('auds-naltrexone-safety').checked) audsAssessmentText.push("Naltrexone Safety Considerations:\nMust be opioid-free for at least 710 days before starting to avoid precipitated withdrawal. Not to be used if patient has acute hepatitis or liver failure. Will obtain baseline liver function tests and monitor periodically. Carry medical alert card/bracelet noting naltrexone use.");
    if (document.getElementById('auds-naltrexone-support').checked) audsAssessmentText.push("Naltrexone Behavioral Support:\nEncouraged concurrent participation in counseling or mutual support groups (e.g., Alcoholics Anonymous) to enhance success.");
    if (document.getElementById('auds-naltrexone-consent').checked) audsAssessmentText.push("Naltrexone Informed Consent:\nPatient verbalized understanding of risks, benefits, and alternatives and agreed to start naltrexone.");

    // Acamprosate Detailed Counseling
    if (document.getElementById('auds-acamprosate-purpose').checked) audsAssessmentText.push("Acamprosate Purpose & Mechanism:\nExplained that acamprosate helps reduce post-acute withdrawal symptoms and cravings by restoring brain neurotransmitter balance disrupted by chronic alcohol use.");
    if (document.getElementById('auds-acamprosate-dosing').checked) audsAssessmentText.push("Acamprosate Dosing & Administration:\nTaken as 666 mg three times daily (may need dose adjustment for low body weight). Emphasized importance of adherence to TID dosing schedule.");
    if (document.getElementById('auds-acamprosate-side-effects').checked) audsAssessmentText.push("Acamprosate Side Effects:\nDiscussed common side effect of diarrhea and possible GI upset; usually mild and transient.");
    if (document.getElementById('auds-acamprosate-safety').checked) audsAssessmentText.push("Acamprosate Safety Considerations:\nSafe for patients with liver disease. Contraindicated in severe renal impairment (CrCl 30 mL/min); use caution in moderate renal impairment. Will obtain baseline renal function prior to initiation.");
    if (document.getElementById('auds-acamprosate-support').checked) audsAssessmentText.push("Acamprosate Behavioral Support:\nReinforced need for concurrent counseling or support group involvement to improve success rates.");
    if (document.getElementById('auds-acamprosate-consent').checked) audsAssessmentText.push("Acamprosate Informed Consent:\nPatient verbalized understanding of medication purpose, side effects, and agreed to start acamprosate.");

    // Disulfiram Detailed Counseling
    if (document.getElementById('auds-disulfiram-purpose').checked) audsAssessmentText.push("Disulfiram Purpose & Mechanism:\nExplained that disulfiram works as an alcohol deterrent by causing an unpleasant physical reaction if alcohol is consumed (flushing, nausea, vomiting, headache, palpitations).");
    if (document.getElementById('auds-disulfiram-dosing').checked) audsAssessmentText.push("Disulfiram Dosing & Administration:\nTaken once daily; must be started only after patient has been completely abstinent from alcohol for at least 1224 hours.");
    if (document.getElementById('auds-disulfiram-side-effects').checked) audsAssessmentText.push("Disulfiram Side Effects:\nReviewed potential side effects (drowsiness, fatigue, metallic taste) and rare but serious effects (hepatotoxicity, neuropathy, psychosis).");
    if (document.getElementById('auds-disulfiram-safety').checked) audsAssessmentText.push("Disulfiram Safety Considerations:\nAvoid all forms of alcohol (including hidden sources: mouthwash, cough syrups, sauces, topical products, colognes). Baseline liver function tests prior to starting; monitor periodically. Discussed that disulfiram reaction can occur up to 14 days after last dose.");
    if (document.getElementById('auds-disulfiram-support').checked) audsAssessmentText.push("Disulfiram Behavioral Support:\nEmphasized that disulfiram works best when combined with behavioral therapy or counseling.");
    if (document.getElementById('auds-disulfiram-consent').checked) audsAssessmentText.push("Disulfiram Informed Consent:\nPatient verbalized understanding of mechanism, risks, and need for strict alcohol abstinence, and agreed to start disulfiram.");

    if (audsAssessmentText.length > 0) noteParts.push(`Assessment:\nAlcohol Use Disorder appropriate for pharmacotherapy\n\n${audsAssessmentText.join('\n\n')}`);

    let audsPlan = [];
    
    // General Plan
    let audsGeneral = [];
    ['auds-plan-gen-start', 'auds-plan-gen-labs', 'auds-plan-gen-support', 'auds-plan-gen-fup', 'auds-plan-gen-pcp', 'auds-plan-gen-stopped'].forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox && checkbox.checked) {
            const label = document.querySelector(`label[for="${id}"]`);
            if (label) {
                if (id === 'auds-plan-gen-start') {
                    const input = label.querySelector('input[type="text"]');
                    const medName = (input && input.value) ? input.value : '[chosen medication]';
                    audsGeneral.push(`Start ${medName} as discussed`);
                } else {
                    audsGeneral.push(label.textContent.trim());
                }
            }
        }
    });
    if (audsGeneral.length > 0) audsPlan.push(`General Plan\n${audsGeneral.join('\n')}`);
    
    // Naltrexone Plan
    let audsNal = [];
    ['auds-plan-nal-start', 'auds-plan-nal-vivitrol', 'auds-plan-nal-labs', 'auds-plan-nal-fup', 'auds-plan-nal-pcp', 'auds-plan-nal-stopped'].forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox && checkbox.checked) {
            const label = document.querySelector(`label[for="${id}"]`);
            if (label) audsNal.push(label.textContent.trim());
        }
    });
    if (audsNal.length > 0) audsPlan.push(`Naltrexone Plan (Oral or Vivitrol)\n${audsNal.join('\n')}`);
    
    // Acamprosate Plan
    let audsAca = [];
    ['auds-plan-aca-start', 'auds-plan-aca-labs', 'auds-plan-aca-fup', 'auds-plan-aca-pcp', 'auds-plan-aca-stopped'].forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox && checkbox.checked) {
            const label = document.querySelector(`label[for="${id}"]`);
            if (label) audsAca.push(label.textContent.trim());
        }
    });
    if (audsAca.length > 0) audsPlan.push(`Acamprosate Plan\n${audsAca.join('\n')}`);
    
    // Disulfiram Plan
    let audsDis = [];
    ['auds-plan-dis-start', 'auds-plan-dis-labs', 'auds-plan-dis-fup', 'auds-plan-dis-pcp', 'auds-plan-dis-stopped'].forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox && checkbox.checked) {
            const label = document.querySelector(`label[for="${id}"]`);
            if (label) audsDis.push(label.textContent.trim());
        }
    });
    if (audsDis.length > 0) audsPlan.push(`Disulfiram Plan\n${audsDis.join('\n')}`);

    if (audsPlan.length > 0) noteParts.push(`Plan:\n${audsPlan.join('\n\n')}`);

    let audsTime = [];
    if (document.getElementById('auds-time-face').checked) audsTime.push(`Face to face/telephonic time: ${document.getElementById('auds-time-face-txt').value || '[time]'}`);
    if (document.getElementById('auds-time-doc').checked) audsTime.push(`Documentation: ${document.getElementById('auds-time-doc-txt').value || '[time]'}`);
    if (document.getElementById('auds-time-coord').checked) audsTime.push(`Coordination of care: ${document.getElementById('auds-time-coord-txt').value || '[time]'}`);
    if (document.getElementById('auds-time-total').checked) audsTime.push(`Total visit time: ${document.getElementById('auds-time-total-txt').value || '[time]'}`);
    if (audsTime.length > 0) noteParts.push(`Time Statement\nToday's visit time consisted of the following:\n${audsTime.join('\n')}`);

    finalNote = noteParts.join('\n\n');
}   
    else if (selectedNoteType === 'nurse-follow-up') {
            let noteParts = [];
            const diag = document.getElementById('nurse-diag').value;
            const goal = document.getElementById('nurse-goal').value;
            const reason = document.getElementById('nurse-reason').value;
            const services = document.getElementById('nurse-services').value;
            const response = document.getElementById('nurse-response').value;
            const plan = document.getElementById('nurse-plan').value;

            if (diag) noteParts.push(`Diagnosis:\n${diag}`);
            if (goal) noteParts.push(`Goal:\n${goal}`);
            if (reason) noteParts.push(`Reason for visit:\n${reason}`);
            if (services) noteParts.push(`Services provided & Client observations:\n${services}`);

let interventions = [];
            // Find all textareas within the container, excluding hidden ones
            document.querySelectorAll('#nurse-interventions-container textarea:not(.hidden)').forEach(textarea => {
                if (textarea.value.trim() !== '') {
                    interventions.push(`- ${textarea.value.trim()}`);
                }
            });
            if (interventions.length > 0) {
                noteParts.push(`Interventions:\n${interventions.join('\n')}`);
            }

            if (response) noteParts.push(`Client's response:\n${response}`);
            
            // Build Plan/Next Steps from checked items and manual text
            let planItems = [];
            for (let i = 1; i <= 4; i++) {
                const checkbox = document.getElementById(`nurse-plan-checkbox-${i}`);
                if (checkbox && checkbox.checked) {
                    let text = checkbox.getAttribute('data-text');
                    if (i === 3 || i === 4) {
                        const customInput = document.getElementById(`nurse-plan-custom-${i}`);
                        if (customInput && customInput.value.trim()) {
                            text += customInput.value.trim();
                            // For date input (checkbox 4), format the date nicely
                            if (i === 4) {
                                const dateObj = new Date(customInput.value + 'T00:00:00');
                                if (!isNaN(dateObj.getTime())) {
                                    text = text.replace(customInput.value, dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
                                }
                            }
                            text += '.';
                        }
                    }
                    planItems.push(text);
                }
            }
            
            // Combine checked items with manual textarea content
            let fullPlanText = planItems.join('\n');
            if (plan) {
                if (fullPlanText) fullPlanText += '\n' + plan;
                else fullPlanText = plan;
            }
            
            if (fullPlanText) noteParts.push(`Plan/Next Steps:\n${fullPlanText}`);

            finalNote = noteParts.join('\n\n');
            } else if (selectedNoteType === 'op-alcohol-detox') {
            // OP Alcohol Detox note generation with CIWA-Ar interpretation
            let noteParts = [];
            
            // Chief Complaint
            const opChief = document.getElementById('op-chief')?.value;
            if (opChief) noteParts.push(`Chief Complaint:\n${opChief}`);
            
            // HPI
            let hpiParts = [];
            const opHpiOnset = document.getElementById('op-hpi-onset')?.value;
            if (opHpiOnset) hpiParts.push(`Onset of use: ${opHpiOnset}`);
            const opHpiQty = document.getElementById('op-hpi-qty')?.value;
            if (opHpiQty) hpiParts.push(`Quantity/frequency: ${opHpiQty}`);
            const opHpiType = document.getElementById('op-hpi-type')?.value;
            if (opHpiType) hpiParts.push(`Type(s) of alcohol: ${opHpiType}`);
            const opHpiLastDrink = document.getElementById('op-hpi-last-drink')?.value;
            if (opHpiLastDrink) hpiParts.push(`Last drink: ${opHpiLastDrink}`);
            const opHpiPrevWithdrawal = document.getElementById('op-hpi-prev-withdrawal')?.value;
            if (opHpiPrevWithdrawal) hpiParts.push(`Prior withdrawal experiences: ${opHpiPrevWithdrawal}`);
            const opHpiPriorDetox = document.getElementById('op-hpi-prior-detox')?.value;
            if (opHpiPriorDetox) hpiParts.push(`Prior detoxifications: ${opHpiPriorDetox}`);
            const opHpiDurationSobriety = document.getElementById('op-hpi-duration-sobriety')?.value;
            if (opHpiDurationSobriety) hpiParts.push(`Longest period of sobriety: ${opHpiDurationSobriety}`);
            const opHpiTriggers = document.getElementById('op-hpi-triggers')?.value;
            if (opHpiTriggers) hpiParts.push(`Identified triggers: ${opHpiTriggers}`);
            
            if (hpiParts.length > 0) noteParts.push(`History of Present Illness:\n${hpiParts.join('\n')}`);
            
            // Withdrawal Symptoms Assessment
            let withdrawalSymptoms = [];
            const wsMap = {
                'op-w-tremor': 'Tremor',
                'op-w-anxiety': 'Anxiety',
                'op-w-nausea': 'Nausea/vomiting',
                'op-w-sweating': 'Diaphoresis/sweating',
                'op-w-insomnia': 'Insomnia',
                'op-w-hallucinations': 'Hallucinations',
                'op-w-seizures': 'Seizures',
                'op-w-headache': 'Headache',
                'op-w-palpitations': 'Palpitations',
                'op-w-other': 'Other symptoms'
            };
            for (const [id, label] of Object.entries(wsMap)) {
                if (document.getElementById(id)?.checked) {
                    withdrawalSymptoms.push(label);
                }
            }
            if (withdrawalSymptoms.length > 0) noteParts.push(`Withdrawal Symptoms Present:\n${withdrawalSymptoms.join(', ')}`);
            
            const opAssociated = document.getElementById('op-associated')?.value;
            if (opAssociated) noteParts.push(`Associated symptoms/comorbidities:\n${opAssociated}`);
            
            // Social/Support History
            const opSupport = document.getElementById('op-support')?.value;
            if (opSupport) noteParts.push(`Support system/family involvement:\n${opSupport}`);
            
            const opSocial = document.getElementById('op-social')?.value;
            if (opSocial) noteParts.push(`Social history:\n${opSocial}`);
            
            const opMotivation = document.getElementById('op-motivation')?.value;
            if (opMotivation) noteParts.push(`Readiness for treatment/motivation:\n${opMotivation}`);
            
            // PMH and Family History
            const opPmh = document.getElementById('op-pmh')?.value;
            if (opPmh) noteParts.push(`Past Medical History:\n${opPmh}`);
            
            const opFamily = document.getElementById('op-family')?.value;
            if (opFamily) noteParts.push(`Family History:\n${opFamily}`);
            
            // ROS
            let rosParts = [];
            const rosItems = [
                { id: 'op-ros-gi', label: 'GI' },
                { id: 'op-ros-cardiovascular', label: 'Cardiovascular' },
                { id: 'op-ros-neuro', label: 'Neurological' },
                { id: 'op-ros-psych', label: 'Psychiatric' },
                { id: 'op-ros-other', label: 'Other' }
            ];
            rosItems.forEach(item => {
                const val = document.getElementById(item.id)?.value;
                if (val) rosParts.push(`${item.label}: ${val}`);
            });
            if (rosParts.length > 0) noteParts.push(`Review of Systems:\n${rosParts.join('\n')}`);
            
            // Objective: Vitals & Physical Exam
            let objectiveParts = [];
            const vitalsItems = [
                { id: 'op-vs-bp', label: 'BP' },
                { id: 'op-vs-hr', label: 'HR' },
                { id: 'op-vs-rr', label: 'RR' },
                { id: 'op-vs-temp', label: 'Temp' },
                { id: 'op-vs-o2', label: 'O2 sat' }
            ];
            let vitalsParts = [];
            vitalsItems.forEach(item => {
                const val = document.getElementById(item.id)?.value;
                if (val) vitalsParts.push(`${item.label}: ${val}`);
            });
            if (vitalsParts.length > 0) objectiveParts.push(`Vitals:\n${vitalsParts.join(', ')}`);
            
            const peItems = [
                { id: 'op-pe-general', label: 'General' },
                { id: 'op-pe-neuro', label: 'Neuro exam' },
                { id: 'op-pe-cardiac', label: 'Cardiac' },
                { id: 'op-pe-lungs', label: 'Lungs' },
                { id: 'op-pe-abdomen', label: 'Abdomen' },
                { id: 'op-pe-extremities', label: 'Extremities' }
            ];
            let peParts = [];
            peItems.forEach(item => {
                const val = document.getElementById(item.id)?.value;
                if (val) peParts.push(`${item.label}: ${val}`);
            });
            if (peParts.length > 0) objectiveParts.push(`Physical Exam:\n${peParts.join('\n')}`);
            
            // CIWA-Ar Score with Interpretation
            const ciwaScore = document.getElementById('op-ciwa-score')?.value;
            if (ciwaScore) {
                let ciwaInterpretation = '';
                const score = parseInt(ciwaScore);
                if (score <= 9) {
                    ciwaInterpretation = 'minimal/mild withdrawal risk; monitor for symptom progression';
                } else if (score <= 19) {
                    ciwaInterpretation = 'moderate withdrawal risk; pharmacological support recommended (benzodiazepine-based detoxification)';
                } else {
                    ciwaInterpretation = 'severe withdrawal risk; strongly recommend inpatient detoxification and intensive pharmacological management';
                }
                objectiveParts.push(`CIWA-Ar Assessment: Score ${ciwaScore}  ${ciwaInterpretation}`);
            }
            
            if (objectiveParts.length > 0) noteParts.push(`Objective:\n${objectiveParts.join('\n\n')}`);
            
            // Labs
            let labsParts = [];
            const labItems = [
                { id: 'op-lab-cbc', label: 'CBC' },
                { id: 'op-lab-cmp', label: 'CMP' },
                { id: 'op-lab-lfts', label: 'LFTs' },
                { id: 'op-lab-mag', label: 'Magnesium' },
                { id: 'op-lab-phos', label: 'Phosphate' },
                { id: 'op-lab-uds', label: 'Urine drug screen' },
                { id: 'op-lab-ethanol', label: 'Serum ethanol' },
                { id: 'op-lab-preg', label: 'Pregnancy test' }
            ];
            labItems.forEach(item => {
                const checkbox = document.getElementById(item.id);
                if (checkbox?.checked) {
                    const notes = document.getElementById(`${item.id}-txt`)?.value;
                    let labText = item.label;
                    if (notes) labText += `: ${notes}`;
                    labsParts.push(labText);
                }
            });
            if (labsParts.length > 0) noteParts.push(`Diagnostic Testing:\n${labsParts.join('\n')}`);
            
            // Assessment
            let assessmentParts = [];
            const primaryDx = document.getElementById('op-primary-dx')?.value;
            if (primaryDx) assessmentParts.push(`Primary Diagnosis: ${primaryDx}`);
            
            const secondaryDx = document.getElementById('op-secondary-dx')?.value;
            if (secondaryDx) assessmentParts.push(`Secondary Diagnoses: ${secondaryDx}`);
            
            const withdrawalRisk = document.getElementById('op-withdrawal-risk')?.value;
            if (withdrawalRisk) assessmentParts.push(`Withdrawal Risk: ${withdrawalRisk}`);
            
            const seizureRisk = document.getElementById('op-seizure-risk')?.value;
            if (seizureRisk) assessmentParts.push(`Seizure/DT Risk: ${seizureRisk}`);
            
            const supportAdequate = document.querySelector('input[name="op-support-adequate"]:checked');
            if (supportAdequate) assessmentParts.push(`Social support adequate for outpatient management: ${supportAdequate.value}`);
            
            const safetyConcerns = document.querySelector('input[name="op-safety-concerns"]:checked');
            if (safetyConcerns) assessmentParts.push(`Safety concerns (SI/HI, medical instability): ${safetyConcerns.value}`);
            
            const safetyDetails = document.getElementById('op-safety-details')?.value;
            if (safetyDetails) assessmentParts.push(`Safety Plan Details:\n${safetyDetails}`);
            
            if (assessmentParts.length > 0) noteParts.push(`Assessment:\n${assessmentParts.join('\n')}`);
            
            // Plan: Detoxification Regimen with Dosing Option
            let planParts = [];
            
            // Check for low-risk medication selection
            const lowRiskSelected = document.querySelector('input[name="op-dosing-low-risk"]:checked');
            const highRiskSelected = document.querySelector('input[name="op-dosing-high-risk"]:checked');
            
            if (lowRiskSelected) {
                const med = lowRiskSelected.value;
                let medLabel = '';
                if (med === 'gabapentin') medLabel = 'Gabapentin 300 mg';
                else if (med === 'diazepam') medLabel = 'Diazepam 5 mg';
                else if (med === 'chlordiazepoxide') medLabel = 'Chlordiazepoxide 25 mg';
                
                planParts.push(`Dosing - Fixed Schedule Benzodiazepine/Gabapentin Regimen\n\nMedication: ${medLabel}\n\nSchedule:\n Day 1: 1 tab QID (4 doses/day)\n Day 2: 1 tab TID (3 doses/day)\n Day 3: 1 tab BID (2 doses/day)\n Day 4: 1 tab once daily\n\nPRN: Prescribe 5 additional tablets for breakthrough withdrawal symptoms.\n\nTotal dispensed: 15 tablets (10 scheduled + 5 PRN).`);
            }
            
            if (highRiskSelected) {
                const med = highRiskSelected.value;
                let medLabel = '';
                if (med === 'diazepam') medLabel = 'Diazepam 10 mg';
                else if (med === 'chlordiazepoxide') medLabel = 'Chlordiazepoxide 50 mg';
                
                planParts.push(`Dosing - Fixed Schedule Benzodiazepine Regimen (Moderate-High Risk)\n\nMedication: ${medLabel}\n\nSchedule:\n Day 1: 1 tab QID (4 doses/day)\n Day 2: 1 tab TID (3 doses/day)\n Day 3: 1 tab BID (2 doses/day)\n Day 4: 1 tab once daily\n\nPRN: Prescribe 5 additional tablets for breakthrough symptoms.\n\nTotal dispensed: 15 tablets (10 scheduled + 5 PRN).`);
            }
            
            // Include dosing option dropdown if selected (legacy)
            const dosingOption = document.getElementById('op-dosing-option')?.value;
            if (dosingOption && !lowRiskSelected && !highRiskSelected) {
                planParts.push(`Benzodiazepine Detoxification Strategy:\n${dosingOption}`);
            }
            const dosingOther = document.getElementById('op-dosing-other')?.value;
            if (dosingOther && document.getElementById('op-dosing-option')?.value === 'Other (specify in plan notes)') {
                planParts.push(`Alternative Dosing Approach:\n${dosingOther}`);
            }
            
            // Outpatient vs inpatient decision
            if (document.getElementById('op-plan-outpatient')?.checked) planParts.push(' Outpatient detoxification appropriate');
            if (document.getElementById('op-plan-inpatient')?.checked) {
                const inpatientReason = document.getElementById('op-plan-inpatient-reason')?.value;
                let inpatientText = ' Consider inpatient referral';
                if (inpatientReason) inpatientText += ` (${inpatientReason})`;
                planParts.push(inpatientText);
            }
            if (document.getElementById('op-plan-decline-inpatient')?.checked) planParts.push(' Patient declines inpatient referral');
            
            // Supportive/adjunctive medications
            let supportParts = [];
            const supportMeds = [
                { id: 'op-med-thiamine', indication: 'Vitamin supplementation', med: 'Thiamine', doseId: 'op-med-thiamine-dose', notesId: 'op-med-thiamine-notes' },
                { id: 'op-med-folate', indication: 'Vitamin supplementation', med: 'Folic acid', doseId: 'op-med-folate-dose', notesId: 'op-med-folate-notes' },
                { id: 'op-med-multivit', indication: 'Vitamin supplementation', med: 'Multivitamin', doseId: 'op-med-multivit-dose', notesId: 'op-med-multivit-notes' },
                { id: 'op-med-clonidine', indication: 'Autonomic symptoms', med: 'Clonidine', doseId: 'op-med-clonidine-dose', notesId: 'op-med-clonidine-notes' },
                { id: 'op-med-hydroxyzine', indication: 'Anxiety/Insomnia', med: 'Hydroxyzine', doseId: 'op-med-hydroxyzine-dose', notesId: 'op-med-hydroxyzine-notes' },
                { id: 'op-med-gabapentin', indication: 'Adjunct', med: 'Gabapentin', doseId: 'op-med-gabapentin-dose', notesId: 'op-med-gabapentin-notes' },
                { id: 'op-med-trazodone', indication: 'Sleep', med: 'Trazodone', doseId: 'op-med-trazodone-dose', notesId: 'op-med-trazodone-notes' },
                { id: 'op-med-ondansetron', indication: 'Nausea', med: 'Ondansetron', doseId: 'op-med-ondansetron-dose', notesId: 'op-med-ondansetron-notes' }
            ];
            supportMeds.forEach(item => {
                if (document.getElementById(item.id)?.checked) {
                    const dose = document.getElementById(item.doseId)?.value || '';
                    
                    let medLine = item.indication + ': ' + item.med;
                    if (dose) medLine += ', ' + dose;
                    medLine += '.';
                    
                    supportParts.push(' ' + medLine);
                }
            });
            if (supportParts.length > 0) {
                planParts.push(`\nSupportive/Adjunctive Medications:\n${supportParts.join('\n')}`);
            }
            
            if (planParts.length > 0) noteParts.push(`Plan:\n${planParts.join('\n')}`);
            
            // Monitoring
            let monitoringParts = [];
            const monitoringItems = [
                { id: 'op-monitor-daily', label: 'Daily follow-up' },
                { id: 'op-monitor-ciwa', label: 'CIWA-Ar scoring at each contact' },
                { id: 'op-monitor-hold-benzo', label: 'Hold benzodiazepine if sedated or hypotensive' },
                { id: 'op-monitor-hydration', label: 'Encourage hydration, nutrition, and rest' },
                { id: 'op-monitor-safety-plan', label: 'Safety plan: call 911 or go to ED if seizures, confusion, hallucinations, or suicidality' }
            ];
            monitoringItems.forEach(item => {
                if (document.getElementById(item.id)?.checked) {
                    monitoringParts.push(` ${item.label}`);
                }
            });
            if (monitoringParts.length > 0) noteParts.push(`Monitoring:\n${monitoringParts.join('\n')}`);
            
            // Follow-up
            let followupParts = [];
            if (document.getElementById('op-followup-return')?.checked) {
                const days = document.getElementById('op-followup-days')?.value || 'as specified';
                followupParts.push(` Return in ${days} days or sooner if worsening`);
            }
            if (document.getElementById('op-followup-reviewlabs')?.checked) {
                followupParts.push(' Review labs and progress at next visit');
            }
            if (followupParts.length > 0) noteParts.push(`Follow-up:\n${followupParts.join('\n')}`);
            
            // Education
            let educationParts = [];
            const educationItems = [
                { id: 'op-edu-warning', label: 'Reviewed withdrawal warning signs' },
                { id: 'op-edu-avoid', label: 'Avoid alcohol and sedatives during taper' },
                { id: 'op-edu-avoid-driving', label: 'Avoid driving or operating machinery while sedated' },
                { id: 'op-edu-hydration', label: 'Reinforced hydration, nutrition, and support engagement' }
            ];
            educationItems.forEach(item => {
                if (document.getElementById(item.id)?.checked) {
                    educationParts.push(` ${item.label}`);
                }
            });
            if (educationParts.length > 0) noteParts.push(`Patient Education:\n${educationParts.join('\n')}`);
            
            finalNote = noteParts.join('\n\n');
            } else if (selectedNoteType === 'ciwa-ar-assessment') {
            // CIWA-Ar Assessment note generation - includes all questions and responses
            let noteParts = [];
            
            // Define CIWA-Ar questions with their labels
            const ciwaQuestions = [
                { id: 'ciwa-q-0', label: 'Nausea and Vomiting' },
                { id: 'ciwa-q-1', label: 'Tremor' },
                { id: 'ciwa-q-2', label: 'Paroxysmal Sweats' },
                { id: 'ciwa-q-3', label: 'Anxiety' },
                { id: 'ciwa-q-5', label: 'Headache, Fullness in Head' },
                { id: 'ciwa-q-6', label: 'Auditory Disturbances' },
                { id: 'ciwa-q-7', label: 'Visual Disturbances' },
                { id: 'ciwa-q-8', label: 'Tactile Disturbances' },
                { id: 'ciwa-q-4', label: 'Agitation' },
                { id: 'ciwa-q-9', label: 'Orientation and Clouding of Sensorium' }
            ];
            
            // Collect all responses
            let responsesParts = [];
            ciwaQuestions.forEach(q => {
                const select = document.getElementById(q.id);
                if (select && select.value) {
                    const selectedOption = select.options[select.selectedIndex];
                    responsesParts.push(`${q.label}: ${selectedOption.text}`);
                }
            });
            
            if (responsesParts.length > 0) {
                noteParts.push(`CIWA-Ar Responses:\n${responsesParts.join('\n')}`);
            }
            
            // Get the calculated score
            const ciwaScore = document.getElementById('ciwa-embedded-score')?.textContent || '';
            
            if (ciwaScore && ciwaScore !== '0') {
                let interpretation = '';
                const scoreNum = parseInt(ciwaScore, 10);
                if (scoreNum <= 9) {
                    interpretation = 'Minimal/mild withdrawal risk; monitor for symptom progression';
                } else if (scoreNum <= 19) {
                    interpretation = 'Moderate withdrawal risk; pharmacological support recommended (benzodiazepine-based detoxification)';
                } else {
                    interpretation = 'Severe withdrawal risk; strongly recommend inpatient detoxification and intensive pharmacological management';
                }
                noteParts.push(`CIWA-Ar Total Score: ${ciwaScore}\n\nInterpretation: ${interpretation}`);
            }
            
            finalNote = noteParts.join('\n\n');
            } else if (selectedNoteType === 'time-off-coverage') {
            // Time Off Coverage - Grid format (not a generated note)
            // Build the table content for copying
            let gridContent = 'TASK:\tSTATUS/ASSIGNMENT:\n';
            gridContent += 'Away message (voicemail, email)\t' + (document.getElementById('toc-away-message').value || '') + '\n';
            gridContent += 'Group Coverage\t' + (document.getElementById('toc-group-coverage').value || '') + '\n';
            gridContent += 'Client coverage\t' + (document.getElementById('toc-client-coverage').value || '') + '\n';
            gridContent += 'MDT notes prepared\t' + (document.getElementById('toc-mdt-notes').value || '') + '\n';
            gridContent += 'Front Desk notified\t' + (document.getElementById('toc-front-desk').value || '') + '\n';
            gridContent += 'RAS appointment changed in RAS portal\t' + (document.getElementById('toc-ras-portal').value || '') + '\n';
            gridContent += 'Timecard completed (including PTO requests)  double check before leave.\t' + (document.getElementById('toc-timecard').value || '') + '\n';
            gridContent += 'Ten11 accurate (no booked client appointments)\t' + (document.getElementById('toc-ten11').value || '');
            
            finalNote = gridContent;
            } else if (selectedNoteType === 'drug-treatment-court-report') {
            // Drug Treatment Court Report note generation
            let progressText = '';
            let courtText = '';

                const dtcCccServiceBy = (document.getElementById('dtc-ccc-service-by')?.value || '').trim();
                const dtcCccCoordinationWith = (document.getElementById('dtc-ccc-coordination-with')?.value || '').trim();

            const lastCourtDate = formatDate(document.getElementById('dtc-initialCourtDate').value);
            if (lastCourtDate) {
                progressText += `Since last court date ${lastCourtDate}, writer provided treatment report via Unified Court System portal UCMS to coordinate care with Drug Treatment Court per request of Michelle Devine.\n\n`;
            }
            progressText += "To complete this client's DTC report, writer previously spoke one on one with client and summarized client's treatment schedule and attendance.\n\n";
            progressText += "In addition, writer checks client's UDS results in both eCR and the New York State Unified Court System portal UCMS.\n\n";

            const courtPrepDate = formatDate(document.getElementById('dtc-courtPrepDate').value);
            if (courtPrepDate) {
                progressText += `Writer also prepared for court and ways to support and advocate for client in the court room on ${courtPrepDate}. Writer prepared a report for treatment court, which included an update on client's presentation in services inclusive of client's individual session attendance, group session attendance, weekly check-ins as required by court, random toxicology screens as required by court, and toxicology screens (and results) provided by client to Delphi Rise. \n\n`;
            }

            const careCoordination = document.getElementById('dtc-careCoordination').value;
            if (careCoordination) {
                progressText += `Writer also coordinated care with ${careCoordination}.\n\n`;
            }
            if (dtcCccServiceBy) {
                progressText += `Drug Treatment Court reporting completed by ${dtcCccServiceBy}.\n\n`;
            }
            if (dtcCccCoordinationWith) {
                progressText += `Coordinated with: ${dtcCccCoordinationWith}.\n\n`;
            }
            progressText += "SEE Criminal Drug Treatment Court Appearance Report completed and scanned into client's chart.\n\n";
            progressText += "This support helps the client meet court-mandated requirements and advance treatment goals by providing consistent guidance, accountability, and coordination of care while addressing barriers to court compliance such as transportation, scheduling, and understanding mandated expectations.";

            // --- Court Note Generation ---
            if (lastCourtDate) {
                courtText += `Since last court date ${lastCourtDate}:\n\n`;
            }

            const clientName = document.getElementById('dtc-clientName').value;
            const hasNotHas = document.getElementById('dtc-hasNotHas').value;
            if (hasNotHas) {
                courtText += `${clientName || 'Client'} ${hasNotHas} kept all appointments as scheduled.\n`;
            }

            const checkingIn = document.getElementById('dtc-checkingIn').value;
            if (checkingIn === 'Yes') {
                courtText += `Checking in with case manager per requirements: Yes\n\n`;
            } else if (checkingIn === 'No') {
                courtText += `NOT checking in with case manager per requirements.\n\n`;
            }

            const lud = formatDate(document.getElementById('dtc-lud').value);
            if (lud) {
                courtText += `LUD: ${lud}`;
                const ludExtra = document.getElementById('dtc-ludExtra');
                if (ludExtra && ludExtra.style.display !== 'none') {
                    const ludResponse = document.getElementById('dtc-ludResponse').value;
                    const ludSubstance = document.getElementById('dtc-ludSubstance').value;
                    if (ludResponse) {
                        courtText += ` (${ludResponse}`;
                        if (ludSubstance) courtText += `, ${ludSubstance}`;
                        courtText += `)`;
                    }
                }
                courtText += '\n\n';
            }

            const treatmentSchedule = document.getElementById('dtc-treatmentSchedule').value;
            if (treatmentSchedule) {
                courtText += `Treatment Schedule: ${treatmentSchedule}\n\n`;
            }

            // Attendance Details
            const individualAttended = document.getElementById('dtc-individualAttended').value;
            const individualTotal = document.getElementById('dtc-individualTotal').value;
            if (individualAttended && individualTotal) {
                courtText += `Attended ${individualAttended}/${individualTotal} individual sessions`;
                if (Number(individualAttended) < Number(individualTotal) && document.getElementById('dtc-individualMissed').value) {
                    courtText += ` (${document.getElementById('dtc-individualMissed').value})`;
                }
                courtText += '.\n';
            }

            const groupAttended = document.getElementById('dtc-groupAttended').value;
            const groupTotal = document.getElementById('dtc-groupTotal').value;
            if (groupAttended && groupTotal) {
                courtText += `Attended ${groupAttended}/${groupTotal} group sessions`;
                if (Number(groupAttended) < Number(groupTotal) && document.getElementById('dtc-groupMissed').value) {
                    courtText += ` (${document.getElementById('dtc-groupMissed').value})`;
                }
                courtText += '.\n';
            }

            const medAttended = document.getElementById('dtc-medAttended').value;
            const medTotal = document.getElementById('dtc-medTotal').value;
            if (medAttended && medTotal) {
                courtText += `Attended ${medAttended}/${medTotal} medication appointments`;
                if (Number(medAttended) < Number(medTotal) && document.getElementById('dtc-medMissed').value) {
                    courtText += ` (${document.getElementById('dtc-medMissed').value})`;
                }
                courtText += '.\n';
            }

            const nextDate = formatDate(document.getElementById('dtc-nextDate').value);
            const appointmentType = document.getElementById('dtc-appointmentType').value;
            if (nextDate && appointmentType) {
                courtText += `\nNext Appointment: ${nextDate} - ${appointmentType}\n\n`;
            } else {
                courtText += '\n';
            }

            // Toxicology Screens
            courtText += `Toxicology Screens at Treatment:\n`;
            if (document.getElementById('dtc-toxNotScreened').checked) {
                courtText += `N/A - not screened since last court date\n\n`;
            } else {
                const toxRows = document.querySelectorAll('#dtc-toxContainer .dtc-tox-row');
                const filledToxRows = Array.from(toxRows).filter(r => {
                    const dateVal = r.querySelector('input[type="date"]')?.value;
                    return dateVal && dateVal.trim() !== '';
                });
                
                if (filledToxRows.length === 0) {
                    courtText += 'No screens reported.\n\n';
                } else {
                    filledToxRows.forEach(row => {
                        const dateInput = row.querySelector('input[type="date"]');
                        const resultSelect = row.querySelector('select');
                        const substanceInput = row.querySelector('input[type="text"]');
                        
                        const toxDate = formatDate(dateInput?.value);
                        const toxResult = resultSelect?.value;
                        const toxSubstance = substanceInput?.value;
                        
                        if (toxDate) {
                            courtText += `${toxDate} - ${toxResult}`;
                            if (toxResult === 'positive' && toxSubstance) {
                                courtText += ` (${toxSubstance})`;
                            }
                            courtText += '\n';
                        }
                    });
                    courtText += '\n';
                }
            }

            // Random Screens
            courtText += `Random Screens:\n`;
            if (document.getElementById('dtc-randomNotScreened').checked) {
                courtText += `N/A - not screened since last court date\n\n`;
            } else {
                const randomRows = document.querySelectorAll('#dtc-randomContainer .dtc-random-row');
                const filledRandomRows = Array.from(randomRows).filter(r => {
                    const dateVal = r.querySelector('input[type="date"]')?.value;
                    return dateVal && dateVal.trim() !== '';
                });
                
                if (filledRandomRows.length === 0) {
                    courtText += 'No screens reported.\n\n';
                } else {
                    filledRandomRows.forEach(row => {
                        const dateInput = row.querySelector('input[type="date"]');
                        const resultSelect = row.querySelector('select');
                        const substanceInput = row.querySelector('input[type="text"]');
                        
                        const randomDate = formatDate(dateInput?.value);
                        const randomResult = resultSelect?.value;
                        const randomSubstance = substanceInput?.value;
                        
                        if (randomDate) {
                            courtText += `${randomDate} - ${randomResult}`;
                            if (randomResult === 'positive' && randomSubstance) {
                                courtText += ` (${randomSubstance})`;
                            }
                            courtText += '\n';
                        }
                    });
                    courtText += '\n';
                }
            }

            const matAttendance = document.getElementById('dtc-matAttendance').value;
            if (matAttendance) {
                courtText += `MAT: Client ${matAttendance} attending MAT appts as scheduled.\n\n`;
            }

            const probation = document.getElementById('dtc-probation').value;
            if (probation) {
                courtText += `Probation: ${probation}\n\n`;
            }

            const mentalHealth = document.getElementById('dtc-mentalHealth').value;
            if (mentalHealth) {
                courtText += `Mental Health: ${mentalHealth}\n\n`;
            }
            
            const additionalNotes = document.getElementById('dtc-additionalNotes').value;
            if (additionalNotes) {
                courtText += `Additional Notes: ${additionalNotes}\n`;
            }

            finalNote = `COMPLEX COORDINATION OF CARE NOTE:\n\n${progressText.trim()}\n\n---\n\nCOURT NOTE:\n\n${courtText.trim()}`;
            
            // For DTC, populate separate text areas
            const dtcProgressCopy = document.getElementById('dtc-progress-note-copy');
            const dtcCourtCopy = document.getElementById('dtc-court-note-copy');
            dtcProgressCopy.value = progressText.trim();
            dtcCourtCopy.value = courtText.trim();
            // Auto-resize the textareas to fit content
            autoResizeDtcTextareas(dtcProgressCopy, dtcCourtCopy);
            }
        
        // Toggle copy area visibility based on note type
        const singleCopyArea = document.getElementById('single-note-copy-area');
        const dtcDualCopyArea = document.getElementById('dtc-dual-copy-area');
        const tocCopyButton = document.getElementById('toc-copy-button');
        const copyAreaContainer = document.querySelector('.copy-area-container');
        const hideCopyAreaForDischargePlan = selectedNoteType === 'discharge-plan' || selectedNoteType === 'crisis-intervention';
        if (copyAreaContainer) {
            copyAreaContainer.style.display = hideCopyAreaForDischargePlan ? 'none' : 'block';
        }
        
        if (selectedNoteType === 'drug-treatment-court-report') {
            singleCopyArea.style.display = 'none';
            dtcDualCopyArea.style.display = 'block';
            if (tocCopyButton) tocCopyButton.style.display = 'none';
            // Validate required fields for DTC
            validateDtcRequiredFields();
        } else if (selectedNoteType === 'time-off-coverage') {
            singleCopyArea.style.display = 'none';
            dtcDualCopyArea.style.display = 'none';
            if (tocCopyButton) tocCopyButton.style.display = 'block';
        } else {
            singleCopyArea.style.display = 'block';
            dtcDualCopyArea.style.display = 'none';
            if (tocCopyButton) tocCopyButton.style.display = 'none';
            document.getElementById('dtc-validation-warning').style.display = 'none';
            if (selectedNoteType === 'crisis-intervention' && crisisGeneratedNote) {
                crisisGeneratedNote.value = finalNote.trim();
                autoResize(crisisGeneratedNote);
            } else {
                finalNoteCopy.value = finalNote.trim();
                autoResize(finalNoteCopy);
            }
        }
    }

    function toggleSafetyPlan(mainCheckbox, safetyPlanCheckbox) {
        safetyPlanCheckbox.disabled = !mainCheckbox.checked;
        if (!mainCheckbox.checked) {
            safetyPlanCheckbox.checked = false;
        }
    }

    function sortSelectOptions(selectElement) {
        const options = Array.from(selectElement.options);
        let placeholder = null;
        
        if (options.length > 0 && options[0].disabled) {
            placeholder = options.shift();
        }

        options.sort((a, b) => a.text.localeCompare(b.text));

        selectElement.innerHTML = '';

        if (placeholder) {
            selectElement.add(placeholder);
        }

        options.forEach(option => selectElement.add(option));
    }

    // Complex Coordination of Care listeners
    if (cccNonRoutineCheckbox) {
        cccNonRoutineCheckbox.addEventListener('change', () => { syncCccVisibility(); updateFinalNote(); });
    }
    [cccServiceByInput, cccCoordinationWithInput, cccCategorySelect, cccSupportNextSteps, cccNoteTextarea, cccVerifyNextSteps, cccVerifyGoals].forEach(el => {
        if (el) {
            el.addEventListener('input', updateFinalNote);
            el.addEventListener('change', updateFinalNote);
        }
    });
    if (cccSupportNextSteps) {
        cccSupportNextSteps.addEventListener('input', () => autoResize(cccSupportNextSteps));
    }
    if (cccNoteTextarea) {
        cccNoteTextarea.addEventListener('input', () => autoResize(cccNoteTextarea));
    }
    if (cccExampleToggle && cccExample) {
        cccExampleToggle.addEventListener('click', () => {
            const isHidden = cccExample.classList.contains('hidden');
            cccExample.classList.toggle('hidden', !isHidden);
            cccExampleToggle.textContent = isHidden ? 'Hide Narrative Example' : 'Narrative Example';
        });
    }


// EVENT LISTENERS
    initSmokingCessationListeners();
    noteTypeSelect.addEventListener('change', () => {
        const selection = noteTypeSelect.value;
        if (selection === 'eval-cd') {
            resetDiagnosisRows();
        } else if (selection === 'entry-cd') {
            resetGoalRows(clientGoalsContainer, treatmentGoalsContainer);
        } else if (selection === 'entry-so') {
            resetGoalRows(soClientGoalsContainer, soTreatmentGoalsContainer);
        } else if (selection === 'telehealth') {
            telehealthPractitionerLocation.value = "72 Hinchey Road, Rochester, NY";
        } else if (selection === 'mdt') {
            mdtDiagnosisContainer.innerHTML = '';
            addMdtDiagnosisRow();
        } else if (selection === 'med-mgmt-follow-up') {
            const container = document.getElementById('mmfu-diagnosis-container');
            container.innerHTML = '';
            addMmfuDiagnosisRow();
        } else if (selection === 'nurse-follow-up') {
            document.getElementById('nurse-interventions-container').innerHTML = '';
            addNurseInterventionRow(true); // Add the first row automatically
            initNursePlanCheckboxes(); // Initialize plan checkboxes
        } else if (selection === 'op-alcohol-detox') {
            // Initialize OP Alcohol Detox inputs and listeners
            initOpAlcoholDetox();
        } else if (selection === 'ciwa-ar-assessment') {
            // Initialize CIWA-Ar Assessment
            initCiwaArAssessment();
        } else if (selection === 'drug-treatment-court-report') {
            // Initialize Drug Treatment Court Report
            initDrugTreatmentCourtReport();
        } else if (selection === 'psychiatric-assessment') {
            // Initialize Psychiatric Assessment
            initPsychiatricAssessmentListeners();
        } else if (selection === 'psychiatric-followup') {
            // Initialize Psychiatric Follow-Up
            initPsychiatricFollowupListeners();
        }
        updateFinalNote();
    });
    
    // Eval-CD Listeners
    detailsTextarea.addEventListener('input', () => { autoResize(detailsTextarea); updateFinalNote(); });
    mandateCheckbox.addEventListener('change', updateFinalNote);
    cdHasMhProviderTextCheckbox.addEventListener('change', () => { toggleSafetyPlan(cdHasMhProviderTextCheckbox, cdSafetyPlanHasProviderCheckbox); updateFinalNote(); });
    cdNoMhProviderTextCheckbox.addEventListener('change', () => { toggleSafetyPlan(cdNoMhProviderTextCheckbox, cdSafetyPlanNoProviderCheckbox); updateFinalNote(); });
    cdSafetyPlanHasProviderCheckbox.addEventListener('change', updateFinalNote);
    cdSafetyPlanNoProviderCheckbox.addEventListener('change', updateFinalNote);
    cdOverdoseRiskCheckbox.addEventListener('change', updateFinalNote);
    cdGamblingRiskCheckbox.addEventListener('change', updateFinalNote);

    // Eval-SO Listeners
    soDiagnosisSelect.addEventListener('change', updateFinalNote);
    soDetailsTextarea.addEventListener('input', () => { autoResize(soDetailsTextarea); updateFinalNote(); });
    soHasMhProviderTextCheckbox.addEventListener('change', () => { toggleSafetyPlan(soHasMhProviderTextCheckbox, soSafetyPlanHasProviderCheckbox); updateFinalNote(); });
    soNoMhProviderTextCheckbox.addEventListener('change', () => { toggleSafetyPlan(soNoMhProviderTextCheckbox, soSafetyPlanNoProviderCheckbox); updateFinalNote(); });
    soSafetyPlanHasProviderCheckbox.addEventListener('change', updateFinalNote);
    soSafetyPlanNoProviderCheckbox.addEventListener('change', updateFinalNote);
    soOverdoseRiskCheckbox.addEventListener('change', updateFinalNote);
    soGamblingRiskCheckbox.addEventListener('change', updateFinalNote);

    // Opioid Use Disorder Short Listeners
    const oudsInputs = document.querySelectorAll('#opioid-use-disorder-short-container input, #opioid-use-disorder-short-container textarea, #opioid-use-disorder-short-container select');
    oudsInputs.forEach(input => {
        input.addEventListener('input', updateFinalNote);
        input.addEventListener('change', updateFinalNote);
    });
    // Crisis Intervention Listeners
    const crisisInputs = document.querySelectorAll('#crisis-intervention-container input, #crisis-intervention-container textarea, #crisis-intervention-container select');
    crisisInputs.forEach(input => {
        input.addEventListener('input', updateFinalNote);
        input.addEventListener('change', updateFinalNote);
    });
    oudsActiveUseRadios.forEach(radio => radio.addEventListener('change', () => {
        oudsLastUseDateRow.classList.toggle('hidden', radio.value !== 'yes');
        // Update label text if needed - now handled by initial HTML and only visibility changes.
        oudsLastUseDateLabel.textContent = "Date of last use:";
        updateFinalNote();
    }));
    oudsPharmRadios.forEach(radio => radio.addEventListener('change', () => {
        oudsPharmFields.classList.toggle('hidden', radio.value !== 'yes');
        updateFinalNote();
    }));
    oudsSubstances.forEach(key => {
        if (key !== 'other') {
            const cb = document.getElementById(`ouds-sub-${key}`);
            if (cb) {
                cb.addEventListener('change', () => {
                    const isChecked = cb.checked;
                    const amtInput = document.getElementById(`ouds-amt-${key}`);
                    const dateInput = document.getElementById(`ouds-date-${key}`);

                    if (amtInput) amtInput.classList.toggle('hidden', !isChecked);
                    if (dateInput) dateInput.classList.toggle('hidden', !isChecked);
                    updateFinalNote();
                });
            }
        }
    });

    function createOtherSubstanceRow(rowClass, substanceClass, amountClass, dateClass, removeClass) {
        const row = document.createElement('div');
        row.className = `other-substance-row ${rowClass}`;
        row.innerHTML = `
            <div class="other-substance-field">
                <label>Substance</label>
                <input type="text" class="${substanceClass}" aria-label="Substance">
            </div>
            <div class="other-substance-field">
                <label>Amount Used</label>
                <input type="text" class="${amountClass}" aria-label="Amount Used">
            </div>
            <div class="other-substance-field">
                <label>Last date of use</label>
                <input type="date" class="${dateClass}" aria-label="Last date of use" title="Last date of use">
            </div>
            <button type="button" class="${removeClass} remove-btn">−</button>
        `;
        return row;
    }

    function bindOtherSubstanceRow(row, removeVisibilityUpdater) {
        row.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', updateFinalNote);
            input.addEventListener('change', updateFinalNote);
        });
        const removeBtn = row.querySelector('.remove-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                row.remove();
                removeVisibilityUpdater();
                updateFinalNote();
            });
        }
    }

    // Handle OUDS "Other" substances add/remove functionality
    function setupOudsOtherRow(row) {
        bindOtherSubstanceRow(row, updateOudsRemoveButtonVisibility);
    }

    function updateOudsRemoveButtonVisibility() {
        const container = document.getElementById('ouds-other-details');
        if (!container) return;
        const rows = container.querySelectorAll('.ouds-other-row');
        rows.forEach(row => {
            const removeBtn = row.querySelector('.ouds-remove-other');
            if (removeBtn) {
                removeBtn.style.display = rows.length > 1 ? 'block' : 'none';
            }
        });
    }

    const oudsOtherCheckbox = document.getElementById('ouds-sub-other');
    const oudsOtherContainer = document.getElementById('ouds-other-details');
    const oudsAddOtherBtn = document.getElementById('ouds-add-other');
    
    if (oudsOtherContainer) {
        oudsOtherContainer.querySelectorAll('.ouds-other-row').forEach(row => setupOudsOtherRow(row));
        updateOudsRemoveButtonVisibility();
    }

    if (oudsOtherCheckbox && oudsOtherContainer && oudsAddOtherBtn) {
        oudsOtherCheckbox.addEventListener('change', () => {
            const isChecked = oudsOtherCheckbox.checked;
            oudsOtherContainer.classList.toggle('hidden', !isChecked);
            oudsAddOtherBtn.classList.toggle('hidden', !isChecked);
            updateFinalNote();
        });
        oudsOtherContainer.classList.toggle('hidden', !oudsOtherCheckbox.checked);
        oudsAddOtherBtn.classList.toggle('hidden', !oudsOtherCheckbox.checked);
    }

    if (oudsAddOtherBtn) {
        oudsAddOtherBtn.addEventListener('click', () => {
            const newRow = createOtherSubstanceRow('ouds-other-row', 'ouds-other-substance', 'ouds-other-amount', 'ouds-other-date', 'ouds-remove-other');
            oudsOtherContainer.appendChild(newRow);
            setupOudsOtherRow(newRow);
            updateOudsRemoveButtonVisibility();
            updateFinalNote();
        });
    }

    // OUDS Psychiatric Ideation Listener
    const oudsParallaxIdeation = document.getElementById('ouds-psych-ideation');
    if (oudsParallaxIdeation) {
        oudsParallaxIdeation.addEventListener('change', (event) => {
            const safetyContainer = document.getElementById('ouds-safety-planning-container');
            const safetyCheckbox = document.getElementById('ouds-safety-planning-checkbox');
            if (event.target.value.includes('Endorses')) {
                safetyContainer.classList.remove('hidden');
            } else {
                safetyContainer.classList.add('hidden');
                safetyCheckbox.checked = false; // Uncheck it when hidden
            }
            updateFinalNote();
        });
    }

// Stimulant Use Disorder Short Listeners
    const sudsInputs = document.querySelectorAll('#stimulant-use-disorder-short-container input, #stimulant-use-disorder-short-container textarea, #stimulant-use-disorder-short-container select');
    sudsInputs.forEach(input => {
        input.addEventListener('input', updateFinalNote);
        input.addEventListener('change', updateFinalNote);
        if (input.tagName.toLowerCase() === 'textarea') {
            input.addEventListener('input', () => autoResize(input));
        }
    });
    
    // Show/hide other chief complaint input
    const sudsChiefComplaint = document.getElementById('suds-chief-complaint');
    const sudsChiefComplaintOther = document.getElementById('suds-chief-complaint-other');
    if (sudsChiefComplaint) {
        sudsChiefComplaint.addEventListener('change', () => {
            sudsChiefComplaintOther.classList.toggle('hidden', sudsChiefComplaint.value !== 'Other');
            updateFinalNote();
        });
    }
    
    // Show/hide other substance use input and handle amount/date fields
    const sudsCouseSubstances = [
        'alcohol', 'amphet', 'benzodiazepines', 'cannabis', 'cocaine', 'hallucinogens', 'illicit-opioids', 'ivdu', 'kratom', 'mdma', 'nicotine', 'prescription-opioids'
    ];
    
    sudsCouseSubstances.forEach(key => {
        const cb = document.getElementById(`suds-couse-${key}`);
        if (cb) {
            cb.addEventListener('change', () => {
                const isChecked = cb.checked;
                const amtInput = document.getElementById(`suds-couse-amt-${key}`);
                const dateInput = document.getElementById(`suds-couse-date-${key}`);
                
                if (amtInput) amtInput.classList.toggle('hidden', !isChecked);
                if (dateInput) dateInput.classList.toggle('hidden', !isChecked);
                updateFinalNote();
            });
        }
    });

    // Handle SUDS "Other" substances add/remove functionality
    function setupSudsOtherRow(row) {
        bindOtherSubstanceRow(row, updateSudsRemoveButtonVisibility);
    }

    function updateSudsRemoveButtonVisibility() {
        const container = document.getElementById('suds-other-details');
        if (!container) return;
        const rows = container.querySelectorAll('.suds-other-row');
        rows.forEach(row => {
            const removeBtn = row.querySelector('.suds-remove-other');
            if (removeBtn) {
                removeBtn.style.display = rows.length > 1 ? 'block' : 'none';
            }
        });
    }

    const sudsOtherCheckbox = document.getElementById('suds-couse-other');
    const sudsOtherContainer = document.getElementById('suds-other-details');
    const sudsAddOtherBtn = document.getElementById('suds-add-other');
    
    if (sudsOtherContainer) {
        sudsOtherContainer.querySelectorAll('.suds-other-row').forEach(row => setupSudsOtherRow(row));
        updateSudsRemoveButtonVisibility();
    }

    if (sudsOtherCheckbox && sudsOtherContainer && sudsAddOtherBtn) {
        sudsOtherCheckbox.addEventListener('change', () => {
            const isChecked = sudsOtherCheckbox.checked;
            sudsOtherContainer.classList.toggle('hidden', !isChecked);
            sudsAddOtherBtn.classList.toggle('hidden', !isChecked);
            updateFinalNote();
        });
        sudsOtherContainer.classList.toggle('hidden', !sudsOtherCheckbox.checked);
        sudsAddOtherBtn.classList.toggle('hidden', !sudsOtherCheckbox.checked);
    }

    if (sudsAddOtherBtn) {
        sudsAddOtherBtn.addEventListener('click', () => {
            const newRow = createOtherSubstanceRow('suds-other-row', 'suds-other-substance', 'suds-other-amount', 'suds-other-date', 'suds-remove-other');
            sudsOtherContainer.appendChild(newRow);
            setupSudsOtherRow(newRow);
            updateSudsRemoveButtonVisibility();
            updateFinalNote();
        });
    }
    
    // Show/hide UDS positive details
    const sudsUdsRadios = document.querySelectorAll('input[name="suds-uds-result"]');
    const sudsUdsPositive = document.getElementById('suds-uds-positive');
    sudsUdsRadios.forEach(radio => radio.addEventListener('change', () => {
        sudsUdsPositive.classList.toggle('hidden', radio.value !== 'Positive');
        updateFinalNote();
    }));

// Alcohol Use Disorder Short Listeners
    const audsInputs = document.querySelectorAll('#alcohol-use-disorder-short-container input, #alcohol-use-disorder-short-container textarea, #alcohol-use-disorder-short-container select');
    audsInputs.forEach(input => {
        input.addEventListener('input', updateFinalNote);
        input.addEventListener('change', updateFinalNote);
        if (input.tagName.toLowerCase() === 'textarea') {
            input.addEventListener('input', () => autoResize(input));
        }
    });

    const audsActiveDrinkingRadios = document.querySelectorAll('input[name="auds-active-drinking"]');
    const audsLastDrinkDateRow = document.getElementById('auds-last-drink-date-row');
    audsActiveDrinkingRadios.forEach(radio => radio.addEventListener('change', () => {
        audsLastDrinkDateRow.classList.toggle('hidden', radio.value !== 'yes');
        updateFinalNote();
    }));

    const audsPharmRadios = document.querySelectorAll('input[name="auds-pharmacotherapy"]');
    const audsPharmFields = document.getElementById('auds-pharm-fields');
    audsPharmRadios.forEach(radio => radio.addEventListener('change', () => {
        audsPharmFields.classList.toggle('hidden', radio.value !== 'yes');
        updateFinalNote();
    }));

    const audsSubstanceList = document.getElementById('auds-substance-list');
    const audsSubstanceCheckboxes = Array.from(audsSubstanceList.querySelectorAll('input[type="checkbox"]'))
        .filter(checkbox => checkbox.id !== 'auds-sub-other');
    audsSubstanceCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const isChecked = checkbox.checked;
            const key = checkbox.id.replace('auds-sub-', '');
            const amtInput = document.getElementById(`auds-amt-${key}`);
            const dateInput = document.getElementById(`auds-date-${key}`);

            if (amtInput) amtInput.classList.toggle('hidden', !isChecked);
            if (dateInput) dateInput.classList.toggle('hidden', !isChecked);
            
            updateFinalNote();
        });
    });

    // Handle AUDS "Other" substances add/remove functionality
    function setupAudsOtherRow(row) {
        bindOtherSubstanceRow(row, updateAudsRemoveButtonVisibility);
    }

    function updateAudsRemoveButtonVisibility() {
        const container = document.getElementById('auds-other-details');
        if (!container) return;
        const rows = container.querySelectorAll('.auds-other-row');
        rows.forEach(row => {
            const removeBtn = row.querySelector('.auds-remove-other');
            if (removeBtn) {
                removeBtn.style.display = rows.length > 1 ? 'block' : 'none';
            }
        });
    }

    const audsOtherCheckbox = document.getElementById('auds-sub-other');
    const audsOtherContainer = document.getElementById('auds-other-details');
    const audsAddOtherBtn = document.getElementById('auds-add-other');
    
    if (audsOtherContainer) {
        audsOtherContainer.querySelectorAll('.auds-other-row').forEach(row => setupAudsOtherRow(row));
        updateAudsRemoveButtonVisibility();
    }

    if (audsOtherCheckbox && audsOtherContainer && audsAddOtherBtn) {
        audsOtherCheckbox.addEventListener('change', () => {
            const isChecked = audsOtherCheckbox.checked;
            audsOtherContainer.classList.toggle('hidden', !isChecked);
            audsAddOtherBtn.classList.toggle('hidden', !isChecked);
            updateFinalNote();
        });
        audsOtherContainer.classList.toggle('hidden', !audsOtherCheckbox.checked);
        audsAddOtherBtn.classList.toggle('hidden', !audsOtherCheckbox.checked);
    }

    if (audsAddOtherBtn) {
        audsAddOtherBtn.addEventListener('click', () => {
            const newRow = createOtherSubstanceRow('auds-other-row', 'auds-other-substance', 'auds-other-amount', 'auds-other-date', 'auds-remove-other');
            audsOtherContainer.appendChild(newRow);
            setupAudsOtherRow(newRow);
            updateAudsRemoveButtonVisibility();
            updateFinalNote();
        });
    }

    // Listener for Psychiatric Ideation dropdown to show/hide safety planning
    const audsPsychIdeationSelect = document.getElementById('auds-psych-ideation');
    const audsSafetyPlanningContainer = document.getElementById('auds-safety-planning-container');
    const audsSafetyPlanningCheckbox = document.getElementById('auds-safety-planning-checkbox');
    audsPsychIdeationSelect.addEventListener('change', (event) => {
        if (event.target.value.includes('Endorses')) { // Covers 'Endorses SI', 'Endorses HI', 'Endorses SI/HI'
            audsSafetyPlanningContainer.classList.remove('hidden');
        } else {
            audsSafetyPlanningContainer.classList.add('hidden');
            audsSafetyPlanningCheckbox.checked = false; // Uncheck it when hidden
        }
        updateFinalNote();
    });

    // Ensure initial state is set on page load for the safety planning checkbox
    document.addEventListener('DOMContentLoaded', () => {
        // Trigger change for audsPsychIdeationSelect to set initial visibility of safety planning
        audsPsychIdeationSelect.dispatchEvent(new Event('change'));
    });
    // Med Mgmt Follow Up Listeners
    mmfuNicotineUse.addEventListener('change', () => {
        mmfuNicotineDetailsSection.classList.toggle('hidden', mmfuNicotineUse.value !== 'yes');
        updateFinalNote();
    });
    document.querySelectorAll('#med-mgmt-follow-up-container input, #med-mgmt-follow-up-container select, #med-mgmt-follow-up-container textarea').forEach(el => {
        el.addEventListener('input', updateFinalNote);
        el.addEventListener('change', updateFinalNote);
        if (el.tagName.toLowerCase() === 'textarea') {
            el.addEventListener('input', () => autoResize(el));
        }
    });


    // Narcan Listeners
    narcanProvidedCheckbox.addEventListener('change', () => {
        if (narcanProvidedCheckbox.checked) narcanDeclinedCheckbox.checked = false;
        updateFinalNote();
    });
    narcanDeclinedCheckbox.addEventListener('change', () => {
        if (narcanDeclinedCheckbox.checked) narcanProvidedCheckbox.checked = false;
        updateFinalNote();
    });

    // Discharge Plan Listeners
    if (dischargeAddMedicationBtn) {
        dischargeAddMedicationBtn.addEventListener('click', () => {
            addDischargeMedicationRow();
            updateDischargeOtherNeedsSummary();
        });
    }
    if (dischargeMedicationsNoneCheckbox) {
        dischargeMedicationsNoneCheckbox.addEventListener('change', () => {
            toggleDischargeMedicationInputs();
            updateDischargeOtherNeedsSummary();
        });
    }
    if (dischargeReferralDropdown) {
        dischargeReferralDropdown.addEventListener('change', () => {
            const showLocation = dischargeReferralDropdown.value === 'Yes';
            if (dischargeReferralLocation) {
                dischargeReferralLocation.classList.toggle('hidden', !showLocation);
                if (!showLocation) {
                    dischargeReferralLocation.value = '';
                }
            }
            updateDischargeOtherNeedsSummary();
        });
    }
    dischargeReferralLocation?.addEventListener('input', updateDischargeOtherNeedsSummary);
    dischargeOverdoseDropdown?.addEventListener('change', updateDischargeOtherNeedsSummary);
    dischargeContinuingCareDropdown?.addEventListener('change', updateDischargeOtherNeedsSummary);
    dischargeReasonInput?.addEventListener('input', () => {
        updateDischargeOtherNeedsSummary();
        updateFinalNote();
    });
    dischargeAppointmentsDropdown?.addEventListener('change', () => {
        updateDischargeOtherNeedsSummary();
        updateFinalNote();
    });
    dischargeOverdoseOfferedDropdown?.addEventListener('change', updateDischargeOtherNeedsSummary);

    // MAT Listeners
    matEducationType.addEventListener('change', () => {
        const selected = matEducationType.value;
        matNotTakingSection.classList.toggle('hidden', selected !== 'not-taking');
        matAlreadyTakingSection.classList.toggle('hidden', selected !== 'already-taking');
        matFormFields.classList.toggle('hidden', !selected);

        matResponseDropdown.value = ""; // Reset selection
        const options = matResponseDropdown.options;
        for (let i = 0; i < options.length; i++) {
            const option = options[i];
            if (option.dataset.type) {
                option.hidden = option.dataset.type !== selected;
            }
        }
        updateFinalNote();
    });
    matExploredOptionsDropdown.addEventListener('change', () => {
        matOptionsDetailsSection.classList.toggle('hidden', matExploredOptionsDropdown.value !== 'did');
        updateFinalNote();
    });
    matNicotineUseDropdown.addEventListener('change', () => {
        matNicotineResourcesSection.classList.toggle('hidden', matNicotineUseDropdown.value !== 'does');
        updateFinalNote();
    });
    matNicotineOtherCheckbox.addEventListener('change', () => {
        matNicotineOtherTextbox.classList.toggle('hidden', !matNicotineOtherCheckbox.checked);
        updateFinalNote();
    });
    [matResponseDropdown, matSubstancesTextbox, matNicotineReplacementCheckbox, matNicotineCounselingCheckbox, matNicotineReferralCheckbox, matNicotineOtherTextbox].forEach(el => {
        el.addEventListener('input', updateFinalNote);
        el.addEventListener('change', updateFinalNote);
    });
    matSpecificOptionsCheckboxes.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', updateFinalNote);
    });
    
    // Telehealth Listeners
    [telehealthVisitType, telehealthReason, telehealthDisruption, telehealthSatisfaction, telehealthPresenceDropdown].forEach(el => {
        el.addEventListener('change', updateFinalNote);
    });
    [telehealthReasonOther, telehealthDisruptionPlan, telehealthClientLocation, telehealthPractitionerLocation, telehealthOthersPresent, telehealthSatisfactionConcerns].forEach(el => {
        el.addEventListener('input', updateFinalNote);
    });
    
    // Closing Note (Admitted) Listeners
    closingMedsDropdown.addEventListener('change', () => {
        closingMedsActionsContainer.classList.toggle('hidden', closingMedsDropdown.value !== 'is');
        updateFinalNote();
    });
    [closingDischargeStatus, closingDisposition, closingRecommendations, closingMedsActions, closingReferrals, closingOfferedToDropdown, closingClientResponse].forEach(el => {
        el.addEventListener('input', updateFinalNote);
        el.addEventListener('change', updateFinalNote);
    });
    
    // Closing Note (Admitted) Loss of Contact field listeners
    if (closingAdmittedLossSessions) closingAdmittedLossSessions.addEventListener('input', updateFinalNote);
    if (closingAdmittedLossStartDate) closingAdmittedLossStartDate.addEventListener('change', updateFinalNote);
    if (closingAdmittedLossEndDate) closingAdmittedLossEndDate.addEventListener('change', updateFinalNote);
    
    // Closing Note (Non-Admitted) Listeners
    nonAdmittedClientType.addEventListener('change', () => {
        nonAdmittedNoEngageSection.classList.toggle('hidden', nonAdmittedClientType.value !== 'no-engage');
        nonAdmittedHigherLocSection.classList.toggle('hidden', nonAdmittedClientType.value !== 'higher-loc');
        nonAdmittedNoCriteriaSection.classList.toggle('hidden', nonAdmittedClientType.value !== 'no-criteria');
        updateFinalNote();
    });
    [nonAdmittedEfforts, nonAdmittedProvidedTo1, nonAdmittedLocadtr, nonAdmittedEfforts2, nonAdmittedProvidedTo2, nonAdmittedUrineScreen, nonAdmittedProvidedTo3].forEach(el => {
        el.addEventListener('input', updateFinalNote);
    });

    // MDT Listeners
    mdtStageOfChange.addEventListener('change', () => {
        mdtStageOfChangeOther.classList.toggle('hidden', mdtStageOfChange.value !== 'Other');
        updateFinalNote();
    });
    const mdtInputs = document.querySelectorAll('#mdt-container input, #mdt-container textarea, #mdt-container select');
    mdtInputs.forEach(input => {
        input.addEventListener('input', updateFinalNote);
        input.addEventListener('change', updateFinalNote);
    });

    // Medication Management Follow-up Listeners
    const mmfuInputs = document.querySelectorAll('#med-mgmt-follow-up-container input, #med-mgmt-follow-up-container textarea, #med-mgmt-follow-up-container select');
    mmfuInputs.forEach(input => {
        input.addEventListener('input', updateFinalNote);
        input.addEventListener('change', updateFinalNote);
        if (input.tagName.toLowerCase() === 'textarea') {
            input.addEventListener('input', () => autoResize(input));
        }
    });

    // Injections Listeners
    injectionTypeSelect.addEventListener('change', () => {
        const selection = injectionTypeSelect.value;
        vivitrolSection.classList.toggle('hidden', selection !== 'vivitrol');
        sublocadeSection.classList.toggle('hidden', selection !== 'sublocade');
        brixadiSection.classList.toggle('hidden', selection !== 'brixadi');
        updateFinalNote();
    });
    [
        vivitrolSite, vivitrolLot, vivitrolExp, vivitrolSn, vivitrolNextInjection,
        sublocadeSite, sublocadeLot, sublocadeExp, sublocadeSn, sublocadeNextInjection,
        brixadiSite, brixadiLot, brixadiExp, brixadiSn, brixadiNextInjection
    ].forEach(el => {
        el.addEventListener('input', updateFinalNote);
        el.addEventListener('change', updateFinalNote);
    });

    // Medical Screening Listeners
    const medicalScreeningContainer = document.getElementById('medical-screening-container');
    if (medicalScreeningContainer) {
        const msInputs = medicalScreeningContainer.querySelectorAll('input, select, textarea');
        msInputs.forEach(input => {
            input.addEventListener('change', updateFinalNote);
            input.addEventListener('keyup', updateFinalNote);
        });

        const setupMSConditional = (triggerName, conditions) => {
            const triggers = document.querySelectorAll(`#medical-screening-container [name="${triggerName}"]`);
            triggers.forEach(trigger => {
                trigger.addEventListener('change', () => {
                    Object.values(conditions).forEach(sectionId => {
                        const section = document.querySelector(sectionId);
                        if (section) section.classList.add('hidden');
                    });
                    const value = trigger.value;
                    const sectionToShow = document.querySelector(conditions[value]);
                    if (sectionToShow) {
                        sectionToShow.classList.remove('hidden');
                    }
                });
            });
        };

        setupMSConditional('hasPCP', { 'yes': '#ms-pcpYesSection', 'no': '#ms-pcpNoSection' });
        setupMSConditional('hadPELastYear', { 'yes': '#ms-peLastYearYesSection', 'no': '#ms-peLastYearNoSection' });
        setupMSConditional('pcpConsentCompleted', { 'no': '#ms-pcpConsentNoSection' });
        setupMSConditional('declineReason', { 'other': '#ms-declineReasonOtherSpecify' });
        setupMSConditional('stdHepTest', { 'yes': '#ms-stdHepTestYesSection' });
        document.getElementById('stdHepStatus').addEventListener('change', () => {
            const status = document.getElementById('stdHepStatus').value;
            document.getElementById('ms-stdHepPositiveSection').classList.toggle('hidden', status !== 'known_positive');
        });
        setupMSConditional('tbTest', { 'yes': '#ms-tbTestYesSection', 'no': '#ms-tbTestNoSection' });
        setupMSConditional('tbResult', { 'positive': '#ms-tbPositiveDetailsSection' });
        setupMSConditional('tobaccoUse', { 'yes': '#ms-tobaccoUseYesSection' });
        setupMSConditional('cessationInterest', { 'yes': '#ms-cessationInterestYesSection' });
        setupMSConditional('onMAT', { 'yes': '#ms-matYesSection', 'no': '#ms-matNoSection' });
    }


    // Copy Button functionality
    copyButton.addEventListener('click', () => {
        finalNoteCopy.select();
        try {
            const successful = document.execCommand('copy');
            const originalText = copyButton.textContent;
            if(successful) {
                copyButton.textContent = 'Copied!';
                copyButton.style.backgroundColor = '#1e7e34';
                setTimeout(() => {
                    copyButton.textContent = originalText;
                    copyButton.style.backgroundColor = '#28a745';
                }, 1500);
            } else {
                    copyButton.textContent = 'Copy Failed';
            }
        } catch (err) {
            console.error('Fallback copy failed', err);
        }
    });

    if (crisisCopyButton && crisisGeneratedNote) {
        crisisCopyButton.addEventListener('click', () => {
            crisisGeneratedNote.select();
            try {
                const successful = document.execCommand('copy');
                const originalText = crisisCopyButton.textContent;
                if (successful) {
                    crisisCopyButton.textContent = 'Copied!';
                    crisisCopyButton.style.backgroundColor = '#1e7e34';
                    setTimeout(() => {
                        crisisCopyButton.textContent = originalText;
                        crisisCopyButton.style.backgroundColor = '#224f8f';
                    }, 1500);
                } else {
                    crisisCopyButton.textContent = 'Copy Failed';
                }
            } catch (err) {
                console.error('Fallback copy failed', err);
            }
        });
    }

    if (crisisResetButton) {
        crisisResetButton.addEventListener('click', () => {
            const crisisContainer = document.getElementById('crisis-intervention-container');
            if (!crisisContainer) return;
            if (!confirm('Reset all fields?')) return;
            crisisContainer.querySelectorAll('input, textarea, select').forEach(el => {
                if (el.type === 'checkbox' || el.type === 'radio') {
                    el.checked = false;
                } else {
                    el.value = '';
                }
            });
            updateFinalNote();
        });
    }

    // Initial call to populate the form on page load
    document.addEventListener('DOMContentLoaded', () => {
        // sortSelectOptions(noteTypeSelect); // Sort the main dropdown
        resetDiagnosisRows();
        resetGoalRows(clientGoalsContainer, treatmentGoalsContainer);
        resetGoalRows(soClientGoalsContainer, soTreatmentGoalsContainer);
        toggleSafetyPlan(cdHasMhProviderTextCheckbox, cdSafetyPlanHasProviderCheckbox);
        toggleSafetyPlan(cdNoMhProviderTextCheckbox, cdSafetyPlanNoProviderCheckbox);
        toggleSafetyPlan(soHasMhProviderTextCheckbox, soSafetyPlanHasProviderCheckbox);
        toggleSafetyPlan(soNoMhProviderTextCheckbox, soSafetyPlanNoProviderCheckbox);
        syncCccVisibility();
        initializeDischargeMedicationRows();
        updateDischargeOtherNeedsSummary();
        updateFinalNote();
    });

    // Copy button logic for discharge plan textboxes
    function copyTextboxContent(textbox, button) {
        textbox.select();
        try {
            document.execCommand('copy');
            const originalText = button.textContent;
            button.textContent = 'Copied!';
            button.style.backgroundColor = '#1e7e34';
            setTimeout(() => {
                button.textContent = originalText;
                button.style.backgroundColor = '#28a745';
            }, 1200);
        } catch (err) {
            button.textContent = 'Copy Failed';
        }
    }
    const copyPeerSupportBtn = document.getElementById('copy-peer-support-btn');
    const copyFamilyServicesBtn = document.getElementById('copy-family-services-btn');
    const peerSupportTextbox = document.getElementById('peer-support-textbox');
    const familyServicesTextbox = document.getElementById('family-services-textbox');
    if (copyPeerSupportBtn && peerSupportTextbox) {
        copyPeerSupportBtn.addEventListener('click', () => copyTextboxContent(peerSupportTextbox, copyPeerSupportBtn));
    }
    if (copyFamilyServicesBtn && familyServicesTextbox) {
        copyFamilyServicesBtn.addEventListener('click', () => copyTextboxContent(familyServicesTextbox, copyFamilyServicesBtn));
    }
    if (dischargeSummaryCopyBtn && dischargeSummaryTextbox) {
        dischargeSummaryCopyBtn.addEventListener('click', () => copyTextboxContent(dischargeSummaryTextbox, dischargeSummaryCopyBtn));
    }

    // Eval-CD Goal Copy Buttons
    const copyEvalCdGoal1Btn = document.getElementById('copy-eval-cd-goal1-btn');
    const evalCdGoal1Textbox = document.getElementById('eval-cd-goal1-textbox');
    if (copyEvalCdGoal1Btn && evalCdGoal1Textbox) {
        copyEvalCdGoal1Btn.addEventListener('click', () => copyTextboxContent(evalCdGoal1Textbox, copyEvalCdGoal1Btn));
    }
    const copyEvalCdGoal2Btn = document.getElementById('copy-eval-cd-goal2-btn');
    const evalCdGoal2Textbox = document.getElementById('eval-cd-goal2-textbox');
    if (copyEvalCdGoal2Btn && evalCdGoal2Textbox) {
        copyEvalCdGoal2Btn.addEventListener('click', () => copyTextboxContent(evalCdGoal2Textbox, copyEvalCdGoal2Btn));
    }

    // Eval-SO Goal Copy Buttons
    const copyEvalSoGoal1Btn = document.getElementById('copy-eval-so-goal1-btn');
    const evalSoGoal1Textbox = document.getElementById('eval-so-goal1-textbox');
    if (copyEvalSoGoal1Btn && evalSoGoal1Textbox) {
        copyEvalSoGoal1Btn.addEventListener('click', () => copyTextboxContent(evalSoGoal1Textbox, copyEvalSoGoal1Btn));
    }
    const copyEvalSoGoal2Btn = document.getElementById('copy-eval-so-goal2-btn');
    const evalSoGoal2Textbox = document.getElementById('eval-so-goal2-textbox');
    if (copyEvalSoGoal2Btn && evalSoGoal2Textbox) {
        copyEvalSoGoal2Btn.addEventListener('click', () => copyTextboxContent(evalSoGoal2Textbox, copyEvalSoGoal2Btn));
    }
    
    // --- MSE Modal and related logic ---
        const mseModal = document.getElementById('mse-modal');
        const closeMseBtn = document.querySelector('#mse-modal .close-btn');
        let activeMseTargetId = null; // Variable to store which MSE textarea is being edited
    
        document.querySelectorAll('.open-mse-modal-btn').forEach(button => {
            button.onclick = function() {
                activeMseTargetId = this.dataset.target; // Get the target ID from the button's data-target attribute
                mseModal.style.display = 'block';
            }
        });
    closeMseBtn.onclick = function() {
        mseModal.style.display = 'none';
    }
    window.onclick = function(event) {
        if (event.target == mseModal) {
            mseModal.style.display = 'none';
        }
    }

    const positiveMseValues = ["Normal MSE", "Oriented x4", "Neat", "Clean", "Appropriately Dressed", "Not Remarkable", "Appropriate", "Ct does not show signs of withdrawal", "Normal", "Normal", "Normal", "Responsive", "Cooperative", "Congruent", "Appropriate", "Euthymic", "Normal", "Congruent", "Normal", "No Hallucinations or Delusions during Interview", "Good", "Good", "Normal", "No evidence or report of SI/HI"];
    const telehealthMseValues = ["Telehealth Normal MSE", "Oriented x4", "Appropriate", "Normal", "Normal", "Normal", "Responsive", "Cooperative", "Congruent", "Euthymic", "Normal", "Congruent", "Normal", "No Hallucinations or Delusions during Interview", "Good", "Good", "Normal", "No evidence or report of SI/HI"];
    function setCheckboxes(valuesToSelect) {
        document.querySelectorAll('.mse-form-container input[type="checkbox"]').forEach(cb => {
            const labelText = cb.parentElement.textContent.trim();
            cb.checked = valuesToSelect.includes(labelText);
        });
        updateMseText();
    }

    function togglePositiveMSE() {
        const cb = document.getElementById('positiveMSE');
        if (cb.checked) {
            document.getElementById('telehealthpositiveMSE').checked = false;
            setCheckboxes(positiveMseValues);
        } else {
            clearAllMseCheckboxes();
        }
    }

    function TelehealthPositiveMSE() {
        const cb = document.getElementById('telehealthpositiveMSE');
        if (cb.checked) {
            document.getElementById('positiveMSE').checked = false;
            setCheckboxes(telehealthMseValues);
        } else {
            clearAllMseCheckboxes();
        }
    }
    
    function clearAllMseCheckboxes() {
        document.querySelectorAll('#MSE input[type="checkbox"]').forEach(cb => cb.checked = false);
        document.querySelectorAll('#MSE input[type="text"]').forEach(input => input.value = '');
        updateMseText();
    }
    
    function updateMseText() {
        const mseTextbox = document.getElementById("mseTextbox");
        let text = "";
        const fieldsets = document.querySelectorAll('.mse-form-container fieldset');

        fieldsets.forEach(fieldset => {
            const legend = fieldset.querySelector('legend');
            if (!legend || legend.textContent === 'Presets') return;

            const categoryName = legend.textContent;
            const checkedItems = [];

            fieldset.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
                checkedItems.push(checkbox.parentElement.textContent.trim());
            });

            const customInput = fieldset.querySelector('input[type="text"]');
            if (customInput && customInput.value.trim() !== "") {
                checkedItems.push(customInput.value.trim());
            }

            if (checkedItems.length > 0) {
                text += `${categoryName}: ${checkedItems.join(", ")}\n`;
            }
        });

        mseTextbox.value = text.trim();
    }

    function saveMseAndClose() {
            updateMseText(); // Ensure the text is up-to-date
            const mseResult = document.getElementById("mseTextbox").value;
            
            // Use the activeMseTargetId to find the correct textarea
            if (activeMseTargetId) {
                const mainMseTextarea = document.getElementById(activeMseTargetId);
                if (mainMseTextarea) {
                    mainMseTextarea.value = mseResult;
                    // Trigger input event to update the main note copy area
                    mainMseTextarea.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }
    
            mseModal.style.display = "none";
            activeMseTargetId = null; // Reset the target ID
        }

    // Initial call to set up the form on page load.
    document.addEventListener('DOMContentLoaded', updateMseText);

    // Function to update final note from checkboxes (does not modify textarea)
    function updateNursePlanFromCheckboxes() {
        // Just trigger the final note update - the logic is now in updateFinalNote
        updateFinalNote();
    }

    // Attach listeners to plan checkboxes when nurse-follow-up is loaded
    function initNursePlanCheckboxes() {
        for (let i = 1; i <= 4; i++) {
            const checkbox = document.getElementById(`nurse-plan-checkbox-${i}`);
            if (checkbox) {
                checkbox.addEventListener('change', updateNursePlanFromCheckboxes);
            }
            
            // For checkboxes with custom input
            if (i === 3 || i === 4) {
                const customInput = document.getElementById(`nurse-plan-custom-${i}`);
                if (customInput) {
                    customInput.addEventListener('input', () => {
                        if (document.getElementById(`nurse-plan-checkbox-${i}`).checked) {
                            updateNursePlanFromCheckboxes();
                        }
                    });
                    customInput.addEventListener('keyup', () => {
                        if (document.getElementById(`nurse-plan-checkbox-${i}`).checked) {
                            updateNursePlanFromCheckboxes();
                        }
                    });
                }
            }
        }
    }
    
    // Initialize OP Alcohol Detox inputs & listeners
    function toggleDossingOption(radio) {
        // If clicking the same radio twice, deselect it
        if (radio.wasChecked) {
            radio.checked = false;
            radio.wasChecked = false;
            // Clear opposite group
            const oppositeName = radio.name === 'op-dosing-low-risk' ? 'op-dosing-high-risk' : 'op-dosing-low-risk';
            document.querySelectorAll(`input[name=${oppositeName}]`).forEach(r => {
                r.wasChecked = false;
                r.checked = false;
            });
        } else {
            // Set this one, clear opposite group
            const oppositeName = radio.name === 'op-dosing-low-risk' ? 'op-dosing-high-risk' : 'op-dosing-low-risk';
            document.querySelectorAll(`input[name=${oppositeName}]`).forEach(r => {
                r.wasChecked = false;
                r.checked = false;
            });
            radio.wasChecked = true;
        }
        updateDossingDisplay();
    }

    function updateDossingDisplay() {
        // Update CIWA display
        const ciwaScore = document.getElementById('op-ciwa-score')?.value;
        const ciwaDisplay = document.getElementById('op-dosing-ciwa-display');
        if (ciwaDisplay) {
            ciwaDisplay.textContent = ciwaScore || '[Enter CIWA score above]';
        }
        
        // Check which dosing option is selected
        const lowRiskSelected = document.querySelector('input[name="op-dosing-low-risk"]:checked');
        const highRiskSelected = document.querySelector('input[name="op-dosing-high-risk"]:checked');
        const displayDiv = document.getElementById('op-dosing-schedule-display');
        const contentDiv = document.getElementById('op-dosing-schedule-content');
        
        if (!displayDiv || !contentDiv) return;
        
        let scheduleText = '';
        if (lowRiskSelected) {
            const med = lowRiskSelected.value;
            let medLabel = '';
            if (med === 'gabapentin') medLabel = 'Gabapentin 300 mg';
            else if (med === 'diazepam') medLabel = 'Diazepam 5 mg';
            else if (med === 'chlordiazepoxide') medLabel = 'Chlordiazepoxide 25 mg';
            
            scheduleText = `Medication: ${medLabel}

Schedule:
 Day 1: 1 tab QID (4 doses/day)
 Day 2: 1 tab TID (3 doses/day)
 Day 3: 1 tab BID (2 doses/day)
 Day 4: 1 tab once daily

PRN: Prescribe 5 additional tablets for breakthrough withdrawal symptoms.

Total dispensed: 15 tablets (10 scheduled + 5 PRN).`;
        } else if (highRiskSelected) {
            const med = highRiskSelected.value;
            let medLabel = '';
            if (med === 'diazepam') medLabel = 'Diazepam 10 mg';
            else if (med === 'chlordiazepoxide') medLabel = 'Chlordiazepoxide 50 mg';
            
            scheduleText = `Medication: ${medLabel}

Schedule:
 Day 1: 1 tab QID (4 doses/day)
 Day 2: 1 tab TID (3 doses/day)
 Day 3: 1 tab BID (2 doses/day)
 Day 4: 1 tab once daily

PRN: Prescribe 5 additional tablets for breakthrough symptoms.

Total dispensed: 15 tablets (10 scheduled + 5 PRN).`;
        }
        
        if (scheduleText) {
            contentDiv.textContent = scheduleText;
            displayDiv.style.display = 'block';
        } else {
            displayDiv.style.display = 'none';
            contentDiv.textContent = '';
        }
        
        updateFinalNote();
    }

    function initOpAlcoholDetox() {
        // Quick-set chief complaint
        const quick = document.getElementById('op-chief-quick');
        const chief = document.getElementById('op-chief');
        if (quick && chief) {
            quick.addEventListener('change', () => {
                if (quick.value === 'Other') chief.value = '';
                else chief.value = quick.value;
                updateFinalNote();
            });
            chief.addEventListener('input', updateFinalNote);
        }

        // Wire most inputs to updateFinalNote
        const container = document.getElementById('op-alcohol-detox-container');
        if (!container) return;
        const inputs = container.querySelectorAll('input, textarea, select');
        inputs.forEach(el => el.addEventListener('input', updateFinalNote));
        inputs.forEach(el => el.addEventListener('change', updateFinalNote));

        // CIWA button
        const ciwaBtn = document.getElementById('open-ciwa-btn');
        if (ciwaBtn) ciwaBtn.addEventListener('click', openCIWAModal);

        // Safety concerns toggle
        const safetyRadios = document.getElementsByName('op-safety-concerns');
        safetyRadios.forEach(r => r.addEventListener('change', () => {
            const details = document.getElementById('op-safety-details-container');
            if (!details) return;
            const anyYes = Array.from(safetyRadios).some(rr => rr.checked && rr.value === 'Yes');
            details.classList.toggle('hidden', !anyYes);
        }));
    }

    function initCiwaArAssessment() {
        // Wire embedded CIWA questions to update final note
        for (let i = 0; i < 10; i++) {
            const q = document.getElementById(`ciwa-q-${i}`);
            if (q) {
                // Use both 'change' and 'input' to ensure it fires in all situations
                q.addEventListener('change', () => {
                    computeCIWAScore();
                    updateFinalNote();
                });
                q.addEventListener('input', () => {
                    computeCIWAScore();
                    updateFinalNote();
                });
            }
        }
        // Calculate initial score
        computeCIWAScore();
    }

    function initDrugTreatmentCourtReport() {
        // Initialize form visibility
        handleDtcLudVisibility();
        updateDtcMissedStatus();
        // Initialize with first tox and random rows if empty
        if (document.getElementById('dtc-toxContainer').children.length === 0) {
            addDtcToxRow();
        }
        if (document.getElementById('dtc-randomContainer').children.length === 0) {
            addDtcRandomRow();
        }

        // Clinician info listeners
        const dtcCccServiceBy = document.getElementById('dtc-ccc-service-by');
        const dtcCccCoordinationWith = document.getElementById('dtc-ccc-coordination-with');
        if (dtcCccServiceBy) dtcCccServiceBy.addEventListener('input', updateFinalNote);
        if (dtcCccCoordinationWith) dtcCccCoordinationWith.addEventListener('input', updateFinalNote);
    }

    // CIWA modal open/save functions
    function openCIWAModal() {
        // create modal if not present
        if (!document.getElementById('ciwa-modal')) {
            const modal = document.createElement('div');
            modal.id = 'ciwa-modal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close-btn">&times;</span>
                    <h2>CIWA-Ar</h2>
                    <div id="ciwa-questions" style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; max-height:60vh; overflow:auto;">
                    </div>
                    <div style="margin-top:10px; display:flex; gap:8px; align-items:center;"><strong>Score: </strong><input type="text" id="ciwa-score-output" style="width:120px;" readonly /></div>
                    <div style="margin-top:12px;"><button id="ciwa-save-btn" class="mse-button">Save & Close</button></div>
                </div>`;
            document.body.appendChild(modal);

            // add questions
            const qContainer = modal.querySelector('#ciwa-questions');
            const items = [
                { label: 'NAUSEA AND VOMITING', ask: 'Ask "Do you feel sick to your stomach? Have you vomited?" Observation.', options: ['no nausea and no vomiting', 'mild nausea with no vomiting', '', '', 'intermittent nausea with dry heaves', '', '', 'constant nausea, frequent dry heaves and vomiting'] },
                { label: 'TREMOR', ask: 'Arms extended and fingers spread apart. Observation.', options: ['no tremor', 'not visible, but can be felt fingertip to fingertip', '', '', 'moderate, with patient\'s arms extended', '', '', 'severe, even with arms not extended'] },
                { label: 'PAROXYSMAL SWEATS', ask: 'Observation.', options: ['no sweat visible', 'barely perceptible sweating, palms moist', '', '', 'beads of sweat obvious on forehead', '', '', 'drenching sweats'] },
                { label: 'ANXIETY', ask: 'Ask "Do you feel nervous?" Observation.', options: ['no anxiety, at ease', 'mild anxious', '', '', 'moderately anxious, or guarded, so anxiety is inferred', '', '', 'equivalent to acute panic states as seen in severe delirium or acute schizophrenic reactions'] },
                { label: 'HEADACHE, FULLNESS IN HEAD', ask: 'Ask "Does your head feel different? Does it feel like there is a band around your head?" Do not rate for dizziness or lightheadedness.', options: ['not present', 'very mild', 'mild', 'moderate', 'moderately severe', 'severe', 'very severe', 'extremely severe'] },
                { label: 'AUDITORY DISTURBANCES', ask: 'Ask "Are you more aware of sounds around you? Are they harsh? Do they frighten you? Are you hearing anything that is disturbing to you? Are you hearing things you know are not there?" Observation.', options: ['not present', 'very mild harshness or ability to frighten', 'mild harshness or ability to frighten', 'moderate harshness or ability to frighten', 'moderately severe hallucinations', 'severe hallucinations', 'extremely severe hallucinations', 'continuous hallucinations'] },
                { label: 'VISUAL DISTURBANCES', ask: 'Ask "Does the light appear to be too bright? Is its color different? Does it hurt your eyes? Are you seeing anything that is disturbing to you? Are you seeing things you know are not there?" Observation.', options: ['not present', 'very mild sensitivity', 'mild sensitivity', 'moderate sensitivity', 'moderately severe hallucinations', 'severe hallucinations', 'extremely severe hallucinations', 'continuous hallucinations'] },
                { label: 'TACTILE DISTURBANCES', ask: 'Ask "Have you any itching, pins and needles sensations, any burning, any numbness, or do you feel bugs crawling on or under your skin?" Observation.', options: ['none', 'very mild itching, pins and needles, burning or numbness', 'mild itching, pins and needles, burning or numbness', 'moderate itching, pins and needles, burning or numbness', 'moderately severe hallucinations', 'severe hallucinations', 'extremely severe hallucinations', 'continuous hallucinations'] },
                { label: 'AGITATION', ask: 'Observation.', options: ['normal activity', 'somewhat more than normal activity', '', '', 'moderately fidgety and restless', '', '', 'paces back and forth during most of the interview, or constantly thrashes about'] },
                { label: 'ORIENTATION AND CLOUDING OF SENSORIUM', ask: 'Ask "What day is this? Where are you? Who am I?"', options: ['oriented and can do serial additions', 'cannot do serial additions or is uncertain about date', 'disoriented for date by no more than 2 calendar days', 'disoriented for date by more than 2 calendar days', 'disoriented for place/or person', '', '', ''] }
            ];
            items.forEach((item, idx) => {
                const div = document.createElement('div');
                div.innerHTML = `<label style="display:block; font-weight:bold; margin-bottom:4px;">${item.label}</label><p style="font-size:0.75em; font-style:italic; color:#666; margin:0 0 6px 0;">${item.ask}</p>`;
                const select = document.createElement('select');
                select.id = `ciwa-modal-q-${idx}`;
                select.style.width = '100%';
                // Add "Select an option" as first choice
                const selectOpt = document.createElement('option');
                selectOpt.value = '';
                selectOpt.textContent = 'Select an option';
                select.appendChild(selectOpt);
                for (let i=0;i<=7;i++) {
                    const opt = document.createElement('option');
                    opt.value = i;
                    const desc = item.options[i] ? ` - ${item.options[i]}` : '';
                    opt.textContent = i + desc;
                    select.appendChild(opt);
                }
                select.addEventListener('change', () => computeCIWAScoreModal());
                div.appendChild(select);
                qContainer.appendChild(div);
            });

            // close
            modal.querySelector('.close-btn').addEventListener('click', () => modal.style.display = 'none');
            modal.querySelector('#ciwa-save-btn').addEventListener('click', saveCIWAAndClose);
        }
        document.getElementById('ciwa-modal').style.display = 'block';
        computeCIWAScoreModal();
    }

    // Psychiatric Assessment MSE modal
    function openPsychMSEModal() {
        openPsychMSEModalFor('psych-mse-output');
    }

    function openPsychMSEModalFor(targetId) {
        const mseModal = document.getElementById('mse-modal');
        if (mseModal) {
            activeMseTargetId = targetId;
            mseModal.style.display = 'block';
        }
    }

    function computeCIWAScore() {
        let score = 0;
        for (let i = 0; i < 10; i++) {
            const sel = document.getElementById(`ciwa-q-${i}`);
            if (sel && sel.value) {
                const val = parseInt(sel.value, 10);
                if (!isNaN(val)) {
                    score += val;
                }
            }
        }
        const embedded = document.getElementById('ciwa-embedded-score');
        if (embedded) {
            embedded.textContent = score;
        }
    }

    function computeCIWAScoreModal() {
        let score = 0;
        for (let i = 0; i < 10; i++) {
            const sel = document.getElementById(`ciwa-modal-q-${i}`);
            if (sel && sel.value) {
                const val = parseInt(sel.value, 10);
                if (!isNaN(val)) {
                    score += val;
                }
            }
        }
        const out = document.getElementById('ciwa-score-output');
        if (out) {
            out.value = score;
        }
    }

    function saveCIWAAndClose() {
        const selectedNoteType = document.getElementById('note-type-select')?.value;
        
        // If on CIWA-Ar Assessment form (embedded version), get score from embedded input
        let score;
        if (selectedNoteType === 'ciwa-ar-assessment') {
            score = document.getElementById('ciwa-embedded-score').textContent;
        } else {
            // Otherwise, get from modal's ciwa-score-output
            const modal = document.getElementById('ciwa-modal');
            if (!modal) return;
            score = document.getElementById('ciwa-score-output').value;
            modal.style.display = 'none';
        }
        
        const ciwaField = document.getElementById('op-ciwa-score');
        if (ciwaField) ciwaField.value = score;
        
        // Update CIWA-Ar Assessment result display if on that note type
        if (selectedNoteType === 'ciwa-ar-assessment') {
            const resultDiv = document.getElementById('ciwa-ar-result');
            const scoreSpan = document.getElementById('ciwa-final-score');
            const interpPara = document.getElementById('ciwa-interpretation');
            if (resultDiv && scoreSpan && interpPara && score) {
                scoreSpan.textContent = score;
                const scoreNum = parseInt(score, 10);
                let interpretation = '';
                if (scoreNum <= 9) {
                    interpretation = 'Minimal/mild withdrawal risk; monitor for symptom progression';
                } else if (scoreNum <= 19) {
                    interpretation = 'Moderate withdrawal risk; pharmacological support recommended (benzodiazepine-based detoxification)';
                } else {
                    interpretation = 'Severe withdrawal risk; strongly recommend inpatient detoxification and intensive pharmacological management';
                }
                interpPara.textContent = 'Interpretation: ' + interpretation;
                resultDiv.style.display = 'block';
            }
        }
        
        updateDossingDisplay();
        updateFinalNote();
    }
    
// Nurse Follow Up Listeners
    [
        document.getElementById('nurse-diag'),
        document.getElementById('nurse-goal'),
        document.getElementById('nurse-reason'),
        document.getElementById('nurse-services'),
        document.getElementById('nurse-response'),
        document.getElementById('nurse-plan')
    ].forEach(el => {
        if(el) {
            el.addEventListener('input', () => {
                autoResize(el);
                updateFinalNote();
            });
        }
    });

    // Interventions Used Functions
    function updateDarpProgressNote() {
        const interventions = [];
        
        // Collect CBT interventions
        const cbtChecked = document.querySelectorAll('input[name="CBT"]:checked');
        if (cbtChecked.length > 0) {
            const cbtItems = Array.from(cbtChecked).map(cb => cb.value);
            const cbtOther = document.getElementById('CBTOther')?.value?.trim();
            if (cbtOther) cbtItems.push(cbtOther);
            interventions.push('CBT:\n   ' + cbtItems.join('\n   '));
        }
        
        // Collect Person Centered interventions
        const pcChecked = document.querySelectorAll('input[name="Person Centered"]:checked');
        if (pcChecked.length > 0) {
            const pcItems = Array.from(pcChecked).map(cb => cb.value);
            const pcOther = document.getElementById('PersonCenteredOther')?.value?.trim();
            if (pcOther) pcItems.push(pcOther);
            interventions.push('Person Centered:\n   ' + pcItems.join('\n   '));
        }
        
        // Collect Motivational Interviewing interventions
        const miChecked = document.querySelectorAll('input[name="Motivational Interviewing"]:checked');
        if (miChecked.length > 0) {
            const miItems = Array.from(miChecked).map(cb => cb.value);
            const miOther = document.getElementById('MotivationalInterviewingOther')?.value?.trim();
            if (miOther) miItems.push(miOther);
            interventions.push('Motivational Interviewing:\n   ' + miItems.join('\n   '));
        }
        
        // Collect Custom interventions (only checked)
        const customItems = Array.from(document.querySelectorAll('#customList input[type="checkbox"]:checked')).map(cb => cb.getAttribute('data-text') || cb.nextElementSibling?.textContent || cb.value).filter(Boolean);
        if (customItems.length > 0) {
            interventions.push('Interventions:\n   ' + customItems.join('\n   '));
        }
        
        // Update the final note with interventions
        updateFinalNote();
    }
    
    function addCustomIntervention() {
        const input = document.getElementById('customInput');
        const value = input?.value?.trim();
        
        if (!value) {
            alert('Please enter an intervention');
            return;
        }
        
        const customList = document.getElementById('customList');
        const div = document.createElement('div');
        const label = document.createElement('label');
        label.style.display = 'flex';
        label.style.alignItems = 'center';
        label.style.gap = '8px';
        label.style.cursor = 'pointer';

        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.className = 'custom-intervention-checkbox';
        cb.setAttribute('data-text', value);
        cb.addEventListener('change', updateDarpProgressNote);

        const span = document.createElement('span');
        span.textContent = value;

        label.appendChild(cb);
        label.appendChild(span);
        div.appendChild(label);
        
        customList.appendChild(div);
        input.value = '';
        input.focus();
        updateDarpProgressNote();
    }
    
    function removeSelectedIntervention() {
        const customList = document.getElementById('customList');
        // Prefer removing checked custom items; if none, remove the first
        const checked = customList.querySelectorAll('input[type="checkbox"]:checked');
        if (checked.length > 0) {
            checked.forEach(cb => cb.closest('div')?.remove());
            updateDarpProgressNote();
            return;
        }
        const first = customList.querySelector('div');
        if (first) {
            first.remove();
            updateDarpProgressNote();
        }
    }

    function addCustomInterventionFU() {
        const input = document.getElementById('customInputFU');
        const value = input?.value?.trim();
        
        if (!value) {
            alert('Please enter an intervention');
            return;
        }
        
        const customList = document.getElementById('customListFU');
        const div = document.createElement('div');
        const label = document.createElement('label');
        label.style.display = 'flex';
        label.style.alignItems = 'center';
        label.style.gap = '8px';
        label.style.cursor = 'pointer';

        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.className = 'custom-intervention-checkbox';
        cb.setAttribute('data-text', value);
        cb.addEventListener('change', updateDarpProgressNote);

        const span = document.createElement('span');
        span.textContent = value;

        label.appendChild(cb);
        label.appendChild(span);
        div.appendChild(label);
        
        customList.appendChild(div);
        input.value = '';
        input.focus();
        updateDarpProgressNote();
    }
    
    function removeSelectedInterventionFU() {
        const customList = document.getElementById('customListFU');
        // Prefer removing checked custom items; if none, remove the first
        const checked = customList.querySelectorAll('input[type="checkbox"]:checked');
        if (checked.length > 0) {
            checked.forEach(cb => cb.closest('div')?.remove());
            updateDarpProgressNote();
            return;
        }
        const first = customList.querySelector('div');
        if (first) {
            first.remove();
            updateDarpProgressNote();
        }
    }

    function openPsychFUMSEModal() {
        openPsychMSEModalFor('psych-fu-mse-output');
    }

    function addPsychRiskOther() {
        const container = document.getElementById('psych-risk-other-container');
        const div = document.createElement('div');
        div.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 6px;';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Enter other risk factor...';
        input.style.cssText = 'flex: 1; padding: 6px; border: 1px solid #ccc; border-radius: 4px;';
        input.addEventListener('input', updateFinalNote);
        
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.textContent = 'Remove';
        removeBtn.className = 'copy-button';
        removeBtn.style.cssText = 'width: auto; padding: 6px 10px; background: #dc3545;';
        removeBtn.onclick = () => {
            div.remove();
            updateFinalNote();
        };
        
        div.appendChild(input);
        div.appendChild(removeBtn);
        container.appendChild(div);
        input.focus();
    }

    function addPsychProtectOther() {
        const container = document.getElementById('psych-protect-other-container');
        const div = document.createElement('div');
        div.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 6px;';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Enter other protective factor...';
        input.style.cssText = 'flex: 1; padding: 6px; border: 1px solid #ccc; border-radius: 4px;';
        input.addEventListener('input', updateFinalNote);
        
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.textContent = 'Remove';
        removeBtn.className = 'copy-button';
        removeBtn.style.cssText = 'width: auto; padding: 6px 10px; background: #dc3545;';
        removeBtn.onclick = () => {
            div.remove();
            updateFinalNote();
        };
        
        div.appendChild(input);
        div.appendChild(removeBtn);
        container.appendChild(div);
        input.focus();
    }

    function addPsychFuRiskOther() {
        const container = document.getElementById('psych-fu-risk-other-container');
        const div = document.createElement('div');
        div.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 6px;';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Enter other risk factor...';
        input.style.cssText = 'flex: 1; padding: 6px; border: 1px solid #ccc; border-radius: 4px;';
        input.addEventListener('input', updateFinalNote);
        
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.textContent = 'Remove';
        removeBtn.className = 'copy-button';
        removeBtn.style.cssText = 'width: auto; padding: 6px 10px; background: #dc3545;';
        removeBtn.onclick = () => {
            div.remove();
            updateFinalNote();
        };
        
        div.appendChild(input);
        div.appendChild(removeBtn);
        container.appendChild(div);
        input.focus();
    }

    function addPsychFuProtectOther() {
        const container = document.getElementById('psych-fu-protect-other-container');
        const div = document.createElement('div');
        div.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 6px;';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Enter other protective factor...';
        input.style.cssText = 'flex: 1; padding: 6px; border: 1px solid #ccc; border-radius: 4px;';
        input.addEventListener('input', updateFinalNote);
        
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.textContent = 'Remove';
        removeBtn.className = 'copy-button';
        removeBtn.style.cssText = 'width: auto; padding: 6px 10px; background: #dc3545;';
        removeBtn.onclick = () => {
            div.remove();
            updateFinalNote();
        };
        
        div.appendChild(input);
        div.appendChild(removeBtn);
        container.appendChild(div);
        input.focus();
    }
         

