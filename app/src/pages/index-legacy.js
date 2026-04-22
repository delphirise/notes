"use strict";

function splitCallArguments(argsSource) {
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

    return parts;
}

function resolveCallablePath(path) {
    const segments = path.split('.');
    let context = window;
    for (let i = 0; i < segments.length - 1; i += 1) {
        context = context?.[segments[i]];
    }

    if (!context) {
        return null;
    }

    const fn = context[segments[segments.length - 1]];
    if (typeof fn !== 'function') {
        return null;
    }

    return { fn, context };
}

function parseCallArgument(token, scopedEvent, element) {
    if (token === 'this') return element;
    if (token === 'event') return scopedEvent;
    if (token === 'true') return true;
    if (token === 'false') return false;
    if (token === 'null') return null;
    if (/^-?\d+(?:\.\d+)?$/.test(token)) return Number(token);
    if ((token.startsWith("'") && token.endsWith("'")) || (token.startsWith('"') && token.endsWith('"'))) {
        return token.slice(1, -1);
    }
    return undefined;
}

function executeDataCalls(expression, event, element) {
    if (!expression) {
        return;
    }

    const statements = String(expression)
        .split(';')
        .map((item) => item.trim())
        .filter(Boolean);

    const scopedEvent = event
        ? new Proxy(event, {
            get(target, prop) {
                if (prop === 'currentTarget' || prop === 'delegateTarget') {
                    return element;
                }
                const value = target[prop];
                return typeof value === 'function' ? value.bind(target) : value;
            },
        })
        : event;

    for (const statement of statements) {
        const callMatch = statement.match(/^([A-Za-z_$][\w$.]*)\s*(?:\((.*)\))?$/);
        if (!callMatch) {
            continue;
        }

        const callable = resolveCallablePath(callMatch[1]);
        if (!callable) {
            continue;
        }

        const argsSource = callMatch[2] || '';
        const args = argsSource.trim()
            ? splitCallArguments(argsSource)
                .map((token) => parseCallArgument(token, scopedEvent, element))
                .filter((value) => value !== undefined)
            : [];

        try {
            callable.fn.apply(callable.context, args);
        } catch (error) {
            console.error(`Error running data call ${callMatch[1]}:`, error);
        }
    }
}

function getClosestWithAttribute(event, attributeName) {
    const target = event.target;
    if (!(target instanceof Element)) {
        return null;
    }
    return target.closest(`[${attributeName}]`);
}

function wireDeclarativeHandlers() {
    if (document.body.dataset.dataHandlersWired === 'true') {
        return;
    }

    document.body.addEventListener('click', (event) => {
        const element = getClosestWithAttribute(event, 'data-onclick');
        if (!element) {
            return;
        }
        executeDataCalls(element.getAttribute('data-onclick'), event, element);
    });

    document.body.addEventListener('input', (event) => {
        const target = event.target;
        if (!(target instanceof Element) || !target.hasAttribute('data-oninput')) {
            return;
        }
        executeDataCalls(target.getAttribute('data-oninput'), event, target);
    });

    document.body.addEventListener('change', (event) => {
        const target = event.target;
        if (!(target instanceof Element) || !target.hasAttribute('data-onchange')) {
            return;
        }
        executeDataCalls(target.getAttribute('data-onchange'), event, target);
    });

    document.body.addEventListener('mouseover', (event) => {
        const element = getClosestWithAttribute(event, 'data-onmouseenter');
        if (!element) {
            return;
        }

        const related = event.relatedTarget;
        if (related instanceof Node && element.contains(related)) {
            return;
        }

        executeDataCalls(element.getAttribute('data-onmouseenter'), event, element);
    });

    document.body.addEventListener('mouseout', (event) => {
        const element = getClosestWithAttribute(event, 'data-onmouseleave');
        if (!element) {
            return;
        }

        const related = event.relatedTarget;
        if (related instanceof Node && element.contains(related)) {
            return;
        }

        executeDataCalls(element.getAttribute('data-onmouseleave'), event, element);
    });

    document.body.dataset.dataHandlersWired = 'true';
}

wireDeclarativeHandlers();

