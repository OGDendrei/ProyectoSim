# DISEÑO — Simulador de Razas de Fantasía (nombre provisional)

> Documento de diseño vivo. Es la **fuente de verdad** del proyecto.
> Está escrito para que lo lean tanto personas como una IA (Claude) en cualquier chat futuro, sin necesidad de contexto previo.

---

## 0. Cómo usar este documento

### 0.1 Para Claude (u otra IA) que lea esto
- Lee este archivo **entero** antes de escribir código o proponer cambios.
- El usuario **no programa**: todo el código lo escribe y mantiene la IA. Explica los cambios en lenguaje llano, en español, de forma concisa y directa.
- Si el usuario cambia una decisión, **actualiza primero este documento** (sección afectada + registro de cambios del final) y después el código.
- No inventes decisiones nuevas sin marcarlas como `[PROPUESTO]` y preguntar.
- Si el código y este documento se contradicen, gana el documento (o se pregunta al usuario y se corrige uno de los dos).
- Idioma: todo el juego (textos, log, interfaz) en **español**.
- Este proyecto puede publicarse (GitHub): **no incluir datos personales del usuario** (nombre, usuario, correo, contraseñas, enlaces a chats) en código, comentarios, commits ni archivos. Los commits deben ser anónimos.

### 0.2 Etiquetas de estado
| Etiqueta | Significado |
|---|---|
| `[CERRADO]` | Decidido con el usuario. No cambiar sin preguntar. |
| `[PROPUESTO]` | Valor o idea sugerida por la IA, aceptada de forma provisional. Ajustable jugando. |
| `[FUTURO]` | Fuera del alcance actual. La estructura debe dejar el hueco preparado. |
| `[ABIERTO]` | Pendiente de decidir. |

### 0.3 Flujo de trabajo acordado
- **Chat de diseño:** se debate, se cambian ideas y se actualiza este documento.
- **Chat de programación (Claude Code):** se construye el juego sobre la carpeta del proyecto, leyendo siempre este documento.
- **Este archivo es el puente** entre ambos. Cualquier cambio de diseño se anota aquí.

---

## 1. Concepto

**Simulador de eventos y acciones de razas de fantasía en un mundo generado proceduralmente.** Dos bandos (dos razas elegidas entre cuatro) viven, trabajan, se reproducen, comercian, pactan, se traicionan y se hacen la guerra por sí solos. **El jugador solo mira**: no controla nada. Interactúa únicamente con menús, ventanas de información y el botón de reiniciar.

El atractivo central son **las historias que emergen** (cortejos, dinastías, traiciones, rencores heredados, raids, hambrunas) contadas en un **log de eventos**. Pensado para dejarlo corriendo en un segundo monitor, a ritmo pausado.

Referencias de ambientación: *Dwarf Fortress* (estética ASCII, fichas de personajes, sensación de simulación profunda) con toques de diplomacia tipo *Crusader Kings*. Tono: serio, pero sin pasarse.

### Principios de diseño
1. **Las historias son el producto.** Si una mecánica no genera historias legibles en el log, es sospechosa.
2. **Emergencia sobre guion.** Raids, alianzas y guerras nacen de la escasez y de la personalidad, no de eventos forzados.
3. **Simple hoy, ampliable mañana.** Datos preparados para sistemas complejos (combate por partes del cuerpo, armaduras...) aunque la versión 1 use una parte mínima.
4. **Todo configurable** (tamaño, velocidad, ticks por año...), con valores por defecto sensatos.
5. **Sin dependencias externas ni servidores.** Todo funciona en el navegador, offline.

---

## 2. Resumen de decisiones cerradas

