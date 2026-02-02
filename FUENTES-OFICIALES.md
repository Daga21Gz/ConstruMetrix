# 📚 FUENTES OFICIALES COLOMBIANAS - CONSTRUMETRIX v2.0

## 🏛️ GUÍA DE FUENTES DE DATOS GUBERNAMENTALES

### Actualizado: Febrero 2026

Este documento detalla las fuentes oficiales integradas en CONSTRUMETRIX para garantizar:
- ✅ **Precisión** en avalúos comerciales
- ✅ **Cumplimiento normativo** según decretos vigentes
- ✅ **Transparencia** en cálculos de costos
- ✅ **Trazabilidad** de datos utilizados

---

## 🗂️ ÍNDICE

1. [IGAC - Instituto Geográfico Agustín Codazzi](#igac)
2. [DANE - Departamento de Estadística](#dane)
3. [Normativa Legal](#normativa)
4. [CAMACOL - Sector Privado](#camacol)
5. [Uso en CONSTRUMETRIX](#uso)

---

## 1️⃣ IGAC - INSTITUTO GEOGRÁFICO AGUSTÍN CODAZZI {#igac}

### 📌 Descripción
Entidad oficial del gobierno colombiano encargada del catastro nacional y la realización de avalúos.

### 🌐 Recursos Disponibles

#### A. Portal Principal
- **URL:** https://www.igac.gov.co/
- **Contenido:** Información catastral, avalúos de predios, mapas
- **Uso en CONSTRUMETRIX:** Consulta de valores catastrales por región

#### B. Subdirección de Avalúos
- **URL:** https://www.igac.gov.co/el-igac/areas-estrategicas/direccion-de-gestion-catastral/subdireccion-de-avaluos
- **Contenido:** Métodos técnicos para avalúos comerciales
- **Uso en CONSTRUMETRIX:** Base metodológica para cálculo de avalúos

**Métodos de Valoración IGAC:**
- Método Comparativo de Mercado
- Método de Costo de Reposición (usado en CONSTRUMETRIX)
- Método Residual
- Método de Capitalización de Rentas

#### C. Observatorio Inmobiliario Catastral (OIC)
- **URL:** https://www.igac.gov.co/el-igac/areas-estrategicas/direccion-de-investigacion-prospectiva/observatorio-inmobiliario-catastral
- **Contenido:** Estadísticas de transacciones, dinámicas de mercado
- **Actualización:** Mensual
- **Uso en CONSTRUMETRIX:** Análisis de tendencias de precios, benchmarking

**Estadísticas Disponibles:**
- Transacciones por región
- Precios promedio m²
- Variación temporal
- Segmentación por estrato

#### D. Registro de Transacciones Inmobiliarias
- **URL:** https://www.datos.gov.co/Vivienda-Ciudad-y-Territorio/Registro-de-transacciones-inmobiliarias-en-Colombi/7y2j-43cv
- **Formato:** CSV, JSON, API REST
- **Contenido:** Millones de transacciones desde 2015
- **Uso en CONSTRUMETRIX:** Análisis comparativo de precios reales

**Campos de Datos:**
- Fecha de transacción
- Ubicación (departamento, municipio)
- Área construida y terreno
- Valor de transacción
- Estrato socioeconómico

---

## 2️⃣ DANE - DEPARTAMENTO ADMINISTRATIVO NACIONAL DE ESTADÍSTICA {#dane}

### 📌 Descripción
Entidad oficial responsable de producir estadísticas nacionales.

### 🌐 Recursos Disponibles

#### A. Índice de Costos de la Construcción de Edificaciones (ICOCED)
- **URL:** https://www.dane.gov.co/index.php/estadisticas-por-tema/precios-y-costos/indice-de-costos-de-la-construccion-de-edificaciones-icoced
- **Actualización:** Mensual
- **Cobertura:** Principales ciudades de Colombia
- **Uso en CONSTRUMETRIX:** Estimación de costo por m² según región

**Lo que mide ICOCED:**
```
- Materiales de construcción
- Mano de obra calificada y no calificada
- Equipos y maquinaria
- Transporte de materiales
```

**Ciudades Incluidas:**
- Bogotá D.C.
- Medellín
- Cali
- Barranquilla
- Cartagena
- Bucaramanga
- Y más...

#### B. Índice de Valoración Predial (IVP)
- **URL:** https://www.dane.gov.co/index.php/en/estadisticas-por-tema-2/construccion/indice-de-valoracioon-predial
- **Actualización:** Trimestral
- **Cobertura:** 22 ciudades principales
- **Uso en CONSTRUMETRIX:** Medir variación del valor de mercado en el tiempo

**Lo que mide IVP:**
```
Cambio porcentual del valor de los predios entre trimestres
Segmentado por:
- Tipo de predio (casas, apartamentos)
- Estrato
- Ciudad
```

#### C. Normativa - Decreto 1170 de 2015
- **URL:** https://www.dane.gov.co/index.php/acerca-del-dane/informacion-institucional/normatividad/decreto-1170-del-2015
- **Contenido:** Definiciones legales de avalúos
- **Uso en CONSTRUMETRIX:** Marco conceptual legal

**Definiciones Clave:**
- Valor Comercial
- Valor Catastral
- Valor de Reposición
- Depreciación

---

## 3️⃣ NORMATIVA LEGAL {#normativa}

### 📌 Decretos y Regulaciones

#### A. Decreto 148 de 2020
- **URL:** https://actualicese.com/archivo/decreto-148-de-04-02-2020/
- **Contenido:** Métodos de valoración para avalúos
- **Vigencia:** Actual
- **Uso en CONSTRUMETRIX:** Criterios técnicos para valoraciones

**Métodos Aprobados:**
1. Método Comparativo o de Mercado
2. Método de Capitalización de Rentas
3. Método del Costo de Reposición ✅ (usado en CONSTRUMETRIX)
4. Método Residual

#### B. Decreto 1082 de 2015
- **Contenido:** Definición de AIU (Administración, Imprevistos, Utilidad)
- **Valores Estándar:**

```javascript
AIU = {
    administracion: 15%,
    imprevistos: 5%,
    utilidad: 10%,
    total: 30%
}
```

**Aplicado en CONSTRUMETRIX:**
```javascript
CRN = Costos Directos × (1 + AIU)
CRN = Costos Directos × 1.30
```

---

## 4️⃣ CAMACOL - SECTOR PRIVADO {#camacol}

### 📌 Descripción
Cámara Colombiana de la Construcción - Gremio nacional del sector constructor.

### 🌐 Recursos Disponibles

#### Información Económica CAMACOL
- **URL:** https://camacol.co/informacion-economica
- **Contenido:** Informes, tendencias, análisis sectorial
- **Actualización:** Mensual / Trimestral
- **Acceso:** Público (reportes generales) / Asociados (datos detallados)

**Información Disponible:**
- Estadísticas de licencias de construcción
- Análisis de oferta y demanda
- Tendencias de precios de materiales
- Proyecciones del sector
- Estudios de mercado regionales

**Uso en CONSTRUMETRIX:**
- Complemento a datos oficiales IGAC/DANE
- Análisis de tendencias sectoriales
- Benchmark con mercado actual

**Nota:** 
> ⚠️ CAMACOL es una fuente sectorial privada (no gubernamental) pero reconocida y con alta confiabilidad en el sector constructor.

---

## 5️⃣ USO EN CONSTRUMETRIX {#uso}

### 🔍 Trazabilidad de Datos

#### Cada cálculo en CONSTRUMETRIX está respaldado por:

1. **Costos Directos**
   - Fuente: Items.json (basado en lista CONSTRUDATA 2024)
   - Referencias: DANE ICOCED para índices de actualización

2. **AIU (30%)**
   - Fuente: Decreto 1082 de 2015
   - Estándar: 15% Admin + 5% Imprevistos + 10% Utilidad

3. **CRN (Costo de Reposición Nuevo)**
   - Método: Decreto 148 de 2020 (Método de Costo)
   - Fórmula: `Costos Directos × (1 + AIU)`

4. **Depreciación**
   - Método: Ross-Heidecke (IGAC)
   - Variables:
     - Vida útil del inmueble
     - Estado de conservación
     - Calidad de construcción

5. **Valor del Terreno**
   - Fuente: IGAC Catastro / OIC transacciones
   - Segmentación por estrato y zona

6. **Avalúo Comercial**
   - Método: IGAC Subdirección de Avalúos
   - Fórmula: `CRN Depreciado + Valor Terreno + Ajustes Mercado`

---

### 💻 Implementación Técnica

En el archivo `fuentes-oficiales.js`:

```javascript
window.FUENTES_OFICIALES = {
    igac: { /* Recursos IGAC */ },
    dane: { /* Recursos DANE */ },
    normativa: { /* Decretos */ },
    camacol: { /* Info sectorial */ }
};

window.ESTANDARES_OFICIALES = {
    aiu: {
        administracion: 0.15,
        imprevistos: 0.05,
        utilidad: 0.10,
        total: 0.30
    },
    // ... más estándares
};
```

### 🔗 APIs y Datasets

#### Endpoints Disponibles (Públicos):

```javascript
// Transacciones IGAC
GET https://www.datos.gov.co/resource/7y2j-43cv.json

// Parámetros:
?departamento=CUNDINAMARCA
&municipio=BOGOTA
&anio=2025
```

**Ejemplo de Respuesta:**
```json
{
    "fecha_transaccion": "2025-12-01",
    "direccion": "CL 100 # 10-20",
    "area_construida": 120,
    "valor_transaccion": 450000000,
    "estrato": "3"
}
```

---

## 📊 COMPARACIÓN DE FUENTES

| Fuente | Tipo | Actualización | Confiabilidad | Uso Principal |
|--------|------|---------------|---------------|---------------|
| **IGAC** | Gubernamental | Mensual | 100% Oficial | Avalúos y catastro |
| **DANE** | Gubernamental | Mensual/Trimestral | 100% Oficial | Costos e índices |
| **Decretos** | Legal | Permanente | 100% Legal | Marco normativo |
| **CAMACOL** | Sectorial | Mensual | Alta (no oficial) | Tendencias mercado |

---

## ✅ CHECKLIST DE CUMPLIMIENTO

CONSTRUMETRIX cumple con:

- ✅ Métodos de valoración aprobados (Decreto 148/2020)
- ✅ AIU según estándar (Decreto 1082/2015)
- ✅ Depreciación método IGAC (Ross-Heidecke)
- ✅ Referencias a datos oficiales DANE (ICOCED, IVP)
- ✅ Transparencia en cálculos
- ✅ Trazabilidad de fuentes

---

## 🔄 ACTUALIZACIÓN DE DATOS

### Frecuencia Recomendada:

| Dato | Frecuencia | Responsable |
|------|------------|-------------|
| Lista de precios items.json | Trimestral | CONSTRUMETRIX |
| Índices ICOCED | Mensual | Consulta DANE |
| Transacciones mercado | Mensual | Consulta IGAC OIC |
| Normativa | Al cambiar | Revisión legal |

---

## 📞 CONTACTO CON ENTIDADES

### IGAC
- **Teléfono:** +57 (1) 369 4000
- **Email:** contacto@igac.gov.co
- **Dirección:** Carrera 30 # 48-51, Bogotá

### DANE
- **Teléfono:** +57 (1) 597 8300
- **Email:** contacto@dane.gov.co
- **Dirección:** Carrera 59 # 26-70, Bogotá

### CAMACOL
- **Teléfono:** +57 (1) 743 3970
- **Email:** contacto@camacol.co
- **Web:** https://camacol.co

---

## 📝 NOTAS FINALES

### Recomendaciones:

1. **Siempre contrastar** múltiples fuentes para mayor precisión
2. **Verificar vigencia** de decretos y normativa
3. **Actualizar periódicamente** la lista de precios
4. **Documentar** cualquier ajuste manual realizado
5. **Citar la fuente** en reportes oficiales

### Limitaciones:

- Los datos de CAMACOL requieren suscripción pagada para detalles completos
- Algunas APIs del IGAC pueden no estar públicamente documentadas
- Los datasets de transacciones tienen rezago de 1-2 meses

---

**Documento preparado por:** CONSTRUMETRIX Data Team  
**Versión:** 2.0  
**Fecha:** Febrero 2026  
**Próxima Revisión:** Mayo 2026

---

## 🔗 ENLACES RÁPIDOS

- [IGAC Principal](https://www.igac.gov.co/)
- [DANE ICOCED](https://www.dane.gov.co/index.php/estadisticas-por-tema/precios-y-costos/indice-de-costos-de-la-construccion-de-edificaciones-icoced)
- [Datos Abiertos Colombia](https://www.datos.gov.co/)
- [CAMACOL](https://camacol.co/)
- [Decreto 148/2020](https://actualicese.com/archivo/decreto-148-de-04-02-2020/)

---

*Este documento es parte integral de CONSTRUMETRIX v2.0 y debe actualizarse cuando cambien regulaciones o fuentes de datos.*
