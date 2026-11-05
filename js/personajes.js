// personajes: razas, rasgos, nombres y creación de personajes (los 5 fundadores de cada bando).
// Solo datos y reglas; no dibuja nada.
window.Sim = window.Sim || {};

// Las 4 razas. Los bonus de habilidad están en config.personajes.habilidadRaza.
Sim.razas = {
  enanos: { id: 'enanos', nombre: 'Enanos', singular: ['enano', 'enana'] },
  elfos: { id: 'elfos', nombre: 'Elfos', singular: ['elfo', 'elfa'] },
  orcos: { id: 'orcos', nombre: 'Orcos', singular: ['orco', 'orca'] },
  humanos: { id: 'humanos', nombre: 'Humanos', singular: ['humano', 'humana'] },
};

Sim.personajes = (function () {
  // Rasgos con su forma masculina y femenina. "opuesto": no pueden ir juntos.
  const RASGOS = {
    valiente: { m: 'valiente', f: 'valiente', opuesto: 'cobarde' },
    cobarde: { m: 'cobarde', f: 'cobarde', opuesto: 'valiente' },
    avaricioso: { m: 'avaricioso', f: 'avariciosa', opuesto: null },
    leal: { m: 'leal', f: 'leal', opuesto: null },
    perezoso: { m: 'perezoso', f: 'perezosa', opuesto: 'obsesivo' },
    curioso: { m: 'curioso', f: 'curiosa', opuesto: null },
    obsesivo: { m: 'obsesivo', f: 'obsesiva', opuesto: 'perezoso' },
    agresivo: { m: 'agresivo', f: 'agresiva', opuesto: 'pacifico' },
    pacifico: { m: 'pacífico', f: 'pacífica', opuesto: 'agresivo' },
    honorable: { m: 'honorable', f: 'honorable', opuesto: null },
    codicioso: { m: 'codicioso', f: 'codiciosa', opuesto: null },
  };

  const HABILIDADES = ['cultivo', 'tala', 'mineria', 'caza', 'construccion', 'combate', 'diplomacia'];
  const NOMBRE_HABILIDAD = {
    cultivo: 'Cultivo', tala: 'Tala', mineria: 'Minería', caza: 'Caza',
    construccion: 'Construcción', combate: 'Combate', diplomacia: 'Diplomacia',
  };
  const NOMBRE_PARTE = {
    cabeza: 'Cabeza', torso: 'Torso', brazoIzq: 'Brazo izq.', brazoDer: 'Brazo der.',
    piernaIzq: 'Pierna izq.', piernaDer: 'Pierna der.',
  };
  const ROL = {
    rey: ['rey', 'reina'], guardia: ['guardia', 'guardia'], trabajador: ['trabajador', 'trabajadora'],
  };
  const COMIDAS = {
    enanos: ['cerdo asado', 'pan negro', 'queso curado', 'setas de cueva', 'gachas'],
    elfos: ['bayas', 'venado', 'miel', 'pan de nueces', 'pescado de río'],
    orcos: ['carne cruda', 'tuétano', 'jabalí', 'gusanos fritos', 'sangre cuajada'],
    humanos: ['pan', 'guiso', 'queso', 'pescado', 'manzanas'],
  };
  const MATERIALES = ['madera', 'piedra', 'metal', 'oro'];

  // Generador de nombres por raza: sílabas de inicio + final (distinto por género).
  const NOMBRES = {
    enanos: {
      inicio: ['Thor', 'Bal', 'Dur', 'Gim', 'Bof', 'Nor', 'Dwal', 'Kil', 'Grim', 'Thra', 'Bru', 'Hel', 'Orm', 'Dag'],
      m: ['in', 'ak', 'ur', 'grim', 'dal', 'ror', 'bek', 'li'],
      f: ['a', 'is', 'dra', 'hild', 'una', 'wyn', 'ri'],
    },
    elfos: {
      inicio: ['Ae', 'Lin', 'Ela', 'Fae', 'Thal', 'Sil', 'Ith', 'Cel', 'Gal', 'Nim', 'Ar', 'Lor', 'Ely', 'Mir'],
      m: ['ndil', 'rion', 'las', 'thor', 'dan', 'mir', 'ion'],
      f: ['wen', 'iel', 'riel', 'ith', 'wyn', 'nia', 'eth'],
    },
    orcos: {
      inicio: ['Gr', 'Ug', 'Mog', 'Kr', 'Zug', 'Gor', 'Shag', 'Brak', 'Durz', 'Lug', 'Naz', 'Ruk', 'Az', 'Skar'],
      m: ['ok', 'ash', 'ug', 'gul', 'rak', 'mog', 'thak'],
      f: ['ra', 'ga', 'sha', 'ka', 'zga', 'uma', 'gha'],
    },
    humanos: {
      inicio: ['Al', 'Ber', 'Gon', 'Rod', 'Mar', 'El', 'Jim', 'San', 'Ter', 'Ur', 'Fer', 'Ram', 'Ber', 'Lu'],
      m: ['do', 'nardo', 'zalo', 'rigo', 'tín', 'mundo', 'ón'],
      f: ['vira', 'ena', 'cha', 'esa', 'raca', 'ilda', 'cía'],
    },
  };

  function nombreNuevo(raza, genero, usados, rng) {
    const N = NOMBRES[raza];
    for (let intento = 0; intento < 50; intento++) {
      const n = rng.elegir(N.inicio) + rng.elegir(N[genero]);
      if (!usados.has(n)) { usados.add(n); return n; }
    }
    const n = rng.elegir(N.inicio) + rng.elegir(N[genero]) + ' ' + (usados.size + 1);
    usados.add(n);
    return n;
  }

  function elegirRasgos(rng) {
    const C = Sim.config.personajes;
    const cuantos = rng.entero(C.rasgosMin, C.rasgosMax);
    const lista = rng.barajar(Object.keys(RASGOS));
    const elegidos = [];
    for (const r of lista) {
      if (elegidos.length >= cuantos) break;
      if (elegidos.some((e) => RASGOS[e].opuesto === r)) continue;
      elegidos.push(r);
    }
    return elegidos;
  }

  // Crea un personaje con todos los campos de DISENO.md 6.1.
  function crear(estado, datos, rng) {
    const C = Sim.config.personajes;
    const id = estado.sigId++;
    const habilidades = {};
    for (const h of HABILIDADES) {
      const base = (C.habilidadRol[datos.rol] || {})[h] || 0;
      const bonus = (C.habilidadRaza[datos.raza] || {})[h] || 0;
      habilidades[h] = { nivel: Math.min(C.habilidadMax, base + bonus + rng.entero(0, 2)), exp: 0 };
    }
    const cuerpo = {};
    for (const parte in C.vidaParte) cuerpo[parte] = { vida: C.vidaParte[parte], max: C.vidaParte[parte] };
    const oficio = datos.rol === 'trabajador' ? rng.ponderado(C.oficioRaza[datos.raza]) : datos.rol;

    const p = {
      id: id,
      nombre: datos.nombre,
      raza: datos.raza,
      genero: datos.genero,              // 'm' o 'f'
      nacimiento: datos.nacimiento,      // tick en que nació (la edad se calcula a partir de aquí)
      bando: datos.bando,
      rol: datos.rol,
      oficio: oficio,
      padreId: null, madreId: null, parejaId: null, hijosIds: [],
      rasgos: elegirRasgos(rng),
      gustos: {
        comida: rng.elegir(COMIDAS[datos.raza]),
        material: rng.elegir(MATERIALES),
        aprecia: [], rechaza: [],
      },
      necesidades: { hambre: rng.entero(0, 30), cansancio: rng.entero(0, 30), seguridad: 100 },
      habilidades: habilidades,
      relaciones: {},                   // id → valor (-100 a 100)
      recuerdos: [],                    // { tick, texto }
      rencores: [],
      cuerpo: cuerpo,                   // en la v1 solo cuenta la suma
      heridas: [],
      arma: datos.rol === 'guardia' || datos.rol === 'rey' ? 'basica' : null,
      armadura: {},                     // por parte del cuerpo (vacío en la v1)
      inventario: { capacidad: C.capacidadCarga, objetos: {} },
      salud: 'sano',
      x: datos.x, y: datos.y,
      accion: null,                     // qué está haciendo (ver ia)
      ultimaAccion: null,
      historial: [],                    // últimas acciones terminadas
    };
    estado.personajes[id] = p;
    return p;
  }

  // Crea los 5 fundadores de un bando dentro de su salón.
  function crearFundadores(estado, bando, rng) {
    const C = Sim.config.personajes;
    const roles = C.roles.slice();
    // Géneros: al menos minHombres y minMujeres; el resto al azar
    const generos = [];
    for (let i = 0; i < C.minHombres; i++) generos.push('m');
    for (let i = 0; i < C.minMujeres; i++) generos.push('f');
    while (generos.length < roles.length) generos.push(rng.prob(0.5) ? 'm' : 'f');
    rng.barajar(generos);

    const tpa = estado.tiempo.ticksPorAno;
    const usados = new Set();
    const s = bando.salon;
    const ids = roles.map(function (rol, i) {
      const edad = rng.rango(rol === 'rey' ? C.edadRey : C.edadFundador);
      const p = crear(estado, {
        nombre: nombreNuevo(bando.raza, generos[i], usados, rng),
        raza: bando.raza, genero: generos[i], rol: rol, bando: bando.id,
        nacimiento: -edad * tpa - rng.entero(0, tpa - 1),
        x: s.x + 1 + rng.entero(0, s.ancho - 3), y: s.y + 1 + rng.entero(0, s.alto - 3),
      }, rng);
      return p.id;
    });
    bando.miembros = ids;
    bando.reyId = ids[roles.indexOf('rey')];

    // Relaciones entre fundadores y gustos sobre personas
    for (const id of ids) {
      const p = estado.personajes[id];
      const otros = ids.filter((o) => o !== id);
      for (const o of otros) p.relaciones[o] = rng.rango(C.relacionInicial);
      const aprecia = rng.elegir(otros);
      p.gustos.aprecia.push(aprecia);
      p.relaciones[aprecia] = C.relacionAprecio;
      if (rng.prob(C.probRechazo)) {
        const rechaza = rng.elegir(otros.filter((o) => o !== aprecia));
        p.gustos.rechaza.push(rechaza);
        p.relaciones[rechaza] = C.relacionRechazo;
      }
      recordar(estado, p, 'Llegó a estas tierras para fundar el pueblo de los ' + Sim.razas[p.raza].nombre.toLowerCase() + '.');
    }
  }

  // ---------- Consultas ----------
  function edad(estado, p) { return Math.floor((estado.tiempo.tick - p.nacimiento) / estado.tiempo.ticksPorAno); }
  function etapa(estado, p) {
    const e = edad(estado, p), E = Sim.config.personajes.etapas;
    if (e < E.nino) return 'bebe';
    if (e < E.adulto) return 'nino';
    if (e < E.anciano) return 'adulto';
    return 'anciano';
  }
  function vida(p) {
    let v = 0, max = 0;
    for (const k in p.cuerpo) { v += p.cuerpo[k].vida; max += p.cuerpo[k].max; }
    return { vida: v, max: max };
  }
  function tieneRasgo(p, r) { return p.rasgos.indexOf(r) >= 0; }
  function textoRasgo(p, r) { return RASGOS[r][p.genero]; }
  function textoRol(p) { return (ROL[p.rol] || [p.rol, p.rol])[p.genero === 'm' ? 0 : 1]; }
  function textoRaza(p) { return Sim.razas[p.raza].singular[p.genero === 'm' ? 0 : 1]; }
  function recordar(estado, p, texto) {
    p.recuerdos.push({ tick: estado.tiempo.tick, texto: texto });
    const max = Sim.config.ia.maxRecuerdos;
    if (p.recuerdos.length > max) p.recuerdos.splice(0, p.recuerdos.length - max);
  }

  return {
    RASGOS: RASGOS, HABILIDADES: HABILIDADES, NOMBRE_HABILIDAD: NOMBRE_HABILIDAD, NOMBRE_PARTE: NOMBRE_PARTE,
    crear: crear, crearFundadores: crearFundadores,
    edad: edad, etapa: etapa, vida: vida, tieneRasgo: tieneRasgo,
    textoRasgo: textoRasgo, textoRol: textoRol, textoRaza: textoRaza, recordar: recordar,
  };
})();
