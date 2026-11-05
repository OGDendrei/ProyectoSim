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

  // --- Personajes (Fase 2) ---
  personajes: {
    roles: ['rey', 'guardia', 'guardia', 'trabajador', 'trabajador'], // los 5 fundadores
    minHombres: 2,
    minMujeres: 2,
    edadRey: [25, 45],          // años (mín., máx.)
    edadFundador: [18, 40],
    rasgosMin: 2,
    rasgosMax: 3,
    etapas: { nino: 3, adulto: 18, anciano: 70 }, // edad a la que empieza cada etapa
    vidaParte: { cabeza: 20, torso: 40, brazoIzq: 20, brazoDer: 20, piernaIzq: 20, piernaDer: 20 },
    capacidadCarga: 5,
    habilidadMax: 20,
    // Nivel inicial de habilidades según rol
    habilidadRol: {
      rey: { diplomacia: 6, combate: 4 },
      guardia: { combate: 5 },
      trabajador: { cultivo: 2, tala: 2, mineria: 2, caza: 2, construccion: 2 },
    },
    // Bonus de raza (se suma al nivel inicial)
    habilidadRaza: {
      enanos: { mineria: 3, construccion: 3, combate: 1 },
      elfos: { caza: 3, tala: 2 },
      orcos: { combate: 3, caza: 1 },
      humanos: { diplomacia: 2, cultivo: 1 },
    },
    // Oficio preferido de los trabajadores por raza (peso). Se usa de verdad en la Fase 3.
    oficioRaza: {
      enanos: { minero: 5, constructor: 3, leñador: 1, campesino: 1 },
      elfos: { cazador: 5, leñador: 3, campesino: 1 },
      orcos: { cazador: 4, leñador: 2, minero: 2 },
      humanos: { campesino: 4, leñador: 2, minero: 2, cazador: 2 },
    },
    relacionInicial: [-10, 30],
    relacionAprecio: 40,
    relacionRechazo: -30,
    probRechazo: 0.5,           // probabilidad de tener a alguien que le cae mal
  },

  // --- Necesidades e IA (Fase 2) ---  (0 = bien, 100 = fatal; seguridad al revés: 100 = seguro)
  ia: {
    hambrePorTick: 1.2,
    cansancioPorTick: 0.6,
    cansancioExtraAndando: 0.4,
    seguridadSube: 3,           // por tick cerca del salón
    seguridadBaja: 0.6,         // por tick lejos (el cobarde el doble)
    seguridadCercaGuardia: 1,
    radioSeguro: 8,             // casillas alrededor del salón que se sienten seguras
    comerBaja: 25,              // hambre que se quita por tick comiendo
    descansoBaja: 8,            // cansancio que se quita por tick descansando
    duracion: {                 // ticks que dura cada actividad al llegar [mín, máx]
      pasear: [1, 3], explorar: [2, 4], patrullar: [1, 2], vigilar: [4, 8],
      charlar: [2, 5], despachar: [4, 10], holgazanear: [2, 6],
    },
    radioPasear: 8,
    radioExplorar: [12, 24],
    radioPatrulla: [5, 9],
    radioCharla: 12,
    charlaRelacion: [1, 4],     // cuánto mejora la relación por tick charlando
    azar: 15,                   // máximo de azar sumado a cada puntuación
    penalizarRepetir: 12,       // resta a la acción que hizo la última vez
    urgente: 85,                // hambre o cansancio que interrumpe lo que esté haciendo
    maxRecuerdos: 12,
  },

  // --- Rutas (A*) ---
  rutas: {
    coste: { 0: 1, 1: 1, 2: 1.6, 3: 3, 5: 2 }, // por tipo de terreno (agua no se cruza)
    maxNodos: 30000,            // límite de búsqueda para no colgar el juego
    tamanoCache: 300,
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
