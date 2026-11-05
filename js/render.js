// render: TODO el dibujo del mapa. Solo lee el estado; nunca lo cambia.
// Para pasar a tileset en el futuro, basta con cambiar este archivo.
window.Sim = window.Sim || {};

Sim.render = (function () {
  const T = Sim.mapa.T;

  // Símbolo de cada terreno (estilo Dwarf Fortress / CP437)
  const SIMBOLO = {};
  SIMBOLO[T.SUELO] = '.';
  SIMBOLO[T.PRADERA] = '"';
  SIMBOLO[T.BOSQUE] = '♣';
  SIMBOLO[T.MONTANA] = '▲';
  SIMBOLO[T.AGUA] = '≈';
  SIMBOLO[T.VADO] = '≈';
  const SIMBOLO_RECURSO = { metal: '*', oro: '$' };
  const SIMBOLO_ANIMAL = 'c';
  const SIMBOLO_REY = '☻';
  const SIMBOLO_PLANO = '░';

  // Paletas. Los terrenos tienen 4 colores: primavera, verano, otoño, invierno.
  // "agotado" es el color al que tiende el símbolo cuando el nodo se vacía.
  const PALETAS = {
    clasica: {
      nombre: 'Clásica',
      fondo: '#000000',
      fondoAgua: '#001a33',
      terreno: {
        [T.SUELO]: ['#8a7a5a', '#8a7a5a', '#8a6f4a', '#b8b8c0'],
        [T.PRADERA]: ['#5fd75f', '#87d75f', '#c0a040', '#d0d8d8'],
        [T.BOSQUE]: ['#2ecc40', '#1fa832', '#d08a20', '#d8e8e0'],
        [T.MONTANA]: ['#a8a8a8', '#a8a8a8', '#a09890', '#ffffff'],
        [T.AGUA]: ['#3a7fff', '#3a7fff', '#3070e0', '#a0c8ff'],
        [T.VADO]: ['#7fb0ff', '#7fb0ff', '#70a0e0', '#d0e4ff'],
      },
      agotado: { madera: '#6b4a2a', piedra: '#505050', metal: '#404858', oro: '#605020', pesca: '#1a3a70', caza: '#5a4a30' },
      recurso: { metal: '#8fb4d8', oro: '#ffd700' },
      animal: '#d8a060',
      razas: { enanos: '#c08040', elfos: '#40e040', orcos: '#ff4040', humanos: '#ffffff' },
    },
    oscura: {
      nombre: 'Oscura',
      fondo: '#0b0b10',
      fondoAgua: '#0a1020',
      terreno: {
        [T.SUELO]: ['#4a4438', '#4a4438', '#4a3e30', '#6a6a72'],
        [T.PRADERA]: ['#3a7a3a', '#4a7a30', '#7a6028', '#80888a'],
        [T.BOSQUE]: ['#1e7a2a', '#16662a', '#8a5a18', '#8a9a94'],
        [T.MONTANA]: ['#6a6a70', '#6a6a70', '#66605a', '#a8a8b0'],
        [T.AGUA]: ['#24508a', '#24508a', '#204678', '#5a7aa0'],
        [T.VADO]: ['#4a74a8', '#4a74a8', '#406898', '#7a94b8'],
      },
      agotado: { madera: '#3a2a1a', piedra: '#303034', metal: '#2a3038', oro: '#3a3018', pesca: '#14284a', caza: '#3a3020' },
      recurso: { metal: '#6a88a8', oro: '#c8a820' },
      animal: '#a07848',
      razas: { enanos: '#a06a38', elfos: '#38b038', orcos: '#d03030', humanos: '#d8d8d8' },
    },
    tierra: {
      nombre: 'Tonos tierra',
      fondo: '#1a140e',
      fondoAgua: '#14202a',
      terreno: {
        [T.SUELO]: ['#a08868', '#a89070', '#987858', '#c8c0b0'],
        [T.PRADERA]: ['#9aa84a', '#b0a848', '#c08838', '#c8c4b0'],
        [T.BOSQUE]: ['#5a8a3a', '#4a7a30', '#b06a28', '#b8c0b0'],
        [T.MONTANA]: ['#8a7a6a', '#8a7a6a', '#806e5e', '#e0dcd4'],
        [T.AGUA]: ['#4a7a90', '#4a7a90', '#40708a', '#98b4c0'],
        [T.VADO]: ['#7aa0b0', '#7aa0b0', '#7098a8', '#c0d0d8'],
      },
      agotado: { madera: '#5a3a20', piedra: '#4a4038', metal: '#3a3a40', oro: '#5a4a20', pesca: '#2a4050', caza: '#4a3a28' },
      recurso: { metal: '#90a0b0', oro: '#e0b030' },
      animal: '#c89060',
      razas: { enanos: '#b8763a', elfos: '#70b040', orcos: '#d04a30', humanos: '#f0e8d8' },
    },
  };

  // ---------- Utilidades de color ----------
  function hexARgb(h) { const v = parseInt(h.slice(1), 16); return [v >> 16, (v >> 8) & 255, v & 255]; }
  function mezclar(a, b, t) {
    const x = hexARgb(a), y = hexARgb(b);
    return 'rgb(' + Math.round(x[0] + (y[0] - x[0]) * t) + ',' + Math.round(x[1] + (y[1] - x[1]) * t) + ',' + Math.round(x[2] + (y[2] - x[2]) * t) + ')';
  }

  // ---------- Estado del dibujo (no es estado de la partida) ----------
  let lienzo = null, ctx = null;
  let estado = null;
  let paleta = PALETAS.clasica;
  const camara = { x: 0, y: 0, zoom: 1 }; // x, y en casillas (esquina superior izquierda)
  let pendiente = false;

  function iniciar(canvas) {
    lienzo = canvas;
    ctx = canvas.getContext('2d');
    // Si cambia el tamaño de la zona del mapa, se reajusta el lienzo
    new ResizeObserver(function () { ajustarTamano(); pedirDibujo(); }).observe(canvas.parentElement);
  }

  function ajustarTamano() {
    const r = lienzo.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    lienzo.width = Math.max(1, Math.floor(r.width * dpr));
    lienzo.height = Math.max(1, Math.floor(r.height * dpr));
    lienzo.style.width = r.width + 'px';
    lienzo.style.height = r.height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function tamCasilla() { return Sim.config.render.tamanoCasilla * camara.zoom; }
  function anchoVista() { return lienzo.width / (window.devicePixelRatio || 1); }
  function altoVista() { return lienzo.height / (window.devicePixelRatio || 1); }

  // Encaja el mapa entero en la pantalla
  function encuadrar() {
    if (!estado) return;
    ajustarTamano();
    const m = estado.mapa, C = Sim.config.render;
    const z = Math.min(anchoVista() / (m.ancho * C.tamanoCasilla), altoVista() / (m.alto * C.tamanoCasilla));
    camara.zoom = Math.max(C.zoomMinimo, Math.min(C.zoomMaximo, z));
    centrar(m.ancho / 2, m.alto / 2);
  }
  function centrar(cx, cy) {
    camara.x = cx - anchoVista() / tamCasilla() / 2;
    camara.y = cy - altoVista() / tamCasilla() / 2;
    pedirDibujo();
  }

  function pedirDibujo() {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(function () { pendiente = false; dibujar(); });
  }

  function dibujar() {
    if (!ctx) return;
    ctx.fillStyle = paleta.fondo;
    ctx.fillRect(0, 0, anchoVista(), altoVista());
    if (!estado) return;
    const m = estado.mapa;
    const est = Sim.motor.calendario().estacion;
    const tc = tamCasilla();

    // Solo las casillas visibles
    const x0 = Math.max(0, Math.floor(camara.x)), y0 = Math.max(0, Math.floor(camara.y));
    const x1 = Math.min(m.ancho - 1, Math.ceil(camara.x + anchoVista() / tc));
    const y1 = Math.min(m.alto - 1, Math.ceil(camara.y + altoVista() / tc));

    ctx.font = Math.round(tc * 0.9) + "px 'DejaVu Sans Mono', 'Consolas', 'Courier New', monospace";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const i = y * m.ancho + x;
        const t = m.terreno[i];
        const px = (x - camara.x) * tc, py = (y - camara.y) * tc;
        if (t === T.AGUA || t === T.VADO) {
          ctx.fillStyle = paleta.fondoAgua;
          ctx.fillRect(px, py, tc + 0.5, tc + 0.5);
        }
        let simbolo = SIMBOLO[t];
        let color = paleta.terreno[t][est];
        const ni = m.nodoPorCasilla[i];
        if (ni >= 0) {
          const nodo = m.nodos[ni];
          if (SIMBOLO_RECURSO[nodo.recurso]) { simbolo = SIMBOLO_RECURSO[nodo.recurso]; color = paleta.recurso[nodo.recurso]; }
          // El color se apaga según lo que queda en el nodo
          const vacio = 1 - nodo.cantidad / nodo.maximo;
          if (vacio > 0) color = mezclar(color, paleta.agotado[nodo.recurso], vacio);
        }
        // Algunas casillas de las zonas de caza muestran un animal
        const ci = m.cazaPorCasilla[i];
        if (ci >= 0 && m.nodos[ci].cantidad > 0 && hashCasilla(x, y) < Sim.config.mapa.densidadAnimales) {
          simbolo = SIMBOLO_ANIMAL; color = paleta.animal;
        }
        ctx.fillStyle = color;
        ctx.fillText(simbolo, px + tc / 2, py + tc / 2 + 1);
      }
    }

    // Zonas de inicio: plano del futuro salón y el rey en el centro
    const C = Sim.config.mapa;
    for (const ini of m.inicios) {
      const col = paleta.razas[ini.raza];
      for (let y = ini.y; y < ini.y + C.altoSalon; y++) for (let x = ini.x; x < ini.x + C.anchoSalon; x++) {
        const borde = y === ini.y || y === ini.y + C.altoSalon - 1 || x === ini.x || x === ini.x + C.anchoSalon - 1;
        const px = (x - camara.x) * tc, py = (y - camara.y) * tc;
        ctx.fillStyle = paleta.fondo;
        ctx.fillRect(px, py, tc + 0.5, tc + 0.5);
        if (borde) { ctx.fillStyle = col; ctx.globalAlpha = 0.55; ctx.fillText(SIMBOLO_PLANO, px + tc / 2, py + tc / 2 + 1); ctx.globalAlpha = 1; }
      }
      const cx = ini.x + (C.anchoSalon >> 1), cy = ini.y + (C.altoSalon >> 1);
      ctx.fillStyle = col;
      ctx.fillText(SIMBOLO_REY, (cx - camara.x) * tc + tc / 2, (cy - camara.y) * tc + tc / 2 + 1);
    }
  }

  // Número fijo 0..1 por casilla (para decidir dónde se ve un animal)
  function hashCasilla(x, y) {
    let h = Math.imul(x, 73856093) ^ Math.imul(y, 19349663);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  // ---------- Cámara: arrastrar y zoom ----------
  function mover(dxPx, dyPx) { camara.x -= dxPx / tamCasilla(); camara.y -= dyPx / tamCasilla(); pedirDibujo(); }
  function zoom(factor, pxX, pxY) {
    const C = Sim.config.render;
    const antes = pantallaACasilla(pxX, pxY, true);
    camara.zoom = Math.max(C.zoomMinimo, Math.min(C.zoomMaximo, camara.zoom * factor));
    camara.x = antes.x - pxX / tamCasilla();
    camara.y = antes.y - pxY / tamCasilla();
    pedirDibujo();
  }
  function pantallaACasilla(pxX, pxY, exacto) {
    const x = camara.x + pxX / tamCasilla(), y = camara.y + pxY / tamCasilla();
    return exacto ? { x: x, y: y } : { x: Math.floor(x), y: Math.floor(y) };
  }

  return {
    PALETAS: PALETAS,
    SIMBOLO: SIMBOLO, SIMBOLO_RECURSO: SIMBOLO_RECURSO, SIMBOLO_ANIMAL: SIMBOLO_ANIMAL,
    SIMBOLO_REY: SIMBOLO_REY, SIMBOLO_PLANO: SIMBOLO_PLANO,
    iniciar: iniciar,
    ponerEstado: function (e) { estado = e; encuadrar(); },
    ponerPaleta: function (id) { paleta = PALETAS[id] || PALETAS.clasica; pedirDibujo(); },
    paleta: function () { return paleta; },
    pedirDibujo: pedirDibujo,
    encuadrar: encuadrar,
    centrar: centrar,
    mover: mover, zoom: zoom, pantallaACasilla: pantallaACasilla,
  };
})();
