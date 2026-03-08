import{c as k,e as s}from"./index-CBqbAnDP.js";import{e as h}from"./note-engine-ChFpS_v0.js";const j=[{id:"recovery-stability",name:"Recovery Stability",objectives:["Maintain abstinence or reduced use for the next review period","Strengthen use of sober supports","Identify and interrupt relapse triggers"],interventions:["Review relapse prevention plan each session","Assign skills practice between sessions","Coordinate with community supports or recovery meetings"]},{id:"mental-health",name:"Mental Health Regulation",objectives:["Reduce frequency or intensity of anxiety symptoms","Improve mood stability and daily functioning","Increase use of grounding and self-regulation skills"],interventions:["Teach emotion regulation strategies","Practice cognitive restructuring","Monitor sleep, stress, and symptom patterns"]},{id:"life-functioning",name:"Life Functioning",objectives:["Improve appointment attendance and follow-through","Strengthen family or social communication","Increase stability in work, school, or housing"],interventions:["Use problem-solving around barriers","Coordinate care with outside providers","Build a weekly structure and accountability plan"]}],w={domains:j},d=w.domains;var f;const I={domainId:((f=d[0])==null?void 0:f.id)??"",objectives:[],interventions:[],targetDate:""};function u(o){return d.find(i=>i.id===o.domainId)??d[0]??null}function y(o,i,l){return o.map(a=>{const e=i.includes(a)?"checked":"";return`
        <label class="check-card">
          <input type="checkbox" data-plan-kind="${s(l)}" value="${s(a)}" ${e} />
          <span>${s(a)}</span>
        </label>
      `}).join("")}async function x(o,{featureState:i,replaceFeatureState:l}){const a=document.createElement("div");a.className="stack-lg",o.append(a);const e={domainId:i.domainId||I.domainId,objectives:[...i.objectives??[]],interventions:[...i.interventions??[]],targetDate:i.targetDate??""},v=()=>{const t=u(e),n=a.querySelector("#planner-output");n&&(n.value=h({domain:t==null?void 0:t.name,objectives:e.objectives,interventions:e.interventions,targetDate:e.targetDate}))},m=()=>{l(e),v()},b=()=>{const t=u(e);a.innerHTML=`
      <section class="hero-grid">
        <article class="panel accent-panel stack-sm">
          <p class="eyebrow">Treatment planning</p>
          <h3 class="panel-title">Goals, objectives, and interventions belong in data libraries.</h3>
          <p class="panel-copy">The current planner can be broken into configurable domain libraries so staff can update content without rewriting page markup.</p>
        </article>
        <article class="panel stack-sm">
          <p class="eyebrow">Plan summary</p>
          <textarea id="planner-output" rows="12" readonly></textarea>
          <div class="actions-row">
            <button class="primary-button" type="button" data-copy-plan>Copy plan</button>
          </div>
        </article>
      </section>

      <section class="three-column-grid">
        <article class="panel stack-sm">
          <label class="field-block">
            <span class="field-label">Goal domain</span>
            <select id="plan-domain-select">
              ${d.map(n=>{const r=n.id===e.domainId?"selected":"";return`<option value="${s(n.id)}" ${r}>${s(n.name)}</option>`}).join("")}
            </select>
          </label>
          <label class="field-block">
            <span class="field-label">Review date</span>
            <input id="plan-target-date" type="date" value="${s(e.targetDate)}" />
          </label>
        </article>
        <article class="panel stack-sm">
          <div class="section-heading compact-heading">
            <h3 class="panel-title small-title">Objectives</h3>
          </div>
          <div class="check-grid">
            ${t?y(t.objectives,e.objectives,"objective"):""}
          </div>
        </article>
        <article class="panel stack-sm">
          <div class="section-heading compact-heading">
            <h3 class="panel-title small-title">Interventions</h3>
          </div>
          <div class="check-grid">
            ${t?y(t.interventions,e.interventions,"intervention"):""}
          </div>
        </article>
      </section>
    `,v()};a.addEventListener("change",t=>{const n=t.target.closest("#plan-domain-select");if(n){e.domainId=n.value,e.objectives=[],e.interventions=[],l(e),b();return}const r=t.target.closest("#plan-target-date");if(r){e.targetDate=r.value,m();return}const c=t.target.closest("[data-plan-kind]");if(!c)return;const g=c.dataset.planKind==="objective"?"objectives":"interventions",p=new Set(e[g]);c.checked?p.add(c.value):p.delete(c.value),e[g]=Array.from(p),m()}),a.addEventListener("click",async t=>{if(t.target.closest("[data-copy-plan]")){const n=u(e);await k(h({domain:n==null?void 0:n.name,objectives:e.objectives,interventions:e.interventions,targetDate:e.targetDate}))}}),b()}export{I as defaultState,x as mount};