| Tema | Decisión |
|---|---|
| Tipo de juego | Simulador sin interacción (solo mirar) `[CERRADO]` |
| Bandos | 1 vs 1; se eligen 2 razas de 4 (enanos, elfos, orcos, humanos) `[CERRADO]` |
| Inicio de cada bando | 5 fundadores: 1 rey, 2 guardias, 2 trabajadores (mín. 2 hombres y 2 mujeres entre los 5) `[CERRADO]` |
| Fin de partida | Muere el rey **sin descendencia** (o el jugador termina la partida) `[CERRADO]` |
| Sucesión | Si hay descendencia, sigue la dinastía; regencia si el heredero es menor `[CERRADO]` |
| Reproducción | Solo hombre+mujer; todo nacido tiene madre y padre en el juego `[CERRADO]` |
| Población | Limitada por casas: cada casa +5 huecos `[CERRADO]` |
| Mapa | Cuadrícula, vista cenital de una capa, procedural, con semilla `[CERRADO]` |
| Gráficos | ASCII estilo Dwarf Fortress con paletas; capa gráfica separada para tileset futuro `[CERRADO]` |
| Tiempo | Tick configurable (1 min / 10 s / 1 s...); ticks por año configurable `[CERRADO]` |
| Vida | 100 años para todas las razas de momento `[CERRADO]` |
| Log | En español, tono mixto (seco en lo cotidiano, narrativo en lo importante) `[CERRADO]` |
| Ficha de personaje | Ventana flotante arrastrable con aspa y árbol genealógico `[CERRADO]` |
| Recursos | Nodos con cantidad que se agota y se repone cada N ticks `[CERRADO]` |
| Transporte | Los trabajadores cargan y llevan al almacén `[CERRADO]` |
| Estaciones | 4 estaciones simples `[CERRADO]` |
| Combate | Versión simple activa + estructura preparada para estilo DF `[CERRADO]` |
| Raids | Las dirige el rey con el ejército; el rey puede ir y arriesgarse `[CERRADO]` |
| Curación | Solo descanso (curandero en el futuro) `[CERRADO]` |
| Muertos | Quedan en el suelo un tiempo y luego desaparecen; existe un libro de difuntos `[CERRADO]` |
| Prisioneros | Mazmorra en el castillo; se pueden intercambiar o ejecutar `[CERRADO]` |
| Neutrales y eventos aleatorios | Siempre activos de momento `[CERRADO]` |
| Estilo de edificios por raza | No de momento `[FUTURO]` |

---

## 3. Tecnología y arquitectura

### 3.1 Plataforma `[CERRADO]`
- **HTML + JavaScript puro (sin librerías pesadas)**, ejecutable abriendo el archivo en el navegador. Sin servidor, sin instalación, sin coste.
- Dibujo en `<canvas>`.
- **No se usa ningún modelo de lenguaje** dentro del juego: la IA de los personajes es lógica normal de programación.

### 3.2 Principios de arquitectura `[PROPUESTO]`
Aunque al principio pueda ser un solo archivo, el código debe estar **organizado en módulos separados** (en Code, un archivo por módulo) con responsabilidades claras:

| Módulo | Responsabilidad |
|---|---|
| `mapa` | Generación procedural, terreno, nodos de recurso |
| `motor` | Bucle de ticks, velocidad, estaciones, calendario |
| `personajes` | Datos del personaje, necesidades, habilidades, rasgos |
| `ia` | Decisión de cada personaje y capa estratégica del rey |
| `familia` | Cortejo, nacimientos, genealogía, sucesión, regencia |
| `economia` | Recursos, inventarios, almacenes, construcción |
| `combate` | Resolución de combates, heridas, partes del cuerpo |
| `diplomacia` | Pactos, tributos, treguas, traiciones, matrimonios entre bandos |
| `eventos` | Neutrales, eventos aleatorios, plantillas del log |
| `render` | **Todo el dibujo.** Aislado para poder cambiar ASCII por tileset |
| `ui` | Menú previo, ventanas flotantes, log, paneles |
| `guardado` | Guardar/cargar partida |
| `azar` | Generador de números aleatorios con semilla (lo usan todos los módulos) `[PROPUESTO]` |
| `config` | Todos los valores numéricos ajustables `[PROPUESTO]` |

Los módulos se cargan con etiquetas `<script>` normales (no módulos ES) y cuelgan de un objeto global `Sim`, para que el juego funcione abriendo `index.html` con doble clic, sin servidor `[PROPUESTO]`.

**Regla clave:** la **simulación** (datos y reglas) **nunca depende de cómo se dibuja**. `render` solo lee el estado y lo pinta. Esto permite cambiar a tileset sin tocar la lógica.

### 3.3 Reglas técnicas `[PROPUESTO]`
- **Generador de números aleatorios con semilla** (no usar `Math.random` directamente): misma semilla = mismo mapa, y partidas reproducibles.
- **Estado de partida serializable** (todo en objetos simples) para poder guardar/cargar fácilmente.
- **Identificadores únicos** para personajes, edificios y nodos (no referencias directas), para guardar y cargar sin problemas y para que el árbol genealógico funcione.
- **Rendimiento:** mapas hasta 200x200 (40.000 casillas) y decenas/cientos de personajes deben ir fluidos. Cálculo de rutas con A* y **rutas cacheadas** (se calcula al salir, no en cada tick). Dibujar solo lo visible.
- **Los textos del log se generan por plantillas**, nunca con texto fijo dentro de la lógica.
- Los **valores numéricos** (costes, duraciones, probabilidades) viven en un **archivo de configuración único** (`config`), no repartidos por el código, para ajustar jugando.

---

## 4. Mapa `[CERRADO]`

