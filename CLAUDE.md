# Instrucciones para Claude

1. **DISENO.md manda.** Es la fuente de verdad del proyecto. Léelo entero antes de programar. Si el código y DISENO.md se contradicen, gana DISENO.md (o se pregunta al usuario y se corrige uno de los dos).
2. **Cambios de diseño, primero en DISENO.md.** Cualquier cambio de diseño se anota antes en la sección afectada de DISENO.md y en su registro de cambios (sección 24), y solo después se toca el código. Las decisiones nuevas de la IA se marcan como `[PROPUESTO]`.
3. **Todo en español:** textos del juego, interfaz, log, nombres de módulos y comentarios.
4. **Sin datos personales del usuario** (nombre, usuario, correo, contraseñas, enlaces a chats) en código, comentarios, commits ni archivos. Los commits son **anónimos**: sin nombre ni correo del usuario y sin enlaces a sesiones o chats.
5. El usuario no programa: explica los cambios en español sencillo, breve y sin jerga.

## Estructura técnica
- HTML + JavaScript puro, sin librerías ni servidor. Se abre con `index.html`.
- Un archivo por módulo en `js/` (ver DISENO.md 3.2). Se cargan con `<script>` normales (no módulos ES) para que funcione abriendo el archivo con doble clic. Todos cuelgan del objeto global `Sim`.
- Números ajustables en `js/config.js`. Azar siempre con `Sim.azar` (con semilla), nunca `Math.random`.
- La simulación nunca depende de `render`.
