import{r as v}from"./dynamic-form-CJxcwHAq.js";import{c as b,e as u}from"./index-CBqbAnDP.js";import{f as m}from"./note-engine-ChFpS_v0.js";const n=[{id:"attendance",label:"Attendance Verification",fields:[{key:"recipient",label:"Recipient",type:"text",placeholder:"To whom it may concern"},{key:"clientName",label:"Client name",type:"text",placeholder:"Client initials or name"},{key:"date",label:"Visit date",type:"date"},{key:"reason",label:"Visit type",type:"text",placeholder:"counseling session, medication visit, etc."}],body:`{{recipient}}

This letter verifies that {{clientName}} was seen on {{date}} for a {{reason}}. Please contact the clinic if additional verification is required.`},{id:"referral",label:"Referral Letter",fields:[{key:"recipient",label:"Recipient",type:"text",placeholder:"Receiving provider or agency"},{key:"clientName",label:"Client name",type:"text",placeholder:"Client initials or name"},{key:"date",label:"Referral date",type:"date"},{key:"summary",label:"Clinical summary",type:"textarea",rows:4,placeholder:"Reason for referral and current concerns"},{key:"requestedService",label:"Requested service",type:"text",placeholder:"Specific assessment, counseling, case management, etc."}],body:`{{recipient}}

This letter serves as a referral for {{clientName}} dated {{date}}.

Clinical summary: {{summary}}

Requested service: {{requestedService}}`}];var y;const h={letterId:((y=n[0])==null?void 0:y.id)??"",values:{}};function r(i){return n.find(l=>l.id===i.letterId)??n[0]??null}async function w(i,{featureState:l,replaceFeatureState:c}){const s=document.createElement("div");s.className="stack-lg",i.append(s);const t={letterId:l.letterId||h.letterId,values:{...l.values??{}}},o=()=>{const a=r(t),e=s.querySelector("#letter-output");e&&(e.value=m(a,t.values))},d=()=>{c(t),o()},p=()=>{const a=r(t);s.innerHTML=`
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
              ${n.map(e=>{const f=e.id===t.letterId?"selected":"";return`<option value="${u(e.id)}" ${f}>${u(e.label)}</option>`}).join("")}
            </select>
          </label>
          <div class="field-grid">
            ${a?v(a.fields,t.values):""}
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
    `,o()};s.addEventListener("change",a=>{const e=a.target;if(e instanceof HTMLInputElement||e instanceof HTMLSelectElement||e instanceof HTMLTextAreaElement){if(e.id==="letter-type-select"){t.letterId=e.value,t.values={},c(t),p();return}e.dataset.fieldKey&&(t.values[e.dataset.fieldKey]=e.value,d())}}),s.addEventListener("input",a=>{const e=a.target;(e instanceof HTMLInputElement||e instanceof HTMLTextAreaElement)&&e.dataset.fieldKey&&(t.values[e.dataset.fieldKey]=e.value,d())}),s.addEventListener("click",async a=>{if(a.target.closest("[data-copy-letter]")){const e=r(t);await b(m(e,t.values))}}),p()}export{h as defaultState,w as mount};
