# Remotion Editor Skill

Convierte fragmentos de video en una edición completa con Remotion: análisis de voz, subtítulos sincronizados, B-roll, gráficos, acercamientos, tratamiento de audio y MP4 final. Incluye el rol completo que originó la habilidad y un flujo reutilizable para otros contenidos.

## Instalar en Codex

Desde la carpeta de tu proyecto:

```sh
npx --yes github:tonatojustin4-sketch/remotion-editor-skill
```

Instala `remotion-content-editor` en `.agents/skills/` del proyecto actual. Requiere Node.js 20 o superior, npm y Git. El instalador no tiene dependencias propias ni necesita una publicación en npm.

## Instalar la skill y Remotion juntos

Usa esta opción para dejar preparado también el editor local:

```sh
npx --yes github:tonatojustin4-sketch/remotion-editor-skill --with-remotion
```

Instala la skill y descarga el scaffolder oficial de Remotion para crear `edicion-remotion/` con sus dependencias. Si el proyecto actual o esa subcarpeta ya tienen Remotion instalado, los reutiliza. Conserva los videos originales y rechaza reemplazar una carpeta con otro contenido.

Puedes elegir otra carpeta:

```sh
npx --yes github:tonatojustin4-sketch/remotion-editor-skill --with-remotion --remotion-dir mi-video
```

Después abre el editor desde la carpeta de Remotion con `npx remotion studio --no-open`. El instalador muestra la carpeta elegida. Necesitas conexión para descargar Remotion y sus dependencias. La transcripción y FFmpeg se preparan después según el equipo y la edición solicitada.

Con `--global --with-remotion`, la skill queda disponible para todos tus proyectos y Remotion se prepara **en el proyecto actual**. Solo `--global` instala las instrucciones sin preparar un editor.

Para todos tus proyectos de Codex:

```sh
npx --yes github:tonatojustin4-sketch/remotion-editor-skill --global
```

Alternativa mediante el ecosistema abierto de skills:

```sh
npx skills add tonatojustin4-sketch/remotion-editor-skill --skill remotion-content-editor --agent codex -y
```

Esta sintaxis está documentada en [Vercel Skills](https://github.com/vercel-labs/skills). Puedes elegir otros agentes que ese instalador soporte; el flujo requiere archivos, terminal y herramientas de medios.

La instalación copia la skill. Con `--with-remotion` también instala Remotion; si no usas esa opción, el agente lo prepara al invocar la skill cuando haga falta. Remotion, FFmpeg y los motores de transcripción conservan sus propias licencias y requisitos.

## Usarla

Disponible en el próximo turno de Codex. Si no aparece, vuelve a abrir el proyecto. Coloca tus grabaciones en una carpeta y escribe:

```text
$remotion-content-editor
Edita los fragmentos de esta carpeta en su orden natural.
Conserva el mensaje, añade subtítulos, B-roll y gráficos donde ayuden.
Prepara el proyecto de Remotion y entrega el MP4 final revisado.
```

También puedes pedir solo preview, un cambio concreto o un formato distinto. La skill respeta ese alcance. No ejecuta una edición solo por instalarse.

## Qué incluye

- Instrucciones de editor, director creativo, motion designer y diseñador de sonido.
- El rol original completo, sin los videos ni datos privados del proyecto de origen.
- Criterios para cortes, hook, reencuadres, captions, UI, B-roll, imágenes, segmentación y transiciones.
- Helpers de inventario y transcripción local con caché y tiempos de palabras.
- Instrucciones de proyecto, preview, export y control de calidad en Remotion.
- Instalador que detecta versiones idénticas y conserva respaldo al actualizar explícitamente.

Los recursos opcionales se eligen por su utilidad. No se fuerzan música, imágenes generadas o recorte de sujeto en todos los videos.

## Instalar una copia local

```sh
node bin/install.mjs --project "/ruta/a/tu/proyecto"
```

Revisar el destino sin escribir:

```sh
node bin/install.mjs --dry-run
```

Actualizar una versión diferente con respaldo:

```sh
npx --yes github:tonatojustin4-sketch/remotion-editor-skill --force
```

Consulta `--help` para un destino personalizado. Para quitar la skill, elimina solo la carpeta `remotion-content-editor` del destino donde la instalaste; esto no elimina proyectos de video ni dependencias.

## Publicar el repositorio

Cuenta prevista: `tonatojustin4-sketch`. Nombre: `remotion-editor-skill`. Si cambian, actualiza los comandos de este README y `repository` en `package.json`.

Crea un repositorio público en GitHub y sube esta carpeta. No necesitas publicar en npm: `npx github:...` toma el paquete del repositorio. El comando funcionará una vez que exista y sea accesible.

La plantilla `automation/github-check.yml` permite validar la skill en Linux, macOS y Windows y generar un instalador `.tgz` en cada push o pull request. Para activarla, cópiala a `.github/workflows/check.yml` usando una conexión con permiso para workflows. El instalador por `npx` funciona sin activar Actions. Puedes generar el mismo paquete localmente:

```sh
npm run check
npm pack
```

El archivo generado se instala con:

```sh
npx --yes --package=./remotion-editor-skill-1.1.0.tgz remotion-editor-skill
```

Para fijar una versión desde GitHub, crea la etiqueta `v1.1.0` y usa `npx --yes github:tonatojustin4-sketch/remotion-editor-skill#v1.1.0`. Publicar etiquetas o paquetes npm es opcional y no ocurre automáticamente.

## Desarrollo

```sh
npm run check
```

Las pruebas no necesitan `npm install`, usan directorios temporales y no modifican tu instalación real de Codex. CI no descarga modelos ni renderiza videos; las pruebas de la opción Remotion simulan las llamadas a npm para no instalar dependencias de video en cada ejecución.

La estructura principal es `skills/remotion-content-editor/SKILL.md`, con `agents/`, `references/` y `scripts/`. El instalador está en `bin/install.mjs`. Licencia MIT para el código e instrucciones de esta distribución.
