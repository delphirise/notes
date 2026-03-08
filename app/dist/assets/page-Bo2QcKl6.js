import{m as r}from"./schema-DzUJ57Zz.js";import{c as f,e as o}from"./index-CBqbAnDP.js";import{b}from"./note-engine-ChFpS_v0.js";const v={selections:{},notes:{}};function y(a,d){const c=d.selections[a.id]??[],n=d.notes[a.id]??"";return`
    <article class="panel stack-sm">
      <div class="section-heading compact-heading">
        <h3 class="panel-title small-title">${o(a.label)}</h3>
      </div>
      <div class="check-grid">
        ${a.choices.map(e=>{const u=c.includes(e)?"checked":"";return`
              <label class="check-card">
                <input type="checkbox" data-mse-option data-section-id="${o(a.id)}" value="${o(e)}" ${u} />
                <span>${o(e)}</span>
              </label>
            `}).join("")}
      </div>
      <label class="field-block">
        <span class="field-label">Custom note</span>
        <textarea data-mse-note data-section-id="${o(a.id)}" rows="2" placeholder="Add detail for ${o(a.label.toLowerCase())}">${o(n)}</textarea>
      </label>
    </article>
  `}function h(a){return{selections:{...a.selections??{}},notes:{...a.notes??{}}}}async function $(a,{featureState:d,replaceFeatureState:c}){const n=document.createElement("div");n.className="stack-lg",a.append(n);let e=h(d);const u=()=>{const s=b(r.sections,e),t=n.querySelector("#mse-output");t&&(t.value=s)},m=()=>{c(e),u()},p=()=>{n.innerHTML=`
      <section class="hero-grid">
        <article class="panel accent-panel stack-sm">
          <p class="eyebrow">Assessment</p>
          <h3 class="panel-title">MSE is now a schema-driven feature page.</h3>
          <p class="panel-copy">Sections and preset bundles live in JSON, while the summary builder lives in a shared note service. That means the wording logic can be reused by other notes without scraping an iframe.</p>
          <div class="actions-row wrap-row">
            ${r.presets.map(s=>`<button class="ghost-button" type="button" data-preset-id="${o(s.id)}">${o(s.label)}</button>`).join("")}
            <button class="ghost-button" type="button" data-clear-mse>Clear</button>
          </div>
        </article>
        <article class="panel stack-sm">
          <p class="eyebrow">Generated summary</p>
          <textarea id="mse-output" rows="12" readonly placeholder="Choose findings to build the MSE summary."></textarea>
          <div class="actions-row">
            <button class="primary-button" type="button" data-copy-mse>Copy MSE</button>
          </div>
        </article>
      </section>
      <section class="stack-md">
        ${r.sections.map(s=>y(s,e)).join("")}
      </section>
    `,u()};n.addEventListener("click",async s=>{const t=s.target.closest("[data-preset-id]");if(t){const l=r.presets.find(i=>i.id===t.dataset.presetId);if(!l)return;e={selections:structuredClone(l.values),notes:{}},c(e),p();return}if(s.target.closest("[data-clear-mse]")){e=h(v),c(e),p();return}s.target.closest("[data-copy-mse]")&&await f(b(r.sections,e))}),n.addEventListener("change",s=>{const t=s.target.closest("[data-mse-option]");if(!t)return;const l=t.dataset.sectionId,i=new Set(e.selections[l]??[]);t.checked?i.add(t.value):i.delete(t.value),e.selections[l]=Array.from(i),m()}),n.addEventListener("input",s=>{const t=s.target.closest("[data-mse-note]");t&&(e.notes[t.dataset.sectionId]=t.value,m())}),p()}export{v as defaultState,$ as mount};
