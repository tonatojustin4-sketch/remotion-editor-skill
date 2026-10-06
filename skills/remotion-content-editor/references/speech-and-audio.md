# Voz, transcripción y sincronización

## Transcripción local

Primero identifica herramientas disponibles y sistema operativo. No envíes grabaciones a un servicio externo sin que esté autorizado dentro del encargo.

El helper `scripts/transcribe.py` usa Python 3, FFmpeg y uno de estos motores instalados dentro de un entorno local del proyecto:

```sh
python3 -m venv .venv-edicion
```

En un Mac Apple Silicon con Metal disponible:

```sh
.venv-edicion/bin/python -m pip install mlx-whisper
.venv-edicion/bin/python /ruta/a/la/skill/scripts/transcribe.py --root . --engine mlx --model small --language es --out analisis/transcripciones
```

Como alternativa local con CPU compatible:

```sh
.venv-edicion/bin/python -m pip install openai-whisper
.venv-edicion/bin/python /ruta/a/la/skill/scripts/transcribe.py --root . --engine whisper --model small --language es --out analisis/transcripciones
```

Selecciona el idioma real; `es` es solo el ejemplo. Los modelos requieren descarga la primera vez. El helper sitúa la caché en el directorio de análisis, no en una ruta personal fija. Transcribe cada clip con tiempos de palabras y mantiene JSON originales. Puedes pasar varios `--file` para restringir las fuentes.

MLX puede fallar si el entorno no permite GPU/Metal. Intenta acceso permitido o cambia de motor; no repitas el mismo fallo sin cambiar condiciones. Algunos entornos necesitan aprobación para descargar dependencias o usar GPU. Si falta una herramienta imprescindible, informa de la limitación y continúa lo que sí pueda completarse sin inventar subtítulos.

## Corrección editorial y offsets

Conserva la transcripción automática separada de la corregida. Contrasta nombres de empresas, plataformas y términos especializados con imagen, audio o contexto. Nunca reescribas la voz. Los signos de interrogación pueden corregirse editorialmente, pero los cambios de palabra requieren sustento.

Representa captions con `text`, `startMs`, `endMs`, `timestampMs` y `confidence` compatibles con `@remotion/captions`. Convierte el tiempo de fuente al de la edición:

`tiempoFinal = inicioClipEnTimeline + tiempoPalabraEnFuente - recorteInicial`

Si se elimina una pausa interna, utiliza intervalos de edición separados y recalcula los offsets. No reutilices tiempos de un montaje anterior después de cortar. Redondea de forma consistente con los FPS y revisa límites de clips.

Guarda una timeline común para clips, palabras y gráficos. Forma frases naturales de aproximadamente 3–7 palabras, respetando nombres y pausas; valida que ninguna palabra desaparezca o se duplique. Mantén una copia SRT cuando sea útil.

## Preparación de medios y audio

Conserva archivos originales. Para HEVC o material grande, crea copias H.264 de trabajo con la resolución final adecuada y `yuv420p`. Corrige orientación y aspecto sin deformar. Usa FFmpeg sin shell interpolation para rutas que contienen espacios.

Ejemplo de tratamiento moderado cuando la voz lo necesite: filtro de graves alrededor de 70 Hz y normalización cercana a -16 LUFS con pico máximo -1,5 dBTP. Son puntos iniciales, no filtros obligatorios. Un `loudnorm` en dos pasadas ofrece niveles más previsibles que una sola; escucha y mide el resultado. Evita eliminar frecuencias útiles o comprimir ruido.

Recorta silencios reales, no consonantes suaves ni respiraciones naturales. Guarda márgenes pequeños en los límites de voz. Equilibra tomas y revisa que no existan clicks en las uniones.

Música disponible y adecuada: secundaria, con ducking cuando corresponda y fades. No inventes licencias ni descargues canciones al azar. SFX: pocos, suaves y ligados a acciones visuales. No cambies la voz ni agregues locución nueva sin que lo pida el usuario.

## Revisión

Comprueba sincronización en frases cortas y largas, junto a cada corte y al final. Mide clipping y continuidad. Una transcripción correcta no demuestra por sí sola que la exportación suene bien. Diferencia lo observado, lo medido y lo no escuchado.
