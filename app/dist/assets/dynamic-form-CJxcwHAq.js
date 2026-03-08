import{e as l}from"./index-CBqbAnDP.js";function n(t,s){return t.options.map(e=>{const a=e.value===s?"selected":"";return`<option value="${l(e.value)}" ${a}>${l(e.label)}</option>`}).join("")}function o(t,s={}){return t.map(e=>{const a=s[e.key]??"",p=e.helpText?`<p class="field-help">${l(e.helpText)}</p>`:"";return e.type==="textarea"?`
          <label class="field-block">
            <span class="field-label">${l(e.label)}</span>
            <textarea data-field-key="${l(e.key)}" rows="${e.rows??4}" placeholder="${l(e.placeholder??"")}">${l(a)}</textarea>
            ${p}
          </label>
        `:e.type==="select"?`
          <label class="field-block">
            <span class="field-label">${l(e.label)}</span>
            <select data-field-key="${l(e.key)}">
              <option value="">${l(e.placeholder??"Select an option")}</option>
              ${n(e,a)}
            </select>
            ${p}
          </label>
        `:`
        <label class="field-block">
          <span class="field-label">${l(e.label)}</span>
          <input data-field-key="${l(e.key)}" type="${l(e.type??"text")}" value="${l(a)}" placeholder="${l(e.placeholder??"")}" />
          ${p}
        </label>
      `}).join("")}export{o as r};