- Cuadrícula de **tamaño configurable**: por defecto **64x64** `[PROPUESTO]`, hasta 200x200 o más.
- **Vista cenital, una sola capa** (no hay subsuelo ni niveles).
- **Generación procedural aleatoria con semilla.**
- Tipos de terreno: **bosque, montaña, río/agua, pradera, suelo llano**, y zonas con **animales** (caza).
- Cada raza aparece en una zona distinta, **alejadas entre sí**, con acceso razonable a comida y madera.
- **Nodos de recurso** repartidos con "manchas" de abundancia desigual (ver sección 10), para crear **puntos calientes** de conflicto.
- Los ríos son barreras parcialmente cruzables (vados/puentes) `[PROPUESTO]`.

### Símbolos ASCII de referencia (estilo DF / CP437) `[PROPUESTO]`
| Elemento | Símbolo |
|---|---|
| Bosque | `♣` |
| Montaña | `▲` |
| Agua | `≈` |
| Vado | `≈` (color más claro) `[PROPUESTO]` |
| Veta de metal | `*` `[PROPUESTO]` |
| Oro | `$` `[PROPUESTO]` |
| Animales (zona de caza) | `c` `[PROPUESTO]` |
| Pradera | `"` |
| Suelo | `.` |
| Pared / puerta | `#` / `+` |
| Plano de obra | `░` |
| Persona | `☺` (color por raza) |
| Rey | `☻` |
| Guardia / niño / animal | símbolos o letras distintos |

El color del símbolo se **apaga según los recursos restantes** del nodo y **cambia con la estación**.

---

## 5. Razas `[CERRADO]`

Cuatro razas. Se eligen **2** por partida. Las diferencias son de **bonus y tendencias**, no de reglas distintas.

| Raza | Fortalezas | Debilidades | Color |
|---|---|---|---|
| **Enanos** | Minería, construcción, defensa | Agricultura | Marrón |
| **Elfos** | Bosque, caza, sigilo; aguantan mejor el invierno | Poco metal | Verde |
| **Orcos** | Ataque, raids | Economía débil; sufren más el invierno | Rojo |
| **Humanos** | Equilibrio, diplomacia, comercio | Sin especialidad extrema | Blanco |

- **Vida:** 100 años para todas de momento `[CERRADO]`. Preparado para valores por raza en el futuro (propuesta: humanos 100, enanos 130, elfos 200, orcos 70) `[FUTURO]`.
- **Híbridos/mestizos** (semielfos, etc.): `[FUTURO]`. Mientras tanto, los hijos de matrimonio entre bandos son de la raza del progenitor del bando donde viven `[PROPUESTO]`.
- **Nombres:** cada raza tiene su propia lista/generador de nombres (de estilo distinto) `[PROPUESTO]`.

---

## 6. Personajes

### 6.1 Datos de un personaje `[CERRADO]` (campos mínimos)
- `id`, `nombre`, `raza`, `género` (masculino/femenino), `edad`, `bando`
- `rol` (rey, guardia, trabajador, niño, anciano...) y `oficio`
- `padre_id`, `madre_id` (nulos en los fundadores), `pareja_id`, `hijos_ids`
- **Rasgos de personalidad** (2-3), p. ej. valiente, cobarde, avaricioso, leal, perezoso, curioso, obsesivo, agresivo, pacífico, honorable, codicioso
- **Gustos** (comida favorita, material favorito, personas que aprecia o rechaza)
- **Necesidades:** hambre, cansancio, seguridad
- **Habilidades** por oficio (con nivel y experiencia): cultivo, tala, minería, caza, construcción, combate, diplomacia
- **Relaciones** con otros personajes (valor positivo/negativo) y **recuerdos** (lista de sucesos relevantes)
- **Rencores** (heredables)
- **Cuerpo** (lista de partes con vida) — ver sección 12
- **Inventario** (capacidad máxima de carga)
- **Estado actual** (qué está haciendo) y estado de salud

### 6.2 Etapas de vida `[PROPUESTO]`
| Etapa | Edad (años) | Notas |
|---|---|---|
| Bebé | 0-2 | No actúa; depende de los padres |
| Niño | 3-17 | No trabaja ni lucha; aprende oficios de los padres |
| Adulto | 18-69 | Trabaja, lucha, se empareja, tiene hijos |
| Anciano | 70+ | Pierde rendimiento físico; mantiene/gana diplomacia |

- Adulto a los **18 años** (~18 % de la vida). Con vida de 100 años: **1 tick = 1 año** si se configura así.
- La edad se mide en **años del juego**; el ajuste "ticks por año" convierte entre años y ticks.
- Causas de muerte `[CERRADO]`: **vejez, combate, hambre, enfermedad/plaga** (evento).

