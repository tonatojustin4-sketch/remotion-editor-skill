# Proyecto y render de Remotion

## Inspección y setup

El instalador de esta skill acepta `--with-remotion` para crear `edicion-remotion/` con el scaffolder oficial e instalar sus dependencias, o reutilizar Remotion existente. `--remotion-dir` cambia la carpeta. Si la skill ya está instalada, volver a ejecutarlo con `--with-remotion` también funciona. Inspecciona ese proyecto antes de instalar otro.

Lee `package.json`, configuración, fuentes e instrucciones locales. Reutiliza el proyecto y la versión instalada. Consulta la documentación oficial para APIs dudosas o que hayan cambiado; no copies una API de otra versión sin comprobarla.

Si solo hay fuentes de video en la carpeta, crea una subcarpeta. Ejemplo:

```sh
npx create-video@latest --yes --blank --no-tailwind edicion-remotion
```

El scaffolder puede instalar dependencias; revisa el resultado y ejecuta `npm install` dentro de esa carpeta si hace falta. Añade paquetes Remotion con `npx remotion add` para mantener compatibilidad. Guarda el lockfile.

La skill es independiente de otras skills instaladas. Si el entorno ofrece documentación o skills de Remotion, úsalas; si no, consulta https://www.remotion.dev/docs. No exige HyperFrames ni cambia el framework elegido.

## Estructura y sincronización

Adapta al repo. Una estructura útil: `src/components`, `src/data`, `public/raw`, `public/processed`, `public/generated`, `public/audio`, `output` y `scripts`. No copies archivos pesados innecesariamente ni publiques medios privados como parte de la skill.

Usa `Composition` con duración, FPS y dimensiones del montaje real. Cada clip o escena editable necesita su propio JSX. `Sequence` permite tiempos absolutos; `Series` ajusta secuencias consecutivas; las transiciones requieren calcular solapamientos. Datos declarativos para captions y gráficos son válidos.

Para medios, elige componentes disponibles en la versión instalada, como `OffthreadVideo` o `Video` de `@remotion/media`; comprueba cómo interpretan recortes y duración. Usa `staticFile()` para assets locales. Asegura que los clips servidos son reproducibles por el navegador y el renderer.

Todas las animaciones derivan del frame. Evita `Date.now()`, timers, estado dependiente de playback, CSS animation y random sin semilla. Preprocesa tareas caras; no segmentes ni generes imágenes por frame.

Sincroniza recursos con frases existentes, no con segundos repartidos uniformemente. El montaje final no debe tener gaps visuales involuntarios ni offsets acumulados por solapamientos de audio.

## Preview y exportación

Arranca el Studio sin abrir automáticamente un navegador del sistema:

```sh
npx remotion studio --no-open
```

Abre la URL exacta publicada por el proceso en la interfaz disponible. Si hay un límite de watchers, considera `--webpack-poll 1000`. Si el sandbox impide puertos o Chromium, usa los mecanismos permitidos del entorno; no supongas que todos los puertos están realmente ocupados.

Para exportar, sustituye el ID por el que realmente existe:

```sh
npx remotion render src/index.ts MiVideo output/video-final.mp4 --codec=h264 --crf=18
```

La concurrencia se ajusta a RAM y CPU; empezar con 2 es razonable para video pesado. Descarga el navegador de Remotion solo cuando sea necesario. Usa imágenes de prueba para comprobar tipos de escenas y límites de clips antes del render completo.

## Verificación de la entrega

Ejecuta checks del proyecto que correspondan. Comprueba con `ffprobe` duración, resolución, FPS y pistas. Decodifica todo el MP4 con FFmpeg; inspecciona cuadros negros inesperados, congelados y artefactos. Los detectores automáticos pueden señalar pantallas negras o quietas intencionales; revisa cada hallazgo.

Revisa imágenes del resultado y escucha intervalos de cortes, énfasis y cierre si el entorno lo permite. Una hoja de contacto sirve para visión global; un still previo no demuestra que el MP4 final sea correcto. No afirmes revisión íntegra si solo muestreaste.

Entrega el MP4 completo y el proyecto editable, además de un README de uso y una nota breve con verificaciones y limitaciones. Las dependencias y licencias de Remotion y de medios siguen siendo independientes de la licencia de esta skill.
