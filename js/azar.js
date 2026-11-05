// azar: generador de números aleatorios con semilla.
// Misma semilla = mismos resultados. No usar Math.random en el juego.
window.Sim = window.Sim || {};

Sim.azar = (function () {
  // Convierte un texto (la semilla) en un número de 32 bits.
  function hashTexto(texto) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < texto.length; i++) {
      h ^= texto.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  // Crea un generador. Su estado es un número, así se puede guardar.
  function crear(semilla) {
    const g = { estado: (typeof semilla === 'number' ? semilla : hashTexto(String(semilla))) >>> 0 };

    // Número entre 0 (incluido) y 1 (excluido). Algoritmo mulberry32.
    g.num = function () {
      g.estado = (g.estado + 0x6d2b79f5) >>> 0;
      let t = g.estado;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    g.entero = function (min, max) { return min + Math.floor(g.num() * (max - min + 1)); };
    g.prob = function (p) { return g.num() < p; };
    g.elegir = function (lista) { return lista[Math.floor(g.num() * lista.length)]; };
    return g;
  }

  // Semilla nueva al azar, solo para cuando el jugador deja el campo vacío.
  function semillaNueva() {
    const v = new Uint32Array(1);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(v);
    else v[0] = (Date.now() ^ (performance.now() * 1000)) >>> 0;
    return String(v[0] % 1000000);
  }

  return { crear: crear, hashTexto: hashTexto, semillaNueva: semillaNueva };
})();
