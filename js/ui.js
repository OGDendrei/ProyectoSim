// ui: menú previo, barra de controles, leyenda, paneles y botón "Nuke the map".
window.Sim = window.Sim || {};

Sim.ui = (function () {
  const $ = (id) => document.getElementById(id);
  let alCrear = null;      // función que main da para crear la partida
  let alNuke = null;
  let estado = null;
  const TEXTO_INFO = 'Pasa el ratón por el mapa para ver qué hay en cada casilla.';

  // ---------- Menú previo ----------
  function montarMenu(opcionesPrevias) {
    const P = Sim.config.partida;
    const prev = opcionesPrevias || {};

    $('m-tamano').value = prev.tamano || P.tamanoPorDefecto;
    $('m-tamano').min = P.tamanoMinimo;
    $('m-tamano').max = P.tamanoMaximo;
    $('m-tpa').value = prev.ticksPorAno || P.ticksPorAnoPorDefecto;
    $('m-semilla').value = prev.semillaEscrita || '';

    const razasSel = prev.razas || P.razasPorDefecto;
    const cont = $('m-razas');
    cont.innerHTML = '';
    for (const id in Sim.razas) {
      const lab = document.createElement('label');
      lab.className = 'raza-opcion';
      lab.innerHTML = '<input type="checkbox" value="' + id + '"> <span style="color:' +
        Sim.render.PALETAS.clasica.razas[id] + '">' + Sim.render.SIMBOLO_REY + '</span> ' + Sim.razas[id].nombre;
      lab.querySelector('input').checked = razasSel.indexOf(id) >= 0;
      cont.appendChild(lab);
    }

    llenarVelocidades($('m-velocidad'), prev.msPorTick || P.velocidadPorDefecto);
    llenarPaletas($('m-paleta'), prev.paleta || P.paletaPorDefecto);
    $('m-error').textContent = '';
  }

  function llenarVelocidades(sel, valor) {
    sel.innerHTML = '';
    for (const v of Sim.config.velocidades) {
      const o = document.createElement('option');
      o.value = v.ms; o.textContent = v.texto;
      sel.appendChild(o);
    }
    sel.value = String(valor);
  }
  function llenarPaletas(sel, valor) {
    sel.innerHTML = '';
    for (const id in Sim.render.PALETAS) {
      const o = document.createElement('option');
      o.value = id; o.textContent = Sim.render.PALETAS[id].nombre;
      sel.appendChild(o);
    }
    sel.value = valor;
  }

  function leerMenu() {
    const P = Sim.config.partida;
    const razas = Array.from(document.querySelectorAll('#m-razas input:checked')).map((i) => i.value);
    if (razas.length !== 2) return { error: 'Elige exactamente 2 razas.' };
    let tamano = parseInt($('m-tamano').value, 10);
    if (!(tamano >= P.tamanoMinimo && tamano <= P.tamanoMaximo))
      return { error: 'El tamaño debe estar entre ' + P.tamanoMinimo + ' y ' + P.tamanoMaximo + '.' };
    const tpa = parseInt($('m-tpa').value, 10);
    if (!(tpa >= 4 && tpa <= 100000)) return { error: 'Los ticks por año deben ser 4 o más.' };
    const escrita = $('m-semilla').value.trim();
    return {
      tamano: tamano,
      razas: razas,
      msPorTick: parseInt($('m-velocidad').value, 10),
      ticksPorAno: tpa,
      semillaEscrita: escrita,
      semilla: escrita || Sim.azar.semillaNueva(),
      paleta: $('m-paleta').value,
    };
  }

  function mostrarMenu(opcionesPrevias) {
    montarMenu(opcionesPrevias);
    $('menu').classList.remove('oculto');
    $('juego').classList.add('oculto');
  }
  function mostrarJuego() {
    $('menu').classList.add('oculto');
    $('juego').classList.remove('oculto');
  }

  // ---------- Pantalla de juego ----------
  function ponerEstado(e) {
    estado = e;
    llenarVelocidades($('c-velocidad'), e.tiempo.msPorTick);
    llenarPaletas($('c-paleta'), e.opciones.paleta);
    $('c-semilla').textContent = e.opciones.semilla;
    montarBandos();
    montarLeyenda();
    actualizar();
  }

  function montarBandos() {
    const pal = Sim.render.paleta();
    const cont = $('bandos');
    cont.innerHTML = '';
    estado.mapa.inicios.forEach(function (ini) {
      const r = Sim.razas[ini.raza];
      const caja = document.createElement('div');
      caja.className = 'bando';
      caja.innerHTML =
        '<div class="bando-cabecera"><span style="color:' + pal.razas[ini.raza] + '">' + Sim.render.SIMBOLO_REY + '</span> ' +
        r.nombre + ' <span class="tenue">· población 0</span></div>' +
        '<div class="log"><div class="tenue">Aún no hay habitantes. Llegan en la Fase 2.</div></div>';
      caja.querySelector('.bando-cabecera').addEventListener('click', function () {
        const C = Sim.config.mapa;
        Sim.render.centrar(ini.x + C.anchoSalon / 2, ini.y + C.altoSalon / 2);
      });
      caja.querySelector('.bando-cabecera').title = 'Clic para ir a su zona';
      cont.appendChild(caja);
    });
  }
  function montarLeyenda() {
    const pal = Sim.render.paleta();
    const est = Sim.motor.calendario().estacion;
    const T = Sim.mapa.T, S = Sim.render.SIMBOLO;
    const filas = [
      [S[T.SUELO], pal.terreno[T.SUELO][est], 'Suelo llano'],
      [S[T.PRADERA], pal.terreno[T.PRADERA][est], 'Pradera'],
      [S[T.BOSQUE], pal.terreno[T.BOSQUE][est], 'Bosque (madera)'],
      [S[T.MONTANA], pal.terreno[T.MONTANA][est], 'Montaña (piedra)'],
      [Sim.render.SIMBOLO_RECURSO.metal, pal.recurso.metal, 'Veta de metal'],
      [Sim.render.SIMBOLO_RECURSO.oro, pal.recurso.oro, 'Oro'],
      [S[T.AGUA], pal.terreno[T.AGUA][est], 'Agua (pesca en la orilla)'],
      [S[T.VADO], pal.terreno[T.VADO][est], 'Vado (se puede cruzar)'],
      [Sim.render.SIMBOLO_ANIMAL, pal.animal, 'Animales (zona de caza)'],
      [Sim.render.SIMBOLO_PLANO, '#888', 'Plano del salón del rey'],
    ];
    $('leyenda').innerHTML = filas.map((f) =>
      '<div><span class="ley-simbolo" style="color:' + f[1] + '">' + f[0] + '</span> ' + f[2] + '</div>').join('');
  }

  // Refresca los indicadores (año, estación, botón de pausa)
  function actualizar() {
    if (!estado) return;
    const cal = Sim.motor.calendario();
    $('c-fecha').textContent = 'Año ' + cal.ano + ' · ' + Sim.motor.ESTACIONES[cal.estacion] +
      ' · tick ' + cal.tickDelAno + '/' + cal.ticksPorAno;
    $('c-pausa').textContent = estado.tiempo.pausa ? '▶ Reanudar' : '❚❚ Pausa';
    $('c-pausa').classList.toggle('activo', estado.tiempo.pausa);
  }

  // Barra de progreso hasta el próximo tick (se mueve sola)
  function animarProgreso() {
    if (estado) $('c-progreso-relleno').style.width = (Sim.motor.progreso() * 100) + '%';
    requestAnimationFrame(animarProgreso);
  }

  // ---------- Controles ----------
  function conectarControles() {
    $('m-crear').addEventListener('click', function () {
      const op = leerMenu();
      if (op.error) { $('m-error').textContent = op.error; return; }
      alCrear(op);
    });
    $('m-semilla').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('m-crear').click(); });

    $('c-pausa').addEventListener('click', function () { Sim.motor.pausar(); actualizar(); });
    $('c-paso').addEventListener('click', function () { Sim.motor.pasoManual(); });
    $('c-velocidad').addEventListener('change', function () { Sim.motor.cambiarVelocidad(parseInt(this.value, 10)); });
    $('c-paleta').addEventListener('change', function () {
      estado.opciones.paleta = this.value;
      Sim.render.ponerPaleta(this.value);
      montarBandos(); montarLeyenda();
    });
    $('c-encuadrar').addEventListener('click', function () { Sim.render.encuadrar(); });
    $('c-semilla').addEventListener('click', function () {
      if (navigator.clipboard) navigator.clipboard.writeText(estado.opciones.semilla);
      this.title = 'Copiada';
    });

    document.addEventListener('keydown', function (e) {
      if ($('juego').classList.contains('oculto') || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      if (e.code === 'Space') { e.preventDefault(); Sim.motor.pausar(); actualizar(); }
    });

    // Mapa: arrastrar para mover, rueda para zoom, pasar el ratón para info
    const lienzo = $('lienzo');
    let arrastre = null;
    lienzo.addEventListener('mousedown', function (e) { arrastre = { x: e.clientX, y: e.clientY }; lienzo.classList.add('arrastrando'); });
    window.addEventListener('mouseup', function () { arrastre = null; lienzo.classList.remove('arrastrando'); });
    window.addEventListener('mousemove', function (e) {
      if (arrastre) { Sim.render.mover(e.clientX - arrastre.x, e.clientY - arrastre.y); arrastre = { x: e.clientX, y: e.clientY }; }
    });
    // La barra de información solo se reescribe al cambiar de casilla (no redibuja el mapa)
    let ultimaCasilla = '';
    lienzo.addEventListener('mousemove', function (e) {
      if (!estado) return;
      const r = lienzo.getBoundingClientRect();
      const c = Sim.render.pantallaACasilla(e.clientX - r.left, e.clientY - r.top);
      const clave = c.x + ',' + c.y;
      if (clave === ultimaCasilla) return;
      ultimaCasilla = clave;
      $('info').textContent = Sim.mapa.describir(estado.mapa, c.x, c.y) || ' ';
    });
    lienzo.addEventListener('mouseleave', function () { ultimaCasilla = ''; $('info').textContent = TEXTO_INFO; });
    lienzo.addEventListener('wheel', function (e) {
      e.preventDefault();
      const r = lienzo.getBoundingClientRect();
      Sim.render.zoom(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX - r.left, e.clientY - r.top);
    }, { passive: false });
    // Táctil: arrastrar con un dedo
    let toque = null;
    lienzo.addEventListener('touchstart', function (e) { if (e.touches.length === 1) toque = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }, { passive: true });
    lienzo.addEventListener('touchmove', function (e) {
      if (!toque || e.touches.length !== 1) return;
      e.preventDefault();
      Sim.render.mover(e.touches[0].clientX - toque.x, e.touches[0].clientY - toque.y);
      toque = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: false });
    lienzo.addEventListener('touchend', function () { toque = null; });
    $('c-zoom-mas').addEventListener('click', function () { const r = lienzo.getBoundingClientRect(); Sim.render.zoom(1.25, r.width / 2, r.height / 2); });
    $('c-zoom-menos').addEventListener('click', function () { const r = lienzo.getBoundingClientRect(); Sim.render.zoom(1 / 1.25, r.width / 2, r.height / 2); });

    conectarNuke();
  }

  // "Nuke the map": hay que mantenerlo pulsado unos segundos
  function conectarNuke() {
    const b = $('nuke'), relleno = $('nuke-relleno');
    let inicio = 0, animando = false;
    function empezar(e) { e.preventDefault(); inicio = performance.now(); animando = true; paso(); }
    function cancelar() { animando = false; relleno.style.width = '0%'; }
    function paso() {
      if (!animando) return;
      const p = (performance.now() - inicio) / Sim.config.nukeMs;
      relleno.style.width = Math.min(100, p * 100) + '%';
      if (p >= 1) { cancelar(); alNuke(); return; }
      requestAnimationFrame(paso);
    }
    b.addEventListener('mousedown', empezar);
    b.addEventListener('touchstart', empezar, { passive: false });
    ['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach((ev) => b.addEventListener(ev, cancelar));
  }

  return {
    iniciar: function (crear, nuke) { alCrear = crear; alNuke = nuke; conectarControles(); animarProgreso(); },
    mostrarMenu: mostrarMenu,
    mostrarJuego: mostrarJuego,
    ponerEstado: ponerEstado,
    actualizar: actualizar,
    alCambiarEstacion: function () { montarLeyenda(); },
  };
})();