### 6.3 Ventana de personaje `[CERRADO]`
Al **hacer clic** en un personaje se abre una **ventana flotante**:
- **Arrastrable** y con **aspa (✕) para cerrar**. Se pueden tener **varias abiertas** a la vez.
- Contenido: nombre, raza, género, edad, rol/oficio, rasgos, gustos, estado (hambre, cansancio, qué hace ahora), habilidades, salud/heridas, familia, relaciones importantes, últimos recuerdos.
- **Árbol genealógico** (abuelos, padres, pareja, hermanos, hijos). **Cada nombre es clicable** para saltar a esa persona.

---

## 7. Inteligencia artificial

### 7.1 Principio `[CERRADO]`
Los personajes **actúan solos** y **no son robots repetitivos**. Todo es lógica de programación, sin modelo de lenguaje.

### 7.2 Capa individual: necesidades + personalidad + azar `[PROPUESTO]`
En cada tick, el personaje:
1. Genera una lista de **acciones posibles** (comer, descansar, trabajar, huir, vigilar, cortejar, construir...).
2. **Puntúa** cada una según: necesidades urgentes, rasgos, gustos, situación (peligro cercano), órdenes del bando y un **poco de azar**.
3. Ejecuta la mejor. Las acciones largas (ir a un nodo, trabajar, volver) son **estados con memoria de ruta**.

Dos trabajadores del mismo oficio no hacen siempre lo mismo, porque sus rasgos y su situación difieren.

### 7.3 Capa estratégica del rey `[PROPUESTO]`
El rey (o su regente) decide en función de su **personalidad** y de la situación del bando:
- Prioridades de oficio ("falta comida → más campesinos", "falta piedra → más mineros").
- Preparar/lanzar un raid, proponer o romper un pacto, pedir tributo, construir casas/defensas.
- Un rey **agresivo** ataca antes; uno **prudente** espera ventaja; uno **codicioso** prioriza oro; uno **honorable** rompe menos pactos.

### 7.4 Elección de oficio de los hijos `[PROPUESTO]`
Al hacerse adultos eligen oficio **por puntuación** (no al azar ni por orden del rey), combinando:
- Habilidades heredadas/aprendidas de la familia.
- Gustos y rasgos (valiente → guardia, perezoso → oficios suaves, curioso → explorador).
- Necesidades del bando.
- Empujón de raza (los enanos tienden a minar), sin obligar.

### 7.5 Recuerdos y relaciones `[CERRADO]`
Los personajes guardan recuerdos ("vio morir a su hermano", "pacto roto") y relaciones numéricas. Esto alimenta decisiones, rencores y el log.

---

## 8. Familia, población y sucesión

### 8.1 Reproducción `[CERRADO]`
- **Solo hombre + mujer.** Todo personaje nacido tiene `madre_id` y `padre_id` existentes en el juego. Los 5 fundadores son la única excepción.
- **Fundadores:** al menos 2 hombres y 2 mujeres entre los 5, para que el bando pueda reproducirse desde el inicio `[PROPUESTO]`.
- **Cortejo:** dos adultos libres, de distinto sexo, con relación positiva y un **hueco de población libre**. Si no hay hueco, el bando se plantea construir una casa.
- **Anti-incesto:** no pueden emparejarse padres/hijos ni hermanos. Primos, sí `[PROPUESTO]`.
- **Embarazo y crianza:** duran un tiempo (en años del juego) que frena el crecimiento `[PROPUESTO]`: embarazo ~1 año, tiempo mínimo entre hijos ~2 años (valores ajustables).

### 8.2 Límite de población `[CERRADO]`
- **Cada casa añade 5 huecos.** El salón inicial del rey aporta los primeros huecos.
- Sin huecos libres no nacen hijos hasta construir otra casa.
- Otros frenos: comida disponible y tiempo de crianza.

### 8.3 Herencia de rasgos `[CERRADO]`
Al nacer un hijo:
- Hereda con **50 % de probabilidad** un rasgo de cada progenitor.
- Obtiene **1 rasgo nuevo al azar** (mutación).
- **Hereda rencores:** si matan al padre en un raid, el hijo adulto puede quedar con "sed de venganza" contra ese bando.
- Los niños aprenden algo del oficio de sus padres; las familias tienden a especializarse. Esa experiencia se pierde si mueren sin transmitirla `[CERRADO]`.

### 8.4 Sucesión del rey `[CERRADO]`
- **Rey muere sin descendencia directa → fin de partida.**
- **Con descendencia → continúa** la dinastía.
- "Descendencia directa" = **cualquier descendiente del rey actual o de su dinastía**. Si el hijo del rey no tiene hijos pero tiene hermanos, la partida sigue (todos descienden del mismo rey).
- **Orden de sucesión** `[PROPUESTO]`: hijo/a mayor adulto → resto de hijos por edad → nietos.
- **Panel de "línea de sucesión"** visible en la interfaz para ver el peligro cuando queda un único heredero.

