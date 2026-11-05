// config: todos los valores numéricos ajustables del juego en un solo sitio.
window.Sim = window.Sim || {};

Sim.config = {
  // --- Menú previo (valores por defecto) ---
  partida: {
    tamanoPorDefecto: 64,
    tamanoMinimo: 32,
    tamanoMaximo: 300,
    ticksPorAnoPorDefecto: 100,
    velocidadPorDefecto: 60000, // ms por tick (1 minuto)
    paletaPorDefecto: 'clasica',
    razasPorDefecto: ['enanos', 'orcos'],
  },

  // Velocidades del tick (ms). 0,2 s es [PROPUESTO] para probar rápido.
  velocidades: [
    { ms: 60000, texto: '1 minuto' },
    { ms: 10000, texto: '10 segundos' },
    { ms: 1000, texto: '1 segundo' },
    { ms: 200, texto: '0,2 segundos' },
  ],

  // --- Generación del mapa ---
  mapa: {
    escalaRelieve: 0.045,   // menor = manchas más grandes
    escalaHumedad: 0.06,
    escalaRiqueza: 0.08,
    octavas: 4,
    nivelAgua: 0.27,        // por debajo: lago
    nivelMontana: 0.70,     // por encima: montaña
    humedadBosque: 0.56,    // por encima: bosque
    humedadPradera: 0.44,   // entre esto y bosque: pradera
    riosPor64: 2,           // ríos por cada 64x64 casillas
    vadoCada: 9,            // aprox. un vado cada N casillas de río
    probMetal: 0.10,        // probabilidad de veta de metal en montaña
    probOro: 0.012,         // probabilidad de oro en montaña
    probZonaCaza: 0.35,     // fuerza de las zonas de animales
    densidadAnimales: 0.12, // casillas de zona de caza que muestran un animal
    distanciaMinimaRazas: 0.5, // fracción del lado del mapa
    radioRecursosInicio: 9, // radio para valorar comida y madera cerca del inicio
    anchoSalon: 7,
    altoSalon: 5,
  },

  // Cantidad máxima base de cada nodo (se multiplica por la "riqueza" de la zona: 0,4 a 1,6)
  nodos: {
    madera: 40,
    piedra: 60,
    metal: 30,
    oro: 10,
    caza: 20,
    pesca: 15,
  },

  // --- Dibujo ---
  render: {
    tamanoCasilla: 16,  // px a zoom 1
    zoomMinimo: 0.25,
    zoomMaximo: 3,
  },

  // Botón "Nuke the map": tiempo que hay que mantenerlo pulsado
  nukeMs: 2000,
};
