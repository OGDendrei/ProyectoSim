// ia: decisiones de cada personaje (Fase 2: necesidades + personalidad + azar).
// En cada tick cada personaje hace UNA cosa: dar un paso o realizar su actividad.
window.Sim = window.Sim || {};

Sim.ia = (function () {
  const P = () => Sim.personajes;

  // Textos de estado: [mientras va, mientras lo hace]
  const TEXTOS = {
    comer: ['Va al salón a comer', 'Comiendo'],
    descansar: ['Va al salón a descansar', 'Descansando'],
    pasear: ['Paseando', 'Mirando alrededor'],
    explorar: ['Explorando lejos', 'Contemplando el paisaje'],
    patrullar: ['Patrullando', 'Patrullando'],
    vigilar: ['Va a hacer guardia', 'Haciendo guardia'],
    charlar: ['Va a hablar con {otro}', 'Charlando con {otro}'],
    despachar: ['Vuelve al salón', 'Despachando asuntos del reino'],
    holgazanear: ['Holgazaneando', 'Holgazaneando'],
    refugiarse: ['Vuelve al salón, inquieto', 'Se recoge en el salón'],
    tantear: ['Va a ver {lugar}', 'Examinando {lugar}'],
  };
  // Recurso que busca cada oficio en la Fase 2 (solo va a mirarlo; trabajar llega en la Fase 3)
  const OFICIO_RECURSO = {
    minero: ['piedra', 'metal'], 'leñador': ['madera'], cazador: ['caza'], campesino: ['pradera'], constructor: ['salon'],
  };
  const NOMBRE_LUGAR = { piedra: 'la cantera', metal: 'una veta de metal', madera: 'el bosque', caza: 'el coto de caza', pradera: 'la pradera', salon: 'el terreno del salón' };

  // ---------- Tick ----------
  function tick(estado, rng) {
    for (const b of estado.bandos) {
      for (const id of b.miembros) {
        const p = estado.personajes[id];
        if (!p) continue;
        actualizarNecesidades(estado, p, b);
        const C = Sim.config.ia;
        const urgente = (p.necesidades.hambre >= C.urgente || p.necesidades.cansancio >= C.urgente);
        if (p.accion && urgente && p.accion.tipo !== 'comer' && p.accion.tipo !== 'descansar') terminar(p);
        if (!p.accion) decidir(estado, p, b, rng);
        if (p.accion) continuar(estado, p, rng);
        // Si acaba de terminar, ya decide lo siguiente (lo empezará en el próximo tick)
        if (!p.accion) decidir(estado, p, b, rng);
      }
    }
  }

  function centroSalon(b) { return { x: b.salon.x + (b.salon.ancho >> 1), y: b.salon.y + (b.salon.alto >> 1) }; }
  function distancia(a, b) { return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)); }
  function limitar(v) { return Math.max(0, Math.min(100, v)); }

  function actualizarNecesidades(estado, p, b) {
    const C = Sim.config.ia, n = p.necesidades;
    n.hambre = limitar(n.hambre + C.hambrePorTick);
    const andando = p.accion && p.accion.fase === 'ir';
    n.cansancio = limitar(n.cansancio + C.cansancioPorTick + (andando ? C.cansancioExtraAndando : 0));
    if (distancia(p, centroSalon(b)) <= C.radioSeguro) n.seguridad = limitar(n.seguridad + C.seguridadSube);
    else {
      let baja = C.seguridadBaja;
      if (P().tieneRasgo(p, 'cobarde')) baja *= 2;
      if (P().tieneRasgo(p, 'valiente')) baja *= 0.5;
      n.seguridad = limitar(n.seguridad - baja);
    }
    if (p.rol !== 'guardia') {
      for (const id of b.miembros) {
        const o = estado.personajes[id];
        if (o && o.rol === 'guardia' && distancia(p, o) <= 3) { n.seguridad = limitar(n.seguridad + C.seguridadCercaGuardia); break; }
      }
    }
  }

  // ---------- Decidir: puntuar todas las acciones posibles y elegir la mejor ----------
  function decidir(estado, p, b, rng) {
    const C = Sim.config.ia, n = p.necesidades, r = (x) => P().tieneRasgo(p, x) ? 1 : 0;
    const opciones = [];
    const add = (tipo, puntos, preparar) => opciones.push({ tipo: tipo, puntos: puntos, preparar: preparar });

    add('comer', n.hambre + (n.hambre > 50 ? 20 : 0), () => ({ destino: casillaSalon(estado, b, rng) }));
    add('descansar', n.cansancio + (n.cansancio > 50 ? 15 : 0) + r('perezoso') * 10, () => ({ destino: casillaSalon(estado, b, rng) }));
    add('pasear', 20 + r('curioso') * 5, () => ({ destino: puntoCerca(estado, centroSalon(b), 2, C.radioPasear, rng) }));
    if (n.seguridad > 40)
      add('explorar', 8 + r('curioso') * 25 + r('valiente') * 8 - r('cobarde') * 15,
        () => ({ destino: puntoCerca(estado, centroSalon(b), C.radioExplorar[0], C.radioExplorar[1], rng) }));
    if (n.seguridad < 60)
      add('refugiarse', (100 - n.seguridad) * (r('cobarde') ? 1.5 : 1), () => ({ destino: casillaSalon(estado, b, rng) }));
    add('holgazanear', 8 + r('perezoso') * 25 - r('obsesivo') * 10, () => ({ destino: { x: p.x, y: p.y } }));

    if (p.rol === 'guardia') {
      add('patrullar', 35 + r('leal') * 10 + r('obsesivo') * 5,
        () => ({ destino: puntoCerca(estado, centroSalon(b), C.radioPatrulla[0], C.radioPatrulla[1], rng) }));
      const rey = estado.personajes[b.reyId];
      if (rey) add('vigilar', 22 + r('leal') * 12, () => ({ destino: puntoCerca(estado, rey, 1, 2, rng) }));
    }
    if (p.rol === 'rey') add('despachar', 28 + r('honorable') * 5 - r('perezoso') * 10, () => ({ destino: casillaSalon(estado, b, rng) }));
    if (p.rol === 'trabajador') {
      const sitio = buscarSitioOficio(estado, p, b, rng);
      if (sitio) add('tantear', 30 + r('obsesivo') * 10 - r('perezoso') * 10, () => sitio);
    }
    // Charlar con alguien cercano, preferiblemente alguien que le cae bien
    const companero = elegirCompanero(estado, p, b, rng);
    if (companero) {
      const rel = p.relaciones[companero.id] || 0;
      add('charlar', 15 + r('pacifico') * 10 - r('agresivo') * 5 + rel / 5,
        () => ({ destino: { x: companero.x, y: companero.y }, con: companero.id }));
    }

    // Azar y variedad: un poco de ruido y castigo por repetir
    for (const o of opciones) {
      o.puntos += rng.num() * C.azar;
      const veces = (p.historial || []).filter((t) => t === o.tipo).length;
      o.puntos -= veces * C.penalizarRepetir;
    }
    opciones.sort((a, b2) => b2.puntos - a.puntos);

    for (const o of opciones) {
      const datos = o.preparar();
      if (!datos || !datos.destino) continue;
      const ruta = Sim.rutas.buscar(estado.mapa, p.x, p.y, datos.destino.x, datos.destino.y);
      if (!ruta) continue;
      p.accion = {
        tipo: o.tipo, fase: 'ir', ruta: ruta,
        destino: datos.destino, con: datos.con !== undefined ? datos.con : null,
        lugar: datos.lugar || null, restante: 0,
      };
      return;
    }
  }

  // ---------- Ejecutar un paso de la acción ----------
  function continuar(estado, p, rng) {
    const a = p.accion, C = Sim.config.ia;
    if (a.fase === 'ir') {
      if (a.ruta.length) {
        const i = a.ruta.shift();
        p.x = i % estado.mapa.ancho; p.y = (i / estado.mapa.ancho) | 0;
        if (a.ruta.length) return;
      }
      // Si iba a charlar y el otro se ha movido, recalcula la ruta hacia él (pocas veces)
      if (a.tipo === 'charlar') {
        const o = estado.personajes[a.con];
        if (o && distancia(p, o) > 2 && (a.reintentos || 0) < 3 && distancia(p, o) <= C.radioCharla * 1.5) {
          a.reintentos = (a.reintentos || 0) + 1;
          const r = Sim.rutas.buscar(estado.mapa, p.x, p.y, o.x, o.y);
          if (r && r.length) { a.ruta = r; return; }
        }
      }
      // Ha llegado: empieza la actividad en el próximo tick
      a.fase = 'hacer';
      a.restante = C.duracion[a.tipo] ? rng.rango(C.duracion[a.tipo]) : 1;
      if (a.tipo === 'charlar') invitarACharla(estado, p, a);
      return;
    }
    // Fase "hacer"
    const n = p.necesidades;
    switch (a.tipo) {
      case 'comer':
        n.hambre = limitar(n.hambre - C.comerBaja);
        if (n.hambre <= 0) terminar(p);
        return;
      case 'descansar':
        n.cansancio = limitar(n.cansancio - C.descansoBaja);
        if (n.cansancio <= 5) terminar(p);
        return;
      case 'refugiarse':
        if (n.seguridad >= 95) terminar(p);
        return;
      case 'charlar': {
        const o = estado.personajes[a.con];
        if (!o || distancia(p, o) > 2) { terminar(p); return; }
        const sube = rng.rango(C.charlaRelacion) * (P().tieneRasgo(p, 'agresivo') ? 0.5 : 1);
        p.relaciones[o.id] = Math.min(100, (p.relaciones[o.id] || 0) + sube);
        o.relaciones[p.id] = Math.min(100, (o.relaciones[p.id] || 0) + sube);
        break;
      }
      case 'explorar':
        if (a.restante === 1) recuerdoExplorar(estado, p, rng);
        break;
    }
    if (--a.restante <= 0) terminar(p);
  }

  // Termina la acción y la apunta en el historial (las 3 últimas), para no repetir siempre lo mismo
  function terminar(p) {
    if (p.accion) {
      p.ultimaAccion = p.accion.tipo;
      p.historial = (p.historial || []).concat(p.accion.tipo).slice(-3);
    }
    p.accion = null;
  }

  // Si el otro está libre o en algo poco importante, se para a charlar también
  function invitarACharla(estado, p, a) {
    const o = estado.personajes[a.con];
    if (!o || distancia(p, o) > 2) return;
    const libre = !o.accion || ['pasear', 'holgazanear', 'vigilar', 'despachar', 'patrullar'].indexOf(o.accion.tipo) >= 0;
    if (!libre) return;
    o.accion = { tipo: 'charlar', fase: 'hacer', ruta: [], destino: { x: o.x, y: o.y }, con: p.id, lugar: null, restante: a.restante };
  }

  // ---------- Elegir destinos ----------
  function casillaSalon(estado, b, rng) {
    const s = b.salon;
    return { x: s.x + 1 + rng.entero(0, s.ancho - 3), y: s.y + 1 + rng.entero(0, s.alto - 3) };
  }
  function puntoCerca(estado, centro, rMin, rMax, rng) {
    for (let k = 0; k < 15; k++) {
      const ang = rng.num() * Math.PI * 2, d = rMin + rng.num() * (rMax - rMin);
      const x = Math.round(centro.x + Math.cos(ang) * d), y = Math.round(centro.y + Math.sin(ang) * d);
      if (Sim.rutas.transitable(estado.mapa, x, y)) return { x: x, y: y };
    }
    return null;
  }
  function elegirCompanero(estado, p, b, rng) {
    const C = Sim.config.ia;
    const cerca = b.miembros.map((id) => estado.personajes[id])
      .filter((o) => o && o.id !== p.id && distancia(p, o) <= C.radioCharla && p.gustos.rechaza.indexOf(o.id) < 0);
    if (!cerca.length) return null;
    const pesos = {};
    for (const o of cerca) pesos[o.id] = Math.max(1, 50 + (p.relaciones[o.id] || 0));
    return estado.personajes[rng.ponderado(pesos)];
  }
  // Un sitio de su oficio cerca del salón, eligiendo entre los más cercanos
  function buscarSitioOficio(estado, p, b, rng) {
    const recursos = OFICIO_RECURSO[p.oficio];
    if (!recursos) return null;
    const rec = rng.elegir(recursos);
    const m = estado.mapa, c = centroSalon(b);
    if (rec === 'salon') {
      const d = puntoCerca(estado, c, 4, 7, rng);
      return d ? { destino: d, lugar: NOMBRE_LUGAR.salon } : null;
    }
    const candidatos = [];
    if (rec === 'pradera') {
      for (let k = 0; k < 60; k++) {
        const pt = puntoCerca(estado, c, 2, 22, rng);
        if (pt && m.terreno[pt.y * m.ancho + pt.x] === Sim.mapa.T.PRADERA) candidatos.push(pt);
      }
    } else {
      for (const nd of m.nodos) {
        if (nd.recurso !== rec) continue;
        const d = distancia(nd, c);
        if (d < 30) candidatos.push({ x: nd.x, y: nd.y, d: d });
      }
      candidatos.sort((a2, b2) => a2.d - b2.d);
      candidatos.length = Math.min(candidatos.length, 12);
    }
    if (!candidatos.length) return null;
    const nd = rng.elegir(candidatos);
    // Se coloca al lado si la casilla no se puede pisar (agua, por ejemplo)
    let destino = { x: nd.x, y: nd.y };
    if (!Sim.rutas.transitable(m, nd.x, nd.y)) destino = puntoCerca(estado, nd, 1, 1.5, rng);
    return destino ? { destino: destino, lugar: NOMBRE_LUGAR[rec] } : null;
  }

  // Un recuerdo al terminar de explorar, si vio algo notable
  function recuerdoExplorar(estado, p, rng) {
    const m = estado.mapa;
    let vio = null;
    for (let dy = -4; dy <= 4 && !vio; dy++) for (let dx = -4; dx <= 4 && !vio; dx++) {
      const x = p.x + dx, y = p.y + dy;
      if (x < 0 || y < 0 || x >= m.ancho || y >= m.alto) continue;
      const ni = m.nodoPorCasilla[y * m.ancho + x];
      if (ni >= 0 && m.nodos[ni].recurso === 'oro') vio = 'Vio oro en la montaña mientras exploraba.';
      else if (ni >= 0 && m.nodos[ni].recurso === 'metal' && rng.prob(0.3)) vio = 'Encontró una veta de metal mientras exploraba.';
    }
    if (!vio && rng.prob(0.15)) vio = 'Se alejó del salón para explorar el horizonte.';
    if (vio) P().recordar(estado, p, vio);
  }

  // Texto de lo que está haciendo (para la ficha)
  function textoAccion(estado, p) {
    if (!p.accion) return 'Pensando qué hacer';
    const a = p.accion;
    let t = TEXTOS[a.tipo][a.fase === 'ir' ? 0 : 1];
    if (a.con !== null && estado.personajes[a.con]) t = t.replace('{otro}', estado.personajes[a.con].nombre);
    if (a.lugar) t = t.replace('{lugar}', a.lugar);
    return t;
  }

  return { tick: tick, textoAccion: textoAccion };
})();
