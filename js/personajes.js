// personajes: datos de razas y (a partir de la Fase 2) de los personajes.
window.Sim = window.Sim || {};

// Las 4 razas. Las diferencias reales (bonus, tendencias) llegan en fases posteriores.
Sim.razas = {
  enanos: { id: 'enanos', nombre: 'Enanos', singular: 'enano' },
  elfos: { id: 'elfos', nombre: 'Elfos', singular: 'elfo' },
  orcos: { id: 'orcos', nombre: 'Orcos', singular: 'orco' },
  humanos: { id: 'humanos', nombre: 'Humanos', singular: 'humano' },
};
