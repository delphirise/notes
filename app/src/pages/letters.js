"use strict";

function executeDataCalls(expression, event, element) {
    if (!expression) {
        return;
    }

    const statements = String(expression)
        .split(';')
        .map((item) => item.trim())
        .filter(Boolean);

    for (const statement of statements) {
        const callMatch = statement.match(/^([A-Za-z_$][\w$]*)\s*(?:\((.*)\))?$/);
        if (!callMatch) {
            continue;
        }

        const fnName = callMatch[1];
        const argsSource = callMatch[2] || '';
        const fn = window[fnName];
        if (typeof fn !== 'function') {
            continue;
        }

        const args = [];
        if (argsSource.trim()) {
            const parts = [];
            let current = '';
            let inSingle = false;
            let inDouble = false;
            for (let i = 0; i < argsSource.length; i += 1) {
                const ch = argsSource[i];
                if (ch === "'" && !inDouble) {
                    inSingle = !inSingle;
                    current += ch;
                    continue;
                }
                if (ch === '"' && !inSingle) {
                    inDouble = !inDouble;
                    current += ch;
                    continue;
                }
                if (ch === ',' && !inSingle && !inDouble) {
                    parts.push(current.trim());
                    current = '';
                    continue;
                }
                current += ch;
            }
            if (current.trim()) {
                parts.push(current.trim());
            }

            for (const part of parts) {
                if (part === 'this') {
                    args.push(element);
                } else if (part === 'event') {
                    args.push(event);
                } else if (part === 'true') {
                    args.push(true);
                } else if (part === 'false') {
                    args.push(false);
                } else if (part === 'null') {
                    args.push(null);
                } else if (/^-?\d+(?:\.\d+)?$/.test(part)) {
                    args.push(Number(part));
                } else if ((part.startsWith("'") && part.endsWith("'")) || (part.startsWith('"') && part.endsWith('"'))) {
                    args.push(part.slice(1, -1));
                }
            }
        }

        try {
            fn(...args);
        } catch (error) {
            console.error(`Error running data call ${fnName}:`, error);
        }
    }
}

function wireDataActionButtons() {
    if (document.body.dataset.dataActionWired === 'true') {
        return;
    }

    document.body.addEventListener('click', (event) => {
        const button = event.target.closest('[data-action]');
        if (!button) {
            return;
        }

        const action = button.getAttribute('data-action');
        if (!action) {
            return;
        }

        const fn = window[action];
        if (typeof fn !== 'function') {
            return;
        }

        const argRaw = button.getAttribute('data-action-arg');
        if (argRaw == null || argRaw === '') {
            fn();
            return;
        }

        const arg = /^-?\d+$/.test(argRaw) ? Number(argRaw) : argRaw;
        fn(arg);
    });

    document.body.dataset.dataActionWired = 'true';
}

function wireDataInputChangeAttributes() {
    document.querySelectorAll('[data-oninput]').forEach((element) => {
        if (element.dataset.oninputWired === 'true') {
            return;
        }

        const expression = element.getAttribute('data-oninput');
        element.addEventListener('input', (event) => {
            executeDataCalls(expression, event, element);
        });
        element.dataset.oninputWired = 'true';
        element.removeAttribute('data-oninput');
    });

    document.querySelectorAll('[data-onchange]').forEach((element) => {
        if (element.dataset.onchangeWired === 'true') {
            return;
        }

        const expression = element.getAttribute('data-onchange');
        element.addEventListener('change', (event) => {
            executeDataCalls(expression, event, element);
        });
        element.dataset.onchangeWired = 'true';
        element.removeAttribute('data-onchange');
    });
}

function migrateInlineInputChangeAttributes() {
    document.querySelectorAll('[oninput], [onchange]').forEach((element) => {
        const onInput = element.getAttribute('oninput');
        const onChange = element.getAttribute('onchange');

        if (onInput) {
            element.setAttribute('data-oninput', onInput);
            element.removeAttribute('oninput');
        }

        if (onChange) {
            element.setAttribute('data-onchange', onChange);
            element.removeAttribute('onchange');
        }
    });
}

