// main: une los módulos. Crea la partida con las opciones del menú y arranca el bucle.
window.Sim = window.Sim || {};

(function () {
  let ultimasOpciones = null;

  function crearPartida(op) {
    ultimasOpciones = op;
    const mapa = Sim.mapa.generar({ ancho: op.tamano, alto: op.tamano, semilla: op.semilla, razas: op.razas });
    // Estado de la partida: solo datos simples, para poder guardarlo en el futuro
    const C = Sim.config.mapa;
    const estado = {
      version: 2,
      opciones: op,
      tiempo: { tick: 0, ticksPorAno: op.ticksPorAno, msPorTick: op.msPorTick, pausa: false },
      mapa: mapa,
      azar: { estado: Sim.azar.hashTexto('sim:' + op.semilla) }, // azar de la simulación (se guarda)
      sigId: 1,
      personajes: {},
      bandos: mapa.inicios.map((ini, k) => ({
        id: k, raza: ini.raza, reyId: null, miembros: [],
        salon: { x: ini.x, y: ini.y, ancho: C.anchoSalon, alto: C.altoSalon },
      })),
    };
    const rng = Sim.azar.crear(estado.azar);
    for (const b of estado.bandos) Sim.personajes.crearFundadores(estado, b, rng);
    Sim.ui.mostrarJuego();
    Sim.motor.iniciar(estado);
    Sim.render.ponerPaleta(op.paleta);
    Sim.fichas.ponerEstado(estado);
    Sim.ui.ponerEstado(estado);
    Sim.render.ponerEstado(estado);
    Sim.render.ponerModo(op.graficos, function (ok) {
      if (!ok) estado.opciones.graficos = 'ascii';
      Sim.ui.ponerEstado(estado); // refresca selector y leyenda
    });
    Sim.estadoActual = estado; // útil para depurar desde la consola
  }

  function nuke() {
    Sim.motor.detener();
    Sim.fichas.cerrarTodas();
    Sim.render.ponerEstado(null);
    Sim.ui.mostrarMenu(ultimasOpciones);
  }

  Sim.motor.alTick(function (estado, cambio) {
    Sim.ui.actualizar();
    Sim.ui.actualizarBandos();
    Sim.fichas.refrescarTodas();
    if (cambio.estacion) { Sim.render.pedirDibujo(); Sim.ui.alCambiarEstacion(); }
    else Sim.render.actualizar(); // solo las casillas que cambiaron
  });

  window.addEventListener('DOMContentLoaded', function () {
    Sim.render.iniciar(document.getElementById('lienzo'));
    Sim.ui.iniciar(crearPartida, nuke);
    Sim.ui.mostrarMenu(null);
  });
})();
