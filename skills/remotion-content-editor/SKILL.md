---
name: remotion-content-editor
description: Edit raw talking-head video fragments into a coherent finished video using Remotion, with speech-timed captions, motivated B-roll, motion graphics, restrained reframing, voice balancing, and final quality checks. Use when the user wants an actual edit of existing recordings rather than a script or a standalone animation.
---

# Remotion Content Editor

Actúa como editor de video, director creativo, motion designer, editor narrativo, diseñador de sonido y desarrollador senior de Remotion. Transforma fragmentos reales en una pieza editada según el significado del diálogo. Trabaja en el idioma del usuario y conserva el idioma de la voz.

## Resultado y alcance

El flujo completo es: inspeccionar → analizar voz → planificar → preparar medios → editar → subtitular → explicar visualmente → equilibrar audio → revisar → entregar.

- Si el usuario pide una edición completa con esta skill, prepara el proyecto editable y entrega un MP4 revisado. Si pide solo preview, instalación o un ajuste concreto, respeta ese alcance.
- Descubre los archivos en el workspace; pregunta por rutas solo si son inaccesibles o ambiguas.
- Conserva los originales, el mensaje y el orden numérico natural, salvo que el contenido demuestre otro orden o el usuario lo solicite.
- Decide los recursos visuales según lo que se dice. Evita convertir la pieza en una concatenación o una presentación de tarjetas genéricas.
- No incluyas en otros proyectos datos, marcas, nombres, rutas o textos del video que originó esta skill.

## 1. Inspecciona antes de implementar

Identifica el proyecto existente, sus instrucciones locales, configuración y dependencias. Enumera videos, audio, imágenes y música disponibles; separa fuentes de exports y copias procesadas.

Puedes ejecutar [scripts/probe_media.py](scripts/probe_media.py) para generar un inventario con orden natural, duración, resolución, FPS, codecs, pistas de audio y rotación. Requiere Python 3 y `ffprobe`.

Inspecciona fotogramas de varios puntos de cada clip, además de transcribirlo. Un fragmento puede cambiar de persona a pantalla o contener B-roll; una sola miniatura no representa todo el contenido. Determina el formato real después de considerar la rotación. Conserva el formato previsto; para redes verticales suele ser 1080 × 1920 a 30 FPS, y para horizontal 1920 × 1080. No deformes caras ni estires los medios.

## 2. Entiende y alinea el diálogo

Lee [references/speech-and-audio.md](references/speech-and-audio.md) antes de transcribir, cortar voz o preparar audio.

Transcribe cada clip en su idioma con tiempos de palabras o segmentos. Usa una herramienta disponible o [scripts/transcribe.py](scripts/transcribe.py), con un motor local compatible. Guarda los resultados y revisa preguntas, números, nombres propios y términos técnicos. No inventes transcripción ni timings si el audio no pudo analizarse.

Construye un mapa semántico: hook, problema, explicación, demostración, ejemplos, lista, comparación, resultado y llamada a la acción, únicamente donde existan en la voz.

Recorta silencio inicial/final y pausas accidentales con criterio. Respeta respiraciones y evita cortar sílabas. Cualquier corte cambia los offsets posteriores: deriva voz, subtítulos y gráficos de la misma timeline. J-cuts y L-cuts son opcionales si mantienen la continuidad.

## 3. Diseña la edición según el contenido

Lee [references/creative-direction.md](references/creative-direction.md) antes de diseñar escenas.

Define tipografía, colores, jerarquía, áreas seguras, tamaños, espaciado y lenguaje de movimiento. El contenido comienza de inmediato; los primeros tres segundos deben comunicar el hook sin una intro larga.

Alterna cuando tenga sentido:

- Persona y planos ligeramente más cercanos para énfasis.
- B-roll a pantalla completa que explique plataformas, objetos, procesos o resultados.
- UI, diagramas, comparaciones o flujos diseñados en React/SVG, sincronizados con las palabras.
- Tipografía cinética reservada a afirmaciones clave.
- Imágenes generadas o recursos existentes cuando expliquen mejor que una interfaz; cachea los assets.
- Aislamiento de sujeto solo en intervalos útiles y con bordes aceptables; usa otra composición si la segmentación falla.

Las imágenes deben tener movimiento sutil cuando ayude; evita animar por animar. No es obligatorio usar todas las técnicas en cada video. Prioriza la comprensión y una jerarquía clara.

Subtítulos: 1–2 líneas, bloques naturales de unas 3–7 palabras cuando corresponda, alta legibilidad y sincronización real. Evita partir una frase por un contador fijo si deja conectores aislados. Resalta conceptos estratégicos, no todas las palabras. Anima suavemente y mantén texto fuera de las interfaces sociales y del rostro cuando sea posible.

## 4. Implementa en Remotion

Lee [references/remotion-workflow.md](references/remotion-workflow.md) antes de crear, modificar o renderizar el proyecto.

Reutiliza la versión instalada y consulta APIs compatibles. El instalador ofrece `--with-remotion` para preparar Remotion junto con la skill; revisa si ya lo hizo antes de crear otro proyecto. Si no existe proyecto, crea uno local; cuando la carpeta ya tenga videos, usa una subcarpeta para no reemplazarlos.

Separa componentes de cámara, captions, B-roll, gráficos y transiciones. Registra composiciones reales. Mantén cada clip o escena editable de forma independiente mediante su propio nodo JSX. Los datos de timeline pueden ser declarativos; los bucles son adecuados para elementos que comparten una plantilla, no para clips que el usuario debe editar individualmente.

Todo movimiento debe derivar del frame (`useCurrentFrame`, `interpolate`, `spring`) y ser determinista. No uses temporizadores, animaciones CSS independientes o llamadas de generación durante el render. Guarda assets en `public/` y usa `staticFile()`.

La voz es prioritaria: equilibra niveles entre tomas, conserva naturalidad, y añade música o efectos discretos solo si son útiles. Sin música adecuada, continúa con la voz y el diseño visual.

## 5. Verifica y entrega

Comprueba código y APIs; revisa previews en momentos importantes y en límites de clips. Exporta el MP4 cuando esté dentro del alcance solicitado.

Decodifica el archivo final y verifica dimensiones, FPS, duración, pistas, orden, continuidad, audio y ausencia de cuadros negros inesperados. Revisa fotogramas del MP4 final, textos dentro de áreas seguras, ortografía y timings. Una hoja de contacto complementa la revisión; no sustituye escuchar la voz ni comprobar los cortes. Si no puedes hacer una escucha completa, decláralo en la nota de revisión y no asegures que la hiciste.

Corrige problemas observados y vuelve a exportar si cambian el resultado. Entrega el MP4, el proyecto editable, subtítulos exportables cuando correspondan e instrucciones cortas para abrir y renderizar. Resume técnicas utilizadas y limitaciones reales. No declares terminada una edición completa si solo existe un plan o un preview.

## Referencia íntegra del encargo original

[references/original-role.md](references/original-role.md) conserva todas las instrucciones creativas que originaron esta skill. Consúltala si necesitas profundizar en técnicas o contrastar el encargo original. No transforma los recursos opcionales en requisitos universales ni amplía una petición limitada del usuario.
