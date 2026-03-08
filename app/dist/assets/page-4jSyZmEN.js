import{c as y,e as c}from"./index-CBqbAnDP.js";import{d as m}from"./note-engine-ChFpS_v0.js";const l=[{id:"alcohol-use-disorder",name:"Alcohol Use Disorder",icd:["F10.10","F10.20"],criteria:["Alcohol used in larger amounts or longer than intended","Persistent desire or unsuccessful efforts to cut down","Craving or strong urge to use alcohol","Continued use despite social or interpersonal problems","Recurrent use in hazardous situations","Tolerance or withdrawal symptoms"]},{id:"opioid-use-disorder",name:"Opioid Use Disorder",icd:["F11.10","F11.20"],criteria:["Opioids taken in larger amounts or over longer periods than intended","Unsuccessful efforts to cut down opioid use","Time spent obtaining, using, or recovering from opioids","Craving or strong desire to use opioids","Failure to fulfill major obligations","Tolerance or withdrawal symptoms"]},{id:"stimulant-use-disorder",name:"Stimulant Use Disorder",icd:["F14.10","F14.20","F15.10","F15.20"],criteria:["Stimulant use exceeding intended amount or duration","Persistent desire or failed attempts to reduce use","Significant time devoted to obtaining or recovering from use","Craving or urge to use stimulants","Continued use despite physical or psychological harm","Tolerance or withdrawal symptoms"]}];var h;const v={diagnosisId:((h=l[0])==null?void 0:h.id)??"",selectedCriteria:[]};function u(a){return l.find(o=>o.id===a.diagnosisId)??l[0]??null}function b(a,o){return a?a.criteria.map(n=>{const t=o.includes(n)?"checked":"";return`
        <label class="check-card">
          <input type="checkbox" data-diagnostic-criterion value="${c(n)}" ${t} />
          <span>${c(n)}</span>
        </label>
      `}).join(""):'<p class="empty-state">No diagnostic data configured yet.</p>'}async function k(a,{featureState:o,replaceFeatureState:n}){const t=document.createElement("div");t.className="stack-lg",a.append(t);const e={diagnosisId:o.diagnosisId||v.diagnosisId,selectedCriteria:[...o.selectedCriteria??[]]},p=()=>{const s=u(e),i=t.querySelector("#diagnostic-output");i&&(i.value=m(s,e.selectedCriteria))},f=()=>{n(e),p()},g=()=>{const s=u(e);t.innerHTML=`
      <section class="hero-grid">
        <article class="panel accent-panel stack-sm">
          <p class="eyebrow">Diagnostics</p>
          <h3 class="panel-title">Structured criteria can live in JSON too.</h3>
          <p class="panel-copy">The current repo embeds large diagnostic content directly inside HTML files. Here, the diagnosis catalog is data and the summary logic is reusable application code.</p>
        </article>
        <article class="panel stack-sm">
          <p class="eyebrow">Diagnostic summary</p>
          <textarea id="diagnostic-output" rows="12" readonly></textarea>
          <div class="actions-row">
            <button class="primary-button" type="button" data-copy-diagnostic>Copy summary</button>
          </div>
        </article>
      </section>

      <section class="two-column-grid">
        <article class="panel stack-sm">
          <label class="field-block">
            <span class="field-label">Diagnosis</span>
            <select id="diagnosis-select">
              ${l.map(i=>{const r=i.id===e.diagnosisId?"selected":"";return`<option value="${c(i.id)}" ${r}>${c(i.name)}</option>`}).join("")}
            </select>
          </label>
          <div class="pill-row">
            ${((s==null?void 0:s.icd)??[]).map(i=>`<span class="pill">${c(i)}</span>`).join("")}
          </div>
        </article>
        <article class="panel stack-sm">
          <div class="section-heading compact-heading">
            <h3 class="panel-title small-title">Criteria</h3>
          </div>
          <div class="check-grid">
            ${b(s,e.selectedCriteria)}
          </div>
        </article>
      </section>
    `,p()};t.addEventListener("change",s=>{const i=s.target.closest("#diagnosis-select");if(i){e.diagnosisId=i.value,e.selectedCriteria=[],n(e),g();return}const r=s.target.closest("[data-diagnostic-criterion]");if(!r)return;const d=new Set(e.selectedCriteria);r.checked?d.add(r.value):d.delete(r.value),e.selectedCriteria=Array.from(d),f()}),t.addEventListener("click",async s=>{if(s.target.closest("[data-copy-diagnostic]")){const i=u(e);await y(m(i,e.selectedCriteria))}}),g()}export{v as defaultState,k as mount};