### 8.5 Regencia (heredero menor de edad) `[CERRADO]`
Cadena de regencia:
1. **La madre** del heredero.
2. Un **pariente adulto** de la familia real, el más cercano (abuelos, tíos, hermanos mayores).
3. El **guardia más leal**.
4. Si no queda nadie, el niño reina solo y el bando va **"a la deriva"**: decide peor, no puede pactar ni declarar raids.

Si la regente está **capturada**, la regencia pasa al siguiente de la cadena y vuelve a ella si es rescatada. **Capturar al heredero o a la regente es un objetivo válido de raid** (rehenes, rescates, intercambios).

### 8.6 Rey capturado `[CERRADO]`
Es **rescatable** o negociable. Si **muere en cautiverio**, cuenta como muerte del rey (aplica la sucesión).

---

## 9. Tiempo y calendario `[CERRADO]`

- **Tick:** unidad básica de tiempo de simulación. Cada personaje actúa **una vez por tick**.
- **Velocidad del tick configurable:** 1 minuto (por defecto), 10 segundos, 1 segundo, etc. Incluye pausa. Se añade 0,2 segundos para probar rápido, un botón de avanzar un tick y la tecla espacio para pausar `[PROPUESTO]`.
- **Ticks por año configurables** (p. ej. 100). Todas las duraciones de juego se expresan en **años del juego** y se convierten a ticks con este ajuste.
- **Estaciones:** 4 por año, cada una un cuarto de los ticks por año.

| Estación | Efecto |
|---|---|
| Primavera | Los campos empiezan a dar; más nacimientos |
| Verano | Cosecha máxima; caza abundante |
| Otoño | Cosecha final; hay que almacenar para el invierno |
| Invierno | Campos sin producción; caza escasa; se consume más comida; sufren los desprotegidos |

- Se nota en la **paleta del mapa** (bosque ocre en otoño, blanquecino en invierno) y en una **etiqueta de estación** junto al año.
- **Hambruna** emergente si el bando no acumuló comida. Elfos aguantan mejor (caza), orcos peor.
- La IA **anticipa**: en otoño prioriza almacenar comida.
- **Guardado de partida automático** para poder cerrar y seguir otro día `[CERRADO]`.

---

## 10. Recursos, trabajo y economía

### 10.1 Recursos `[CERRADO]`
**Comida** (cultivo, caza, pesca), **madera** (bosque), **piedra y metal** (montaña), **oro** (minas raras, comercio, tributos, saqueo; no se obtiene con un oficio normal).

### 10.2 Nodos de recurso con reposición `[CERRADO]`
- Cada casilla/grupo de recurso es un **nodo** con `cantidad_actual` y `cantidad_máxima`.
- Un trabajador presente en el nodo **extrae 1 unidad cada X ticks** (menos ticks si es más hábil).
- Si llega a 0, el nodo queda **agotado**.
- **Reposición:** cada nodo recupera 1 unidad cada **N ticks**, según tipo `[PROPUESTO]`: pradera/campo rápido, bosque medio, mineral lento, oro casi nada.
- **Puntos calientes:** nodos ricos repartidos de forma desigual (manchas de abundancia). Si un bosque se agota hay que ir al del vecino → **conflicto**.
- **Feedback visual:** el color del símbolo se apaga según lo que queda (árbol verde brillante → verde apagado → tocón marrón).
- La IA elige nodo por **cercanía, cantidad restante y peligro**.
- La **caza migra** y los **campos producen por temporada** `[PROPUESTO]`.

### 10.3 Ciclo de trabajo y transporte `[CERRADO]`
Ciclo de estados: **ir al nodo → extraer hasta llenar inventario → ir al almacén → descargar → repetir.**
- Capacidad de carga limitada (≈5 unidades; más para los fuertes) `[PROPUESTO]`.
- Almacén más cercano elegido por el propio personaje; sin almacén, la carga va al salón.
- **Emboscadas:** si un enemigo mata a un cargado, la carga cae al suelo y la recoge quien llegue primero. Motor natural de raids pequeñas.
- Orden de implementación recomendado: un trabajador solo → varios → peligro.

### 10.4 Habilidades `[CERRADO]`
- Niveles por oficio, con experiencia que se gana trabajando. A más nivel, menos ticks por unidad. **Con tope.**
- La raza da bonus inicial; los rasgos modifican el aprendizaje (perezoso lento, obsesivo rápido).
- Los ancianos pierden rendimiento físico pero mantienen/ganan diplomacia.

### 10.5 Consumo `[CERRADO]`
Cada persona **consume comida cada tick** (más en invierno). Crecer exige más campos.

---

## 11. Edificios

### 11.1 Aspecto `[CERRADO]`
Los edificios tienen **forma** (varias casillas con paredes, suelo y puerta), no son iconos sueltos. Se **construyen por fases**: aparece el plano (`░`) y los trabajadores lo levantan. Los personajes **entran y salen** por la puerta.

