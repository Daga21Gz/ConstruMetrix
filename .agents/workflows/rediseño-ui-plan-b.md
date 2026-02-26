---
description: Rediseño Progresivo de UX/UI para ConstruMetrix (Plan B)
---

# Rediseño Progresivo UX/UI: ConstruMetrix SaaS Edition (Plan B)

Este flujo de trabajo detalla el Plan B de la transformación UX/UI, orientando la plataforma estática hacia una experiencia SaaS Moderna ("Enterprise Next-Gen"). Nos enfocaremos en modernizar la estructura de los formularios utilizando "Floating Labels" (etiquetas flotantes), reduciendo el espacio vertical y dando una apariencia super pulida, e implementando "Modales" si es necesario para flujos densos.

## Parte 1: Transformación a Floating Labels (Inputs)

// turbo
1. **Refactorización de Formularios en Sidebar (`index.html`)**
   - **Objetivo**: Limpiar el diseño de las cajas de entrada de texto tradicionales (`<label>` arriba del `<input>`) implementando el patrón "Floating Label" soportado nativamente por CSS/Tailwind (`peer`, `peer-focus`).
   - Identificar los campos numéricos y de texto en "Atributos Físicos" y "Valoración" (ej. Área Constr., Altura, Antigüedad, Vida Útil, Aviso, etc.).
   - Estilo meta de Floating Label:
     ```html
     <div class="relative w-full">
         <input type="text" id="baseArea" class="block w-full px-3 pb-2 pt-5 text-sm text-white bg-dark-card rounded-xl border border-dark-border appearance-none focus:outline-none focus:border-brand peer" placeholder=" " />
         <label for="baseArea" class="absolute text-[10px] uppercase font-bold text-gray-500 duration-300 transform -translate-y-3 scale-75 top-3.5 z-10 origin-[0] start-3 peer-focus:text-brand peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 pointer-events-none">Área Constr.</label>
     </div>
     ```

## Parte 2: Estructura SaaS y Espaciado (Layout)

// turbo
2. **Re-ingeniería del Sidebar y Accordions (`index.html`)**
   - **Objetivo**: Asegurar que los selectores y grupos del acordeón luzcan impecables.
   - Refinar el borde y color del `bg-dark-card` en inputs para que no compitan con el fondo general del sidebar.
   - Reemplazar `<label class="block">` envolvente por etiquetas `div.relative` que aíslen al Input + Label flotante.

## Parte 3: Elevando la Experiencia del Select

// turbo
3. **Optimización de Selects como Floating Labels**
   - **Objetivo**: Los `<select>` clásicos no soportan `peer-placeholder-shown` de la misma manera que los inputs, pero se pueden diseñar como floating labels estáticos (el label siempre arriba pequeño dentro del área de relleno) o mantener un diseño armónico de "Label Inline". 
   - Modificar las clases de los selects para coincidir visualmente con los Inputs: `pt-5 pb-2` con el label posicionado en modo absoluto o relativo de manera elegante.

## Parte 4: QA y Despliegue de la Rama

// turbo
4. **Verificación Visual**
   - Asegurarse de que el comportamiento al enfocar el botón o escribir un valor no solapa el label con el input.
   - Comprobar que en Firefox, Chrome y Safari de Windows el transform funcione fluido.

// turbo-all
5. **Commit y Control de Versiones**
   - Guardar los cambios bajo el commit: `feat(ui): implement UX redesign plan B - floating labels & SaaS layout`.
