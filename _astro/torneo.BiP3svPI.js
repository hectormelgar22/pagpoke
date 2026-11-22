import{f as e,m as t,p as n}from"./ui.Ql9TXEJL.js";import{C as r,G as i,H as a,J as o,M as s,O as c,P as l,S as u,T as d,V as f,W as p,c as m,d as h,g,h as _,k as v,l as y,s as b,u as x,w as S,x as C,z as w}from"./clave.DD8YBWnD.js";var T=e=>t=>e[t]?.nick??`—`,E=e=>e.creadoEnPanel?`/pagpoke/torneos/evento/?id=${encodeURIComponent(e.id)}`:`/pagpoke/torneos/${e.slug}/`;function D(e,t){let n=g(e,t),i=r(e);return`${e.nombre} · ${f(e.inicio)} · ${h(n)?`${i.libres} ${i.libres===1?`plaza`:`plazas`}`:m[n]}`}var O=(e,t)=>e.find(e=>h(g(e,t)))??e[0],k=e=>`Nº ${String(e.numero).padStart(3,`0`)}`;function A(t,n=``){return e`<span class="pill pill--${t} ${n}">${m[t]}</span>`}function j(t,n=!1){let i=r(t),a=i.libres===0;return e`<div class="plazas${n?` plazas--compacta`:``}" data-plazas="${t.id}">
  <p class="plazas-num"><strong class="cifra">${i.ocupadas}</strong><span class="cifra"> / ${t.capacidad}</span> participantes</p>
  <div class="barra${a?` barra--llena`:i.libres<=c(t.capacidad)?` barra--casi`:``}" role="progressbar" aria-label="Plazas ocupadas" aria-valuemin="0" aria-valuemax="${t.capacidad}" aria-valuenow="${i.ocupadas}">
    <span style="--p:${i.pct.toFixed(3)}"></span>
  </div>
  <p class="plazas-libres">${a?t.listaEspera.length?`Completo · ${t.listaEspera.length} en lista de espera`:`Completo`:`${i.libres} ${i.libres===1?`plaza libre`:`plazas libres`}`}${i.pendientes?` · ${i.pendientes} por confirmar`:``}</p>
</div>`}function M(t,n){let r=E(t);return h(n)?e`<a class="btn btn--acento btn--peq" href="${r}#inscripcion">Inscribirme</a>`:x(n)?e`<a class="btn btn--fantasma btn--peq" href="${r}#inscripcion">Lista de espera</a>`:n===`en-curso`||n===`finalizado`?e`<a class="btn btn--fantasma btn--peq" href="${r}#competicion">${n===`en-curso`?`Seguir el cuadro`:`Ver resultados`}</a>`:``}function N(r){return e`<div class="tt-portada tema-${r.tema}" aria-hidden="true">
  <span class="tt-portada-num">${String(r.numero).padStart(3,`0`)}</span>
  <span class="tt-portada-mod">${r.modalidad}</span>
  ${n(t(r.tipo===`presentacion`?`cartas`:r.formato===`eliminacion`?`trofeo`:`usuarios`,`tt-portada-ico`))}
</div>`}function P(r,i){let a=g(r,i);return e`<article class="torneo-tarjeta tema-${r.tema}" data-torneo="${r.id}" data-estado="${a}" data-formato="${r.formato}" data-inicio="${r.inicio}">
  ${N(r)}
  <div class="tt-cuerpo">
    <div class="tt-cab"><span class="mono tt-num">${k(r)}</span>${A(a)}</div>
    <h3 class="tt-nombre"><a href="${E(r)}">${r.nombre}</a></h3>
    <ul class="tt-datos" role="list">
      <li>${n(t(`calendario`))}<span><time datetime="${r.inicio}">${f(r.inicio)}</time> · ${p(r.inicio)} <small>(${o(r.inicio,i)})</small></span></li>
      <li>${n(t(`trofeo`))}<span>${y[r.formato]} · ${r.modalidad}</span></li>
      <li>${n(t(`ubicacion`))}<span>${r.ubicacion} · ${S(r.precio)}</span></li>
    </ul>
    ${a===`en-curso`||a===`finalizado`?F(r):j(r,!0)}
    <div class="tt-acciones"><a class="btn btn--suave btn--peq" href="${E(r)}">Ver torneo</a>${M(r,a)}</div>
  </div>
</article>`}function F(t){let n=u(t).length,r=[...t.suizo.flat(),...t.cuadro?.flat()??[]].filter(e=>!e.bye).length;return e`<div class="plazas plazas--compacta"><p class="plazas-num"><strong class="cifra">${n}</strong><span class="cifra"> / ${r}</span> partidas jugadas</p>
  <div class="barra barra--vivo"><span style="--p:${r?(n/r).toFixed(3):0}"></span></div><p class="plazas-libres">${t.inscripciones.length} jugadores</p></div>`}function I(r,i){let o=g(r,i),s=_(r,i);return e`<article class="destacado tema-${r.tema}" data-torneo="${r.id}">
  <div class="destacado-texto">
    <div class="fila"><span class="etiqueta">${n(t(`trofeo`))}Torneo destacado · ${k(r)}</span>${A(o)}</div>
    <h3 class="h2">${r.nombre}</h3>
    <p class="entradilla">${r.resumen}</p>
    <ul class="destacado-datos" role="list">
      <li><span class="etiqueta">Fecha</span><strong>${a(r.inicio)}</strong></li>
      <li><span class="etiqueta">Hora</span><strong class="cifra">${p(r.inicio)}</strong></li>
      <li><span class="etiqueta">Formato</span><strong>${y[r.formato]}${r.topCorte?` ${r.topCorte}`:``}</strong></li>
      <li><span class="etiqueta">Inscripción</span><strong>${S(r.precio)}</strong></li>
    </ul>
    ${j(r)}
    <div class="fila">${M(r,o)}<a class="btn btn--fantasma btn--peq" href="${E(r)}">Ver todos los detalles</a></div>
  </div>
  ${s?L(r.inicio):``}
</article>`}function L(t){return e`<div class="cuenta-atras" data-cuenta-atras="${t}" aria-label="Tiempo hasta el inicio">
  ${[`dias`,`horas`,`min`,`seg`].map(t=>e`<div><span class="cifra" data-u="${t}">--</span><small>${{dias:`días`,horas:`horas`,min:`min`,seg:`seg`}[t]}</small></div>`)}
</div>`}function R(t,n,r,i){let a=t[n],o=s(t),c=n===`a`?t.ga:t.gb;return a?e`<div class="cj${o?o===a?` cj--gana`:` cj--pierde`:``}" data-jugador="${a}"><span class="cj-seed cifra">${i.get(a)??``}</span><span class="cj-nick">${r[a]?.nick??`—`}</span><span class="cj-marc cifra">${t.bye?``:c??``}</span></div>`:e`<div class="cj cj--vacio"><span class="cj-seed"></span><span class="cj-nick">${t.bye?`Pase directo`:`Por decidir`}</span><span class="cj-marc"></span></div>`}function z(r,i,a,o={}){let c=r.formato===`eliminacion`?C(r):v(r.suizo,C(r),T(a)).map(e=>e.jugadorId),u=new Map(c.map((e,t)=>[e,t+1])),d=i.length,f=s(i[d-1][0]);return e`<div class="cuadro${o.editable?` cuadro--editable`:``}" style="--rondas:${d}" data-cuadro>
  <div class="cuadro-nav" role="group" aria-label="Elegir ronda">
    ${i.map((t,n)=>e`<button type="button" class="chip" data-ir-ronda="${n}" aria-pressed="${n===0}">${l(d,n)}</button>`)}
    <button type="button" class="chip" data-ir-ronda="${d}" aria-pressed="false">Campeón</button>
  </div>
  <div class="cuadro-pista" tabindex="0" aria-label="Cuadro de ${r.nombre}">
    ${i.map((r,i)=>e`<section class="cuadro-ronda" data-ronda="${i}" aria-label="${l(d,i)}">
      <h3 class="cuadro-titulo">${l(d,i)}<span>${r.filter(e=>e.estado===`finalizada`&&!e.bye).length}/${r.filter(e=>!e.bye).length}</span></h3>
      <ol class="cuadro-partidas" role="list">
        ${r.map(r=>e`<li class="cruce cruce--${r.bye?`bye`:r.estado}" data-partida="${r.id}" data-jugadores="${[r.a,r.b].filter(Boolean).join(` `)}">
          <div class="cruce-caja">
            ${R(r,`a`,a,u)}${R(r,`b`,a,u)}
            <span class="cruce-estado">${r.bye?`Pase directo`:r.estado===`en-curso`?`En juego`:r.estado===`finalizada`?`Finalizada`:`Pendiente`}</span>
            ${o.editable&&!r.bye&&r.a&&r.b?e`<button type="button" class="cruce-editar" data-editar-partida="${r.id}" aria-label="Resultado: ${a[r.a]?.nick} contra ${a[r.b]?.nick}">${n(t(`editar`))}</button>`:``}
          </div>
        </li>`)}
      </ol>
    </section>`)}
    <section class="cuadro-ronda cuadro-final" data-ronda="${d}" aria-label="Campeón">
      <h3 class="cuadro-titulo">Campeón</h3>
      <div class="campeon-caja${f?` campeon-caja--si`:``}">
        ${n(t(`trofeo`,`campeon-trofeo`))}
        ${f?e`<p class="campeon-nick">${a[f]?.nick}</p><p class="campeon-nombre">${a[f]?.nombre}</p>`:e`<p class="campeon-nombre">Por decidir</p>`}
      </div>
    </section>
  </div>
  <p class="cuadro-ayuda">${n(t(`info`))}Toca un jugador para seguir su camino en el cuadro.</p>
</div>`}function B(t,n){let r=v(t.suizo,C(t),T(n)),i=t.formato===`suizo-top`?t.topCorte:0;return t.suizo.length?e`<div class="tabla-envoltura"><table class="tabla tabla-suiza">
  <caption class="solo-lector">Clasificación tras ${t.suizo.length} rondas</caption>
  <thead><tr><th scope="col">Pos.</th><th scope="col">Jugador</th><th scope="col" class="num">V-D-E</th><th scope="col" class="num">Puntos</th><th scope="col" class="num col-opc" title="Porcentaje de victorias de los rivales (desempate)">Rivales</th><th scope="col" class="num col-opc">Dif.</th></tr></thead>
  <tbody>${r.map((t,r)=>e`<tr class="${i&&r<i?`en-corte`:``}${i&&r===i-1?` linea-corte`:``}" data-jugador="${t.jugadorId}">
    <td class="cifra pos">${r+1}</td><th scope="row"><span class="jug-nick">${n[t.jugadorId]?.nick}</span><span class="jug-nombre">${n[t.jugadorId]?.nombre}</span></th>
    <td class="num cifra">${t.v}-${t.d}-${t.e}</td><td class="num cifra fuerte">${t.puntos}</td><td class="num cifra col-opc">${(t.rivales*100).toFixed(1)} %</td><td class="num cifra col-opc">${t.dif>0?`+`:``}${t.dif}</td></tr>`)}</tbody></table></div>
  ${i?e`<p class="ayuda-tabla">Los ${i} primeros pasan al top ${i} en eliminación directa. Desempate: puntos, porcentaje de victorias de los rivales y diferencia de juegos.</p>`:e`<p class="ayuda-tabla">3 puntos por victoria, 1 por empate. Desempate: porcentaje de victorias de los rivales y diferencia de juegos.</p>`}`:e`<p class="vacio">La clasificación aparecerá cuando empiece la primera ronda.</p>`}function V(r,i,a={}){if(!r.suizo.length)return``;let o=r.suizo.length-1;return e`<div class="rondas-suizas" data-rondas>
  <div class="chips" role="group" aria-label="Elegir ronda">${r.suizo.map((t,n)=>e`<button type="button" class="chip" data-ver-ronda="${n}" aria-pressed="${n===o}">Ronda ${n+1}</button>`)}</div>
  ${r.suizo.map((c,l)=>e`<div class="ronda-suiza" data-ronda-suiza="${l}" ${l===o?``:n(`hidden`)}>
    <ul class="emparejamientos" role="list">${c.map(c=>{let u=s(c),d=c.estado===`finalizada`&&!c.bye&&c.ga===c.gb;return e`<li class="emp emp--${c.bye?`bye`:c.estado}" data-jugadores="${[c.a,c.b].filter(Boolean).join(` `)}">
      <span class="emp-mesa mono">${c.bye?`Bye`:`Mesa ${c.mesa??``}`}</span>
      <span class="emp-j${u&&u===c.a?` gana`:``}">${i[c.a??``]?.nick??`—`}</span>
      <span class="emp-res cifra">${c.bye?`Pase`:c.estado===`finalizada`?d?`${c.ga}-${c.gb} (empate)`:`${c.ga}-${c.gb}`:c.estado===`en-curso`?`En juego`:`vs`}</span>
      <span class="emp-j emp-j--b${u&&u===c.b?` gana`:``}">${c.bye?``:i[c.b??``]?.nick??`—`}</span>
      ${a.editable&&!c.bye&&l===o&&!r.cuadro&&!r.finalizado?e`<button type="button" class="btn-icono" data-editar-partida="${c.id}" aria-label="Resultado de la mesa ${c.mesa}">${n(t(`editar`))}</button>`:``}
    </li>`})}</ul></div>`)}
</div>`}function H(t,n){let i=r(t),a=Math.min(i.libres,8);return e`<ol class="participantes" role="list">
  ${t.inscripciones.map((t,r)=>{let i=n[t.jugadorId];return e`<li class="participante${t.estado===`pendiente`?` participante--pend`:``}" data-jugador="${t.jugadorId}">
      <span class="part-num cifra">${String(r+1).padStart(2,`0`)}</span>
      <span class="part-avatar" aria-hidden="true" style="--h:${U(i?.nick??``)%360}">${(i?.nick??`?`).slice(0,2)}</span>
      <span class="part-texto"><strong>${i?.nick??`—`}</strong><small>${i?.nombre??``} · ${b[i?.division??`master`]}</small></span>
      ${t.estado===`pendiente`?e`<span class="part-estado">Por confirmar</span>`:``}
    </li>`})}
  ${Array.from({length:a},(n,r)=>e`<li class="participante participante--libre"><span class="part-num cifra">${String(t.inscripciones.length+r+1).padStart(2,`0`)}</span><span class="part-texto"><strong>Plaza libre</strong></span></li>`)}
  ${i.libres>a?e`<li class="participante participante--libre participante--resto"><span class="part-texto"><strong>+${i.libres-a} plazas libres</strong></span></li>`:``}
</ol>
${t.listaEspera.length?e`<h3 class="h3" style="margin-top:28px">Lista de espera</h3><ol class="participantes participantes--espera" role="list">${t.listaEspera.map((t,r)=>e`<li class="participante"><span class="part-num cifra">E${r+1}</span><span class="part-texto"><strong>${n[t.jugadorId]?.nick}</strong><small>${n[t.jugadorId]?.nombre}</small></span></li>`)}</ol>`:``}`}function U(e){let t=0;for(let n of e)t=t*31+n.charCodeAt(0)>>>0;return t}function W(t,n){let r=t.slice(0,3);if(!r.length)return``;let i=[r[1],r[0],r[2]].filter(Boolean);return e`<ol class="podio" role="list">${i.map(r=>{let i=t.indexOf(r)+1,a=n[r.jugadorId];return e`<li class="podio-${i}" data-jugador="${r.jugadorId}">
      <span class="podio-avatar" style="--h:${U(a?.nick??``)%360}" aria-hidden="true">${(a?.nick??``).slice(0,2)}</span>
      <p class="podio-nick">${a?.nick}</p><p class="podio-nombre">${a?.nombre}</p>
      <p class="podio-puntos cifra"><strong>${r.puntos}</strong> pts</p>
      <div class="podio-base"><span class="podio-pos">${i}</span><small>${r.titulos?`${r.titulos} ${r.titulos===1?`título`:`títulos`}`:`${r.torneos} torneos`}</small></div>
    </li>`})}</ol>`}function G(t,n,r=0,i=t.length){return t.slice(r,i).map((t,i)=>{let a=r+i,o=n[t.jugadorId];return e`<tr data-jugador="${t.jugadorId}" class="${a<3?`top top-${a+1}`:``}">
    <td class="cifra pos">${a+1}</td>
    <th scope="row"><span class="jug-nick">${o?.nick}</span><span class="jug-nombre">${o?.nombre}</span></th>
    <td class="num cifra fuerte">${t.puntos}</td>
    <td class="num cifra col-opc">${t.torneos}</td>
    <td class="num cifra col-opc">${t.victorias}</td>
    <td class="num cifra">${Math.round(t.pctVictorias*100)} %</td>
    <td class="ultimos col-opc">${t.resultados.slice(0,5).map(t=>e`<a href="/pagpoke/torneos/${t.slug}/" class="res res--${t.puesto===1?`oro`:t.puesto<=2?`plata`:t.puesto<=4?`bronce`:`otro`}" title="${t.torneo} · ${f(t.fecha)}">${t.etiqueta}</a>`)}</td>
  </tr>`})}function K(t,n,r,i=!1){return e`<div class="tabla-envoltura"><table class="tabla tabla-ranking${i?` tabla-ranking--compacta`:``}">
  <caption class="solo-lector">Clasificación de jugadores</caption>
  <thead><tr><th scope="col">Pos.</th><th scope="col">Jugador</th><th scope="col" class="num">Puntos</th><th scope="col" class="num col-opc">Torneos</th><th scope="col" class="num col-opc">Victorias</th><th scope="col" class="num">% vict.</th><th scope="col" class="col-opc">Últimos resultados</th></tr></thead>
  <tbody>${G(t,n,0,r??t.length)}</tbody></table></div>`}function q(r,a){let o=d(r,T(a)),s=[...o].find(([,e])=>e===1)?.[0],c=[...o].find(([,e])=>e===2)?.[0];return e`<article class="historial-tarjeta tema-${r.tema}" data-formato="${r.formato}" data-inicio="${r.inicio}">
  <div class="ht-fecha"><span class="ht-dia cifra">${w(r.inicio)}</span><span class="ht-mes">${i(r.inicio)}</span></div>
  <div class="ht-cuerpo">
    <p class="mono ht-num">${k(r)} · ${y[r.formato]} · ${r.inscripciones.length} jugadores</p>
    <h3 class="h3"><a href="${E(r)}">${r.nombre}</a></h3>
    <p class="ht-campeon">${n(t(`trofeo`))}<span><small>Campeón</small><strong>${s?a[s]?.nick:`—`}</strong></span></p>
    ${c?e`<p class="ht-finalista"><small>Finalista</small> ${a[c]?.nick}</p>`:``}
  </div>
</article>`}export{k as a,W as c,E as d,K as f,D as g,P as h,I as i,O as l,q as m,z as n,H as o,B as p,L as r,A as s,j as t,V as u};