```
Casa 3x3     Salón del rey 7x5
###          #######
#.+          #.....#
###          #..☻..+
             #.....#
             #######
```

- Mismo estilo para todas las razas de momento. Estilos propios por raza (piedra/enanos, madera/elfos, empalizada/orcos, castillo/humanos): `[FUTURO]`.
- Con mapa 64x64, tamaños pequeños: salón 7x5, casas 3x3 `[PROPUESTO]`.
- **El castillo/salón incluye una mazmorra** para prisioneros `[CERRADO]`.

### 11.2 Costes `[PROPUESTO]` (valores de partida, ajustables en `config`)
| Edificio | Coste | Función |
|---|---|---|
| Salón del rey | Gratis (inicial) | Origen del bando, primeros huecos, mazmorra |
| Casa 3x3 | 10 madera + 5 piedra | +5 huecos de población |
| Almacén | 8 madera | Depósito de lo recolectado |
| Campo de cultivo | 5 madera | Comida estable por temporada |
| Empalizada (por casilla) | 2 madera | Defensa básica |
| Muro de piedra (por casilla) | 3 piedra | Defensa fuerte |
| Torre de vigilancia | 10 madera + 10 piedra | Detecta raids |
| Cuartel | 15 madera + 15 piedra | Guardias y soldados más fuertes |
| Forja | 15 piedra + 10 metal | Armas y armaduras |
| Mercado | 20 madera + 10 oro | Comercio y pactos comerciales |

---

## 12. Combate

### 12.1 Filosofía `[CERRADO]`
Se diseña **desde el principio con partes del cuerpo, armas y armaduras como datos**, pero con una **versión mínima activa**. Pasar a un sistema tipo Dwarf Fortress será **añadir reglas, no rehacer la estructura**.

### 12.2 Versión 1 (activa) `[CERRADO]`
- Combate **por ticks, cuerpo a cuerpo**: dos enemigos adyacentes hacen un intercambio por tick.
- Cada ataque: **probabilidad de acierto** (habilidad de combate atacante vs. defensor) y **daño** (fuerza + arma).
- Cada personaje tiene **vida total** y un **estado de salud**: sano → herido (rinde menos) → grave (huye o cae) → muerto.
- Los **heridos huyen** a casa o hacia un guardia y **se curan descansando** (más rápido en casa).
- **Rasgos:** el cobarde huye antes; el valiente aguanta más.
- **Guardias** llevan arma básica; **trabajadores** casi nada y **huyen** en vez de pelear.

### 12.3 Estructura preparada para el futuro (datos presentes, lógica mínima) `[CERRADO]`
1. **Cuerpo como lista de partes:** `cabeza, torso, brazo izq., brazo der., pierna izq., pierna der.`, cada una con su vida. En v1 solo cuenta la suma; después, una parte puede quedar "perdida" (mano/brazo/pierna cortada) y limitar acciones.
2. **Armas como objetos:** material, tipo de daño (corte, punzante, contundente), peso, alcance. En v1 solo "arma básica" y "sin arma", pero el combate ya consulta las propiedades.
3. **Armaduras por parte del cuerpo:** objeto con material y capas (cuero, hierro...). En v1 vacío.
4. **El ataque apunta a una parte** elegida al azar con probabilidades. En v1 el daño se suma al total.
5. **Heridas como lista de eventos** ("corte en brazo izq."). En v1 se usan para el log, la ficha y los recuerdos/rencores.

### 12.4 Futuro `[FUTURO]`
Sistema completo de armaduras y armas por materiales; daño localizado, amputaciones, hemorragias, infecciones; curandero como oficio.

### 12.5 Curación y muerte `[CERRADO]`
- Curación: **solo descanso** de momento.
- **Cadáveres:** se quedan en el suelo un tiempo y luego desaparecen.
- **Libro de difuntos** consultable: quién murió, **cuándo, cómo y a qué edad**.

### 12.6 Prisioneros `[CERRADO]`
- Se **encierran en la mazmorra** del castillo del captor.
- Se pueden **intercambiar** (negociación) o **ejecutar**.

---

## 13. Raids y ejército `[CERRADO]`

- **El rey es el comandante del ejército** y decide cuándo, a quién y con cuántos atacar. Su personalidad influye.
- **El ejército** lo forman guardias y adultos reclutados con armas. Los trabajadores solo se reclutan en emergencia.
- **Fases:** preparación (reunión, armas, comida) → marcha → ataque → saqueo → retirada.
- **Riesgo para el rey `[CERRADO]`:** si el rey va, la raid es potente pero se juega la partida. Va en raids grandes o decisivas (según personalidad); en las demás delega en el guardia más veterano. Esa es la **balanza de riesgo** central del juego.
- **Defensa:** al ser atacados, el ejército se reúne en la zona amenazada y los trabajadores se refugian.
- **Si el ejército sale, el bando queda indefenso** → contraataques y emboscadas posibles.
- Objetivos de raid: recursos, saqueo, **capturar** al heredero/regente/rey, vengar rencores.

