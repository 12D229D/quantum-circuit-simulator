# Plan: quantum-circuit-simulator

> **Directorio:** `quantum-circuit-simulator`  
> **Categoría:** 🪐 Simuladores / 🛠️ Herramientas  
> **Estado:** ✅ Completado  

---

## 📌 Resumen del Subproyecto
`quantum-circuit-simulator` es un simulador interactivo visual y educativo para diseñar, construir y simular circuitos de computación cuántica de $N$ qubits en el navegador. Incluye representación geométrica interactiva en 3D de la **Esfera de Bloch**, catálogo completo de puertas cuánticas elementales y multi-qubit (Hadamard $H$, Pauli $X, Y, Z$, fases $S, S^\dagger, T, T^\dagger$, rotaciones continuas $R_x, R_y, R_z$, CNOT, CZ, SWAP, Toffoli), cálculo matricial del vector de estado en notación Dirac, cálculo de matrices de densidad reducidas $\rho_q$, simulación de colapso de función de onda ($N$ *shots*), biblioteca de algoritmos cuánticos clásicos (Bell, GHZ, Teleportación, Deutsch, QRNG, Half-Adder) y exportador a **OpenQASM 2.0** y **Qiskit (Python)**.

---

## 🎯 Objetivos Principales
- [x] **Editor Visual de Circuitos:** Diseñador multi-línea con líneas de qubits, slots de puertas, ejecución paso a paso y conectores multi-qubit en tiempo real.
- [x] **Esfera de Bloch 3D:** Renderizado con Canvas 2D/proyección 3D interactiva del vector de estado $\vert\psi\rangle = \cos(\theta/2)\vert 0\rangle + e^{i\phi}\sin(\theta/2)\vert 1\rangle$, controles orbitales de rotación y detector de entrelazamiento por contracción del vector ($|\vec{r}| < 1$).
- [x] **Simulador Matricial en JS Puro:** Motor matricial para álgebra de números complejos, matrices unitarias y productos de Kronecker ($2^N \times 2^N$).
- [x] **Visualizador de Probabilidad y Medición:** Histogramas de amplitud de estado con código de color por fase compleja y simulador de muestreo con $N$ disparos (*shots*).
- [x] **Biblioteca de Algoritmos & Exportador:** Presets cuánticos clásicos y exportación directa a OpenQASM 2.0 y scripts Python para Qiskit.

---

## 🏗️ Arquitectura

- **Patrón Arquitectónico**: Single Page Application (SPA) con arquitectura modular orientada a objetos (POO) y componentes reactivos basados en eventos.

```text
quantum-circuit-simulator/
├── index.html              # Layout semántico, paleta de puertas, visualizadores y modales
├── css/
│   └── style.css           # Sistema de diseño Cyber-Quantum Dark Glassmorphism
├── js/
│   ├── complex.js          # Clase Complex: aritmética de números complejos y fases
│   ├── quantum-matrix.js   # Matrices unitarias y producto tensorial de Kronecker (2^N x 2^N)
│   ├── quantum-circuit.js  # Motor cuántico: vector de estado, medición y matriz de densidad
│   ├── bloch-sphere.js     # Renderizador 3D interactivo de la Esfera de Bloch
│   ├── presets.js          # Catálogo de algoritmos cuánticos predefinidos
│   ├── exporter.js         # Exportador a OpenQASM 2.0 y Qiskit Python
│   └── app.js              # Controlador principal de UI, drag & drop y eventos
├── README.md               # Documentación y manual de usuario
└── plan.md                 # Bitácora de desarrollo y estado del proyecto
```

- **Flujo de datos**:
  1. El usuario interactúa con la cuadrícula cuántica en `app.js`.
  2. `QuantumCircuit` recalcula los operadores unitarios $2^N \times 2^N$ mediante productos tensoriales (`quantum-matrix.js`) y evoluciona el vector de estado $|\psi\rangle$.
  3. Se calculan las amplitudes $c_k$, las probabilidades $|c_k|^2$ y las matrices de densidad reducidas $\rho_{q_i}$.
  4. `BlochSphereRenderer` proyecta en tiempo real la orientación 3D $(\theta, \phi)$ y la pureza cuántica en el lienzo.
  5. Los gráficos de probabilidad, notación Dirac y el exportador OpenQASM/Qiskit se actualizan reactivamente.

---

## 🧠 Paradigma de Programación

