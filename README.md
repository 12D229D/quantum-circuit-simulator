# 🪐 QUANTUM CIRCUIT SIMULATOR 2D/3D

Un simulador interactivo visual y educativo de computación cuántica de $N$ qubits desarrollado en **HTML5 Canvas 2D/3D**, **CSS3 Dark Glassmorphism** y **Vanilla JavaScript (ES6+)**.

---

## 🌟 Características Principales

1. **Motor de Álgebra Matricial con Números Complejos (`js/complex.js` & `js/quantum-matrix.js`)**:
   - Aritmética completa de números complejos $z = a + bi$, fases $\text{Arg}(z)$, módulos $|z|$ y exponencial de Euler $e^{i\theta}$.
   - Catálogo de matrices unitarias elementales:
     - **Puertas de 1 Qubit**: Hadamard ($H$), Pauli ($X, Y, Z$), Cambio de fase ($S, S^\dagger, T, T^\dagger$), Rotaciones continuas en ejes ($R_x(\theta), R_y(\theta), R_z(\theta)$).
     - **Puertas Multi-Qubit / Entrelazamiento**: CNOT (Controlled-NOT / CX), CZ (Controlled-Z), SWAP, Toffoli (CCNOT / Deutsch gate).
   - Expansión automática a operadores unitarios completos $2^N \times 2^N$ mediante productos tensoriales de Kronecker ($\otimes$).

2. **Esfera de Bloch 3D Interactiva (`js/bloch-sphere.js`)**:
   - Renderizado en tiempo real con proyección isométrica 3D y controles de órbita por arrastre (Pitch / Yaw).
   - Ejes ortogonales $X, Y, Z$ y polos fundamentales: $|0\rangle, |1\rangle, |+\rangle, |-\rangle, |i\rangle, |-i\rangle$.
   - Vector de estado animado $(\theta, \phi)$ y cálculo de matriz de densidad reducida $\rho_{q_i} = \text{Tr}_{\bar{i}}(\rho)$.
   - **Detector de Entrelazamiento / Pureza cuántica**: cuando un qubit se entrelaza (ej. en un par de Bell), el vector de Bloch se contrae al interior de la esfera ($|\vec{r}| < 1.0$), reflejando el estado cuántico mixto real.

3. **Diseñador Visual de Circuitos (`js/app.js` & `index.html`)**:
   - Cuadrícula dinámica para 1 a 5 qubits y 6 a 16 pasos temporales.
   - Alternancia de estado inicial por qubit ($|0\rangle \leftrightarrow |1\rangle$).
   - Inserción y eliminación interactiva de puertas con un clic.
   - Conectores verticales para puertas controladas multi-qubit.
   - **Control de reproducción temporal**: avanzar paso a paso (*step-through*), retroceder o reproducir la evolución del estado en tiempo real.

4. **Análisis de Estado y Simulación de Medición**:
   - Representación instantánea en notación Dirac (Bra-Ket): $|\psi\rangle = \sum c_k |k\rangle$.
   - Gráfico de barras de probabilidades de amplitud $|c_k|^2$ con código de color dinámico según la fase cuántica compleja.
   - **Simulador de Muestreo de Medición**: ejecuta experimentos de colapso de función de onda ($100, 1024, 4096$ o $8192$ *shots*) con histograma de frecuencias reales según la regla de Born ($P(x) = |\langle x|\psi\rangle|^2$).

5. **Biblioteca de Algoritmos Cuánticos Predefinidos (`js/presets.js`)**:
   - **Estado de Bell $|\Phi^+\rangle$**: $(|00\rangle + |11\rangle)/\sqrt{2}$.
   - **Estado de Bell $|\Psi^-\rangle$**: $(|01\rangle - |10\rangle)/\sqrt{2}$ (Singlete).
   - **Estado GHZ**: $(|000\rangle + |111\rangle)/\sqrt{2}$ (Entrelazamiento tripartito maximal).
   - **Protocolo de Teletransportación Cuántica**: Transferencia de estado cuántico mediante par EPR y corrección clásica.
   - **Algoritmo de Deutsch**: Demostración de ventaja cuántica en 1 evaluación.
   - **Generador Aleatorio Cuántico (QRNG)**: Superposición equiprobable uniforme.
   - **Sumador Cuántico (Half-Adder)**: Suma y acarreo con Toffoli y CNOT.

6. **Exportador a Estándares Industriales (`js/exporter.js`)**:
   - Código estándar **OpenQASM 2.0 / 3.0**.
   - Scripts ejecutables de Python con **Qiskit (IBM Quantum)** listos para correr con `AerSimulator`.
   - Exportación de circuitos en formato JSON.

---

## 🕹️ Guía de Uso

1. **Seleccionar Puerta**: Haz clic en cualquier puerta de la paleta superior (ej. `H`, `X`, `CNOT`).
2. **Colocar en el Circuito**:
   - Para puertas simples: haz clic en la celda deseada.
   - Para puertas controladas (`CNOT`, `CZ`, `SWAP`): haz clic primero en el qubit de control y luego en el target en la misma columna.
   - Para `Toffoli`: haz clic en el 1.er control, luego en el 2.º control y finalmente en el target.
3. **Observar Resultados**:
   - La notación Dirac se actualiza en tiempo real.
   - La Esfera de Bloch muestra la orientación 3D del qubit seleccionado.
   - El panel inferior muestra el desglose de probabilidades y fases de los $2^N$ estados de la base.
4. **Simular Medición**: Haz clic en el botón `🎲 Medición` para ejecutar 1.024 disparos y ver el histograma de colapso.
5. **Exportar**: Haz clic en `⚡ Exportar Código` para copiar la sintaxis OpenQASM o el script de Qiskit.

---

## 🏗️ Arquitectura de Archivos

```text
quantum-circuit-simulator/
├── index.html              # Layout semántico, paleta de puertas, visualizadores y modales
├── css/
│   └── style.css           # Sistema de diseño Cyber-Quantum Dark Glassmorphism
├── js/
│   ├── complex.js          # Aritmética de números complejos, fases y exponencial
│   ├── quantum-matrix.js   # Matrices unitarias y producto tensorial de Kronecker
│   ├── quantum-circuit.js  # Motor de evolución cuántica, vector de estado y matriz de densidad
│   ├── bloch-sphere.js     # Renderizador 3D interactivo de la Esfera de Bloch
│   ├── presets.js          # Catálogo de algoritmos cuánticos predefinidos
│   ├── exporter.js         # Exportador a OpenQASM 2.0 y Qiskit Python
│   └── app.js              # Controlador principal de UI, drag & drop y eventos
├── README.md               # Documentación y manual de usuario
└── plan.md                 # Bitácora de desarrollo y estado del proyecto
```

---

## 🚀 Cómo Ejecutar

Abre directamente el archivo `index.html` en cualquier navegador web moderno (Google Chrome, Mozilla Firefox, Microsoft Edge, Safari). No requiere instalación de paquetes npm ni compiladores locales.
