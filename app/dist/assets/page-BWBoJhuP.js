import{r as w}from"./dynamic-form-CJxcwHAq.js";import{c as k,e as r}from"./index-CBqbAnDP.js";import{c as y}from"./note-engine-ChFpS_v0.js";const h=[{id:"telehealth-counseling",role:"counseling",label:"Telehealth Counseling",fields:[{key:"clientName",label:"Client name",type:"text",placeholder:"Client initials or name"},{key:"date",label:"Session date",type:"date"},{key:"sessionFocus",label:"Session focus",type:"textarea",rows:4,placeholder:"Primary concerns, stressors, or treatment themes"},{key:"response",label:"Client response",type:"textarea",rows:4,placeholder:"How the client responded during session"},{key:"plan",label:"Plan",type:"textarea",rows:3,placeholder:"Next steps and follow-up"}],output:`Client {{clientName}} participated in a telehealth counseling session on {{date}}.

Session focus: {{sessionFocus}}

Client response: {{response}}

Plan: {{plan}}`},{id:"entry-cd",role:"counseling",label:"Entry Session - Chemical Dependency",fields:[{key:"clientName",label:"Client name",type:"text",placeholder:"Client initials or name"},{key:"date",label:"Entry date",type:"date"},{key:"presentingProblem",label:"Presenting problem",type:"textarea",rows:4,placeholder:"Why the client is seeking services"},{key:"goals",label:"Client goals",type:"textarea",rows:4,placeholder:"Stated or observed goals"},{key:"recommendations",label:"Recommendations",type:"textarea",rows:3,placeholder:"Recommended services or supports"}],output:`Entry session completed for {{clientName}} on {{date}}.

Presenting problem: {{presentingProblem}}

Client goals: {{goals}}

Recommendations: {{recommendations}}`},{id:"med-management-follow-up",role:"medical",label:"Medication Management Follow-Up",fields:[{key:"clientName",label:"Client name",type:"text",placeholder:"Client initials or name"},{key:"date",label:"Follow-up date",type:"date"},{key:"medications",label:"Current medications",type:"textarea",rows:4,placeholder:"Medication list and adherence"},{key:"symptoms",label:"Symptoms reviewed",type:"textarea",rows:4,placeholder:"Symptoms, side effects, or improvements"},{key:"plan",label:"Medication plan",type:"textarea",rows:3,placeholder:"Adjustments, refills, monitoring"}],output:`Medication management follow-up completed for {{clientName}} on {{date}}.

Current medications: {{medications}}

Symptoms reviewed: {{symptoms}}

Plan: {{plan}}`},{id:"psychiatric-follow-up",role:"psychiatric",label:"Psychiatric Follow-Up",fields:[{key:"clientName",label:"Client name",type:"text",placeholder:"Client initials or name"},{key:"date",label:"Encounter date",type:"date"},{key:"moodSymptoms",label:"Mood and symptom update",type:"textarea",rows:4,placeholder:"Mood symptoms, sleep, anxiety, or psychosis review"},{key:"riskReview",label:"Risk review",type:"textarea",rows:3,placeholder:"SI, HI, psychosis, or acute concerns"},{key:"plan",label:"Treatment plan",type:"textarea",rows:3,placeholder:"Medication and follow-up plan"}],output:`Psychiatric follow-up completed for {{clientName}} on {{date}}.

Mood and symptom update: {{moodSymptoms}}

Risk review: {{riskReview}}

Treatment plan: {{plan}}`}],v=[{id:"counseling",label:"Counseling"},{id:"medical",label:"Medical"},{id:"psychiatric",label:"Psychiatric"}];var b;const f={role:((b=v[0])==null?void 0:b.id)??"",noteId:"",values:{}};function g(l){return h.filter(a=>a.role===l)}function x(l){var n;const a=g(l.role);a.some(t=>t.id===l.noteId)||(l.noteId=((n=a[0])==null?void 0:n.id)??"",l.values={})}function p(l){return h.find(a=>a.id===l.noteId)??null}async function S(l,{featureState:a,replaceFeatureState:i}){const n=document.createElement("div");n.className="stack-lg",l.append(n);const t={role:a.role||f.role,noteId:a.noteId||f.noteId,values:{...a.values??{}}},m=()=>{const s=p(t),e=y(s,t.values),o=n.querySelector("#template-output");o&&(o.value=e)},u=()=>{i(t),m()},c=()=>{x(t);const s=g(t.role),e=p(t);n.innerHTML=`
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
              ${v.map(o=>{const d=o.id===t.role?"selected":"";return`<option value="${r(o.id)}" ${d}>${r(o.label)}</option>`}).join("")}
            </select>
          </label>
          <label class="field-block">
            <span class="field-label">Note type</span>
            <select id="template-note-select">
              ${s.map(o=>{const d=o.id===t.noteId?"selected":"";return`<option value="${r(o.id)}" ${d}>${r(o.label)}</option>`}).join("")}
            </select>
          </label>
          <div class="field-grid">
            ${e?w(e.fields,t.values):'<p class="empty-state">No notes available for the selected role.</p>'}
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
    `,m()};n.addEventListener("change",s=>{const e=s.target;if(e instanceof HTMLInputElement||e instanceof HTMLSelectElement||e instanceof HTMLTextAreaElement){if(e.id==="template-role-select"){t.role=e.value,t.noteId="",t.values={},i(t),c();return}if(e.id==="template-note-select"){t.noteId=e.value,t.values={},i(t),c();return}e.dataset.fieldKey&&(t.values[e.dataset.fieldKey]=e.value,u())}}),n.addEventListener("input",s=>{const e=s.target;(e instanceof HTMLInputElement||e instanceof HTMLTextAreaElement)&&e.dataset.fieldKey&&(t.values[e.dataset.fieldKey]=e.value,u())}),n.addEventListener("click",async s=>{if(s.target.closest("[data-copy-template]")){const e=p(t);await k(y(e,t.values))}}),c()}export{f as defaultState,S as mount};
