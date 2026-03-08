import{r as u}from"./dynamic-form-CJxcwHAq.js";import{c as f}from"./index-CBqbAnDP.js";import{g as o}from"./note-engine-ChFpS_v0.js";const l=[{id:"warningSigns",label:"Warning signs",placeholder:"What thoughts, feelings, or situations signal that risk is rising?"},{id:"internalCoping",label:"Internal coping strategies",placeholder:"What can the client do alone to reduce distress?"},{id:"peoplePlaces",label:"People and places for distraction",placeholder:"Who or where can the client go for support or distraction?"},{id:"trustedContacts",label:"Trusted contacts",placeholder:"Who can be called directly for help?"},{id:"professionalSupports",label:"Professional supports",placeholder:"Clinicians, hotlines, urgent care, or emergency resources"},{id:"meansSafety",label:"Means safety",placeholder:"What steps will reduce access to lethal means or substances?"}],v={values:{}};function h(){return l.map(n=>({key:n.id,label:n.label,type:"textarea",rows:3,placeholder:n.placeholder}))}async function b(n,{featureState:c,replaceFeatureState:d}){const t=document.createElement("div");t.className="stack-lg",n.append(t);const s={values:{...c.values??{}}},p=h(),r=()=>{const a=t.querySelector("#safety-plan-output");a&&(a.value=o(l,s.values))},i=()=>{d(s),r()};t.innerHTML=`
    <section class="hero-grid">
      <article class="panel accent-panel stack-sm">
        <p class="eyebrow">Safety planning</p>
        <h3 class="panel-title">Crisis planning can share the same form infrastructure.</h3>
        <p class="panel-copy">This route uses the generic dynamic field renderer and the shared note engine, so the safety plan is just another structured feature instead of a one-off page.</p>
      </article>
      <article class="panel stack-sm">
        <p class="eyebrow">Generated safety plan</p>
        <textarea id="safety-plan-output" rows="14" readonly></textarea>
        <div class="actions-row">
          <button class="primary-button" type="button" data-copy-safety-plan>Copy plan</button>
        </div>
      </article>
    </section>

    <section class="two-column-grid">
      <article class="panel stack-sm">
        <div class="field-grid">
          ${u(p,s.values)}
        </div>
      </article>
      <article class="panel stack-sm">
        <p class="eyebrow">Shared architecture</p>
        <div class="info-list">
          <div>
            <span class="mini-label">Data source</span>
            <p>Plan sections come from JSON, so wording and order can change without editing the router.</p>
          </div>
          <div>
            <span class="mini-label">Reuse</span>
            <p>The same dynamic form renderer could support CSSRS, discharge planning, or screening tools next.</p>
          </div>
        </div>
      </article>
    </section>
  `,t.addEventListener("input",a=>{const e=a.target;(e instanceof HTMLInputElement||e instanceof HTMLTextAreaElement)&&e.dataset.fieldKey&&(s.values[e.dataset.fieldKey]=e.value,i())}),t.addEventListener("change",a=>{const e=a.target;(e instanceof HTMLInputElement||e instanceof HTMLTextAreaElement)&&e.dataset.fieldKey&&(s.values[e.dataset.fieldKey]=e.value,i())}),t.addEventListener("click",async a=>{a.target.closest("[data-copy-safety-plan]")&&await f(o(l,s.values))}),r()}export{v as defaultState,b as mount};