---

## 14. Diplomacia `[CERRADO]` (detalle `[PROPUESTO]`)

Entre los dos bandos:
- **Pacto de no agresión** con duración.
- **Comercio** (requiere mercado) y **tributo**.
- **Treguas** tras una guerra.
- **Traición:** romper un pacto da **mala fama** (relaciones peores, rencores).
- **Intercambio de prisioneros** y **rescates**.

### 14.1 Matrimonio entre bandos `[CERRADO]`
- **Evento raro y especial**, de probabilidad baja.
- Solo con **pacto activo** y **buena relación** entre bandos.
- Efecto: el pacto se alarga y romperlo cuesta mucho más.
- La pareja **se va a vivir al otro bando** (casi un rehén). Sus hijos pertenecen al bando donde viven.

### 14.2 Alianzas
En un 1vs1 no hay alianza entre rivales; las alianzas contra un **enemigo común** (facciones neutrales) sí son posibles.

---

## 15. Facciones neutrales y eventos aleatorios `[CERRADO]`

Siempre activos de momento (se podrán desactivar desde el menú en el futuro).
- **Neutrales/amenazas:** bandidos, monstruos, lobos, quizá una aldea neutral.
- **Eventos aleatorios:** sequía, plaga/enfermedad, buena cosecha, mercader ambulante.
- Dan motivos de alianza temporal, presión extra y variedad.

---

## 16. Interfaz

### 16.1 Pantalla principal `[CERRADO]`
- **Mapa** central (vista cenital ASCII).
- **Log por bando:** un cuadro por cada bando, en español.
- Indicadores: año, estación, velocidad, población de cada bando.
- **Panel de línea de sucesión** de cada rey.
- Acceso al **libro de difuntos**.
- Controles de **velocidad/pausa**.

### 16.2 Log: tono mixto `[CERRADO]`
Generado por **plantillas** con huecos (`{nombre}`, `{lugar}`...), varias variantes por evento.
- **Eventos normales** (comer, trabajar, patrullar): frase corta y seca.
  - Ejemplo: `Grok ataca a Dwin junto al río.`
- **Eventos importantes** (boda, traición, muerte del rey, pacto roto): frase narrativa, **color destacado**.
  - Ejemplo: `Grok, sediento de venganza, se lanza sobre Dwin junto al río.`
- **Concordancia de género** en español mediante marcas en las plantillas (el enano/la enana, muerto/muerta).
- **Colores por tipo de evento** para leer de un vistazo.

### 16.3 Ventanas flotantes `[CERRADO]`
Ver 6.3 (ficha de personaje con árbol genealógico, arrastrable, con aspa, varias a la vez).

### 16.4 Botón "Nuke the map" `[CERRADO]`
- Texto/botón **discreto en una esquina** (para no pulsarlo sin querer).
- Sirve para **terminar la partida y crear una nueva**.
- **Confirmación obligatoria:** mantener pulsado ~2 segundos o confirmar, para no perder partidas largas por un clic.

---

## 17. Menú previo a la partida `[CERRADO]`

Menú pequeño y simple con:
1. **Tamaño del mapa** (por defecto 64x64, hasta 200x200 o más)
2. **Razas** (elegir 2 de 4)
3. **Velocidad del tick** (1 min, 10 s, 1 s...)
4. **Ticks por año** (por defecto 100)
5. **Semilla del mapa** (para repetir uno que guste; vacía = aleatoria)
6. **Paleta de colores**

---

## 18. Gráficos `[CERRADO]`

- **ASCII estilo Dwarf Fortress (CP437)** dibujado en canvas, con **paletas de colores intercambiables** (clásica, oscura, tonos tierra...).
- **Capa gráfica totalmente separada** (módulo `render`) para poder sustituirla por un **tileset** más adelante cambiando solo la imagen y el mapeo símbolo→tile.
- Tilesets candidatos (libres de derechos): packs **CC0** (Kenney.nl, OpenGameArt). Los tilesets de la comunidad de Dwarf Fortress tienen licencias propias: **comprobar cada uno** antes de usarlo. `[FUTURO]`

---

## 19. Guardado `[CERRADO]` (detalle `[PROPUESTO]`)

- **Guardado automático** periódico en el navegador (`localStorage` o `IndexedDB` si el tamaño lo exige).
- Cargar la partida al abrir si existe.
- El estado completo debe poder reconstruirse (semilla + estado de simulación).
- Aviso si se va a sobrescribir una partida (relacionado con el botón "Nuke").

