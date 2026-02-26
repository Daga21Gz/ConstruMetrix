---
description: Rediseño Progresivo de UX/UI para ConstruMetrix (Plan A)
---

# Rediseño Progresivo UX/UI: ConstruMetrix Enterprise (Plan A)

Este flujo de trabajo detalla los pasos concretos, paso a paso, para implementar el Plan A propuesto por el `Designer Skill`. El objetivo es transformar la interfaz de ConstruMetrix actualizando tamaños de fuentes, mejorando legibilidad, limpiando ruidos visuales distractores (neones/glitches constantes) y puliendo la usabilidad sin romper la estética general. 

Todos los pasos deben ser ejecutados en orden consecutivo. Puedes utilizar la flag `// turbo-all` cuando lo creas pertinente, de lo contrario, sigue uno por uno confirmando la correcta ejecución.

## Parte 1: Tipografía y Accesibilidad 

// turbo
1. **Identificar y corregir micro-textos en `index.html`**
   - **Objetivo**: Subir todos los tamaños críticos abusivos (`text-[7px/8px/9px/10px]`) que rompen la accesibilidad.
   - Reemplazar regex de `text-\[7px\]` y `text-\[8px\]` por `text-xs` o `text-[11px]` (para mantener proporción chica pero legible).
   - Ajustar `text-[9px]` y `text-[10px]` progresivamente a `text-xs`. 
   - Utilizar la herramienta de `multi_replace_file_content` para impactar la sidebar y la HUD del visor GIS.

// turbo
2. **Refinar el "Tracking" y Pesos Tipográficos**
   - **Objetivo**: Si aumentamos el tamaño, debemos compensar el espacio y peso.
   - Bajar el peso en los headers y labels muy saturados (ej. `font-black` a `font-bold` en áreas no heroicas).
   - Mejorar o mantener el tracking (`tracking-wider`, `tracking-widest`) en los micro-labels ahora que son más grandes y legibles.

## Parte 2: Eliminación de Fatiga Visual y Ruidos 

// turbo
3. **Controlar Animaciones Innecesarias (`index.html`)**
   - **Objetivo**: Reservar los efectos de neón y destellos para eventos importantes (hover, active, alertas).
   - Eliminar de manera predeterminada clases como `animate-pulse`, `animate-ping`, `animate-[scan_2s_linear_infinite]` o brillos fijos de estado constante (como el `pulse-glow`).
   - Mover estas clases sólo hacia el pseudo-elemento `group-hover` u estados inyectados vía JS (cuando el usuario interactúa).

// turbo
4. **Armonizar Contrastes en el CSS (`elite-colors.css` / `index.html`)**
   - **Objetivo**: Reducir la dureza del `#050507` puro por un dark mode más relajante (`#0f172a` o afín) conservando la base *Enterprise*. 
   - Si se usan clases directas, reescribir `bg-dark-bg` u opacidades (`bg-[#050507]`) en la configuración de Tailwind del `<head>` para subir la luminosidad levemente (hacia un `#0F0F13` o `#0B0E14` neutro).
   - Suavizar sombras (`shadow-[0_0_80px_...]`).

## Parte 3: Usabilidad del Formulario y GIS HUD

// turbo
5. **Ajustar Inputs y Controles en la Sidebar (`index.html`)**
   - **Objetivo**: Dar respiro a los controles, evitando la sensación claustrofóbica.
   - Bajar ligeramente el amontonamiento en grids de formularios (aumentar `gap-2` a `gap-3`).
   - Aumentar minimamente el padding de `input` y `select` (de `py-2` a `py-2.5`).

// turbo
6. **Revisar Botones y Acciones del Mapa GIS (`style.css` o style tag)**
   - **Objetivo**: Seguir reglas UX claras donde lo que se cliquea debe parecer "cliqueable".
   - Confirmar que los botones tengan estados de `:hover` coherentes y no sólo un cambio de opacidad.
   - Asegurarse de que el `z-index` no bloquea elementos inferiores del mapa.

## Parte 4: Validación y QA Visual

// turbo
7. **Crear Checkpoint de Compilación y Servidor de Desarrollo**
   - Levantar/Comprobar el proyecto localmente y visualizar las pantallas.
   - Revisar que los modales y acordeones siguen respondiendo al clic y mostrando toda su información adecuadamente.
   - Verificar si la "Limpieza de Ruido Visual" hizo que sea más obvio y rápido operar el Formulario de la Barra Lateral.

// turbo-all
8. **Documentar y Commit**
   - Agregar cambios al control de versiones bajo un commit descriptivo: `feat(ui): implement UX redesign plan A - accessibility & visual noise reduction`.
