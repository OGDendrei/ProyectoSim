// fichas (parte de ui): ventanas flotantes con la ficha de cada personaje.
// Arrastrables, con aspa para cerrar, y se pueden tener varias abiertas a la vez.
window.Sim = window.Sim || {};

Sim.fichas = (function () {
  const abiertas = new Map(); // id del personaje → elemento de la ventana
  let estado = null;
  let capaZ = 100;
  let siguientePos = 0;

  function esc(t) { return String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function enlace(id) {
    const o = estado.personajes[id];
    if (!o) return '<span class="tenue">desconocido</span>';
    return '<a href="#" class="enlace-persona" data-id="' + id + '" style="color:' + Sim.render.paleta().razas[o.raza] + '">' + esc(o.nombre) + '</a>';
  }
  function barra(valor, malo) {
    // malo = true: 100 es lo peor (hambre, cansancio)
    const v = Math.round(valor);
    const color = (malo ? v : 100 - v) > 70 ? '#e05050' : (malo ? v : 100 - v) > 40 ? '#d8b060' : '#60c060';
    return '<span class="barrita"><span style="width:' + v + '%;background:' + color + '"></span></span> ' + v;
  }

  function contenido(p) {
    const PJ = Sim.personajes;
    const edad = PJ.edad(estado, p);
    const m = p.genero === 'm';
    const etapa = { bebe: 'bebé', nino: m ? 'niño' : 'niña', adulto: m ? 'adulto' : 'adulta', anciano: m ? 'anciano' : 'anciana' }[PJ.etapa(estado, p)];
    const v = PJ.vida(p);
    const n = p.necesidades;
    let h = '';
    h += '<div class="ficha-sub">' + esc(PJ.textoRaza(p)) + ' · ' + (p.genero === 'm' ? 'hombre' : 'mujer') + ' · ' + edad + ' años (' + etapa + ')</div>';
    h += '<div class="ficha-sub">' + esc(PJ.textoRol(p)) + (p.oficio && p.oficio !== p.rol ? ' · oficio: ' + esc(p.oficio) : '') + '</div>';

    h += '<h4>Ahora</h4><div>' + esc(Sim.ia.textoAccion(estado, p)) + '</div>';
    h += '<div class="ficha-tabla">' +
      '<span>Hambre</span><span>' + barra(n.hambre, true) + '</span>' +
      '<span>Cansancio</span><span>' + barra(n.cansancio, true) + '</span>' +
      '<span>Seguridad</span><span>' + barra(n.seguridad, false) + '</span></div>';

    h += '<h4>Rasgos</h4><div>' + p.rasgos.map((r) => esc(PJ.textoRasgo(p, r))).join(', ') + '</div>';
    h += '<h4>Gustos</h4><div>Comida: ' + esc(p.gustos.comida) + ' · Material: ' + esc(p.gustos.material) + '</div>';
    if (p.gustos.aprecia.length) h += '<div>Aprecia a ' + p.gustos.aprecia.map(enlace).join(', ') + '</div>';
    if (p.gustos.rechaza.length) h += '<div>No soporta a ' + p.gustos.rechaza.map(enlace).join(', ') + '</div>';

    h += '<h4>Habilidades</h4><div class="ficha-tabla">';
    for (const k of PJ.HABILIDADES) h += '<span>' + PJ.NOMBRE_HABILIDAD[k] + '</span><span>' + p.habilidades[k].nivel + '</span>';
    h += '</div>';

    h += '<h4>Salud</h4><div>' + (p.salud === 'sano' ? 'Sano' : esc(p.salud)) + ' · vida ' + v.vida + '/' + v.max +
      (p.arma ? ' · arma básica' : ' · sin arma') + '</div>';
    h += '<div class="tenue">' + Object.keys(p.cuerpo).map((k) => PJ.NOMBRE_PARTE[k] + ' ' + p.cuerpo[k].vida + '/' + p.cuerpo[k].max).join(' · ') + '</div>';
    h += '<div>' + (p.heridas.length ? p.heridas.map(esc).join(', ') : 'Sin heridas') + '</div>';

    h += '<h4>Familia</h4>';
    if (p.padreId === null && p.madreId === null) h += '<div class="tenue">Fundador' + (p.genero === 'f' ? 'a' : '') + ': sin padres en estas tierras.</div>';
    else h += '<div>Padre: ' + enlace(p.padreId) + ' · Madre: ' + enlace(p.madreId) + '</div>';
    h += '<div>Pareja: ' + (p.parejaId !== null ? enlace(p.parejaId) : 'ninguna') + '</div>';
    h += '<div>Hijos: ' + (p.hijosIds.length ? p.hijosIds.map(enlace).join(', ') : 'ninguno') + '</div>';
    h += '<div class="tenue">Árbol genealógico: llega en la Fase 4.</div>';

    const rel = Object.keys(p.relaciones).map((id) => ({ id: +id, v: p.relaciones[id] })).sort((a, b) => Math.abs(b.v) - Math.abs(a.v)).slice(0, 4);
    h += '<h4>Relaciones</h4>';
    h += rel.length ? rel.map((r) => '<div>' + enlace(r.id) + ' <span class="' + (r.v >= 0 ? 'bien' : 'mal') + '">' + (r.v > 0 ? '+' : '') + Math.round(r.v) + '</span></div>').join('') : '<div class="tenue">Ninguna</div>';

    h += '<h4>Recuerdos</h4>';
    const rec = p.recuerdos.slice(-5).reverse();
    h += rec.length ? rec.map((r) => '<div>· ' + esc(r.texto) + ' <span class="tenue">(año ' + (Math.floor(r.tick / estado.tiempo.ticksPorAno) + 1) + ')</span></div>').join('') : '<div class="tenue">Ninguno</div>';
    return h;
  }

  function abrir(id) {
    if (!estado || !estado.personajes[id]) return;
    if (abiertas.has(id)) { traerAlFrente(abiertas.get(id)); return; }
    const p = estado.personajes[id];
    const v = document.createElement('div');
    v.className = 'ficha';
    const off = (siguientePos++ % 8) * 26;
    v.style.left = (60 + off) + 'px';
    v.style.top = (80 + off) + 'px';
    v.innerHTML = '<div class="ficha-cabecera"><span class="ficha-titulo" style="color:' + Sim.render.paleta().razas[p.raza] + '">' +
      Sim.render.SIMBOLO_PERSONA[p.rol] + ' ' + esc(p.nombre) + '</span><button class="ficha-ir" title="Ir a su posición">◎</button><button class="ficha-cerrar" title="Cerrar">✕</button></div>' +
      '<div class="ficha-cuerpo"></div>';
    document.body.appendChild(v);
    abiertas.set(id, v);
    traerAlFrente(v);
    refrescar(id);

    v.querySelector('.ficha-cerrar').addEventListener('click', () => cerrar(id));
    v.querySelector('.ficha-ir').addEventListener('click', () => { const o = estado.personajes[id]; if (o) Sim.render.centrar(o.x + 0.5, o.y + 0.5); });
    v.addEventListener('mousedown', () => traerAlFrente(v));
    v.querySelector('.ficha-cuerpo').addEventListener('click', function (e) {
      const a = e.target.closest('.enlace-persona');
      if (a) { e.preventDefault(); abrir(+a.dataset.id); }
    });
    arrastrable(v, v.querySelector('.ficha-cabecera'));
    Sim.render.marcar(Array.from(abiertas.keys()));
  }

  function cerrar(id) {
    const v = abiertas.get(id);
    if (v) v.remove();
    abiertas.delete(id);
    Sim.render.marcar(Array.from(abiertas.keys()));
  }
  function cerrarTodas() { for (const id of Array.from(abiertas.keys())) cerrar(id); }

  function traerAlFrente(v) { v.style.zIndex = ++capaZ; }

  function arrastrable(v, asa) {
    let inicio = null;
    asa.addEventListener('mousedown', function (e) {
      if (e.target.tagName === 'BUTTON') return;
      e.preventDefault();
      inicio = { x: e.clientX, y: e.clientY, l: v.offsetLeft, t: v.offsetTop };
    });
    window.addEventListener('mousemove', function (e) {
      if (!inicio) return;
      const l = Math.max(0, Math.min(window.innerWidth - 60, inicio.l + e.clientX - inicio.x));
      const t = Math.max(0, Math.min(window.innerHeight - 30, inicio.t + e.clientY - inicio.y));
      v.style.left = l + 'px'; v.style.top = t + 'px';
    });
    window.addEventListener('mouseup', function () { inicio = null; });
  }

  function refrescar(id) {
    const v = abiertas.get(id), p = estado.personajes[id];
    if (!v || !p) return;
    const cuerpo = v.querySelector('.ficha-cuerpo');
    const scroll = cuerpo.scrollTop;
    cuerpo.innerHTML = contenido(p);
    cuerpo.scrollTop = scroll;
  }

  return {
    ponerEstado: function (e) { cerrarTodas(); estado = e; },
    abrir: abrir, cerrar: cerrar, cerrarTodas: cerrarTodas,
    refrescarTodas: function () { for (const id of abiertas.keys()) refrescar(id); },
  };
})();
