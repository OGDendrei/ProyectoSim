// main: une los módulos. Crea la partida con las opciones del menú y arranca el bucle.
window.Sim = window.Sim || {};

(function () {
  let ultimasOpciones = null;

  function crearPartida(op) {
    ultimasOpciones = op;
    const mapa = Sim.mapa.generar({ ancho: op.tamano, alto: op.tamano, semilla: op.semilla, razas: op.razas });
    // Estado de la partida: solo datos simples, para poder guardarlo en el futuro
    const estado = {
      version: 1,
      opciones: op,
      tiempo: { tick: 0, ticksPorAno: op.ticksPorAno, msPorTick: op.msPorTick, pausa: false },
      mapa: mapa,
    };
    Sim.ui.mostrarJuego();
    Sim.motor.iniciar(estado);
    Sim.render.ponerPaleta(op.paleta);
    Sim.ui.ponerEstado(estado);
    Sim.render.ponerEstado(estado);
    Sim.estadoActual = estado; // útil para depurar desde la consola
  }

  function nuke() {
    Sim.motor.detener();
    Sim.render.ponerEstado(null);
    Sim.ui.mostrarMenu(ultimasOpciones);
  }

  Sim.motor.alTick(function (estado, cambio) {
    Sim.ui.actualizar();
    if (cambio.estacion) { Sim.render.pedirDibujo(); Sim.ui.alCambiarEstacion(); }
  });

  window.addEventListener('DOMContentLoaded', function () {
    Sim.render.iniciar(document.getElementById('lienzo'));
    Sim.ui.iniciar(crearPartida, nuke);
    Sim.ui.mostrarMenu(null);
  });
})();