- **Híbrido: Orientado a Objetos (POO) + Funcional + Event-Driven**:
  - **POO**: Clases encapsuladas (`Complex`, `QuantumMatrix`, `QuantumCircuit`, `BlochSphereRenderer`, `CircuitExporter`) que modelan los estados cuánticos, operadores y renderizado.
  - **Funcional**: Transformaciones inmutables de vectores de estado, mapeo de probabilidades y cálculo de amplitudes mediante funciones puras.
  - **Event-Driven**: Listeners reactivos para el editor de circuitos, arrastre orbital de la Esfera de Bloch, botones de ejecución temporal y modales de medición.

---

## 🌐 Propósito de Visibilidad y Destino Remoto

- **Visibilidad**: `Público (Open Source / Portafolio)`.
- **Plataforma Remota Asignada**: `GitHub`.
- **Plataforma de Despliegue CI/CD**: `GitHub Pages` / `Cloudflare Pages`.
- **Justificación**: Simulador cuántico interactivo educativo y showcase visual de Three.js / Canvas 2D sin secretos ni backend privado, ideal para vitrina pública de código y despliegue estático de alto rendimiento.

---

## 📋 Tareas Realizadas

### Fase 1: Fundamentos y UI Core
- [x] Creación de `index.html` con estructura semántica (Canvas, Panel de Puertas, Esfera de Bloch, Modales).
- [x] Creación de `css/style.css` con variables CSS HSL, tema Quantum Dark Glassmorphism y layout adaptable.
- [x] Configuración del lienzo Canvas 2D/3D para la Esfera de Bloch interactiva.

### Fase 2: Motor de Álgebra Cuántica
- [x] Implementación de `js/complex.js` (operaciones completas con números complejos, fases y exponencial de Euler).
- [x] Implementación de `js/quantum-matrix.js` (matrices unitarias $H, X, Y, Z, S, T, R_x, R_y, R_z$, CNOT, CZ, SWAP, Toffoli y producto tensorial de Kronecker).
- [x] Implementación de `js/quantum-circuit.js` (gestión del vector de estado $\vert\psi\rangle$, evolución temporal, matriz de densidad reducida y cálculo de coordenadas de Bloch).

### Fase 3: Editor Interactivo y Simulación
- [x] Creación de `js/app.js` (eventos de colocación de puertas, soporte multi-qubit con conectores, reproducción paso a paso).
- [x] Proyección e interpolación en la Esfera de Bloch al aplicar puertas cuánticas y detección de entrelazamiento.
- [x] Simulación de colapso de función de onda probabilístico con muestreo de $N$ disparos (*shots*) e histograma.

### Fase 4: Presets, Exportación y Verificación
- [x] Implementación de `js/presets.js` con algoritmos cuánticos clásicos (Estados de Bell, GHZ, Teletransportación, Deutsch, QRNG, Half-Adder).
- [x] Implementación de `js/exporter.js` para OpenQASM 2.0/3.0 y scripts ejecutables de Qiskit Python.
- [x] Creación de `README.md` y actualización de bitácora y estado global del repositorio.

### Fase 5: Persistencia SQLite Abstracta
- [x] Creación de `js/db.js` — Motor SQLite abstracto con DDL relacional completo (4 tablas: `circuits`, `gates_applied`, `sim_results`, `bloch_states`).
- [x] Persistencia vía `localStorage` con namespace global `window.QSimDB` (compatible con scripts clásicos sin ES modules).
- [x] Exportación de dump `.sql` 100% compatible con `sqlite3` CLI mediante `QSimDB.exportSQLiteDump()`.
- [x] Integración en `js/app.js`: auto-persistencia de resultados de simulación (`saveSimResults`) en cada recalculo del vector de estado final.
- [x] Botón `💾 Guardar` (`#btnSaveCircuit`) en `index.html` para guardar circuitos con nombre personalizado.
- [x] Botón `🗄️ Exportar DB SQL` (`#btnExportDB`) en `index.html` para descargar dump `.sql`.
- [x] Actualización de `index.html`: carga de `js/db.js` antes de `js/app.js`.

---

## 📋 Estado Actual

✅ **Motor SQLite abstracto implementado** (`js/db.js`).  
Tablas: `circuits`, `gates_applied`, `sim_results`, `bloch_states`.  
Exportación `.sql` compatible con `sqlite3` CLI.  
Integración completa en `app.js` con auto-persistencia del vector de estado y botones de guardar/exportar en la UI.
