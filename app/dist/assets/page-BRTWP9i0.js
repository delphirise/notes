import{n,e}from"./index-CBqbAnDP.js";const o=[{oldSurface:"index.html with inline MSE and DARP logic",newSurface:"feature modules with shared services",outcome:"One state store and one router instead of large script blocks."},{oldSurface:"Templates.html plus src/templates.js",newSurface:"templates route with JSON field definitions",outcome:"Role-based templates are data, not a monolith."},{oldSurface:"Iframe-loaded diagnostics, letters, planner, and safety plan",newSurface:"lazy-loaded routes inside the same shell",outcome:"Cross-feature reuse is now possible without postMessage workarounds."}];async function p(t,{navigate:l}){const s=document.createElement("div");s.className="stack-lg",t.append(s);const i=n.filter(a=>a.route!=="dashboard");s.innerHTML=`
    <section class="hero-grid">
      <article class="panel accent-panel">
        <p class="eyebrow">Why this structure works</p>
        <h3 class="panel-title">The app is organized around features, not files.</h3>
        <p class="panel-copy">Each tool becomes a route with its own page module, JSON definitions, and shared services. That eliminates iframe silos and lets MSE, DARP, templates, letters, and safety planning participate in the same session state.</p>
        <div class="pill-row">
          <span class="pill">Hash routing</span>
          <span class="pill">Local persistence</span>
          <span class="pill">JSON-backed forms</span>
          <span class="pill">Feature modules</span>
        </div>
      </article>
      <article class="panel stat-grid">
        <div class="stat-card">
          <span class="stat-value">1</span>
          <span class="stat-label">shell app</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">7</span>
          <span class="stat-label">feature routes</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">6</span>
          <span class="stat-label">shared service layers</span>
        </div>
      </article>
    </section>

    <section class="panel stack-md">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Feature map</p>
          <h3 class="panel-title">Current repo tools mapped into one workspace</h3>
        </div>
      </div>
      <div class="card-grid">
        ${i.map(a=>`
              <article class="detail-card">
                <p class="detail-kicker">${e(a.eyebrow)}</p>
                <h4>${e(a.label)}</h4>
                <p>${e(a.description)}</p>
                <button class="primary-button small-button" type="button" data-open-route="${e(a.route)}">Open ${e(a.label)}</button>
              </article>
            `).join("")}
      </div>
    </section>

    <section class="panel stack-md">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Migration map</p>
          <h3 class="panel-title">What changed from the iframe model</h3>
        </div>
      </div>
      <div class="table-like">
        ${o.map(a=>`
              <div class="table-row">
                <div>
                  <span class="mini-label">Old surface</span>
                  <p>${e(a.oldSurface)}</p>
                </div>
                <div>
                  <span class="mini-label">New surface</span>
                  <p>${e(a.newSurface)}</p>
                </div>
                <div>
                  <span class="mini-label">Why it matters</span>
                  <p>${e(a.outcome)}</p>
                </div>
              </div>
            `).join("")}
      </div>
    </section>
  `,s.querySelectorAll("[data-open-route]").forEach(a=>{a.addEventListener("click",()=>l(a.dataset.openRoute))})}export{p as mount};