migrateInlineInputChangeAttributes();
wireDataActionButtons();
wireDataInputChangeAttributes();
// --- Custom Notification System ---
        function showNotification(message, isError = false) {
            const notification = document.getElementById('notification');
            const messageEl = document.getElementById('notification-message');
            
            messageEl.textContent = message;
            notification.className = `fixed bottom-5 right-5 text-white py-3 px-6 rounded-lg shadow-lg opacity-0 transform translate-y-2 ${isError ? 'bg-red-600' : 'bg-gray-800'}`;

            // Show notification
            setTimeout(() => {
                notification.classList.remove('opacity-0', 'translate-y-2');
                notification.classList.add('opacity-100', 'translate-y-0');
            }, 10);

            // Hide after 3 seconds
            setTimeout(() => {
                notification.classList.remove('opacity-100', 'translate-y-0');
                notification.classList.add('opacity-0', 'translate-y-2');
            }, 3000);
        }


        // --- Password Protection ---
        function setCookie(name, value, days) {
            let expires = "";
            if (days) {
                const date = new Date();
                date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                expires = "; expires=" + date.toUTCString();
            }
            // TODO(security): Move auth cookie issuance server-side with Secure; HttpOnly; SameSite=Strict.
            document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
        }

        function getCookie(name) {
            const nameEQ = name + "=";
            const ca = document.cookie.split(';');
            for (let i = 0; i < ca.length; i++) {
                let c = ca[i];
                while (c.charAt(0) === ' ') c = c.substring(1, c.length);
                if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
            }
            return null;
        }

        function checkPassword() {
            const password = document.getElementById('password-input').value;
            const errorMessage = document.getElementById('error-message');
            const overlay = document.getElementById('password-overlay');
            const encodedPassword = overlay ? overlay.dataset.passwordB64 : '';
            let expectedPassword = '';

            try {
                expectedPassword = atob(encodedPassword || '');
            } catch (error) {
                console.error('Invalid base64 password token on letters page:', error);
                errorMessage.style.display = 'block';
                return;
            }

            // IMPORTANT: This gate is only a client-side deterrent and is not secure auth.
            // TODO(security): replace with server-side authentication and secure session cookies.
            if (password === expectedPassword) {
                document.getElementById('password-overlay').style.display = 'none';
                document.getElementById('main-content').style.display = 'block';
                setCookie('isAuthenticated', 'true', 7); // Cookie expires in 7 days
                initializeApp(); // Initialize app after successful login
            } else {
                errorMessage.style.display = 'block';
            }
        }

        // --- Main Application Logic ---

        // Data for DSM-5 Diagnosis Dropdown
        const dsm5Disorders = [
            "Alcohol Use Disorder", "Cannabis Use Disorder", "Phencyclidine Use Disorder", 
            "Other Hallucinogen Use Disorder", "Inhalant Use Disorder", "Opioid Use Disorder",
            "Sedative, Hypnotic, or Anxiolytic Use Disorder", "Stimulant Use Disorder", "Tobacco Use Disorder",
            "Other (or Unknown) Substance Use Disorder", "Gambling Disorder"
        ];
        let selectedDiagnoses = [];
        let isUpdatingGeneratedText = false;
        let hasManualGeneratedTextOverride = false;

        async function initializeApp() {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            const todayString = `${yyyy}-${mm}-${dd}`;
            
            // Set today's date for all relevant fields
            document.getElementById('guLetterDate').value = todayString;
            document.getElementById('todaysDate').value = todayString;
            document.getElementById('eipTodaysDate').value = todayString;
            document.getElementById('reTodaysDate').value = todayString;
            document.getElementById('trTodaysDate').value = todayString;
            document.getElementById('eipLetterDate').value = todayString;
            document.getElementById('trLetterDate').value = todayString;
            document.getElementById('tnrLetterDate').value = todayString;
            document.getElementById('evLetterDate').value = todayString;
            document.getElementById('disLetterDate').value = todayString;
            document.getElementById('disClientLetterDate').value = todayString;
            document.getElementById('disClientSuccessLetterDate').value = todayString;
            document.getElementById('disDischargeDate').value = '';
            document.getElementById('disClientDischargeDate').value = '';
            document.getElementById('disClientSuccessDischargeDate').value = '';
            document.getElementById('evStartDate').value = todayString;
            document.getElementById('commonSalutationType').value = 'dear';
            toggleCommonSalutationName();
            const disSubjectEl = document.getElementById('disSubject');
            if (disSubjectEl && !disSubjectEl.value) {
                disSubjectEl.value = 'Patient Discharge from Delphi Rise';
            }
            const disClientSubjectEl = document.getElementById('disClientSubject');
            if (disClientSubjectEl && !disClientSubjectEl.value) {
                disClientSubjectEl.value = 'Completion of Services';
            }
            const disClientSuccessSubjectEl = document.getElementById('disClientSuccessSubject');
            if (disClientSuccessSubjectEl && !disClientSuccessSubjectEl.value) {
                disClientSuccessSubjectEl.value = 'Completion of Treatment';
            }
            const eipSubjectEl = document.getElementById('eipSubject');
            if (eipSubjectEl && !eipSubjectEl.value) {
                eipSubjectEl.value = 'Evaluation in Progress';
            }
            const trSubjectEl = document.getElementById('trSubject');
            if (trSubjectEl && !trSubjectEl.value) {
                trSubjectEl.value = 'Treatment Recommendation';
            }
            const tnrSubjectEl = document.getElementById('tnrSubject');
            if (tnrSubjectEl && !tnrSubjectEl.value) {
                tnrSubjectEl.value = 'Treatment Recommendation';
            }
            const evSubjectEl = document.getElementById('evSubject');
            if (evSubjectEl && !evSubjectEl.value) {
                evSubjectEl.value = 'Enrollment Verification';
            }
            const disSalType = document.getElementById('disSalutationType');
            if (disSalType) {
                disSalType.value = 'dear';
                toggleDisSalutationName();
            }
            const eipSalType = document.getElementById('eipSalutationType');
            if (eipSalType) {
                eipSalType.value = 'dear';
                toggleEipSalutationName();
            }
            const trSalType = document.getElementById('trSalutationType');
            if (trSalType) {
                trSalType.value = 'dear';
                toggleTrSalutationName();
            }
            const tnrSalType = document.getElementById('tnrSalutationType');
            if (tnrSalType) {
                tnrSalType.value = 'dear';
                toggleTnrSalutationName();
            }
            const evSalType = document.getElementById('evSalutationType');
            if (evSalType) {
                evSalType.value = 'dear';
                toggleEvSalutationName();
            }
            
            // Set the default closure date for the re-engagement letter
            setClosureDate();
            
            // Populate the diagnosis dropdown
            const dsm5Selector = document.getElementById('dsm5Selector');
            dsm5Disorders.forEach(disorder => {
                const option = document.createElement('option');
                option.value = disorder;
                option.textContent = disorder;
                dsm5Selector.appendChild(option);
            });

            // Keep logo references as direct relative paths for iframe/local compatibility.
            const logoPath = '../../assets/images/logo.png';
            document.getElementById('visible-logo').src = logoPath;
            document.getElementById('pdf-logo').src = logoPath;
            document.getElementById('ev-preview-logo').src = logoPath;

            loadSignature();
            initializeDischargeFieldSync();
            handleTemplateChange();

            const generatedTextEl = document.getElementById('generatedText');
            if (generatedTextEl && !generatedTextEl.dataset.manualOverrideBound) {
                generatedTextEl.addEventListener('input', () => {
                    if (!isUpdatingGeneratedText) {
                        hasManualGeneratedTextOverride = true;
                    }
                });
                generatedTextEl.dataset.manualOverrideBound = 'true';
            }

            // Set initial state for Enrollment Verification interactive form
            toggleSection(document.getElementById('evAttOmit'), 'evAttendanceSection');
            toggleSection(document.getElementById('evToxPositiveOmit'), 'evToxPositiveContainer');
            toggleSection(document.getElementById('evToxNegativeOmit'), 'evToxNegativeContainer');
            toggleSection(document.getElementById('evMatOmit'), 'evMatSection');
        }

        window.onload = function() {
            if (getCookie('isAuthenticated') === 'true') {
                document.getElementById('password-overlay').style.display = 'none';
                document.getElementById('main-content').style.display = 'block';
                initializeApp();
            }
            // Add event listener for the Enter key on the password input
            document.getElementById('password-input').addEventListener('keypress', function(event) {
                if (event.key === 'Enter') {
                    event.preventDefault(); // Prevent form submission
                    checkPassword();
                }
            });
        };

        function handleTemplateChange() {
            const letterType = document.getElementById('letterType').value;
            const allFields = document.querySelectorAll('.form-section');
            allFields.forEach(field => field.style.display = 'none');

            const selectedFields = document.getElementById(letterType + 'Fields');
            if (selectedFields) {
                selectedFields.style.display = 'block';
            }
            // Make the output section visible for all letter types
            document.getElementById('outputSection').style.display = 'block';
            updateClosureDateWarning();
            generateReport();
        }

        function buildSalutation(type, name, custom) {
            if (type === 'dear') {
                return `Dear ${name || '[Name]'},`;
            }
            if (type === 'custom') {
                return custom || '[Custom Salutation]';
            }
            return 'To Whom It May Concern,';
        }

        function getCommonSalutation(fallbackName = '[Name]') {
            const typeEl = document.getElementById('commonSalutationType');
            const nameEl = document.getElementById('commonSalutationName');
            const customEl = document.getElementById('commonCustomSalutation');
            const type = typeEl ? typeEl.value : 'dear';
            const name = nameEl ? (nameEl.value || fallbackName) : fallbackName;
            const custom = customEl ? customEl.value : '';
            return buildSalutation(type, name, custom);
        }

        function getSalutationByPrefix(prefix) {
            const typeEl = document.getElementById(`${prefix}SalutationType`);
            const nameEl = document.getElementById(`${prefix}SalutationName`);
            const customEl = document.getElementById(`${prefix}CustomSalutation`);
            const type = typeEl ? typeEl.value : 'dear';
            const name = nameEl ? (nameEl.value || '[Name]') : '[Name]';
            const custom = customEl ? customEl.value : '';
            return buildSalutation(type, name, custom);
        }

        const dischargeSyncGroups = [
            ['disLetterDate', 'disClientLetterDate', 'disClientSuccessLetterDate'],
            ['disClientFirstName', 'disClientRecipientFirstName', 'disClientSuccessFirstName'],
            ['disClientLastName', 'disClientRecipientLastName', 'disClientSuccessLastName'],
            ['disAdmissionDate', 'disClientAdmissionDate', 'disClientSuccessAdmissionDate'],
            ['disDischargeDate', 'disClientDischargeDate', 'disClientSuccessDischargeDate'],
            ['disNumSessions', 'disClientNumSessions', 'disClientSuccessNumSessions'],
        ];

        function syncDischargeFields(sourceId) {
            const group = dischargeSyncGroups.find((ids) => ids.includes(sourceId));
            if (!group) return;

            const sourceEl = document.getElementById(sourceId);
            if (!sourceEl) return;

            group.forEach((id) => {
                if (id === sourceId) return;
                const targetEl = document.getElementById(id);
                if (targetEl) {
                    targetEl.value = sourceEl.value;
                }
            });
        }

        function initializeDischargeFieldSync() {
            dischargeSyncGroups.forEach((group) => {
                group.forEach((id) => {
                    const field = document.getElementById(id);
                    if (!field) return;

                    const handler = () => syncDischargeFields(id);
                    field.addEventListener('input', handler);
                    field.addEventListener('change', handler);
                });
            });
        }

        document.getElementById('signatureUpload').addEventListener('change', function(event) {
            const [file] = event.target.files;
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const preview = document.getElementById('signaturePreview');
                    preview.src = e.target.result;
                    preview.classList.remove('hidden');
                    generateReport(); // Regenerate report when image is added/changed
                };
                reader.readAsDataURL(file);
            }
        });

        function toggleCommonSalutationName() {
            const salutationType = document.getElementById('commonSalutationType').value;
            const nameWrap = document.getElementById('commonSalutationNameWrap');
            const customWrap = document.getElementById('commonCustomSalutationWrap');
            nameWrap.classList.toggle('hidden', salutationType !== 'dear');
            if (customWrap) customWrap.classList.toggle('hidden', salutationType !== 'custom');
        }

        function toggleSalutationNameByPrefix(prefix) {
            const typeEl = document.getElementById(`${prefix}SalutationType`);
            const wrapEl = document.getElementById(`${prefix}SalutationNameWrap`);
            const customWrapEl = document.getElementById(`${prefix}CustomSalutationWrap`);
            if (!typeEl || !wrapEl) return;
            wrapEl.classList.toggle('hidden', typeEl.value !== 'dear');
            if (customWrapEl) customWrapEl.classList.toggle('hidden', typeEl.value !== 'custom');
        }

        function toggleEipSalutationName() { toggleSalutationNameByPrefix('eip'); }
        function toggleTrSalutationName() { toggleSalutationNameByPrefix('tr'); }
        function toggleTnrSalutationName() { toggleSalutationNameByPrefix('tnr'); }
        function toggleEvSalutationName() { toggleSalutationNameByPrefix('ev'); }

        function toggleRecipientName() {
            const recipientType = document.getElementById('recipientType').value;
            const recipientNameContainer = document.getElementById('recipientNameContainer');
            recipientNameContainer.style.display = recipientType === 'dear' ? 'block' : 'none';
        }

        function toggleDisSalutationName() {
            const salutationType = document.getElementById('disSalutationType').value;
            const nameWrap = document.getElementById('disSalutationNameWrap');
            const customWrap = document.getElementById('disCustomSalutationWrap');
            if (!nameWrap) return;
            nameWrap.classList.toggle('hidden', salutationType !== 'dear');
            if (customWrap) customWrap.classList.toggle('hidden', salutationType !== 'custom');
        }

        function togglePositiveSubstance() {
            const toxResult = document.querySelector('input[name="toxResult"]:checked').value;
            const positiveContainer = document.getElementById('positiveSubstanceContainer');
            positiveContainer.style.display = toxResult === 'positive' ? 'block' : 'none';
        }

        function toggleTrPositiveSubstance() {
            const toxResult = document.querySelector('input[name="trToxResult"]:checked').value;
            const positiveContainer = document.getElementById('trPositiveSubstanceContainer');
            positiveContainer.style.display = toxResult === 'positive' ? 'block' : 'none';
        }
        
        function toggleOasasOther() {
            const oasasResult = document.getElementById('disOasasReasonSelect').value;
            const otherContainer = document.getElementById('oasasOtherContainer');
            otherContainer.style.display = oasasResult === 'Other' ? 'block' : 'none';
        }

        function toggleSection(checkbox, sectionId) {
            const section = document.getElementById(sectionId);
            if (!section) return;

            const inputs = section.querySelectorAll('input, select');
            const isOmitted = checkbox.checked;

            if (isOmitted) {
                section.classList.add('disabled');
            } else {
                section.classList.remove('disabled');
            }

            inputs.forEach(input => {
                if (input !== checkbox) { // Don't disable the controller checkbox itself
                    input.disabled = isOmitted;
                }
            });
        }


        function saveSignature() {
            const signaturePreview = document.getElementById('signaturePreview');
            const signatureData = {
                name: document.getElementById('counselorName').value,
                credentials: document.getElementById('counselorCredentials').value,
                extension: document.getElementById('counselorExtension').value,
                email: document.getElementById('counselorEmail').value,
                imgSrc: signaturePreview.src.startsWith('data:image') ? signaturePreview.src : null
            };
            // NOTE(security): avoid storing PHI in localStorage; keep only minimal signature metadata.
            localStorage.setItem('delphiRiseSignatureInfo', JSON.stringify(signatureData));
            showNotification('Signature information saved!');
        }

        function loadSignature() {
            // NOTE(security): avoid storing PHI in localStorage; keep only minimal signature metadata.
            const savedData = localStorage.getItem('delphiRiseSignatureInfo');
            if (savedData) {
                const signatureData = JSON.parse(savedData);
                document.getElementById('counselorName').value = signatureData.name || '';
                document.getElementById('counselorCredentials').value = signatureData.credentials || '';
                document.getElementById('counselorExtension').value = signatureData.extension || '';
                document.getElementById('counselorEmail').value = signatureData.email || '';
                if (signatureData.imgSrc) {
                    const signaturePreview = document.getElementById('signaturePreview');
                    signaturePreview.src = signatureData.imgSrc;
                    signaturePreview.classList.remove('hidden');
                }
            }
        }

        function deleteSignature() {
            localStorage.removeItem('delphiRiseSignatureInfo');
            document.getElementById('counselorName').value = '';
            document.getElementById('counselorCredentials').value = '';
            document.getElementById('counselorExtension').value = '';
            document.getElementById('counselorEmail').value = '';
            const signaturePreview = document.getElementById('signaturePreview');
            signaturePreview.src = '';
            signaturePreview.classList.add('hidden');
            document.getElementById('signatureUpload').value = null;
            showNotification('Saved signature information deleted.');
            generateReport();
        }

        function setClosureDate() {
            const today = new Date();
            let futureDate = new Date();
            futureDate.setDate(today.getDate() + 7);

            const dayOfWeek = futureDate.getDay(); // Sunday = 0, Friday = 5
            const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
            futureDate.setDate(futureDate.getDate() + daysUntilFriday);

            const yyyy = futureDate.getFullYear();
            const mm = String(futureDate.getMonth() + 1).padStart(2, '0');
            const dd = String(futureDate.getDate()).padStart(2, '0');
            const closureDateString = `${yyyy}-${mm}-${dd}`;
            document.getElementById('closureDate').value = closureDateString;
        }

        function updateClosureDateWarning() {
            const lastServiceDateVal = document.getElementById('lastServiceDate')?.value;
            const closureDateVal = document.getElementById('closureDate')?.value;
            const warningEl = document.getElementById('closureDateWarning');
            if (!warningEl) return;

            if (!lastServiceDateVal || !closureDateVal) {
                warningEl.classList.add('hidden');
                return;
            }

            const lastServiceDate = new Date(lastServiceDateVal);
            const closureDate = new Date(closureDateVal);
            if (isNaN(lastServiceDate.getTime()) || isNaN(closureDate.getTime())) {
                warningEl.classList.add('hidden');
                return;
            }

            const differenceInTime = closureDate.getTime() - lastServiceDate.getTime();
            const differenceInDays = Math.floor(differenceInTime / (1000 * 3600 * 24));
            warningEl.classList.toggle('hidden', differenceInDays >= 60 || differenceInDays < 0);
        }
        
        // --- Diagnosis Management ---
        function addDiagnosis() {
            const selector = document.getElementById('dsm5Selector');
            const diagnosis = selector.value;
            if (diagnosis && !selectedDiagnoses.includes(diagnosis)) {
                selectedDiagnoses.push(diagnosis);
                renderDiagnoses();
                generateReport();
            }
        }

        function removeDiagnosis(index) {
            selectedDiagnoses.splice(index, 1);
            renderDiagnoses();
            generateReport();
        }

        function renderDiagnoses() {
            const container = document.getElementById('diagnosesContainer');
            container.innerHTML = '';
            selectedDiagnoses.forEach((diagnosis, index) => {
                const div = document.createElement('div');
                div.className = 'flex items-center justify-between bg-blue-100 p-2 rounded-lg';
                div.innerHTML = `
                    <span class="text-blue-800">${diagnosis}</span>
                    <button type="button" data-action="removeDiagnosis" data-action-arg="${index}" class="text-red-500 hover:text-red-700 font-bold text-lg">&times;</button>
                `;
                container.appendChild(div);
            });
        }

        function formatDiagnoses(diagnoses) {
            if (diagnoses.length === 0) return '[diagnosis]';
            if (diagnoses.length === 1) return diagnoses[0];
            if (diagnoses.length === 2) return diagnoses.join(' and ');
            return diagnoses.slice(0, -1).join(', ') + ', and ' + diagnoses.slice(-1);
        }

        function generateReport() {
            const letterType = document.getElementById('letterType').value;
            switch (letterType) {
                case 'generalUse':
                    generateGeneralUseReport();
                    break;
                case 'treatmentNotRec':
                    generateTreatmentNotRecReport();
                    break;
                case 'evalInProgress':
                    generateEvalInProgressReport();
                    break;
                case 'reEngagement':
                    generateReEngagementReport();
                    break;
                case 'treatmentRec':
                    generateTreatmentRecReport();
                    break;
                case 'dischargeExternal':
                    generateDischargeReport();
                    break;
                case 'dischargeClient':
                    generateDischargeClientReport();
                    break;
                case 'dischargeClientSuccess':
                    generateDischargeClientSuccessReport();
                    break;
                case 'enrollmentVerification':
                    generateEnrollmentVerificationReport();
                    break;
            }
            const includeReferrals = document.getElementById('includeReferrals')?.checked;
            updateClosureDateWarning();
            if (includeReferrals) appendResourcesToTextarea();
        }

        function setGeneratedText(value) {
            const textarea = document.getElementById('generatedText');
            if (!textarea) return;
            isUpdatingGeneratedText = true;
            textarea.value = value;
            isUpdatingGeneratedText = false;
            hasManualGeneratedTextOverride = false;
        }
        
        // --- Report Generation Functions ---
        
        const formatDate = (dateString, placeholder) => {
            if (!dateString) return `[${placeholder}]`;
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return `[${placeholder}]`;
            const adjustedDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
            return adjustedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        };

        const APPENDIX_HEADER = "=====\nAlso included with the letter:\n=====";
        const APPENDIX_TEXT = `${APPENDIX_HEADER}
DELPHI RISE - RECOVERY RESOURCES & TREATMENT OPTIONS
Rochester, NY Area

RECOVERY SUPPORTS - 24/7 SUPPORT

Open Access
Text: 585-313-1385
Call: 585-627-1777
Location: 72 Hinchey Road, Rochester, NY
Description: 24/7 peer-led support and linkage to support services.

MEDICATION-ASSISTED TREATMENT (MAT) - MAT-ONLY PROVIDERS

Integrated Medication-Assisted Treatment (iMAT)
Phone: (585) 974-5513
Address: 1425 Portland Ave, Bldg. 1, Rochester, NY
Description: Comprehensive outpatient MAT services for opioid and alcohol use.

Trillium Health
Phone: (585) 454-5556
Address: 259 Monroe Avenue, Rochester, NY
Description: Comprehensive outpatient MAT services for opioid and alcohol use.

Helio Health - Medication Focused
Phone: (585) 851-3570
Address: 150 Mount Hope Avenue, Rochester, NY
Description: Medication management (buprenorphine, Suboxone) for opioid use.

Highland Family Medicine
Phone: (585) 324-4527
Address: 777 South Clinton Avenue, Rochester, NY
Description: MAT program for individuals with stable opioid use disorder.

MATTERS Network (Virtual Telehealth)
Phone: (765) 628-8377
Description: Virtual same-day MAT appointments and urgent referrals. Financial assistance available through Bupe-AP program.

Ophelia
Phone: (215) 585-2144
Website: www.ophelia.com

Description: Online opioid addiction treatment.

HARM REDUCTION SERVICES

Trillium Syringe Service Program
Phone: (585) 454-5556
Address: 39 Delevan Street, Rochester, NY
Description: Sterile injection supplies.

Test Strips (MATTERS Network)
Phone: (765) 628-8377
Description: Free test strips mailed to you.

Syringe Service (MATTERS Network)
Phone: (765) 628-8377
Description: Free syringes mailed to you.

SUBSTANCE USE DISORDER (SUD) TREATMENT PROVIDERS - OUTPATIENT

Action for a Better Community - New Directions
Phone: 585-325-5116
Address: 33 Chestnut Street, Rochester, NY
Description: Outpatient SUD treatment.

Baden Street
Phone: 585-325-4910
Address: 152 Baden Street, Rochester, NY
Description: Outpatient SUD treatment.

Catholic Charities Family and Community Services
Phone: 585-262-7000
Address: 79 N. Clinton Avenue, Rochester, NY
Description: Outpatient SUD treatment.

Conifer Park
Phone: 585-442-8422
Address: 556 S. Clinton Avenue, Rochester, NY
Description: Outpatient SUD treatment.

Helio Health Outpatient
Phone: 585-287-5626
Address: 150 Mt. Hope Avenue, Rochester, NY
Description: Outpatient SUD treatment.

Huther Doyle
Phone: 585-325-5100
Address: 360 East Avenue, Rochester, NY
Description: Outpatient SUD treatment.

Strong Recovery
Phone: 585-275-3161
Address: 2613 West Henrietta Road, Rochester, NY
Description: Outpatient SUD treatment.

Villa of Hope
Phone: 585-865-5110
Address: 3300 Dewey Avenue, Rochester, NY
Description: Outpatient SUD treatment.

Westfall Practice
Phone: 585-473-1500
Address: 179 Sully's Trail, Rochester, NY
Description: Outpatient SUD treatment.

PEER SUPPORT & FAMILY RESOURCES

Catholic Charities Dual-Diagnosis Clinic
Phone: (585) 546-7220
Description: Specialized treatment for co-occurring mental health and substance use disorders (Restart team).

AA Rochester
Phone: (585) 232-6720
Website: www.rochesteraa.org

App: Meeting Guide
Description: Alcoholics Anonymous meeting locator.

Celebrate Recovery
Website: www.celebraterecovery.com

Description: Christian-based twelve-step program.

CORE Center
Phone: 585-328-8230
Facebook: https://www.facebook.com/TheCORECenter1

Description: Peer-led recovery resource center.

Gates to Recovery
Phone: 585-310-4080
Description: Peer-to-peer engagement and outreach in Webster, Penfield, East Rochester, Fairport, Brockport/Hamlin, and Irondequoit.

Heroin Anonymous (HA) Rochester
Phone: 585-348-8129
Email: WNYDistrictHA@gmail.com

Website: https://wnydha.org/

Rochester Meetings: https://wnydha.org/?page_id=88

Description: Support groups modeled after AA for opiate addiction.

Hope Dealers Support Group
Website: https://www.hopedealersbtc.com/

In The Rooms (Online Resource)
Website: https://www.intherooms.com/

Description: Online recovery meetings, daily meditations, and support resources.

Delphi Rise Open Access
Phone: (585) 467-2230
Description: Evaluation and referrals to outpatient, detoxification, and inpatient settings. Immediate peer support.

Liberty Resources Peer Support
Phone: (855) 778-1300
Description: Peer support for recovery.

ROCovery Fitness Peer Support
Phone: (585) 484-0234
Website: https://www.rocoveryfitness.org/

Description: Sober active community focused on healing and recovery.

Narcotics Anonymous Hotline
Phone: (585) 235-7889
Description: 12-step support.

Liberty Resources
Peer Support: (855) 778-1300
Family Support: (855) 778-1200
Description: Certified peer support services.

Nar-Anon
Website: www.nar-anon.org

Description: Support for family and friends of individuals with addiction.

Al-Anon / Alateen
Phone: (585) 288-0540
Website: www.aisrochester.org

Description: Support for families and teens affected by someone else's alcohol use.

Monroe County IMPACT Program
Phone: (585) 753-5300
Description: Overdose survivor support, resources, and Narcan training.

Mental Health Association
Phone: 585-325-3145
Description: Creative Wellness Opportunities workshops and mutual support groups.

NA Rochester
Website: https://recoveryispossible.nny-na.org/

Description: Narcotics Anonymous meetings.

Online Intergroup of AA
Website: https://aa-intergroup.org/

Description: Worldwide online AA meetings directory.

RAW - Recovery All Ways
Phone: 585-310-0729
Website: http://www.recoveryallways.org/

Description: Support for those affected by substance use, mental health concerns, and homelessness.

Refuge Recovery
Website: https://www.refugerecovery.org/

Rochester Facebook: https://www.facebook.com/RefugeRecoveryRochester/

Description: Buddhist path to addiction recovery.

Secular Organizations for Sobriety (SOS)
Email: info@sos-rochester.org

Website: https://www.sos-rochester.org/

Description: Non-religious recovery support group.

SMART Recovery
Website: https://www.smartrecovery.org/

Description: Secular, research-based recovery support with daily online meetings.

S.O.A.R.S., Inc.
Phone: 585-771-0896
Email: rebeccabaker@yahoo.com

Facebook: http://www.facebook.com/SOARSRocs

Description: Support for individuals and families impacted by substance use and mental health disorders. Grief support and recovery resources.`;

        function appendResourcesToTextarea() {
            const textarea = document.getElementById('generatedText');
            if (!textarea) return;
            const current = textarea.value || '';
            const base = current.includes(APPENDIX_HEADER) ? current.split(APPENDIX_HEADER)[0].trimEnd() : current.trimEnd();
            textarea.value = `${base}\n\n${APPENDIX_TEXT}`.trimEnd();
        }
        
        function generateGeneralUseReport() {
            const letterDate = formatDate(document.getElementById('guLetterDate').value, "Today's Date");
            const subject = document.getElementById('commonSubject').value;
            const salutation = getCommonSalutation();
            const body = document.getElementById('guBody').value || '[Letter body]';
            
            const mainParagraphs = [
                letterDate
            ];
            
            if (subject) {
                mainParagraphs.push(`Subject: ${subject}`);
            }
            mainParagraphs.push(salutation);
            
            mainParagraphs.push(body);
            
            const signatureBlock = getSignatureBlock();
            const fullText = mainParagraphs.join('\n\n') + `\n\n\n${signatureBlock}`;
            setGeneratedText(fullText);
        }
        
        function generateDischargeReport() {
            const letterDate = formatDate(document.getElementById('disLetterDate').value, "Today's Date");
            const dischargeDate = formatDate(document.getElementById('disDischargeDate').value, "Discharge Date");
            const clientFirstName = document.getElementById('disClientFirstName').value || '[First Name]';
            const clientLastName = document.getElementById('disClientLastName').value || '[Last Name]';
            const clientFullName = `${clientFirstName} ${clientLastName}`.trim();
            const clientDOB = formatDate(document.getElementById('disClientDOB').value, "date of birth");
            const admissionDate = formatDate(document.getElementById('disAdmissionDate').value, "Admission Date");
            const numSessions = document.getElementById('disNumSessions').value || '[Number of Sessions]';
            const goalAchievement = document.getElementById('disGoalAchievement').value;
            const subject = document.getElementById('disSubject').value;
            const disSalutation = getSalutationByPrefix('dis');

            let oasasReasonText = document.getElementById('disOasasReasonSelect').value;
            let finalOasasSentence;

            if (oasasReasonText === 'Other') {
                const otherText = document.getElementById('disOasasOtherText').value || '______________________________';
                finalOasasSentence = `Client was discharged for another reason: ${otherText}.`;
            } else {
                finalOasasSentence = `Client ${oasasReasonText}.`;
            }

            const mainParagraphs = [
                letterDate
            ];

            if (subject) {
                mainParagraphs.push(`Subject: ${subject}`);
            }

            mainParagraphs.push(
                disSalutation,
                `This letter is to confirm that ${clientFullName}, date of birth ${clientDOB}, was admitted to Delphi Rise Outpatient on ${admissionDate} and discharged on ${dischargeDate}.`,
                `During treatment, ${clientFirstName} attended a total of ${numSessions} sessions. At the time of discharge, ${clientFirstName} ${goalAchievement} the treatment goals established at the start of services.`,
                `In accordance with OASAS reporting requirements, this discharge is recorded as follows: ${finalOasasSentence}`,
                `If further information is required, please contact me using the information provided below.`
            );
            
            const signatureBlock = getSignatureBlock();
            const fullText = mainParagraphs.join('\n\n') + `\n\nSincerely,\n\n\n\n${signatureBlock}`;
            setGeneratedText(fullText);
        }

        function generateDischargeClientReport() {
            const letterDate = formatDate(document.getElementById('disClientLetterDate').value, "Today's Date");
            const subject = document.getElementById('disClientSubject').value || 'Completion of Services';
            const firstName = document.getElementById('disClientRecipientFirstName').value || '[First Name]';
            const admissionDate = formatDate(document.getElementById('disClientAdmissionDate').value, "Admission Date");
            const dischargeDate = formatDate(document.getElementById('disClientDischargeDate').value, "Discharge Date");
            const numSessions = document.getElementById('disClientNumSessions').value || '[Number of Sessions]';
            const attendedSentence = String(numSessions).trim() === '1'
                ? `This letter confirms that you were admitted to outpatient services at Delphi Rise on ${admissionDate} and that your services concluded on ${dischargeDate}. During this time, you attended 1 session.`
                : `This letter confirms that you were admitted to outpatient services at Delphi Rise on ${admissionDate} and that your services concluded on ${dischargeDate}. During this time, you attended ${numSessions} sessions and worked toward the goals we identified at the start of treatment.`;

            const mainParagraphs = [
                letterDate,
                `Subject: ${subject}`,
                `Dear ${firstName},`,
                attendedSentence,
                `If you feel that additional support would be helpful in the future, you are welcome to contact Delphi Rise to explore re-engaging in services or to discuss other available resources.`,
                `If you need documentation of your participation or have questions about future services, please feel free to contact me.`,
                `I wish you the best moving forward.`
            ];

            const signatureBlock = getSignatureBlock();
            const fullText = mainParagraphs.join('\n\n') + `\n\nSincerely,\n\n\n\n${signatureBlock}`;
            setGeneratedText(fullText);
        }

        function generateDischargeClientSuccessReport() {
            const letterDate = formatDate(document.getElementById('disClientSuccessLetterDate').value, "Today's Date");
            const subject = document.getElementById('disClientSuccessSubject').value || 'Completion of Treatment';
            const firstName = document.getElementById('disClientSuccessFirstName').value || '[First Name]';
            const admissionDate = formatDate(document.getElementById('disClientSuccessAdmissionDate').value, "Admission Date");
            const dischargeDate = formatDate(document.getElementById('disClientSuccessDischargeDate').value, "Discharge Date");
            const numSessions = document.getElementById('disClientSuccessNumSessions').value || '[Number of Sessions]';

            const mainParagraphs = [
                letterDate,
                `Subject: ${subject}`,
                `Dear ${firstName},`,
                `This letter confirms that you were admitted to outpatient services at Delphi Rise on ${admissionDate} and successfully completed treatment on ${dischargeDate}.`,
                `During your time in treatment, you attended ${numSessions} sessions and worked toward the goals we identified at the beginning of services. Your participation and effort contributed to the progress you made during this time.`,
                `Completing treatment is a meaningful accomplishment. Reaching this point reflects the time, effort, and persistence you invested in the process. The work you have done to address challenges, build insight, and develop healthier patterns can continue to support you moving forward.`,
                `If you feel that additional support would be helpful in the future, you are welcome to contact Delphi Rise to explore returning to services or to discuss other available resources.`,
                `If you need documentation of your participation or have questions in the future, please feel free to reach out.`,
                `I wish you continued success.`
            ];

            const signatureBlock = getSignatureBlock();
            const fullText = mainParagraphs.join('\n\n') + `\n\nSincerely,\n\n\n\n${signatureBlock}`;
            setGeneratedText(fullText);
        }

        function generateEnrollmentVerificationReport() {
            // Update live preview elements within the form
            const evLetterDateVal = document.getElementById('evLetterDate').value;
            document.getElementById('ev-todays-date-display').textContent = formatDate(evLetterDateVal, "Today's Date");
            const evSubjectVal = document.getElementById('evSubject').value;
            const evSalutation = getSalutationByPrefix('ev');
            document.getElementById('ev-signature-block-preview').textContent = getSignatureBlock();

            // Build the final text for copy/PDF
            const clientFirstName = document.getElementById('evClientFirstName').value || '[Client First Name]';
            const clientLastName = document.getElementById('evClientLastName').value || '[Client Last Name]';
            const clientFullName = `${clientFirstName} ${clientLastName}`.trim();
            const clientDOB = formatDate(document.getElementById('evClientDOB').value, "date of birth");
            const startDate = formatDate(document.getElementById('evStartDate').value, "Start Date");
            const salutation = evSalutation;

            const bodyParagraphs = [
                document.getElementById('ev-todays-date-display').textContent
            ];
            if (evSubjectVal) {
                bodyParagraphs.push(`Subject: ${evSubjectVal}`);
            }
            bodyParagraphs.push(
                salutation,
                `This letter is to verify that ${clientFullName}, date of birth ${clientDOB}, is currently enrolled in services with Delphi Rise. Services began on ${startDate}.`
            );

            // Attendance
            if (!document.getElementById('evAttOmit').checked) {
                const attendance = document.getElementById('evAttendance').value;
                bodyParagraphs.push(`The client has been attending services on ${attendance} basis.`);
            }

            // Positive Toxicology
            if (!document.getElementById('evToxPositiveOmit').checked) {
                const positiveDate = document.getElementById('evToxPositiveDate').value;
                if (positiveDate) {
                    const substance = document.getElementById('evToxPositiveSubstance').value || '[Substance]';
                    bodyParagraphs.push(`The most recent positive toxicology screen was on ${formatDate(positiveDate, 'Date')} for ${substance}.`);
                }
            }
            // Negative Toxicology
            if (!document.getElementById('evToxNegativeOmit').checked) {
                const negativeDate = document.getElementById('evToxNegativeDate').value;
                if (negativeDate) {
                    bodyParagraphs.push(`All toxicology screens have been negative since ${formatDate(negativeDate, 'Date')}.`);
                }
            }
            
            // MAT
            if (!document.getElementById('evMatOmit').checked) {
                bodyParagraphs.push(`The client is currently participating in our medication-assisted treatment (MAT) program.`);
            }

            bodyParagraphs.push(
                `Delphi Rise provides a range of recovery and supportive services designed to assist individuals in achieving and maintaining recovery, addressing substance use concerns, and supporting overall well-being. This verification is provided to confirm current enrollment and participation in services only.`,
                `Should you have any additional questions or require further details, please do not hesitate to contact our office.`
            );

            const signatureBlock = getSignatureBlock();
            const fullText = bodyParagraphs.join('\n\n') + `\n\nSincerely,\n\n\n\n${signatureBlock}`;
            
            // The generatedText textarea is now primarily for the PDF/Copy functions, not for display.
            setGeneratedText(fullText);
        }

        function generateTreatmentRecReport() {
            const clientFirstName = document.getElementById('trClientFirstName').value || "[Client's First Name]";
            const clientLastName = document.getElementById('trClientLastName').value || "[Client's Last Name]";
            const clientFullName = `${clientFirstName} ${clientLastName}`.trim();
            const clientDob = formatDate(document.getElementById('trClientDob').value, 'date of birth');
            const letterDate = formatDate(document.getElementById('trLetterDate').value, "DATE");
            const evaluationDate = formatDate(document.getElementById('trEvaluationDate').value, "Date of Evaluation");
            const diagnosisText = formatDiagnoses(selectedDiagnoses);
            const levelOfCare = document.getElementById('trLevelOfCare').value || '[level of care]';
            const toxScreenDate = formatDate(document.getElementById('trToxScreenDate').value, "Toxicology Screen Date");
            const toxResult = document.querySelector('input[name="trToxResult"]:checked').value;
            const salutation = getSalutationByPrefix('tr');
            const subject = document.getElementById('trSubject').value;
            let toxSentence = `${clientFirstName}'s toxicology screen, which was collected on ${toxScreenDate}, was ${toxResult}`;
            if (toxResult === 'positive') {
                const substances = document.getElementById('trPositiveSubstance').value || '[substances]';
                toxSentence += ` for ${substances}.`;
            } else {
                toxSentence += '.';
            }

            const mainParagraphs = [
                letterDate
            ];

                mainParagraphs.push(`Subject: Evaluation report for ${clientFirstName} ${clientLastName}`);

                mainParagraphs.push(
                    salutation,
                    `On ${evaluationDate}, ${clientFullName}, date of birth ${clientDob}, completed a substance and alcohol use disorder evaluation at Delphi Rise. The evaluation included gathering a history of substance and alcohol use, collateral interviews, a toxicology screen, and a brief screen to identify potential mental health concerns.`,
                    `Based on this comprehensive clinical evaluation, ${clientFirstName} has been diagnosed with ${diagnosisText} and is recommended for ${levelOfCare} treatment. ${toxSentence}`,
                    `Delphi Rise is committed to providing personalized, evidence-based treatment to help clients achieve long-term recovery. We believe that ${clientFirstName} would benefit from ongoing engagement in the recommended services and a structured, supportive environment to address the challenges of substance and alcohol use.`,
                    `Please feel free to contact us if you require any additional information or clarification regarding this evaluation or the services we provide.`
                );

            const signatureBlock = getSignatureBlock();
            const fullText = mainParagraphs.join('\n\n') + `\n\nSincerely,\n\n\n\n${signatureBlock}`;
            setGeneratedText(fullText);
        }

        function generateTreatmentNotRecReport() {
            const clientFirstName = document.getElementById('clientFirstName').value || "[Client's First Name]";
            const clientLastName = document.getElementById('clientLastName').value || "[Client's Last Name]";
            const clientFullName = `${clientFirstName} ${clientLastName}`.trim() || "[Client's Full Name]";
            const clientDob = formatDate(document.getElementById('clientDob').value, 'date of birth');
            const letterDate = formatDate(document.getElementById('tnrLetterDate').value, "Date of Report");
            const subject = document.getElementById('tnrSubject').value;
            const recipientSalutation = getSalutationByPrefix('tnr');
            const evaluationDate = formatDate(document.getElementById('evaluationDate').value, 'Evaluation Date');
            const toxScreenDate = formatDate(document.getElementById('toxScreenDate').value, 'Tox Screen Date');
            const includeInterviews = document.getElementById('includeInterviews').checked;
            let assessmentParts = ["a thorough review of " + clientFirstName + "'s history", "a toxicology screen"];
            if (includeInterviews) {
                assessmentParts.splice(1, 0, 'personal interviews');
            }
            let assessmentString = assessmentParts.length === 2 ? assessmentParts.join(' and ') : assessmentParts.slice(0, -1).join(', ') + ', and ' + assessmentParts.slice(-1);
            const firstP = `I am writing to provide an update regarding ${clientFullName}, date of birth ${clientDob}, who was evaluated at Delphi Rise on ${evaluationDate} for substance and alcohol use disorders. As part of our comprehensive assessment, a detailed evaluation was conducted, including ${assessmentString}.`;
            const toxResult = document.querySelector('input[name="toxResult"]:checked').value;
            let toxParagraph = '';
            if (toxResult === 'negative') {
                toxParagraph = `The toxicology screen was collected on ${toxScreenDate} and was negative for all substances and alcohol.`;
            } else {
                const substance = document.getElementById('positiveSubstance').value || '_______';
                toxParagraph = `The toxicology screen was collected on ${toxScreenDate} and was positive for ${substance}.`;
            }
            const conclusionSource = includeInterviews ? 'our clinical evaluation and interviews' : 'our clinical evaluation';
            const conclusionParagraph = `Additionally, based on ${conclusionSource}, there is no current evidence suggesting a substance or alcohol use disorder at this time.`;
            
            const mainParagraphs = [
                letterDate
            ];

                mainParagraphs.push(`Subject: Evaluation Report for ${clientFirstName} ${clientLastName}`);

                mainParagraphs.push(
                    recipientSalutation,
                    firstP,
                    `${toxParagraph} ${conclusionParagraph}`,
                    `Given these findings, we do not recommend ${clientFirstName} for further treatment or intervention related to substance use at this moment. Should there be any future concerns or changes in ${clientFirstName}'s status, we would be prepared to reassess and provide further recommendations as needed.`,
                    `Please let us know if there are any additional requirements or if further information is needed. We are committed to supporting ${clientFirstName}'s ongoing progress and well-being in any way we can.`
                );
            
            const signatureBlock = getSignatureBlock();
            const fullText = mainParagraphs.join('\n\n') + `\n\nSincerely,\n\n\n\n${signatureBlock}`;
            setGeneratedText(fullText);
        }

        function generateEvalInProgressReport() {
            const formatTime = (timeString, placeholder) => {
                if (!timeString) return `[${placeholder}]`;
                const [hours, minutes] = timeString.split(':');
                const date = new Date();
                date.setHours(hours, minutes);
                return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            };
            const clientFirstName = document.getElementById('eipClientFirstName').value || "[Client's First Name]";
            const clientLastName = document.getElementById('eipClientLastName').value || "[Client's Last Name]";
            const clientFullName = `${clientFirstName} ${clientLastName}`.trim();
            const clientDob = formatDate(document.getElementById('eipClientDob').value, 'date of birth');
            const letterDate = formatDate(document.getElementById('eipLetterDate').value, "Today's Date");
            const evaluationDate = formatDate(document.getElementById('eipEvaluationDate').value, 'Evaluation Date');
            const evaluationTime = formatTime(document.getElementById('eipEvaluationTime').value, 'Evaluation Time');
            const salutation = getSalutationByPrefix('eip');
            const subject = document.getElementById('eipSubject').value;
            
            const mainParagraphs = [
                letterDate
            ];

            if (subject) {
                mainParagraphs.push(`Subject: ${subject}`);
            }

            mainParagraphs.push(
                salutation,
                `Re: Evaluation Status for ${clientFullName}`,
                `I am writing to inform you of the current status of the substance use disorder evaluation for ${clientFullName}, date of birth ${clientDob}, which took place on ${evaluationDate} at ${evaluationTime}.`,
                `${clientFirstName} attended the evaluation as scheduled. The assessment has been conducted; however, the results are currently pending the completion of a toxicology screen, which is necessary for a comprehensive evaluation.`,
                `We will provide the final evaluation results as soon as the toxicology screen results are available. Please feel free to contact our office if you need any additional information or if there are any specific forms or documentation required in the interim.`,
                `Thank you for your attention to this matter.`
            );
            
            const signatureBlock = getSignatureBlock();
            const fullText = mainParagraphs.join('\n\n') + `\n\nSincerely,\n\n\n\n${signatureBlock}`;
            setGeneratedText(fullText);
        }
        
        function generateReEngagementReport() {
            const clientFirstName = document.getElementById('reClientFirstName').value || '[FIRST NAME]';
            const clientLastName = document.getElementById('reClientLastName').value || '[LAST NAME]';
            const clientFullName = `${clientFirstName} ${clientLastName}`.trim();
            const address = document.getElementById('reClientAddress').value || '[ADDRESS]';
            const cityStateZip = document.getElementById('reClientCityStateZip').value || '[CITY], [STATE] [ZIP]';
            const todaysDateFormatted = formatDate(document.getElementById('reTodaysDate').value, "TODAY'S DATE");
            const closureDate = formatDate(document.getElementById('closureDate').value, "CLOSURE DATE");
            const salutation = getCommonSalutation(clientFirstName);

            // Calculate days since last service
            const lastServiceDateVal = document.getElementById('lastServiceDate').value;
            const reTodaysDateVal = document.getElementById('reTodaysDate').value;
            let daysDifference = '[XX]';
            if (lastServiceDateVal && reTodaysDateVal) {
                const lastServiceDate = new Date(lastServiceDateVal);
                const reTodaysDate = new Date(reTodaysDateVal);
                if (!isNaN(lastServiceDate.getTime()) && !isNaN(reTodaysDate.getTime())) {
                    const differenceInTime = reTodaysDate.getTime() - lastServiceDate.getTime();
                    const differenceInDays = Math.round(differenceInTime / (1000 * 3600 * 24));
                    daysDifference = differenceInDays >= 0 ? differenceInDays : '[XX]';
                }
            }

            const addressBlock = [clientFullName, address, cityStateZip].join('\n');
            
            const bodyParagraphs = [
                todaysDateFormatted,
                salutation,
                `I hope you're doing well. It has been ${daysDifference} days since your last service with us, and in accordance with OASAS regulations, we are required to close your chart after 60 days if there is no further engagement. However, we want to ensure you continue receiving the support and services that can help you in your recovery.`,
                `If you would like to remain active with Delphi Rise and continue receiving services, we ask that you schedule an appointment by ${closureDate}. You can do so by calling us at 585-467-2230.`,
                `If there are any barriers preventing you from scheduling, please reach out-we are happy to discuss ways to help. We value your well-being and hope to continue supporting you on your journey.`
            ];

            const signatureBlock = getSignatureBlock();
            const fullText = bodyParagraphs.join('\n\n') + `\n\nSincerely,\n\n\n\n${signatureBlock}`;
            setGeneratedText(`${addressBlock}\n\n${fullText}`);
        }

        function getSignatureBlock() {
            const counselorName = document.getElementById('counselorName').value || "[Counselor's Name]";
            const counselorCredentials = document.getElementById('counselorCredentials').value;
            const counselorExtension = document.getElementById('counselorExtension').value || '[Extension]';
            const counselorEmail = document.getElementById('counselorEmail').value || "[Counselor's E-Mail]";
            
            const nameLine = counselorCredentials ? `${counselorName}, ${counselorCredentials}` : counselorName;

            return `${nameLine}\nOutpatient Counselor\nDelphi Rise\n72 Hinchey Road\nRochester, NY 14624\n585-467-2230 ext. ${counselorExtension}\n${counselorEmail}`;
        }

        function copyText() {
            if (!hasManualGeneratedTextOverride) {
                generateReport();
            }
            const textarea = document.getElementById('generatedText');
            textarea.select();
            textarea.setSelectionRange(0, 99999);
            try {
                // Use execCommand as a fallback for iframe environments where Clipboard API might be restricted.
                document.execCommand('copy');
                showNotification('Report text copied to clipboard!');
            } catch (err) {
                showNotification('Failed to copy text.', true);
                console.error('Copy to clipboard failed:', err);
            }
        }

        let referralsPdfBytesPromise = null; // cache to avoid repeated fetches

        async function getReferralsPdfBytes() {
            if (referralsPdfBytesPromise) return referralsPdfBytesPromise;

            const candidates = [
                new URL('../../assets/documents/Referrals.pdf', window.location.href).toString()
            ];

            referralsPdfBytesPromise = (async () => {
                let lastError = null;
                for (const url of candidates) {
                    try {
                        const response = await fetch(url, { cache: 'no-cache' });
                        if (!response.ok) {
                            lastError = new Error(`Unable to fetch Referrals.pdf from ${url} (status ${response.status})`);
                            continue;
                        }
                        return await response.arrayBuffer();
                    } catch (err) {
                        lastError = err;
                        continue;
                    }
                }
                throw lastError || new Error('Unable to fetch Referrals.pdf');
            })().catch(err => {
                referralsPdfBytesPromise = null; // allow retry on next attempt
                throw err;
            });

            return referralsPdfBytesPromise;
        }

        async function processSignatureImage(dataUrl) {
            // Create a canvas to process the signature image and remove grey backgrounds
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            return new Promise((resolve) => {
                img.onload = function() {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    
                    // Draw image
                    ctx.drawImage(img, 0, 0);
                    
                    // Get image data
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;
                    
                    // Remove grey backgrounds by making them transparent
                    // Grey values are typically similar in R, G, B channels
                    for (let i = 0; i < data.length; i += 4) {
                        const r = data[i];
                        const g = data[i + 1];
                        const b = data[i + 2];
                        const a = data[i + 3];
                        
                        // Check if pixel is light grey/white (potential background)
                        // If R, G, B are very similar and light (> 200), make transparent
                        const max = Math.max(r, g, b);
                        const min = Math.min(r, g, b);
                        const diff = max - min;
                        
                        if (diff < 30 && max > 200 && a > 200) {
                            // This is a light grey/white pixel, make it transparent
                            data[i + 3] = 0;
                        }
                    }
                    
                    ctx.putImageData(imageData, 0, 0);
                    resolve(canvas.toDataURL('image/png'));
                };
                
                img.src = dataUrl;
            });
        }

        async function downloadPDF() {
            const { jsPDF } = window.jspdf;
            const currentReportText = document.getElementById('generatedText').value;
            const signaturePreview = document.getElementById('signaturePreview');
            const hasSignatureImage = signaturePreview.src && signaturePreview.src.startsWith('data:image') && !signaturePreview.classList.contains('hidden');

            const pdfContentDiv = document.getElementById('pdf-content');
            const pdfHeader = document.getElementById('pdf-header');
            const pdfFooter = document.getElementById('pdf-footer');
            const pdfMainContent = document.getElementById('pdf-main-content');
            const pdfTextContent = document.getElementById('pdf-text-content');
            const pdfSignatureImg = document.getElementById('pdf-signature');
            const pdfSignatureBlock = document.getElementById('pdf-signature-block');
            const pdfLogo = document.getElementById('pdf-logo');
            const originalPdfLogoSrc = pdfLogo ? pdfLogo.getAttribute('src') : '';
            const pdfLogoDataUrl = typeof window.__DELPHI_LOGO_DATA_URL === 'string' ? window.__DELPHI_LOGO_DATA_URL : '';

            // Keep UI logo links direct, but use data URL during PDF capture to prevent tainted canvas.
            if (pdfLogo && pdfLogoDataUrl) {
                pdfLogo.setAttribute('src', pdfLogoDataUrl);
                if (!pdfLogo.complete || pdfLogo.naturalWidth === 0) {
                    await new Promise((resolve) => {
                        const finalize = () => resolve();
                        pdfLogo.addEventListener('load', finalize, { once: true });
                        pdfLogo.addEventListener('error', finalize, { once: true });
                        setTimeout(finalize, 500);
                    });
                }
            }

            // 1. Prepare Content
            const signatureBlockText = getSignatureBlock();
            let mainBody = currentReportText.trim();
            const signatureBlockIndex = mainBody.lastIndexOf(signatureBlockText);

            if (signatureBlockIndex !== -1) {
                mainBody = mainBody.substring(0, signatureBlockIndex).trimEnd();
            }

            if (mainBody.endsWith('Sincerely,')) {
                mainBody = mainBody.substring(0, mainBody.length - 'Sincerely,'.length).trimEnd();
            }

            pdfTextContent.innerText = mainBody;

            if (hasSignatureImage) {
                const processedSignatureData = await processSignatureImage(signaturePreview.src);
                pdfSignatureImg.src = processedSignatureData;
                pdfSignatureImg.style.display = 'block';
                pdfSignatureBlock.innerText = signatureBlockText;
            } else {
                pdfSignatureImg.src = "";
                pdfSignatureImg.style.display = 'none';
                pdfSignatureBlock.innerText = `\n\n\n${signatureBlockText}`;
            }

            // 2. Setup for Measurement
            pdfContentDiv.classList.remove('hidden');
            pdfContentDiv.style.position = 'absolute';
            pdfContentDiv.style.left = '-9999px';
            pdfContentDiv.style.height = 'auto'; 
            pdfContentDiv.style.minHeight = '11in';
            
            // Set default top for measurement
            pdfMainContent.style.top = '1.5in'; 
            pdfMainContent.style.bottom = 'auto';
            
            // Measure content height (convert px to inches)
            // We measure the scrollHeight of the main content container
            const contentHeightPx = pdfMainContent.scrollHeight;
            const contentHeightIn = contentHeightPx / 96; 
            
            // Threshold for single page (11in - 1.5in top - 1.5in bottom = 8in safe area)
            const isSinglePage = contentHeightIn < 8.0;
            
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'in', format: 'letter' });
            const pdfWidth = 8.5;
            const pdfHeight = 11;

            if (isSinglePage) {
                // --- Single Page: Vertically Centered ---
                // Calculate top offset to center content relative to the page
                // Center point is 5.5in. Top = 5.5 - (Height/2).
                let topOffset = 5.5 - (contentHeightIn / 2);
                // Ensure it doesn't go too high (overlap header)
                if (topOffset < 1.5) topOffset = 1.5;
                
                pdfMainContent.style.top = `${topOffset}in`;
                pdfContentDiv.style.height = '11in'; // Lock height for single page render
                
                const canvas = await html2canvas(pdfContentDiv, { scale: 2, useCORS: true, logging: false });
                const imgData = canvas.toDataURL('image/png');
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                
            } else {
                // --- Multi-Page: Top Aligned (1.5in margin) ---
                pdfMainContent.style.top = '1.5in';
                pdfContentDiv.style.height = 'auto'; // Allow expansion
                
                // Capture Header and Footer separately
                // We clone them to a temp container to capture them cleanly without layout interference
                const tempContainer = document.createElement('div');
                tempContainer.style.position = 'absolute';
                tempContainer.style.left = '-9999px';
                tempContainer.style.width = '8.5in';
                tempContainer.style.height = '11in';
                tempContainer.style.background = 'white';
                document.body.appendChild(tempContainer);

                // Clone Header
                const headerClone = pdfHeader.cloneNode(true);
                tempContainer.appendChild(headerClone);
                const headerCanvas = await html2canvas(headerClone, { scale: 2, backgroundColor: null });
                const headerImgData = headerCanvas.toDataURL('image/png');
                tempContainer.removeChild(headerClone);

                // Clone Footer
                const footerClone = pdfFooter.cloneNode(true);
                tempContainer.appendChild(footerClone);
                const footerCanvas = await html2canvas(footerClone, { scale: 2, backgroundColor: null });
                const footerImgData = footerCanvas.toDataURL('image/png');
                document.body.removeChild(tempContainer);

                // Render Main Content (Hide header/footer to avoid duplication in the continuous strip)
                const originalHeaderDisplay = pdfHeader.style.display;
                const originalFooterDisplay = pdfFooter.style.display;
                pdfHeader.style.display = 'none';
                pdfFooter.style.display = 'none';

                const contentCanvas = await html2canvas(pdfContentDiv, { scale: 2, useCORS: true, logging: false });
                
                pdfHeader.style.display = originalHeaderDisplay;
                pdfFooter.style.display = originalFooterDisplay;

                const contentImgData = contentCanvas.toDataURL('image/png');
                const imgHeight = (contentCanvas.height * pdfWidth) / contentCanvas.width;
                
                let heightLeft = imgHeight;
                let position = 0;
                let page = 1;

                while (heightLeft > 0) {
                    if (page > 1) pdf.addPage();
                    
                    // Add Content Slice
                    // position is negative, moving the image up
                    pdf.addImage(contentImgData, 'PNG', 0, position, pdfWidth, imgHeight);
                    
                    // Add Header (on all pages)
                    // Calculate header height ratio
                    const headerH = (headerCanvas.height * pdfWidth) / headerCanvas.width; // Assuming full width capture
                    // The header clone was in a 8.5in container, so width matches pdfWidth
                    // But we need to be careful about the capture size.
                    // html2canvas captures the element size. pdfHeader is 6.5in wide.
                    // But we put it in a 8.5in container.
                    // Let's just place it using the known dimensions from CSS
                    // Header is at left: 1in, width: 6.5in.
                    // We can just overlay the image we captured.
                    // If we captured the element directly, it's 6.5in wide.
                    const headerProps = pdf.getImageProperties(headerImgData);
                    const headerPdfH = (headerProps.height * 6.5) / headerProps.width;
                    pdf.addImage(headerImgData, 'PNG', 1, 0.5, 6.5, headerPdfH);

                    // Add Footer (on all pages)
                    const footerProps = pdf.getImageProperties(footerImgData);
                    // Footer is right aligned, width 6.5in effectively (or auto).
                    // The footer div has text-align right.
                    // Let's assume we place it at bottom.
                    const footerPdfH = (footerProps.height * 6.5) / footerProps.width;
                    const footerY = 11 - 0.5 - footerPdfH;
                    pdf.addImage(footerImgData, 'PNG', 1, footerY, 6.5, footerPdfH);

                    heightLeft -= 11;
                    position -= 11;
                    page++;
                }
            }

            // Cleanup
            pdfContentDiv.classList.add('hidden');
            pdfContentDiv.style.position = '';
            pdfContentDiv.style.left = '';
            pdfContentDiv.style.height = '';
            pdfMainContent.style.top = '';
            if (pdfLogo && originalPdfLogoSrc) {
                pdfLogo.setAttribute('src', originalPdfLogoSrc);
            }

            // Generate Filename
            const letterType = document.getElementById('letterType').value;
            let clientFirstName = 'Client';
            let clientLastName = 'Report';

            switch(letterType) {
                case 'generalUse':
                    clientFirstName = document.getElementById('commonSubject').value || 'General';
                    clientLastName = 'Letter';
                    break;
                case 'treatmentNotRec':
                    clientFirstName = document.getElementById('clientFirstName').value;
                    clientLastName = document.getElementById('clientLastName').value;
                    break;
                case 'evalInProgress':
                    clientFirstName = document.getElementById('eipClientFirstName').value;
                    clientLastName = document.getElementById('eipClientLastName').value;
                    break;
                case 'reEngagement':
                    clientFirstName = document.getElementById('reClientFirstName').value;
                    clientLastName = document.getElementById('reClientLastName').value;
                    break;
                case 'treatmentRec':
                    clientFirstName = document.getElementById('trClientFirstName').value;
                    clientLastName = document.getElementById('trClientLastName').value;
                    break;
                case 'dischargeExternal':
                    clientFirstName = document.getElementById('disClientFirstName').value;
                    clientLastName = document.getElementById('disClientLastName').value;
                    break;
                case 'dischargeClient':
                    clientFirstName = document.getElementById('disClientRecipientFirstName').value;
                    clientLastName = document.getElementById('disClientRecipientLastName').value;
                    break;
                case 'dischargeClientSuccess':
                    clientFirstName = document.getElementById('disClientSuccessFirstName').value;
                    clientLastName = document.getElementById('disClientSuccessLastName').value;
                    break;
                case 'enrollmentVerification':
                    clientFirstName = document.getElementById('evClientFirstName').value;
                    clientLastName = document.getElementById('evClientLastName').value;
                    break;
            }
            const clientName = `${clientFirstName} ${clientLastName}`.trim() || 'report';
            const fileName = `${clientName.replace(/\s/g, '_')}_Report.pdf`;

            const includeReferrals = document.getElementById('includeReferrals')?.checked;
            if (!includeReferrals) {
                pdf.save(fileName);
                showNotification('PDF downloaded (no referrals).');
                return;
            }

            try {
                if (!window.PDFLib) throw new Error('PDFLib failed to load');

                const mainPdfBytes = await pdf.output('arraybuffer');
                const referralsBytes = await getReferralsPdfBytes();

                const mergedPdf = await PDFLib.PDFDocument.load(mainPdfBytes);
                const referralsPdf = await PDFLib.PDFDocument.load(referralsBytes);

                const referralPages = await mergedPdf.copyPages(referralsPdf, referralsPdf.getPageIndices());
                referralPages.forEach(page => mergedPdf.addPage(page));

                const mergedBytes = await mergedPdf.save();
                const blob = new Blob([mergedBytes], { type: 'application/pdf' });
                const blobUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = fileName;
                link.click();
                URL.revokeObjectURL(blobUrl);
                showNotification('PDF downloaded with Referrals appendix attached.');
            } catch (error) {
                console.error('Failed to append Referrals.pdf, saving base PDF instead:', error);
                showNotification('Could not append Referrals.pdf. Downloaded base PDF only.', true);
                pdf.save(fileName);
            }
        }

