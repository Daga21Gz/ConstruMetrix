# 🎯 GUÍA RÁPIDA - CONSTRUMETRIX v2.0

## 🚀 ACCESO LOCAL

Abre tu navegador y ve a:
```
http://localhost:8000/
```

---

## 📱 INSTALAR COMO APP (PWA)

### Opción 1: Banner Automático
1. Espera 5 segundos
2. Aparecerá un banner morado abajo a la derecha
3. Click en **"Instalar Ahora"**
4. ✅ ¡Listo! Ya tienes la app instalada

### Opción 2: Manual (Chrome/Edge)
1. Busca el ícono ⊕ en la barra de direcciones
2. Click → "Instalar CONSTRUMETRIX"
3. Ahora puedes abrirla desde tu escritorio/menú

### Opción 3: Mobile
1. Menú (⋮) → "Agregar a pantalla de inicio"
2. ✅ Aparecerá como app en tu móvil

---

## 📊 EXPORTAR A EXCEL

1. Agrega ítems a tu presupuesto
2. Configura región, área, calidad, etc.
3. Click en el botón verde **"EXCEL"** (barra superior)
4. Se descarga automáticamente: `CONSTRUMETRIX_Presupuesto_[timestamp].xlsx`

### ¿Qué contiene el Excel?
- **Hoja 1**: Presupuesto completo con todos los ítems
- **Hoja 2**: Análisis agrupado por capítulos
- Metadata del proyecto
- Resumen financiero (CRN, AIU, Avalúo)

---

## 💾 GUARDAR PLANTILLAS

### Guardar
1. Configura tu presupuesto completo
   - Selecciona región
   - Ajusta área, altura, estrato
   - Agrega todos los ítems necesarios
2. Click en **"GUARDAR"** (botón azul con 💾)
3. Escribe un nombre descriptivo:
   - Ejemplo: "Casa 80m² Estrato 3 - Bogotá"
4. ✅ Guardado en tu navegador

### Cargar
1. Click en **"CARGAR"** (botón morado con 📁)
2. Se abre un modal con todas tus plantillas
3. Verás:
   - 📅 Fecha de creación
   - 🛒 Cantidad de ítems
   - 💰 Valor total
4. Click en **"Cargar"** en la plantilla deseada
5. ✅ Todos los datos se restauran automáticamente

### Eliminar Plantilla
1. Abre el modal de plantillas (CARGAR)
2. Click en el botón rojo 🗑️
3. Confirma
4. ✅ Eliminada

---

## 🎨 NUEVAS ANIMACIONES

### Efectos Visuales que Verás:
- **Cards**: Efecto de brillo al pasar el mouse
- **Botones**: Onda al hacer click
- **Números**: Animación "pop" al actualizarse
- **Modales**: Entrada suave desde abajo
- **Pestañas**: Transición fade al cambiar
- **Badges**: Pulso en elementos importantes

### Tips de Navegación:
- Todos los elementos interactivos tienen hover
- Los focus states son visibles (teclado-friendly)
- Las transiciones son suaves (0.3-0.6s)

---

## 🔄 MODO OFFLINE

### ¿Cómo funciona?
1. Instala la PWA (ver arriba)
2. La primera vez que abras, se cachean todos los archivos
3. **Desconéctate de Internet**
4. Abre la app instalada
5. ✅ Funciona perfectamente, sin conexión

### ¿Qué funciona offline?
- ✅ Toda la interfaz
- ✅ Datos de ítems de construcción
- ✅ Calculadora de presupuestos
- ✅ Exportar a Excel
- ✅ Guardar/cargar plantillas
- ❌ CDN resources (se cargan de caché si ya los habías usado)

---

## 🎯 FLUJO RECOMENDADO

### Para un proyecto nuevo:
1. **Configurar parámetros básicos:**
   - 📍 Región → Centro/Norte/Sur
   - 📏 Área m² → Ejemplo: 80
   - 📐 Altura promedio → Ejemplo: 2.5
   - 🏠 Estrato → Ejemplo: 3

2. **Ajustar calidad:**
   - Slider "Estándar de Calidad"
   - Económico (0.8) / Estándar (1.0) / Premium (1.2) / Lujo (1.5)

3. **Seleccionar modelo (opcional):**
   - Desplegable "Modelos Constructivos"
   - Ej: "01.100 - Casa Unifamiliar 1 piso"
   - Esto pre-carga ítems comunes

4. **Agregar ítems manualmente:**
   - Buscar en la barra superior
   - O filtrar por capítulos (sidebar izquierdo)
   - Click en tarjeta → Se agrega al presupuesto

5. **Revisar presupuesto:**
   - Panel derecho → Pestaña "Presupuesto"
   - Ajustar cantidades
   - Ver totales en tiempo real

6. **Exportar:**
   - 📄 PDF para presentación al cliente
   - 📊 EXCEL para edición/análisis detallado

7. **Guardar plantilla:**
   - 💾 GUARDAR → Reutilizar en futuros proyectos similares

---

## 🆕 BOTONES EN LA INTERFAZ

### Barra Superior (Toolbar):
```
🔍 [Buscar...]   | ⚡ Modo Edición | 📄 PDF | 📊 EXCEL | 💾 GUARDAR | 📁 CARGAR
```

### Panel Derecho:
```
📋 Presupuesto | 📊 Análisis
```

### Sidebar Izquierdo:
```
🎚️ Control de Calidad
🗂️ Modelos Constructivos
📚 Capítulos APU
```

---

## 🐞 SOLUCIÓN DE PROBLEMAS

### "No funciona localhost:8000"
```bash
# Asegúrate de que el servidor esté corriendo:
python -m http.server 8000

# Luego abre: http://localhost:8000/
```

### "No veo el botón de instalar PWA"
- Solo funciona en HTTPS o localhost
- Espera 5 segundos para el banner automático
- O busca el ícono ⊕ en la barra de direcciones

### "Excel se descarga vacío"
- Asegúrate de tener ítems en el presupuesto
- Verifica que la biblioteca XLSX esté cargada (consola del navegador)

### "Plantilla no guarda"
- Las plantillas usan localStorage del navegador
- Si limpias caché/cookies, se borran
- Exporta a Excel como backup

---

## 💡 TIPS PRO

1. **Atajos de teclado:**
   - `Tab` → Navegar entre elementos
   - `Enter` → Activar botón/selección
   - `Esc` → Cerrar modales

2. **Plantillas inteligentes:**
   - Guarda una por tipo de proyecto
   - Ejemplo: "Base Casa 1 Piso", "Base Casa 2 Pisos"
   - Cárgala y solo ajusta lo específico

3. **Comparar presupuestos:**
   - Exporta a Excel
   - Abre en Google Sheets
   - Compara lado a lado

4. **Uso mobile:**
   - Funciona perfectamente en tablet
   - Ideal para inspecciones en obra
   - Modo offline = sin necesidad de datos

---

## 📞 SOPORTE

Si algo no funciona:
1. Abre consola del navegador (F12)
2. Busca errores en rojo
3. Toma screenshot
4. Revisa el archivo `CHANGELOG.md` para ver qué se implementó

---

*¡Disfruta CONSTRUMETRIX v2.0!*  
*Ahora con superpoderes 🚀*
