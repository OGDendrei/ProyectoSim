// mapa: generación procedural del mundo (terreno, ríos, zonas de caza,
// nodos de recurso y zonas de inicio de cada raza). No dibuja nada.
window.Sim = window.Sim || {};

Sim.mapa = (function () {
  // Tipos de terreno (el número es lo que se guarda en cada casilla).
  const T = { SUELO: 0, PRADERA: 1, BOSQUE: 2, MONTANA: 3, AGUA: 4, VADO: 5 };
  const TERRENOS = [
    { id: T.SUELO, nombre: 'Suelo llano', transitable: true },
    { id: T.PRADERA, nombre: 'Pradera', transitable: true },
    { id: T.BOSQUE, nombre: 'Bosque', transitable: true },
    { id: T.MONTANA, nombre: 'Montaña', transitable: true },
    { id: T.AGUA, nombre: 'Agua', transitable: false },
    { id: T.VADO, nombre: 'Vado', transitable: true },
  ];

  const NOMBRE_RECURSO = {
    madera: 'Madera', piedra: 'Piedra', metal: 'Metal', oro: 'Oro', caza: 'Caza', pesca: 'Pesca',
  };

  // ---------- Ruido suave con semilla (para manchas naturales) ----------
  function hash2(x, y, s) {
    let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 2147483647)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  function suave(t) { return t * t * (3 - 2 * t); }
  function ruidoValor(x, y, s) {
    const x0 = Math.floor(x), y0 = Math.floor(y);
    const fx = suave(x - x0), fy = suave(y - y0);
    const a = hash2(x0, y0, s), b = hash2(x0 + 1, y0, s);
    const c = hash2(x0, y0 + 1, s), d = hash2(x0 + 1, y0 + 1, s);
    return (a + (b - a) * fx) + ((c + (d - c) * fx) - (a + (b - a) * fx)) * fy;
  }
  function ruido(x, y, escala, octavas, s) {
    let total = 0, amp = 1, frec = escala, suma = 0;
    for (let o = 0; o < octavas; o++) {
      total += ruidoValor(x * frec, y * frec, s + o * 1013) * amp;
      suma += amp; amp *= 0.5; frec *= 2;
    }
    return total / suma;
  }
  // Estira los valores para que usen todo el rango 0..1.
  function normalizar(arr) {
    let min = Infinity, max = -Infinity;
    for (const v of arr) { if (v < min) min = v; if (v > max) max = v; }
    const r = max - min || 1;
    for (let i = 0; i < arr.length; i++) arr[i] = (arr[i] - min) / r;
  }

  // ---------- Generación ----------
  function generar(opciones) {
    const C = Sim.config.mapa;
    const ancho = opciones.ancho, alto = opciones.alto;
    const rng = Sim.azar.crear('mapa:' + opciones.semilla);
    const s1 = rng.entero(1, 1e9), s2 = rng.entero(1, 1e9), s3 = rng.entero(1, 1e9), s4 = rng.entero(1, 1e9);
    const n = ancho * alto;
    const idx = (x, y) => y * ancho + x;
    const dentro = (x, y) => x >= 0 && y >= 0 && x < ancho && y < alto;

    // Relieve y humedad
    const relieve = new Array(n), humedad = new Array(n), riqueza = new Array(n);
    for (let y = 0; y < alto; y++) for (let x = 0; x < ancho; x++) {
      const i = idx(x, y);
      relieve[i] = ruido(x, y, C.escalaRelieve, C.octavas, s1);
      humedad[i] = ruido(x, y, C.escalaHumedad, C.octavas, s2);
      riqueza[i] = ruido(x, y, C.escalaRiqueza, 2, s3);
    }
    normalizar(relieve); normalizar(humedad); normalizar(riqueza);

    // Terreno base
    const terreno = new Array(n);
    for (let i = 0; i < n; i++) {
      const e = relieve[i], m = humedad[i];
      if (e < C.nivelAgua) terreno[i] = T.AGUA;
      else if (e > C.nivelMontana) terreno[i] = T.MONTANA;
      else if (m > C.humedadBosque) terreno[i] = T.BOSQUE;
      else if (m > C.humedadPradera) terreno[i] = T.PRADERA;
      else terreno[i] = T.SUELO;
    }

    // Ríos: nacen en zonas altas y bajan por la pendiente
    const numRios = Math.max(1, Math.round(C.riosPor64 * (n / (64 * 64)) ** 0.5));
    const altos = [];
    for (let i = 0; i < n; i++) if (relieve[i] > C.nivelMontana - 0.08 && relieve[i] < C.nivelMontana + 0.1) altos.push(i);
    for (let r = 0; r < numRios && altos.length; r++) {
      let i = rng.elegir(altos);
      let x = i % ancho, y = Math.floor(i / ancho);
      const visitado = new Set();
      let paso = 0;
      for (let largo = 0; largo < ancho * 3; largo++) {
        i = idx(x, y);
        if (terreno[i] === T.AGUA && largo > 0) break; // llegó a un lago
        visitado.add(i);
        terreno[i] = (paso > 2 && rng.prob(1 / C.vadoCada)) ? T.VADO : T.AGUA;
        paso++;
        // Elegir vecino más bajo (con un poco de azar para que serpentee)
        let mejor = null, mejorV = Infinity;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy;
          if (!dentro(nx, ny)) { mejor = null; mejorV = -1; break; }
          const ni = idx(nx, ny);
          if (visitado.has(ni)) continue;
          const v = relieve[ni] + rng.num() * 0.04;
          if (v < mejorV) { mejorV = v; mejor = [nx, ny]; }
        }
        if (!mejor) break; // borde del mapa o sin salida
        relieve[idx(mejor[0], mejor[1])] = Math.min(relieve[idx(mejor[0], mejor[1])], relieve[i]); // excava el cauce
        x = mejor[0]; y = mejor[1];
      }
    }

    // Zonas de caza (animales)
    const caza = new Array(n).fill(0);
    for (let y = 0; y < alto; y++) for (let x = 0; x < ancho; x++) {
      const i = idx(x, y);
      if ((terreno[i] === T.BOSQUE || terreno[i] === T.PRADERA) &&
          ruido(x, y, 0.07, 2, s4) > 1 - C.probZonaCaza) caza[i] = 1;
    }

    // Zonas de inicio de las razas
    const inicios = elegirInicios(opciones.razas, { ancho, alto, terreno, caza, idx, dentro, rng });

    // Despejar el sitio del futuro salón (suelo llano, sin caza)
    for (const ini of inicios) {
      for (let y = ini.y - 1; y < ini.y + C.altoSalon + 1; y++)
        for (let x = ini.x - 1; x < ini.x + C.anchoSalon + 1; x++)
          if (dentro(x, y)) { terreno[idx(x, y)] = T.SUELO; caza[idx(x, y)] = 0; }
    }

    // Asegurar que los dos bandos pueden llegar uno al otro
    if (inicios.length === 2) conectar(inicios[0], inicios[1], { ancho, alto, terreno, idx, dentro });

    // Nodos de recurso
    const nodos = [];
    const nodoPorCasilla = new Array(n).fill(-1);
    const cazaPorCasilla = new Array(n).fill(-1);
    const N = Sim.config.nodos;
    function crearNodo(x, y, recurso) {
      const i = idx(x, y);
      const factor = 0.4 + 1.2 * riqueza[i]; // manchas de abundancia
      const max = Math.max(1, Math.round(N[recurso] * factor));
      const nodo = { id: nodos.length, x: x, y: y, recurso: recurso, cantidad: max, maximo: max };
      nodos.push(nodo);
      return nodo.id;
    }
    for (let y = 0; y < alto; y++) for (let x = 0; x < ancho; x++) {
      const i = idx(x, y), t = terreno[i];
      if (t === T.BOSQUE) nodoPorCasilla[i] = crearNodo(x, y, 'madera');
      else if (t === T.MONTANA) {
        const r = rng.num();
        const rec = r < C.probOro ? 'oro' : r < C.probOro + C.probMetal ? 'metal' : 'piedra';
        nodoPorCasilla[i] = crearNodo(x, y, rec);
      } else if (t === T.AGUA) {
        // Pesca solo en la orilla
        let orilla = false;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy;
          if (dentro(nx, ny) && terreno[idx(nx, ny)] !== T.AGUA) orilla = true;
        }
        if (orilla) nodoPorCasilla[i] = crearNodo(x, y, 'pesca');
      }
      if (caza[i]) cazaPorCasilla[i] = crearNodo(x, y, 'caza');
    }

    // Estado del mapa: solo datos simples (se puede guardar como JSON)
    return {
      ancho: ancho, alto: alto, semilla: opciones.semilla,
      terreno: terreno, caza: caza,
      nodos: nodos, nodoPorCasilla: nodoPorCasilla, cazaPorCasilla: cazaPorCasilla,
      inicios: inicios,
    };
  }

  // Busca sitios buenos (llanos, con comida y madera cerca) y elige los más alejados.
  function elegirInicios(razas, m) {
    const C = Sim.config.mapa;
    const R = C.radioRecursosInicio;
    const margen = 3;
    const candidatos = [];
    for (let y = margen; y < m.alto - C.altoSalon - margen; y += 2) {
      for (let x = margen; x < m.ancho - C.anchoSalon - margen; x += 2) {
        // El sitio del salón no debe tener agua ni montaña
        let malas = 0;
        for (let yy = y - 1; yy < y + C.altoSalon + 1; yy++)
          for (let xx = x - 1; xx < x + C.anchoSalon + 1; xx++) {
            const t = m.terreno[m.idx(xx, yy)];
            if (t === T.AGUA || t === T.VADO || t === T.MONTANA) malas++;
          }
        if (malas > 2) continue;
        let madera = 0, comida = 0;
        const cx = x + (C.anchoSalon >> 1), cy = y + (C.altoSalon >> 1);
        for (let yy = cy - R; yy <= cy + R; yy++)
          for (let xx = cx - R; xx <= cx + R; xx++) {
            if (!m.dentro(xx, yy)) continue;
            const i = m.idx(xx, yy), t = m.terreno[i];
            if (t === T.BOSQUE) madera++;
            if (t === T.PRADERA) comida++;
            if (m.caza[i]) comida++;
          }
        const valor = Math.min(madera, 40) + Math.min(comida, 40);
        candidatos.push({ x: x, y: y, cx: cx, cy: cy, valor: valor, madera: madera, comida: comida });
      }
    }
    // Plan B si el mapa es muy raro: cualquier sitio
    if (candidatos.length < 2) {
      candidatos.push({ x: margen, y: margen, cx: margen + 3, cy: margen + 2, valor: 1 });
      candidatos.push({ x: m.ancho - C.anchoSalon - margen, y: m.alto - C.altoSalon - margen,
        cx: m.ancho - margen - 4, cy: m.alto - margen - 3, valor: 1 });
    }
    // Elegir la pareja con mejor mezcla de distancia y recursos
    const distMin = C.distanciaMinimaRazas * Math.min(m.ancho, m.alto);
    candidatos.sort((a, b) => b.valor - a.valor);
    const top = candidatos.slice(0, 150);
    let mejor = null, mejorP = -Infinity;
    for (let a = 0; a < top.length; a++) for (let b = a + 1; b < top.length; b++) {
      const d = Math.hypot(top[a].cx - top[b].cx, top[a].cy - top[b].cy);
      let p = Math.min(top[a].valor, top[b].valor) + d * 0.6;
      if (d < distMin) p -= 1000;
      p += m.rng.num(); // desempate con semilla
      if (p > mejorP) { mejorP = p; mejor = [top[a], top[b]]; }
    }
    return razas.map((raza, k) => ({ raza: raza, x: mejor[k].x, y: mejor[k].y }));
  }

  // Si no hay camino entre los dos inicios, abre vados en línea recta.
  function conectar(a, b, m) {
    const desde = m.idx(a.x, a.y), hasta = m.idx(b.x, b.y);
    const visto = new Uint8Array(m.ancho * m.alto);
    const cola = [desde]; visto[desde] = 1;
    while (cola.length) {
      const i = cola.pop();
      if (i === hasta) return;
      const x = i % m.ancho, y = Math.floor(i / m.ancho);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (!m.dentro(nx, ny)) continue;
        const ni = m.idx(nx, ny);
        if (!visto[ni] && TERRENOS[m.terreno[ni]].transitable) { visto[ni] = 1; cola.push(ni); }
      }
    }
    // No hay camino: trazar línea y convertir el agua en vado
    let x0 = a.x, y0 = a.y; const x1 = b.x, y1 = b.y;
    const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    for (;;) {
      const i = m.idx(x0, y0);
      if (m.terreno[i] === T.AGUA) m.terreno[i] = T.VADO;
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x0 += sx; } else { err += dx; y0 += sy; }
    }
  }

  // Descripción de una casilla (para la barra de información)
  function describir(mapa, x, y) {
    if (x < 0 || y < 0 || x >= mapa.ancho || y >= mapa.alto) return '';
    const i = y * mapa.ancho + x;
    let txt = TERRENOS[mapa.terreno[i]].nombre;
    const ni = mapa.nodoPorCasilla[i];
    if (ni >= 0) { const nd = mapa.nodos[ni]; txt += ' — ' + NOMBRE_RECURSO[nd.recurso] + ' ' + nd.cantidad + '/' + nd.maximo; }
    const ci = mapa.cazaPorCasilla[i];
    if (ci >= 0) { const nd = mapa.nodos[ci]; txt += ' — Caza ' + nd.cantidad + '/' + nd.maximo; }
    for (const ini of mapa.inicios) {
      if (x >= ini.x && x < ini.x + Sim.config.mapa.anchoSalon && y >= ini.y && y < ini.y + Sim.config.mapa.altoSalon)
        txt += ' — Zona de inicio: ' + Sim.razas[ini.raza].nombre;
    }
    return '(' + x + ', ' + y + ') ' + txt;
  }

  return { T: T, TERRENOS: TERRENOS, generar: generar, describir: describir };
})();
