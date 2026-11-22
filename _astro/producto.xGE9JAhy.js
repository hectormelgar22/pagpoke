import{nt as e,rt as t,tt as n}from"./clave.DD8YBWnD.js";import{d as r,f as i,m as a,p as o}from"./ui.Ql9TXEJL.js";function s(e){return e<=0?{texto:`Agotado`,clase:`agotado`}:e===1?{texto:`Última unidad`,clase:`pocas`}:e<=3?{texto:`Quedan ${e}`,clase:`pocas`}:{texto:`Disponible`,clase:`ok`}}var c=e=>`/pagpoke/catalogo/${e.slug}/`,l=e=>`${e.nombre}${e.numero?` ${e.numero}`:``}`;function u(n){return[e.get(n.categoria)?.nombre,n.expansion&&t.get(n.expansion)?.nombre,n.idioma].filter(Boolean).join(` · `)}function d(e,t){return t>0?i`<button class="btn btn--acento btn--peq" type="button" data-reservar="${e.id}">${o(a(`bolsa`))}Reservar</button>`:i`<button class="btn btn--fantasma btn--peq" type="button" data-avisar="${e.id}">${o(a(`alerta`))}Avísame</button>`}function f(e){if(!e.rareza)return``;let t=n[e.rareza];return i`<span class="rareza rareza--${t.nivel}" title="${t.nombre}"><span aria-hidden="true">${t.simbolo}</span> ${t.nombre}</span>`}function p(e,t,n={}){let p=s(t.stock),m=e.etiquetas.includes(`novedad`)?`Novedad`:e.etiquetas.includes(`mas-buscado`)?`Muy buscado`:``;return i`<article class="producto" data-id="${e.id}" style="--c1:${e.arte.c1};--c2:${e.arte.c2}">
  <div class="producto-arte">
    <img src="/pagpoke/productos/${e.id}.webp" width="600" height="600" alt="${l(e)}" loading="${n.cargaPrioritaria?`eager`:`lazy`}" decoding="async" />
    ${m?i`<span class="sello">${m}</span>`:``}
    ${f(e)}
  </div>
  <button class="producto-fav" type="button" data-favorito="${e.id}" aria-pressed="false" aria-label="Guardar ${e.nombre} en favoritos">${o(a(`corazon`))}</button>
  <div class="producto-info">
    <p class="producto-meta">${u(e)}</p>
    <h3 class="producto-nombre"><a href="${c(e)}">${e.nombre}</a></h3>
    ${e.numero||e.condicion?i`<p class="producto-num mono">${[e.numero,e.condicion].filter(Boolean).join(` · `)}</p>`:``}
    <div class="producto-pie">
      <span class="precio cifra" data-precio="${e.id}">${r(t.precio)}</span>
      <span class="stock stock--${p.clase}" data-stock="${e.id}">${p.texto}</span>
    </div>
    <div class="producto-accion" data-accion="${e.id}">${d(e,t.stock)}</div>
  </div>
</article>`}function m(e,t){return i`<div class="mini-producto">
  <img src="/pagpoke/productos/${e.id}.webp" width="80" height="80" alt="" />
  <div><p class="producto-meta">${u(e)}</p><p class="h3">${e.nombre}</p>
  <p class="mono" style="margin-top:4px">${r(t.precio)} · ${s(t.stock).texto}</p></div>
</div>`}export{s as a,p as i,m as n,c as o,u as r,d as t};