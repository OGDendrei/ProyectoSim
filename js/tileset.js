// tileset (parte de render): carga del tileset Ever Rogue (Efilheim, CC0) y mapeo elemento → tile.
// Base: versión 2.0. Lo que falta se completa con la 1.0. Casillas de 16x16.
window.Sim = window.Sim || {};

Sim.tileset = (function () {
  const HOJAS = {
    v2: { src: 'assets/tileset/EverRogue-2.0/EverRogueTileset 2.0 Packed Alpha.png', columnas: 8 },
    v1: { src: 'assets/tileset/EverRogue-1.0/EverRogueTileset 1.0 Packed Alpha.png', columnas: 14 },
  };
  const TAM = 16;

  // ---------- Mapeo de los elementos de DISENO.md a tiles ----------
  // hoja + índice (contando de izquierda a derecha y de arriba abajo en la hoja "Packed").
  // efecto: 'escarcha' (aclara en invierno), 'aclarar' (sustituto del vado).
  // Las estaciones van en orden: primavera, verano, otoño, invierno.
  const t = (hoja, i, efecto) => ({ hoja: hoja, i: i, efecto: efecto || null });
  const MAPEO = {
    // Terreno
    suelo: [t('v1', 14), t('v1', 14), t('v1', 14), t('v1', 14, 'escarcha')],
    pradera: [t('v2', 12), t('v2', 12), t('v2', 13), t('v2', 13, 'escarcha')],
    bosque: [t('v2', 7), t('v2', 6), t('v2', 5), t('v2', 7, 'escarcha')],
    montana: t('v2', 8),                 // SUSTITUTO: no hay montaña; bloque de piedra gris
    // Agua: piezas de borde. Se elige según qué lados tocan tierra.
    agua: {
      centro: t('v1', 66), arribaIzq: t('v1', 67), arriba: t('v1', 68), arribaDer: t('v1', 69), der: t('v1', 70),
      abajoDer: t('v1', 71), abajo: t('v1', 72), abajoIzq: t('v1', 73), izq: t('v1', 74),
    },
    vado: t('v1', 66, 'aclarar'),        // SUSTITUTO: no hay vado; agua aclarada
    // Recursos
    metal: t('v1', 84),                  // destellos azulados
    oro: t('v1', 85),                    // destellos dorados
    animal: t('v2', 49),                 // cuadrúpedo marrón (zona de caza)
    // Personajes (se tiñen con el color de su raza)
    guardia: t('v2', 38),                // figura con casco
    trabajador: t('v2', 41),             // figura sin armadura
    rey: t('v2', 38),                    // SUSTITUTO: el de guardia + corona dibujada encima
    // Para fases futuras (aún no se usan)
    pared: t('v1', 16),                  // muro de ladrillo gris
    puerta: t('v1', 143),                // puerta gris
    campo: t('v1', 81),                  // tallos (campo de cultivo)
    almacen: t('v1', 86),                // cofre
    forja: t('v1', 136),                 // horno
    hoguera: t('v1', 126),
    cadaver: t('v2', 52),                // huesos
    lobo: t('v2', 48),
    bandido: t('v2', 39),
    monstruo: t('v2', 42),
  };
  // Elementos de DISENO.md sin tile en el pack (se dibujan con un sustituto provisional)
  const SIN_TILE = ['montana', 'vado', 'plano de obra', 'rey (corona)', 'niño y bebé', 'anciano', 'árbol agotado / tocón',
    'empalizada', 'torre de vigilancia', 'cuartel', 'mercado', 'mazmorra', 'pesca'];

  const imagenes = {};
  let listo = false;
  const cache = new Map(); // tiles ya teñidos o con efecto

  function cargar(alTerminar) {
    if (listo) { alTerminar(true); return; }
    let pendientes = Object.keys(HOJAS).length, fallo = false;
    for (const k in HOJAS) {
      const img = new Image();
      img.onload = () => { if (--pendientes === 0) { listo = !fallo; alTerminar(listo); } };
      img.onerror = () => { fallo = true; if (--pendientes === 0) alTerminar(false); };
      img.src = HOJAS[k].src;
      imagenes[k] = img;
    }
  }

  // Devuelve un lienzo de 16x16 con el tile (teñido o con efecto si hace falta)
  function lienzoTile(tile, tinte, corona) {
    const clave = tile.hoja + ':' + tile.i + ':' + (tile.efecto || '') + ':' + (tinte || '') + ':' + (corona ? 'c' : '');
    let c = cache.get(clave);
    if (c) return c;
    c = document.createElement('canvas');
    c.width = c.height = TAM;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    const h = HOJAS[tile.hoja], sx = (tile.i % h.columnas) * TAM, sy = Math.floor(tile.i / h.columnas) * TAM;
    x.drawImage(imagenes[tile.hoja], sx, sy, TAM, TAM, 0, 0, TAM, TAM);
    if (tinte) {
      // Teñir: multiplicar por el color y recuperar la transparencia original
      x.globalCompositeOperation = 'multiply';
      x.fillStyle = tinte; x.fillRect(0, 0, TAM, TAM);
      x.globalCompositeOperation = 'destination-in';
      x.drawImage(imagenes[tile.hoja], sx, sy, TAM, TAM, 0, 0, TAM, TAM);
      x.globalCompositeOperation = 'source-over';
    }
    if (tile.efecto === 'escarcha' || tile.efecto === 'aclarar') {
      x.globalCompositeOperation = 'source-atop';
      x.fillStyle = tile.efecto === 'escarcha' ? 'rgba(235,240,255,0.55)' : 'rgba(210,235,255,0.6)';
      x.fillRect(0, 0, TAM, TAM);
      x.globalCompositeOperation = 'source-over';
    }
    if (corona) {
      // Corona dorada de pocos píxeles sobre la cabeza (sustituto: el pack no tiene rey)
      x.fillStyle = '#ffd700';
      for (const px of [5, 7, 8, 10]) x.fillRect(px, 0, 1, 1);
      x.fillRect(5, 1, 6, 1);
    }
    cache.set(clave, c);
    return c;
  }

  // Estilo CSS para mostrar un tile en la leyenda (funciona también abriendo el archivo con doble clic)
  function estiloIcono(tile, escala) {
    const h = HOJAS[tile.hoja], e = escala || 1;
    const sx = (tile.i % h.columnas) * TAM * e, sy = Math.floor(tile.i / h.columnas) * TAM * e;
    const img = imagenes[tile.hoja];
    const w = (img && img.naturalWidth ? img.naturalWidth : h.columnas * TAM) * e;
    const hh = (img && img.naturalHeight ? img.naturalHeight : TAM) * e;
    return 'display:inline-block;vertical-align:middle;image-rendering:pixelated;width:' + TAM * e + 'px;height:' + TAM * e + 'px;' +
      'background:url("' + encodeURI(h.src) + '") -' + sx + 'px -' + sy + 'px / ' + w + 'px ' + hh + 'px no-repeat;';
  }

  return {
    TAM: TAM, MAPEO: MAPEO, SIN_TILE: SIN_TILE,
    cargar: cargar, listo: () => listo, lienzoTile: lienzoTile, estiloIcono: estiloIcono,
  };
})();
