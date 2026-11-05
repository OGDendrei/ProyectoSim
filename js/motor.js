// motor: bucle de ticks, velocidad, pausa y calendario (años y estaciones).
window.Sim = window.Sim || {};

Sim.motor = (function () {
  const ESTACIONES = ['Primavera', 'Verano', 'Otoño', 'Invierno'];

  let estado = null;        // estado de la partida (lo crea main)
  let alTick = [];          // funciones a llamar en cada tick
  let acumulado = 0;        // ms transcurridos desde el último tick
  let ultimo = 0;
  let enMarcha = false;

  function iniciar(est) {
    estado = est;
    acumulado = 0;
    ultimo = performance.now();
    if (!enMarcha) { enMarcha = true; requestAnimationFrame(bucle); }
  }

  function bucle(ahora) {
    if (!estado) { enMarcha = false; return; }
    const dt = Math.min(ahora - ultimo, 5000); // si la pestaña estuvo dormida, no recuperar de golpe
    ultimo = ahora;
    if (!estado.tiempo.pausa) {
      acumulado += dt;
      let seguridad = 50;
      while (acumulado >= estado.tiempo.msPorTick && seguridad-- > 0) {
        acumulado -= estado.tiempo.msPorTick;
        tick();
      }
    }
    requestAnimationFrame(bucle);
  }

  // Un tick de simulación. En la Fase 1 solo avanza el calendario.
  function tick() {
    const antes = calendario();
    estado.tiempo.tick++;
    const despues = calendario();
    const cambio = { estacion: antes.estacion !== despues.estacion, ano: antes.ano !== despues.ano };
    for (const f of alTick) f(estado, cambio);
  }

  function calendario() {
    const t = estado.tiempo;
    const tpa = t.ticksPorAno;
    const enAno = t.tick % tpa;
    return {
      ano: Math.floor(t.tick / tpa) + 1,
      estacion: Math.min(3, Math.floor(enAno / (tpa / 4))),
      tickDelAno: enAno + 1,
      ticksPorAno: tpa,
    };
  }

  return {
    ESTACIONES: ESTACIONES,
    iniciar: iniciar,
    detener: function () { estado = null; },
    calendario: calendario,
    pausar: function (p) { estado.tiempo.pausa = (p === undefined) ? !estado.tiempo.pausa : p; return estado.tiempo.pausa; },
    pasoManual: function () { acumulado = 0; tick(); },
    cambiarVelocidad: function (ms) { estado.tiempo.msPorTick = ms; acumulado = Math.min(acumulado, ms); },
    progreso: function () { return estado ? Math.min(1, acumulado / estado.tiempo.msPorTick) : 0; },
    alTick: function (f) { alTick.push(f); },
  };
})();
