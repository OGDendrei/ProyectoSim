// rutas: cálculo de caminos con A* y caché de rutas.
// La ruta se calcula una vez al salir y el personaje la sigue paso a paso.
window.Sim = window.Sim || {};

Sim.rutas = (function () {
  const VECINOS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  let cache = new Map();       // "desde>hasta" → lista de casillas
  let mapaCache = null;

  function coste(mapa, i) {
    const c = Sim.config.rutas.coste[mapa.terreno[i]];
    return c === undefined ? Infinity : c;
  }
  function transitable(mapa, x, y) {
    if (x < 0 || y < 0 || x >= mapa.ancho || y >= mapa.alto) return false;
    return coste(mapa, y * mapa.ancho + x) !== Infinity;
  }

  // Montículo binario sencillo para A*
  function Monticulo() { this.d = []; this.p = []; }
  Monticulo.prototype.meter = function (v, pr) {
    const d = this.d, p = this.p; let i = d.length; d.push(v); p.push(pr);
    while (i > 0) { const pa = (i - 1) >> 1; if (p[pa] <= pr) break; d[i] = d[pa]; p[i] = p[pa]; i = pa; }
    d[i] = v; p[i] = pr;
  };
  Monticulo.prototype.sacar = function () {
    const d = this.d, p = this.p, top = d[0], ultV = d.pop(), ultP = p.pop();
    if (d.length) {
      let i = 0; const n = d.length;
      for (;;) {
        let h = 2 * i + 1; if (h >= n) break;
        if (h + 1 < n && p[h + 1] < p[h]) h++;
        if (p[h] >= ultP) break;
        d[i] = d[h]; p[i] = p[h]; i = h;
      }
      d[i] = ultV; p[i] = ultP;
    }
    return top;
  };
  Monticulo.prototype.vacio = function () { return this.d.length === 0; };

  // Devuelve la lista de casillas (índices) desde el origen (excluido) hasta el destino, o null.
  function buscar(mapa, x0, y0, x1, y1) {
    if (mapa !== mapaCache) { cache = new Map(); mapaCache = mapa; }
    if (!transitable(mapa, x1, y1)) return null;
    const W = mapa.ancho, desde = y0 * W + x0, hasta = y1 * W + x1;
    if (desde === hasta) return [];
    const clave = desde + '>' + hasta;
    if (cache.has(clave)) {
      const r = cache.get(clave);
      cache.delete(clave); cache.set(clave, r); // la más usada pasa al final
      return r.slice();
    }

    const g = new Map(), padre = new Map();
    const abiertos = new Monticulo();
    const h = (i) => { const dx = Math.abs(i % W - x1), dy = Math.abs(((i / W) | 0) - y1); return Math.max(dx, dy) + 0.41 * Math.min(dx, dy); };
    g.set(desde, 0);
    abiertos.meter(desde, h(desde));
    let explorados = 0;
    const max = Sim.config.rutas.maxNodos;
    while (!abiertos.vacio()) {
      const i = abiertos.sacar();
      if (i === hasta) break;
      if (++explorados > max) return null;
      const x = i % W, y = (i / W) | 0, gi = g.get(i);
      for (const [dx, dy] of VECINOS) {
        const nx = x + dx, ny = y + dy;
        if (!transitable(mapa, nx, ny)) continue;
        // En diagonal no se cuela entre dos casillas de agua
        if (dx && dy && (!transitable(mapa, x + dx, y) || !transitable(mapa, x, y + dy))) continue;
        const ni = ny * W + nx;
        const ng = gi + coste(mapa, ni) * (dx && dy ? 1.41 : 1);
        if (ng < (g.has(ni) ? g.get(ni) : Infinity)) {
          g.set(ni, ng); padre.set(ni, i);
          abiertos.meter(ni, ng + h(ni));
        }
      }
    }
    if (!padre.has(hasta)) return null;
    const ruta = [];
    for (let i = hasta; i !== desde; i = padre.get(i)) ruta.push(i);
    ruta.reverse();
    cache.set(clave, ruta);
    if (cache.size > Sim.config.rutas.tamanoCache) cache.delete(cache.keys().next().value);
    return ruta.slice();
  }

  return { buscar: buscar, transitable: transitable };
})();