---

## 20. Hoja de ruta por fases `[PROPUESTO]`

Cada fase debe quedar **funcionando y comprobada** antes de pasar a la siguiente.

| Fase | Contenido | Resultado visible |
|---|---|---|
| **1. Base** | Menú previo, generador de mapa con semilla, render ASCII con paletas, bucle de ticks con velocidad y pausa | Un mapa bonito que se genera y se puede reiniciar |
| **2. Personajes y vida** | Creación de los 5 fundadores por bando, necesidades, movimiento con A*, ventana flotante de ficha | Personajes que se mueven, comen y descansan |
| **3. Economía** | Nodos con reposición, ciclo de trabajo y transporte, almacén, habilidades, consumo de comida | Trabajadores recolectando y llevando recursos |
| **4. Construcción y familia** | Edificios por fases, casas y huecos, cortejo, nacimientos, rasgos heredados, árbol genealógico, edades | La población crece y se ven familias |
| **5. Estaciones y eventos** | 4 estaciones, hambruna, eventos aleatorios, neutrales básicos, log mixto con plantillas | Mundo vivo con historias en el log |
| **6. Combate y muerte** | Combate v1 con cuerpo/armas como datos, heridas, huida, cadáveres, libro de difuntos | Primeras peleas y muertes |
| **7. Rey, sucesión y fin** | Línea de sucesión, regencia, fin de partida, panel de sucesión | Dinastías y la tensión del rey |
| **8. Guerra y diplomacia** | Ejército, raids, pactos, tributos, traiciones, prisioneros, mazmorra, matrimonio entre bandos | El corazón del juego completo |
| **9. Pulido** | Guardado automático, botón "Nuke", ajustes de equilibrio, rendimiento en mapas grandes | Versión 1 completa |

---

## 21. Ideas futuras `[FUTURO]`

- Sistema completo de **armaduras** (cuero, hierro...) y **armas** de varios materiales y tipos de daño.
- **Daño localizado** estilo DF: cortes, amputaciones, hemorragias, infecciones.
- **Curandero** como oficio y medicina.
- **Estilos de edificio por raza** (piedra, madera, empalizada, castillo).
- **Vidas distintas por raza** (humanos 100, enanos 130, elfos 200, orcos 70).
- **Híbridos/mestizos** entre razas.
- **Tileset gráfico** libre de derechos.
- **Entierro** de muertos como oficio y ambientación.
- Más de 2 bandos a la vez, **alianzas** reales entre varios.
- Opciones del menú para **desactivar neutrales y eventos**.
- **Religión, cultura, leyendas** y más profundidad narrativa.
- **Comercio avanzado** (precios, rutas) y economía más rica.
- **Exportar crónica** de la partida (resumen de la historia generada).

---

## 22. Valores a ajustar jugando

Todo lo marcado como `[PROPUESTO]` es ajustable. Los que más probablemente necesiten cambios:
- Ritmo de **reposición** de nodos y consumo de comida (equilibrio hambre/crecimiento).
- Duración de **embarazo y tiempo entre hijos** (que la población no explote ni se estanque).
- **Costes de edificios** y capacidad de carga.
- Probabilidades de **acierto y daño** del combate v1.
- **Frecuencia** de eventos aleatorios y matrimonios entre bandos.
- Tamaño de **edificios** respecto al mapa.

---

## 23. Preguntas abiertas `[ABIERTO]`

- Nombre definitivo del juego.
- Condiciones exactas de **cuándo un bando decide hacer una raid** (umbrales de escasez, ventaja militar, rencor).
- Reglas del **intercambio de prisioneros** (qué se ofrece, quién acepta).
- Si los neutrales **crecen o evolucionan** con el tiempo.
- Cómo se **comunica la mala fama** de un traidor (efecto numérico y visible).

---

## 24. Registro de cambios

| Fecha | Cambio |
|---|---|
| 2026-11-05 | Versión inicial del documento a partir de la sesión de diseño: concepto, mapa, razas, personajes, IA, familia y sucesión, tiempo y estaciones, recursos y nodos, edificios, combate, raids, diplomacia, interfaz, menú, hoja de ruta e ideas futuras. |
| 2026-11-05 | Fase 1 construida. Añadidos como `[PROPUESTO]`: módulos `azar` y `config`; carga con `<script>` normales y objeto global `Sim`; símbolos de vado, metal, oro y animales; velocidad de 0,2 s, botón "+1 tick" y espacio para pausar. Las zonas de inicio muestran el plano del salón y el rey como marcador hasta la Fase 2. |

> **Al modificar el diseño:** edita la sección correspondiente, ajusta las etiquetas de estado y añade una fila aquí con la fecha y un resumen breve.
