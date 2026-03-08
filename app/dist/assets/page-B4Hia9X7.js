import{m}from"./schema-DzUJ57Zz.js";import{e as l,g,c as b}from"./index-CBqbAnDP.js";import{b as h,a as p}from"./note-engine-ChFpS_v0.js";const f=[{name:"CBT",items:["challenged cognitive distortions","reviewed triggers and thought patterns","assigned coping practice between sessions"]},{name:"Motivational Interviewing",items:["explored ambivalence about change","reinforced change talk","scaled readiness and confidence"]},{name:"Relapse Prevention",items:["identified relapse warning signs","updated relapse prevention plan","reviewed sober supports"]},{name:"Skills Training",items:["practiced grounding skills","modeled emotion regulation strategy","rehearsed communication skill"]}],v={sessionContent:"",mentalStatus:"",response:"",goals:"",plan:"",interventions:[]};function u(s){return{sessionContent:s.sessionContent??"",mentalStatus:s.mentalStatus??"",response:s.response??"",goals:s.goals??"",plan:s.plan??"",interventions:[...s.interventions??[]]}}function y(s,c){return`
    <article class="panel stack-sm">
      <div class="section-heading compact-heading">
        <h3 class="panel-title small-title">${l(s.name)}</h3>
      </div>
      <div class="check-grid">
        ${s.items.map(r=>{const a=c.includes(r)?"checked":"";return`
              <label class="check-card">
                <input type="checkbox" data-intervention value="${l(r)}" ${a} />
                <span>${l(r)}</span>
              </label>
            `}).join("")}
      </div>
    </article>
  `}async function S(s,{featureState:c,replaceFeatureState:r}){const a=document.createElement("div");a.className="stack-lg",s.append(a);const t=u(c),d=()=>{const n=p(t),e=a.querySelector("#darp-output");e&&(e.value=n)},i=()=>{r(t),d()};a.innerHTML=`
    <section class="hero-grid">
      <article class="panel accent-panel stack-sm">
        <p class="eyebrow">Progress note</p>
        <h3 class="panel-title">DARP can pull directly from other features.</h3>
        <p class="panel-copy">This route shows the main benefit of removing iframes: a progress note can use the current MSE summary with one button because every feature is in the same stateful app.</p>
        <div class="actions-row wrap-row">
          <button class="ghost-button" type="button" data-use-mse>Pull current MSE summary</button>
          <button class="ghost-button" type="button" data-clear-darp>Clear note</button>
        </div>
      </article>
      <article class="panel stack-sm">
        <p class="eyebrow">Generated DARP</p>
        <textarea id="darp-output" rows="14" readonly></textarea>
        <div class="actions-row">
          <button class="primary-button" type="button" data-copy-darp>Copy DARP</button>
        </div>
      </article>
    </section>

    <section class="two-column-grid">
      <article class="panel stack-sm">
        <label class="field-block">
          <span class="field-label">Session content and problems addressed</span>
          <textarea id="darp-session-content" rows="5" placeholder="Client presentation, themes, and stressors">${l(t.sessionContent)}</textarea>
        </label>
        <label class="field-block">
          <span class="field-label">Mental status</span>
          <textarea id="darp-mental-status" rows="4" placeholder="Pull from the MSE route or summarize here">${l(t.mentalStatus)}</textarea>
        </label>
        <label class="field-block">
          <span class="field-label">Client response</span>
          <textarea id="darp-response" rows="4" placeholder="Engagement, insight, barriers, and progress">${l(t.response)}</textarea>
        </label>
        <label class="field-block">
          <span class="field-label">Progress toward goals</span>
          <textarea id="darp-goals" rows="4" placeholder="Which treatment goals moved during the session?">${l(t.goals)}</textarea>
        </label>
        <label class="field-block">
          <span class="field-label">Plan</span>
          <textarea id="darp-plan" rows="4" placeholder="Next session focus, referrals, follow-up, or homework">${l(t.plan)}</textarea>
        </label>
      </article>

      <section class="stack-sm">
        ${f.map(n=>y(n,t.interventions)).join("")}
      </section>
    </section>
  `,a.addEventListener("click",async n=>{if(n.target.closest("[data-use-mse]")){const e=g("mse",{selections:{},notes:{}});t.mentalStatus=h(m.sections,e);const o=a.querySelector("#darp-mental-status");o&&(o.value=t.mentalStatus),i();return}if(n.target.closest("[data-clear-darp]")){Object.assign(t,u(v)),a.querySelectorAll("textarea").forEach(e=>{e.id!=="darp-output"&&(e.value="")}),a.querySelectorAll("[data-intervention]").forEach(e=>{e.checked=!1}),i();return}n.target.closest("[data-copy-darp]")&&await b(p(t))}),a.addEventListener("input",n=>{const e=n.target;e instanceof HTMLTextAreaElement&&(e.id==="darp-session-content"&&(t.sessionContent=e.value),e.id==="darp-mental-status"&&(t.mentalStatus=e.value),e.id==="darp-response"&&(t.response=e.value),e.id==="darp-goals"&&(t.goals=e.value),e.id==="darp-plan"&&(t.plan=e.value),i())}),a.addEventListener("change",n=>{const e=n.target.closest("[data-intervention]");if(!e)return;const o=new Set(t.interventions);e.checked?o.add(e.value):o.delete(e.value),t.interventions=Array.from(o),i()}),d()}export{v as defaultState,S as mount};