if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
    // --- Core Tab and UI Logic ---
    function toggleSudDropdown(evt) {
        const dropdown = document.getElementById('sudDropdown');
        dropdown.classList.toggle('hidden');
        evt.stopPropagation();
    }

    function showSudDropdown() {
        const dropdown = document.getElementById('sudDropdown');
        dropdown.classList.remove('hidden');
    }

    function hideSudDropdown() {
        const dropdown = document.getElementById('sudDropdown');
        dropdown.classList.add('hidden');
    }

    function highlightOption(element) {
        element.classList.add('bg-indigo-200', 'font-semibold');
    }

    function unhighlightOption(element) {
        element.classList.remove('bg-indigo-200', 'font-semibold');
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        const dropdown = document.getElementById('sudDropdown');
        const sudContainer = document.getElementById('sudContainer');
        if (dropdown && !dropdown.classList.contains('hidden') && !sudContainer.contains(event.target)) {
            dropdown.classList.add('hidden');
        }
    });

    function openTab(evt, tabName) {
        const tabcontent = document.getElementsByClassName("tabcontent");
        for (let i = 0; i < tabcontent.length; i++) {
            tabcontent[i].style.display = "none";
        }
        const tablinks = document.getElementsByClassName("tab-button");
        for (let i = 0; i < tablinks.length; i++) {
            tablinks[i].className = tablinks[i].className.replace(" active", "");
        }
        document.getElementById(tabName).style.display = "block";
        evt.currentTarget.className += " active";
        
        // Close dropdown after selection
        const dropdown = document.getElementById('sudDropdown');
        if (dropdown && !dropdown.classList.contains('hidden')) {
            dropdown.classList.add('hidden');
        }
        setScrollTopVisibility(tabName);
    }
    document.getElementById("defaultOpen").click();

    function setScrollTopVisibility(tabName) {
        const btn = document.getElementById('scrollTopBtn');
        if (!btn) return;
        const shouldShow = tabName === 'MSE' || tabName === 'DARP';
        btn.style.display = shouldShow ? 'flex' : 'none';
    }

    function scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function autoResize(textarea) {
        if(textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        }
    }

    // --- MSE (Mental Status Exam) Logic ---
    function clearAllMseCheckboxes() {
        document.querySelectorAll('#MSE input[type="checkbox"]').forEach(cb => cb.checked = false);
    }

    function togglePositiveMSE() {
        clearAllMseCheckboxes();
        document.getElementById("positiveMSE").checked = true;
        ["x4","neat","clean","appropriatelydressed","notRemarkable","appropriate","normalAttention",
         "normalMemory","normalEyeContact","responsive","cooperative","affectCongruent","affectAppropriate",
         "euthymic","normalSpeech","expressionCongruent","normalOrganization","noHallucinations",
         "insightGood","judgementGood","normalDecisionMaking","noSIHI"]
         .forEach(id => {
             const el = document.getElementById(id);
             if(el) el.checked = true;
        });
        updateMseText();
    }

    function TelehealthPositiveMSE() {
        clearAllMseCheckboxes();
        document.getElementById("telehealthpositiveMSE").checked = true;
        ["x4","appropriate","normalAttention","normalMemory","normalEyeContact","responsive","cooperative",
         "affectCongruent","euthymic","normalSpeech","expressionCongruent","normalOrganization",
         "noHallucinations","insightGood","judgementGood","normalDecisionMaking","noSIHI"]
         .forEach(id => {
            const el = document.getElementById(id);
            if(el) el.checked = true;
        });
        updateMseText();
    }

    function updateMseText() {
        const mseTextbox = document.getElementById("mseTextbox");
        const darpMentalStatusTextarea = document.getElementById("mentalStatus");
        let text = "";

        const categories = [
            { name: "Orientation", checkboxes: ["x4", "time", "place", "situation", "person"], custom: "orientationCustom" },
            { name: "Clothing/Grooming", checkboxes: ["neat", "clean", "appropriatelydressed", "careless", "disheveled", "dirty", "inappropriate", "bizarre"], custom: "clothingGroomingCustom" },
            { name: "Motor Activity", checkboxes: ["notRemarkable", "slowed", "repetitive", "restless", "agitated", "tremor"], custom: "motorActivityCustom" },
            { name: "Behavior", checkboxes: ["appropriate", "aggressive", "angry", "apathetic", "irritable", "passive", "manipulative"], custom: "behaviorCustom" },
            { name: "Attention", checkboxes: ["normalAttention", "unaware", "distractible", "vigilant"], custom: "attentionCustom" },
            { name: "Recall/Memory", checkboxes: ["normalMemory", "shortTermImpaired", "longTermImpaired"], custom: "recallMemoryCustom" },
            { name: "Eye Contact", checkboxes: ["normalEyeContact", "fleeting", "avoided", "none", "staring"], custom: "eyeContactCustom" },
            { name: "Facial Expression", checkboxes: ["responsive", "tense", "anxious", "sad", "angry"], custom: "facialExpressionCustom" },
            { name: "Attitude toward Evaluator", checkboxes: ["cooperative", "friendly", "guarded", "hostile", "indifferent", "ingratiating", "manipulative", "open", "seductive", "suspicious", "uncooperative"], custom: "attitudeEvaluatorCustom" },
            { name: "Affect", checkboxes: ["affectCongruent", "affectIncongruent", "affectAppropriate", "affectInappropriate", "labile", "restricted", "flat", "reactive", "blunted"], custom: "affectCustom" },
            { name: "Mood", checkboxes: ["euthymic", "dysphoric", "anxiousmood", "angrymood", "irritableMood", "pessimistic", "depressed", "hypomanic", "euphoric"], custom: "moodCustom" },
            { name: "Speech", checkboxes: ["normalSpeech", "loud", "blocked", "pressured", "flightOfIdeas", "slurred", "soft", "stuttering", "mute", "verbose"], custom: "speechCustom" },
            { name: "Expression of Thought Content", checkboxes: ["expressionCongruent", "expressionIncongruent", "looseassociations", "suspicions", "delusions", "phobias", "obsessions"], custom: "expressionCustom" },
            { name: "Organization of Thought", checkboxes: ["normalOrganization", "logical", "goalDirected"], custom: "organizationCustom" },
            { name: "Perception", checkboxes: ["noHallucinations", "auditoryhallucinations", "visualhallucinations", "olfactoryhallucinations", "tactilehallucinations", "gustatoryhallucinations", "delusionsPresent"], custom: "perceptionCustom" },
            { name: "Insight", checkboxes: ["insightExcellent", "insightGood", "insightFair", "insightPoor", "insightNil"], custom: "insightCustom" },
            { name: "Judgment", checkboxes: ["judgementExcellent", "judgementGood", "judgementFair", "judgementPoor", "judgementNil", "judgementDangerous"], custom: "judgmentCustom" },
            { name: "Decision Making", checkboxes: ["normalDecisionMaking", "onlySimple", "impulsive", "confused"], custom: "decisionMakingCustom" },
            { name: "Safety", checkboxes: ["noSIHI", "deniesSIHI", "reportsHI", "reportsPassiveSIT", "reportsSuicidePlan", "reportsSuicidalIntention"], custom: "safetyCustom" }
        ];

        categories.forEach(category => {
            const checkedItems = [];
            category.checkboxes.forEach(id => {
                const checkbox = document.getElementById(id);
                if (checkbox && checkbox.checked) {
                    checkedItems.push(checkbox.nextSibling.nodeValue.trim());
                }
            });
            const customInput = document.getElementById(category.custom) ? document.getElementById(category.custom).value : "";
            if (customInput) {
                checkedItems.push(customInput);
            }
            if (checkedItems.length > 0) {
                text += `${category.name}: ${checkedItems.join(", ")}\n`;
            }
        });

        const generatedText = text.trim();
        mseTextbox.value = generatedText;
        if (darpMentalStatusTextarea) {
            darpMentalStatusTextarea.value = generatedText;
            autoResize(darpMentalStatusTextarea);
            updateDarpProgressNote();
        }
    }

    function copyMseToClipboard() {
        const textbox = document.getElementById("mseTextbox");
        textbox.select();
        document.execCommand("copy");
        // Using a more modern notification approach could be an improvement, but alert is simple and effective.
        alert("MSE text copied to clipboard!");
    }

    // --- DARP (Progress Note) Logic ---

    // *** NEW: Intern Note Logic ***
    function applyNoPredictiveText(root = document) {
        const selector = 'input[type="text"], input[type="email"], input[type="search"], input[type="tel"], input[type="url"], input[type="number"], input[type="date"], input[type="time"], textarea';
        root.querySelectorAll(selector).forEach((element) => {
            element.setAttribute('autocomplete', 'off');
            element.setAttribute('autocorrect', 'off');
            element.setAttribute('autocapitalize', 'none');
            element.setAttribute('spellcheck', 'false');
        });
    }

    const internStatementText = "Intern informed client that they are a counselor-in-training completing an internship at the clinic under the supervision of a licensed clinician. Intern explained the supervisory relationship and the role of the supervisor in supporting client care and ensuring quality services. Client was informed that parts of sessions may be reviewed for supervision purposes. Intern obtained client's verbal consent to proceed with treatment under intern status. Client expressed understanding and agreed to continue services.";

    function toggleInternNote() {
        const isChecked = document.getElementById('internNoteCheckbox').checked;
        const displayStyle = isChecked ? 'block' : 'none';
        
        // This controls the top blue statement box
        const statementSection = document.getElementById('internStatementSection');
        if (statementSection) statementSection.style.display = displayStyle;
        
        // This controls the bottom blue information box
        const infoSection = document.getElementById('internInfoSection');
        if (infoSection) infoSection.style.display = displayStyle;
    }

    function saveInternInfo() {
        const internData = {
            name: document.getElementById('internName').value,
            supervisor: document.getElementById('supervisorName').value,
            credential: document.getElementById('supervisorCredential').value,
            credentialNum: document.getElementById('supervisorCredentialNum').value
        };
        localStorage.setItem('internData', JSON.stringify(internData));
        localStorage.setItem('autoCheckInternNote', 'true');
        alert('Intern information saved.');
    }

    function clearInternInfo() {
        localStorage.removeItem('internData');
        localStorage.removeItem('autoCheckInternNote');
        
        document.getElementById('internName').value = '';
        document.getElementById('supervisorName').value = '';
        document.getElementById('supervisorCredential').value = '';
        document.getElementById('supervisorCredentialNum').value = '';
        document.getElementById('internNoteCheckbox').checked = false;
        toggleInternNote(); // This will hide the sections
        updateDarpProgressNote();
        alert('Saved intern information cleared.');
    }

    function loadInternInfo() {
        if (localStorage.getItem('autoCheckInternNote') === 'true') {
            const rawInternData = localStorage.getItem('internData');
            const saved = rawInternData ? JSON.parse(rawInternData) : null;
            if (saved) {
                // Backward compatibility: read both legacy payload wrapper and plain object.
                const internData = saved.data && typeof saved.data === 'object' ? saved.data : saved;
                document.getElementById('internName').value = internData.name || '';
                document.getElementById('supervisorName').value = internData.supervisor || '';
                document.getElementById('supervisorCredential').value = internData.credential || '';
                document.getElementById('supervisorCredentialNum').value = internData.credentialNum || '';
            } else {
                localStorage.removeItem('autoCheckInternNote');
            }
            document.getElementById('internNoteCheckbox').checked = true;
        }
        // Always run toggle to set initial visibility based on (potentially loaded) checkbox state
        toggleInternNote();
    }
    // *** END: Intern Note Logic ***


    function addTreatmentGoalRow() {
        const container = document.getElementById('treatmentGoalsContainer');
        const goalRow = document.createElement('div');
        goalRow.className = 'treatment-goal-row flex items-start gap-2 p-2 border border-gray-300 rounded-md';

        const dateInput = document.getElementById('sessionDate');
        let datePrefix = '';
        if (dateInput && dateInput.value) {
            const date = new Date(dateInput.value);
            // Adjust for timezone to get the correct local date
            const userTimezoneOffset = date.getTimezoneOffset() * 60000;
            const localDate = new Date(date.getTime() + userTimezoneOffset);
            const month = String(localDate.getMonth() + 1).padStart(2, '0');
            const day = String(localDate.getDate()).padStart(2, '0');
            const year = localDate.getFullYear();
            datePrefix = `${month}/${day}/${year} - `;
        }

        goalRow.innerHTML = `
            <div class="flex-grow space-y-2">
                <div class="flex items-center gap-2">
                    <label class="font-medium text-gray-700 w-28 flex-shrink-0">Treatment Goal:</label>
                    <input type="text" class="p-2 border border-gray-300 rounded-md w-full treatment-goal-input" data-oninput="updateDarpProgressNote()">
                </div>
                <div class="flex items-start gap-2">
                    <label class="font-medium text-gray-700 w-28 flex-shrink-0 mt-2">Update:</label>
                    <textarea class="p-2 border border-gray-300 rounded-md w-full treatment-goal-update" data-oninput="autoResize(this); updateDarpProgressNote()">${datePrefix}</textarea>
                </div>
            </div>
            <div class="flex flex-col gap-2">
                <button type="button" class="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600" data-onclick="addTreatmentGoalRow()">+</button>
                <button type="button" class="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 remove-goal-btn" data-onclick="removeTreatmentGoalRow(this)">-</button>
            </div>
        `;

        container.appendChild(goalRow);
        const newTextarea = goalRow.querySelector('textarea');
        autoResize(newTextarea);
        updateRemoveButtonsState();
        updateDarpProgressNote();
    }

    function removeTreatmentGoalRow(button) {
        const row = button.closest('.treatment-goal-row');
        if (row) {
            row.remove();
            updateDarpProgressNote();
            updateRemoveButtonsState();
        }
    }

    function updateRemoveButtonsState() {
        const rows = document.querySelectorAll('#treatmentGoalsContainer .treatment-goal-row');
        rows.forEach(row => {
            const removeBtn = row.querySelector('.remove-goal-btn');
            if (removeBtn) {
                 removeBtn.style.display = rows.length <= 1 ? 'none' : 'block';
            }
        });
    }

    // *** NEW FUNCTION ***
    function syncSessionDateToGoals(dateValue) {
        // Find all goal row update textareas
        const goalUpdateTextareas = document.querySelectorAll('#treatmentGoalsContainer .treatment-goal-row .treatment-goal-update');
        
        goalUpdateTextareas.forEach(textarea => {
            let datePrefix = '';
            if (dateValue) {
                const date = new Date(dateValue);
                // Adjust for timezone to get the correct local date
                const userTimezoneOffset = date.getTimezoneOffset() * 60000;
                const localDate = new Date(date.getTime() + userTimezoneOffset);
                const month = String(localDate.getMonth() + 1).padStart(2, '0');
                const day = String(localDate.getDate()).padStart(2, '0');
                const year = localDate.getFullYear();
                datePrefix = `${month}/${day}/${year} - `;
            }
            
            let currentValue = textarea.value;
            // Regex to find a date prefix like "MM/DD/YYYY - "
            const dateRegex = /^\d{2}\/\d{2}\/\d{4} - /;
            
            if (dateRegex.test(currentValue)) {
                // If a date prefix already exists, replace only the date part, preserve the rest
                textarea.value = currentValue.replace(dateRegex, datePrefix);
            } else if (currentValue.trim() === '') {
                // If the textarea is empty, just add the new prefix
                textarea.value = datePrefix;
            } else {
                // If the textarea has content but no date, prepend the new prefix
                textarea.value = `${datePrefix}${currentValue}`;
            }
            
            // Trigger updates
            autoResize(textarea);
        });
        
        updateDarpProgressNote();
    }
    // *** END NEW FUNCTION ***

    function updateDarpProgressNote() {
        let progressNote = "";
        const isInternNote = document.getElementById('internNoteCheckbox')?.checked;
        const gv = document.getElementById('goalVerification');
        if (gv && !gv.checked) {
            const noteBox = document.getElementById('progressNote');
            if (noteBox) {
                noteBox.value = 'Verify Goals have been updated to generate note.';
                autoResize(noteBox);
            }
            return;
        }

        // *** NEW: Prepend intern statement ***
        if (isInternNote) {
            const internStatement = document.getElementById('internStatementSection')?.innerText.trim();
            if(internStatement) progressNote += `${internStatement}\n\n`;
        }
        
        const mentalStatus = document.getElementById('mentalStatus')?.value || '';
        const problemsAddressed = document.getElementById('problemsAddressed')?.value || '';
        const diagnoses = document.getElementById('diagnoses')?.value || '';
        const additionalAssessment = document.getElementById('additionalAssessment')?.value || '';
        const response = document.getElementById('response')?.value || '';
        const plan = document.getElementById('plan')?.value || '';
        const toxicologyScreen = document.getElementById('toxicologyScreen')?.checked;
        
        progressNote += "DATA:\n";
        if (diagnoses) progressNote += `Diagnoses:\n${diagnoses}\n\n`;
        if (problemsAddressed) progressNote += `Problems Addressed in the Counseling Session:\n${problemsAddressed}\n\n`;
        if (toxicologyScreen) progressNote += `Client provided a toxicology screen.\n\n`;
        
        // --- Interventions Logic ---
        let interventionsUsed = "Interventions Used:\n";
        const containers = document.querySelectorAll('.darp-column');

        // Note: darpModalities might not be populated if this runs before render.
        // But since render calls this, it should be fine.
        if (typeof darpModalities !== 'undefined') {
             containers.forEach((container) => {
                 const modalityIndex = container.getAttribute('data-index');
                 const modality = darpModalities[modalityIndex];
                 if(!modality) return;

                 const checkedBoxes = container.querySelectorAll('input[type="checkbox"]:checked');
                 
                 const selectedItems = Array.from(checkedBoxes).map(cb => cb.value);

                 if (selectedItems.length > 0) {
                     const joined = selectedItems.join(', ');
                     const pinned = document.getElementById(`pinned-rationale-${modalityIndex}`);
                     const rationale = pinned && pinned.value ? pinned.value.trim() : '';
                     if (modality.title === "Custom Interventions") {
                         interventionsUsed += `${joined}`;
                     } else {
                         interventionsUsed += `${modality.title}: ${joined}`;
                     }
                     if (rationale) {
                         interventionsUsed += `. Rationale: ${rationale}`;
                     }
                     interventionsUsed += "\n";
                 }
            });
        }
        
        if (interventionsUsed.trim() !== "Interventions Used:") progressNote += `${interventionsUsed}\n`;

        progressNote += "ASSESSMENT:\n";
        if (mentalStatus) progressNote += `Mental Status Exam:\n${mentalStatus}\n\n`;
        if (additionalAssessment) progressNote += `Assessment:\n${additionalAssessment}\n\n`;

        progressNote += "RESPONSE:\n";
        if (response) progressNote += `${response}\n\n`;

        progressNote += "PLAN:\n";
        if (plan) progressNote += `${plan}`;

        // *** NEW: Append intern signature block ***
        if (isInternNote) {
            const internName = document.getElementById('internName').value || '(Name of Intern)';
            const supervisorName = document.getElementById('supervisorName').value || '(Name of Supervisor)';
            const supervisorCredential = document.getElementById('supervisorCredential').value || '(Supervisor Credential)';
            const supervisorCredentialNum = document.getElementById('supervisorCredentialNum').value || '(Credential Number)';
            
            const signature = `\n\n\nSession completed by ${internName}\nSession reviewed and signed by ${supervisorName}, ${supervisorCredential}, ${supervisorCredentialNum}`;
            progressNote += signature;
        }

        const noteBox = document.getElementById('progressNote');
        if (noteBox) {
            noteBox.value = progressNote;
            autoResize(noteBox);
        }
    }

    function copyDarpToClipboard() {
        const gv = document.getElementById('goalVerification');
        if (gv && !gv.checked) {
            alert('Cannot generate note: please verify that the Goals tab has been updated to proceed.');
            return;
        }
        const note = document.getElementById('progressNote');
        if (!note || !note.value.trim()) {
            alert('No progress note to copy.');
            return;
        }
        note.select();
        document.execCommand("copy");
        alert("Progress note copied to clipboard!");
    }

    /* =========================================
       DYNAMIC MODALITIES / INTERVENTIONS LOGIC
       ========================================= */
       
    const DEFAULT_MODALITIES = [
        {
            title: "Custom Interventions",
            items: ["Reflective Listening", "Mirroring"],
            isCustom: true
        },
        {
            title: "CBT",
            items: [
                "Cognitive Restructuring", "Behavioral Activation", "Mindfulness Training",
                "Problem-Solving", "Activity Scheduling", "Relaxation Techniques",
                "Cognitive Defusion", "Identifying Cognitive Distortions and alternative thinking patterns"
            ]
        },
        {
            title: "Person Centered",
            items: [
                "Open-ended questions", "Reflective Listening", "Summarizing",
                "Empathy", "Active Listening", "Validation", "Silence",
                "Emotional Presence", "Encouraging Autonomy", "Facilitation of Self-Discovery",
                "Unconditional Positive Regard"
            ]
        },
        {
            title: "Motivational Interviewing",
            items: [
                "Open-Ended Questions", "Reflective Listening", "Summarizing",
                "Affirmations", "Decisional Balance (Pros/Cons)",
                "Developing and Identifying Discrepancy", "Supporting Self-Efficacy",
                "Evoking Commitment Language"
            ]
        }
    ];

    const DARP_MODALITIES_STORAGE_KEY = 'darpModalities';

    function cloneDefaultModalities() {
        return JSON.parse(JSON.stringify(DEFAULT_MODALITIES));
    }

    function normalizeStoredModalities(value) {
        if (!Array.isArray(value)) {
            return null;
        }

        const normalized = value
            .map((modality) => {
                if (!modality || typeof modality !== 'object') {
                    return null;
                }

                const title = typeof modality.title === 'string' ? modality.title.trim() : '';
                if (!title) {
                    return null;
                }

                const rawItems = Array.isArray(modality.items) ? modality.items : [];
                const items = Array.from(new Set(
                    rawItems
                        .filter((item) => typeof item === 'string')
                        .map((item) => item.trim())
                        .filter(Boolean)
                ));

                return {
                    title,
                    items,
                    ...(modality.isCustom ? { isCustom: true } : {})
                };
            })
            .filter(Boolean);

        return normalized.length ? normalized : null;
    }

    function loadModalitiesFromStorage() {
        try {
            const raw = localStorage.getItem(DARP_MODALITIES_STORAGE_KEY);
            if (!raw) {
                return null;
            }

            const parsed = JSON.parse(raw);
            const normalized = normalizeStoredModalities(parsed);
            if (!normalized) {
                localStorage.removeItem(DARP_MODALITIES_STORAGE_KEY);
                return null;
            }

            return normalized;
        } catch (error) {
            console.warn('Unable to load saved DARP modalities:', error);
            return null;
        }
    }

    function saveModalitiesToStorage() {
        try {
            localStorage.setItem(DARP_MODALITIES_STORAGE_KEY, JSON.stringify(darpModalities));
        } catch (error) {
            console.warn('Unable to save DARP modalities:', error);
        }
    }

    let darpModalities = loadModalitiesFromStorage() || cloneDefaultModalities();

    // --- State Persistence Logic ---
    function captureInterventionState() {
        try {
            const state = {};
            const containers = document.querySelectorAll('.darp-column');
            containers.forEach(container => {
                 const titleElem = container.querySelector('strong');
                 if(!titleElem) return;
                 const title = titleElem.textContent;
                 
                 const checkboxes = container.querySelectorAll('input[type="checkbox"]');
                 checkboxes.forEach(cb => {
                     const itemText = cb.value;
                     const key = `${title}:::${itemText}`;
                     const justDiv = document.getElementById(`just-container-${cb.id}`);
                     let justification = '';
                     if (justDiv) {
                         const textarea = justDiv.querySelector('textarea');
                         if(textarea) justification = textarea.value;
                     }
                     if (cb.checked || justification) {
                         state[key] = { checked: cb.checked, justification: justification };
                     }
                 });
            });
            return state;
        } catch (error) {
            console.error("Error capturing state:", error);
            return {};
        }
    }

    function restoreInterventionState(state) {
        try {
            if(!state) return;
            
            const containers = document.querySelectorAll('.darp-column');
            containers.forEach(container => {
                 const titleElem = container.querySelector('strong');
                 if(!titleElem) return;
                 const title = titleElem.textContent;
                 
                 const checkboxes = container.querySelectorAll('input[type="checkbox"]');
                 checkboxes.forEach(cb => {
                     const itemText = cb.value;
                     const key = `${title}:::${itemText}`;
                     if (state[key]) {
                         cb.checked = state[key].checked;
                         const justDiv = document.getElementById(`just-container-${cb.id}`);
                         if (justDiv) {
                             if (cb.checked) {
                                justDiv.classList.remove('hidden');
                             }
                             const textarea = justDiv.querySelector('textarea');
                             if(textarea) {
                                 textarea.value = state[key].justification;
                                 textarea.style.height = 'auto';
                                 textarea.style.height = (textarea.scrollHeight) + 'px';
                             }
                         }
                     }
                 });
            });
            updateDarpProgressNote();
        } catch (error) {
            console.error("Error restoring state:", error);
        }
    }

    // Updated save to preserve state
    function saveModalities(preCapturedState) {
        try {
            const currentState = preCapturedState || captureInterventionState();
            saveModalitiesToStorage();
            renderInterventions();
            restoreInterventionState(currentState);
        } catch (error) {
            console.error("Error saving modalities:", error);
        }
    }

    function resetModalitiesToDefault() {
        if(confirm("Are you sure you want to reset all intervention categories to default? This will clear your custom changes.")){
            darpModalities = cloneDefaultModalities();
            saveModalities();
        }
    }

    function renderInterventions() {
        try {
            const container = document.getElementById('darp-interventions-container');
            if (!container) return;
            
            container.innerHTML = ''; // Clear existing

            darpModalities.forEach((modality, modIndex) => {
                const col = document.createElement('div');
                col.className = 'darp-column relative p-2 border border-blue-50 rounded bg-blue-50/30 flex flex-col';
                col.setAttribute('data-index', modIndex);
                
                // Header with delete button
                const header = document.createElement('div');
                header.className = 'flex justify-between items-center mb-2';
                
                const titleRow = document.createElement('div');
                titleRow.className = 'flex items-center gap-2';
                
                const title = document.createElement('strong');
                title.className = 'font-semibold text-gray-800';
                title.textContent = modality.title;
                titleRow.appendChild(title);
                
                // Rename Button
                const renameBtn = document.createElement('button');
                renameBtn.type = 'button'; // Prevent form submission
                renameBtn.innerHTML = '&#9998;'; // Pencil icon
                renameBtn.className = 'text-gray-400 hover:text-blue-600 text-sm';
                renameBtn.title = 'Rename category';
                renameBtn.onclick = () => renameModality(modIndex);
                titleRow.appendChild(renameBtn);

                header.appendChild(titleRow);

                // Delete Modality Button
                const deleteBtn = document.createElement('button');
                deleteBtn.type = 'button'; // Prevent form submission
                deleteBtn.innerHTML = '&times;';
                deleteBtn.className = 'text-red-500 hover:text-red-700 font-bold text-lg px-2';
                deleteBtn.title = 'Remove this data set';
                deleteBtn.onclick = () => deleteModality(modIndex);
                header.appendChild(deleteBtn);
                
                col.appendChild(header);

                // Add Intervention Input
                const controls = document.createElement('div');
                controls.className = 'controls mb-2 flex gap-2';
                const input = document.createElement('input');
                input.type = 'text';
                input.placeholder = 'Add new intervention';
                input.className = 'flex-grow p-1 text-sm border border-gray-300 rounded';
                input.setAttribute('autocomplete', 'off');
                input.setAttribute('autocorrect', 'off');
                input.setAttribute('autocapitalize', 'none');
                input.setAttribute('spellcheck', 'false');
                input.onkeydown = (e) => {
                    if(e.key === 'Enter') {
                        e.preventDefault();
                        addIntervention(modIndex, input.value);
                    }
                };
                
                const addBtn = document.createElement('button');
                addBtn.type = 'button'; // Prevent form submission
                addBtn.textContent = '+';
                addBtn.className = 'px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm';
                addBtn.onclick = () => addIntervention(modIndex, input.value);
                
                controls.appendChild(input);
                controls.appendChild(addBtn);
                col.appendChild(controls);

                // List of interventions
                const listDiv = document.createElement('div');
                listDiv.className = 'space-y-2'; // Increased spacing for comfort
                
                modality.items.forEach((item, itemIndex) => {
                    // Wrapper for item
                    const wrapper = document.createElement('div');
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'darp-inline-checkbox flex items-center justify-between group mb-1';
                    const leftDiv = document.createElement('div');
                    leftDiv.className = 'flex items-center gap-2';
                    const uniqueId = `mod-${modIndex}-item-${itemIndex}`;
                    const cb = document.createElement('input');
                    cb.type = 'checkbox';
                    cb.id = uniqueId;
                    cb.value = item;
                    cb.onchange = () => {
                        updatePinnedRationaleVisibility(modIndex);
                        updateDarpProgressNote();
                    };
                    const label = document.createElement('label');
                    label.htmlFor = uniqueId;
                    label.textContent = item;
                    label.className = 'text-sm text-gray-700';
                    leftDiv.appendChild(cb);
                    leftDiv.appendChild(label);
                    const delItemBtn = document.createElement('button');
                    delItemBtn.type = 'button';
                    delItemBtn.innerHTML = '&times;';
                    delItemBtn.className = 'text-gray-400 hover:text-red-600 font-bold ml-2 opacity-0 group-hover:opacity-100 transition-opacity';
                    delItemBtn.onclick = () => deleteIntervention(modIndex, itemIndex);
                    itemDiv.appendChild(leftDiv);
                    itemDiv.appendChild(delItemBtn);
                    wrapper.appendChild(itemDiv);
                    listDiv.appendChild(wrapper);
                });
                // Pinned rationale textarea (bottom of modality box)
                const pinnedRationaleDiv = document.createElement('div');
                pinnedRationaleDiv.className = 'pinned-rationale mt-2';
                pinnedRationaleDiv.style.marginTop = 'auto';
                pinnedRationaleDiv.style.display = 'none';
                pinnedRationaleDiv.style.position = 'relative';
                pinnedRationaleDiv.style.bottom = '0';
                pinnedRationaleDiv.style.width = '100%';
                pinnedRationaleDiv.style.zIndex = '1';
                pinnedRationaleDiv.style.background = 'transparent';
                const pinnedTextarea = document.createElement('textarea');
                pinnedTextarea.className = 'w-full text-xs p-1.5 border border-gray-300 rounded text-gray-600 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500';
                pinnedTextarea.placeholder = `Clinical Rationale / Goal Alignment for selected ${modality.title} interventions...`;
                pinnedTextarea.rows = 2;
                pinnedTextarea.id = `pinned-rationale-${modIndex}`;
                pinnedTextarea.oninput = function() {
                    this.style.height = 'auto';
                    this.style.height = (this.scrollHeight) + 'px';
                    updateDarpProgressNote();
                };
                pinnedRationaleDiv.appendChild(pinnedTextarea);
                col.appendChild(listDiv);
                col.appendChild(pinnedRationaleDiv);
                container.appendChild(col);
                // Attach event listeners to all checkboxes in this modality to update rationale visibility
                setTimeout(() => {
                    const colElem = document.querySelector(`.darp-column[data-index="${modIndex}"]`);
                    if (colElem) {
                        const checkboxes = colElem.querySelectorAll('input[type="checkbox"]');
                        checkboxes.forEach(cb => {
                            cb.addEventListener('change', () => updatePinnedRationaleVisibility(modIndex));
                        });
                        updatePinnedRationaleVisibility(modIndex);
                    }
                }, 0);
            });
            applyNoPredictiveText(container);
        } catch (error) {
            console.error("Error rendering interventions:", error);
        }
    }

    function toggleJustification(checkbox) {
        // No longer needed: per-intervention rationale
        return;
    }

    // Show/hide pinned rationale textarea for modality
    function updatePinnedRationaleVisibility(modIndex) {
        const col = document.querySelector(`.darp-column[data-index="${modIndex}"]`);
        if (!col) return;
        const checkboxes = col.querySelectorAll('input[type="checkbox"]');
        const anyChecked = Array.from(checkboxes).some(cb => cb.checked);
        const pinnedDiv = col.querySelector('.pinned-rationale');
        if (pinnedDiv) {
            pinnedDiv.style.display = anyChecked ? '' : 'none';
        }
    }

    function addNewModality() {
        const input = document.getElementById('newModalityInput');
        const title = input.value.trim();
        if (!title) {
            alert("Please enter a name for the new category.");
            return;
        }
        
        darpModalities.push({
            title: title,
            items: []
        });
        
        input.value = '';
        saveModalities();
    }

    function renameModality(index) {
        const currentTitle = darpModalities[index].title;
        const newTitle = prompt("Enter new name for this category:", currentTitle);
        if (newTitle && newTitle.trim() !== "") {
            const finalTitle = newTitle.trim();
            // 1. Capture state (using old titles)
            const state = captureInterventionState();
            
            // 2. Update model
            darpModalities[index].title = finalTitle;
            
            // 3. Migrate state keys for this modality
            const newState = {};
            Object.keys(state).forEach(key => {
                const parts = key.split(':::');
                const keyTitle = parts[0];
                const keyItem = parts.slice(1).join(':::'); // Join back in case item text had delimiter
                
                if(keyTitle === currentTitle) {
                    newState[`${finalTitle}:::${keyItem}`] = state[key];
                } else {
                    newState[key] = state[key];
                }
            });
            
            // 4. Save using migrated state
            saveModalities(newState);
        }
    }

    function deleteModality(index) {
        if(confirm(`Delete "${darpModalities[index].title}" and all its options?`)) {
            darpModalities.splice(index, 1);
            saveModalities();
        }
    }

    function addIntervention(modIndex, text) {
        text = text.trim();
        if(!text) return;
        
        // Prevent duplicates in same list?
        if(darpModalities[modIndex].items.includes(text)) {
            alert("This item already exists in this list.");
            return;
        }

        darpModalities[modIndex].items.push(text);
        saveModalities();
    }

    function deleteIntervention(modIndex, itemIndex) {
        if(confirm(`Remove "${darpModalities[modIndex].items[itemIndex]}"?`)) {
            darpModalities[modIndex].items.splice(itemIndex, 1);
            saveModalities();
        }
    }

    // --- Combined DOMContentLoaded Initializer ---
    window.addEventListener('DOMContentLoaded', () => {
        window.scrollTo({ top: 0, behavior: 'auto' });
        if(typeof setScrollTopVisibility === 'function') setScrollTopVisibility('MSE');
        
        // DARP Init
        // Initialize dynamic interventions
        renderInterventions();
        applyNoPredictiveText();
        
        // *** NEW: Load intern info and set up buttons ***
        if(typeof loadInternInfo === 'function') loadInternInfo(); 
        const saveBtn = document.getElementById('saveInternInfo');
        if (saveBtn) saveBtn.addEventListener('click', saveInternInfo);
        
        const clearBtn = document.getElementById('clearInternInfo');
        if (clearBtn) clearBtn.addEventListener('click', clearInternInfo);
        // *** END NEW ***
        
        // Initial call to populate MSE field in DARP from the other tab
        if (typeof updateMseText === 'function' && document.getElementById('mseTextbox')) {
            updateMseText(); 
        }

        // --- ADDED: Logic for editable & synced MSE textareas ---
        const mseTextbox = document.getElementById('mseTextbox');
        const darpMentalStatusTextarea = document.getElementById('mentalStatus');

        if (mseTextbox && darpMentalStatusTextarea) {
            // Sync from MSE tab to DARP tab
            mseTextbox.addEventListener('input', () => {
                darpMentalStatusTextarea.value = mseTextbox.value;
                autoResize(darpMentalStatusTextarea);
                updateDarpProgressNote();
            });

            // Sync from DARP tab to MSE tab
            darpMentalStatusTextarea.addEventListener('input', () => {
                mseTextbox.value = darpMentalStatusTextarea.value;
                autoResize(mseTextbox);
            });
        }
        
        // Final update to ensure note is correct on load
        updateDarpProgressNote();
    });
