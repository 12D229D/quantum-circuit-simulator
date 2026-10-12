/**
 * QUANTUM CIRCUIT SIMULATOR - MAIN APP CONTROLLER
 * UI orchestration, drag-and-drop / click editor, step execution, and live updates.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Instantiate Core Circuit & Bloch Sphere
    const circuit = new QuantumCircuit(3, 8);
    const blochSphere = new BlochSphereRenderer('blochCanvas');

    // App state
    let selectedTool = 'H'; // Current active tool (gate type, or 'DELETE')
    let multiQubitPending = null; // Staging for CNOT/Toffoli/SWAP controls
    let activeBlochQubit = 0; // Which qubit's Bloch sphere to display
    let currentPlaybackStep = null; // null = full circuit final state, number = specific step
    let playbackInterval = null;

    // DB state — ID y nombre del circuito activo en QSimDB
    let currentCircuitId = null;
    let currentCircuitName = 'Mi Circuito';

    // Inicializar QSimDB (verifica que localStorage esté disponible)
    if (window.QSimDB) {
        const stats = QSimDB.getDBStats();
        console.info('[QSimDB] Motor SQLite abstracto activo — v' + stats.version +
            ' | Circuitos guardados: ' + stats.circuits);
    }

    // DOM Elements
    const circuitGridEl = document.getElementById('circuitGrid');
    const diracStateEl = document.getElementById('diracState');
    const probBarsContainerEl = document.getElementById('probBarsContainer');
    const blochQubitSelectEl = document.getElementById('blochQubitSelect');
    const qubitCountSelectEl = document.getElementById('qubitCountSelect');
    const stepCountSelectEl = document.getElementById('stepCountSelect');
    const presetSelectEl = document.getElementById('presetSelect');

    // Export Modal Elements
    const exportModalEl = document.getElementById('exportModal');
    const exportCodeAreaEl = document.getElementById('exportCodeArea');
    const tabQasmBtn = document.getElementById('tabQasm');
    const tabQiskitBtn = document.getElementById('tabQiskit');
    const tabJsonBtn = document.getElementById('tabJson');
    let currentExportTab = 'qasm';

    // Measurement Modal Elements
    const measureModalEl = document.getElementById('measureModal');
    const measureChartContainerEl = document.getElementById('measureChartContainer');
    const measureShotsSelectEl = document.getElementById('measureShotsSelect');

    // 2. Initialize Palette Tools
    const gateButtons = document.querySelectorAll('.gate-tool');
    gateButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            gateButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedTool = btn.dataset.gate;
            multiQubitPending = null; // Cancel any partial control selections
            updateHelperPrompt();
        });
    });

    function updateHelperPrompt() {
        const promptEl = document.getElementById('editorPrompt');
        if (!promptEl) return;
        if (selectedTool === 'DELETE') {
            promptEl.textContent = 'Haz clic en una puerta para eliminarla.';
        } else if (selectedTool === 'CNOT' || selectedTool === 'CZ' || selectedTool === 'SWAP') {
            if (!multiQubitPending) {
                promptEl.textContent = `Paso 1: Haz clic en el QUBIT DE CONTROL para ${selectedTool}.`;
            } else {
                promptEl.textContent = `Paso 2: Haz clic en el QUBIT OBJETIVO (Paso ${multiQubitPending.step}).`;
            }
        } else if (selectedTool === 'TOFFOLI') {
            if (!multiQubitPending) {
                promptEl.textContent = 'Paso 1: Haz clic en el PRIMER QUBIT DE CONTROL.';
            } else if (multiQubitPending.control2 === undefined) {
                promptEl.textContent = 'Paso 2: Haz clic en el SEGUNDO QUBIT DE CONTROL.';
            } else {
                promptEl.textContent = 'Paso 3: Haz clic en el QUBIT OBJETIVO (Target).';
            }
        } else {
            promptEl.textContent = `Haz clic en cualquier celda para colocar la puerta [${selectedTool}].`;
        }
    }

    // 3. Render Circuit Grid
    function renderCircuit() {
        circuitGridEl.innerHTML = '';

        // Setup CSS grid columns: 1 for headers + N for steps
        circuitGridEl.style.gridTemplateColumns = `110px repeat(${circuit.numSteps}, 56px)`;

        // For each qubit wire
        for (let q = 0; q < circuit.numQubits; q++) {
            // Header: |0>/|1> initial state toggle + qubit label
            const headerCell = document.createElement('div');
            headerCell.className = 'wire-header-cell';
            headerCell.innerHTML = `
                <span class="qubit-name">q<sub>${q}</sub></span>
                <button class="init-state-btn" data-qubit="${q}" title="Cambiar estado inicial">
                    |${circuit.initialState[q]}⟩
                </button>
            `;
            headerCell.querySelector('.init-state-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                circuit.toggleInitialState(q);
                updateAllViews();
            });
            circuitGridEl.appendChild(headerCell);

            // Step cells
            for (let s = 0; s < circuit.numSteps; s++) {
                const cell = document.createElement('div');
                cell.className = 'circuit-cell';
                cell.dataset.qubit = q;
                cell.dataset.step = s;

                // Playback highlight
                if (currentPlaybackStep === s) {
                    cell.classList.add('playback-active');
                }

                // Wire line behind
                const wireLine = document.createElement('div');
                wireLine.className = 'quantum-wire-line';
                cell.appendChild(wireLine);

                // Check for gate
                const gate = circuit.grid[q][s];
                if (gate) {
                    const gateEl = document.createElement('div');
                    gateEl.className = `gate-chip gate-type-${gate.type.toLowerCase()}`;
                    gateEl.title = `${gate.type} en q${q}`;

                    if (gate.type === 'CNOT' || gate.type === 'CX') {
                        gateEl.textContent = '⊕';
                        gateEl.classList.add('gate-cnot-target');
                    } else if (gate.type === 'TOFFOLI' || gate.type === 'CCNOT') {
                        gateEl.textContent = '⊕';
                        gateEl.classList.add('gate-toffoli-target');
                    } else if (gate.type === 'SWAP') {
                        gateEl.textContent = '⨯';
                        gateEl.classList.add('gate-swap-target');
                    } else if (gate.type === 'CZ') {
                        gateEl.textContent = 'Z';
                    } else {
                        gateEl.textContent = gate.type;
                    }
                    cell.appendChild(gateEl);
                }

                // Check for multi-qubit controls positioned on other qubits at step s
                for (let otherQ = 0; otherQ < circuit.numQubits; otherQ++) {
                    const otherGate = circuit.grid[otherQ][s];
                    if (otherGate) {
                        if (otherGate.control === q || otherGate.control2 === q) {
                            const controlDot = document.createElement('div');
                            controlDot.className = (otherGate.type === 'SWAP') ? 'gate-swap-dot' : 'gate-control-dot';
                            controlDot.title = `Control para ${otherGate.type} en q${otherQ}`;
                            if (otherGate.type === 'SWAP') controlDot.textContent = '⨯';
                            cell.appendChild(controlDot);

                            // Draw vertical connecting line between control and target
                            const connector = document.createElement('div');
                            connector.className = 'multi-qubit-connector-line';
                            const topQ = Math.min(q, otherQ);
                            const botQ = Math.max(q, otherQ);
                            if (q === topQ) {
                                connector.style.height = `${(botQ - topQ) * 58}px`;
                                cell.appendChild(connector);
                            }
                        }
                    }
                }

                // Cell Click Handler
                cell.addEventListener('click', () => handleCellClick(q, s));
                circuitGridEl.appendChild(cell);
            }
        }
    }

    function handleCellClick(q, s) {
        if (selectedTool === 'DELETE') {
            circuit.removeGate(q, s);
            updateAllViews();
            return;
        }

        // Multi-qubit gate handling
        if (selectedTool === 'CNOT' || selectedTool === 'CZ' || selectedTool === 'SWAP') {
            if (!multiQubitPending) {
                // Step 1: Control selected
                multiQubitPending = { type: selectedTool, control: q, step: s };
                updateHelperPrompt();
                showToast(`Control seleccionado en q${q}. Ahora haz clic en el target (paso ${s}).`);
            } else {
                // Step 2: Target selected
                if (multiQubitPending.step !== s) {
                    showToast('Debes seleccionar el target en el mismo paso/columna.');
                    return;
                }
                if (multiQubitPending.control === q) {
                    showToast('El qubit de control y target no pueden ser el mismo.');
                    return;
                }
                circuit.setGate(q, s, {
                    type: multiQubitPending.type,
                    control: multiQubitPending.control
                });
                multiQubitPending = null;
                updateHelperPrompt();
                updateAllViews();
            }
            return;
        }

        if (selectedTool === 'TOFFOLI') {
            if (!multiQubitPending) {
                multiQubitPending = { type: 'TOFFOLI', control: q, step: s };
                updateHelperPrompt();
                showToast(`Primer control en q${q}. Selecciona el segundo control.`);
            } else if (multiQubitPending.control2 === undefined) {
                if (multiQubitPending.step !== s || multiQubitPending.control === q) {
                    showToast('El segundo control debe estar en el mismo paso y diferente qubit.');
                    return;
                }
                multiQubitPending.control2 = q;
                updateHelperPrompt();
                showToast(`Segundo control en q${q}. Selecciona el target.`);
            } else {
                if (multiQubitPending.step !== s || multiQubitPending.control === q || multiQubitPending.control2 === q) {
                    showToast('El target debe estar en el mismo paso y diferente qubit.');
                    return;
                }
                circuit.setGate(q, s, {
                    type: 'TOFFOLI',
                    control: multiQubitPending.control,
                    control2: multiQubitPending.control2
                });
                multiQubitPending = null;
                updateHelperPrompt();
                updateAllViews();
            }
            return;
        }

        // Standard Single Qubit Gate
        let gateObj = { type: selectedTool };
        if (selectedTool === 'RX' || selectedTool === 'RY' || selectedTool === 'RZ') {
            const angleDeg = parseFloat(prompt('Ingresa el ángulo en grados (e.g. 90, 180, 45):', '90') || '90');
            gateObj.theta = (angleDeg * Math.PI) / 180;
        }

        circuit.setGate(q, s, gateObj);
        updateAllViews();
    }

    // 4. Update Probability Bars & State Vector
    function updateStateView() {
        const step = currentPlaybackStep;
        diracStateEl.textContent = `|ψ⟩ = ${circuit.getDiracNotation(step)}`;

        const probs = circuit.getProbabilities(step);
        probBarsContainerEl.innerHTML = '';

        // Persistir resultados en QSimDB
        if (window.QSimDB && step === null) {
            // Asignar ID temporal si no hay circuito activo
            if (!currentCircuitId) {
                currentCircuitId = 'session_' + Date.now().toString(36);
            }
            const stateVector = probs.map(p => ({
                label:        '|' + p.bitstring + '\u27e9',
                probability:  p.probability,
                amplitude_re: p.amplitude ? p.amplitude.re : 0,
                amplitude_im: p.amplitude ? p.amplitude.im : 0
            }));
            QSimDB.saveSimResults(currentCircuitId, stateVector);
        }

        probs.forEach(p => {
            const barRow = document.createElement('div');
            barRow.className = 'prob-bar-row';

            const pct = (p.probability * 100).toFixed(1);
            const phaseDeg = Math.round((p.phase * 180) / Math.PI);

            // Phase color hue: maps -180..180 to 0..360
            const hue = (phaseDeg + 360) % 360;

            barRow.innerHTML = `
                <span class="basis-state-label">|${p.bitstring}⟩</span>
                <div class="prob-bar-track">
                    <div class="prob-bar-fill" style="width: ${pct}%; background: hsl(${hue}, 85%, 55%);"></div>
                </div>
                <span class="prob-pct-val">${pct}%</span>
            `;
            barRow.title = `Amplitud: ${p.amplitude.toString(3)} | Fase: ${phaseDeg}°`;
            probBarsContainerEl.appendChild(barRow);
        });
    }

    // 5. Update Bloch Sphere
    function updateBlochView() {
        // Populate qubit dropdown
        const currentCount = circuit.numQubits;
        if (blochQubitSelectEl.options.length !== currentCount) {
            blochQubitSelectEl.innerHTML = '';
            for (let q = 0; q < currentCount; q++) {
                const opt = document.createElement('option');
                opt.value = q;
                opt.textContent = `Qubit q${q}`;
                blochQubitSelectEl.appendChild(opt);
            }
            if (activeBlochQubit >= currentCount) activeBlochQubit = 0;
            blochQubitSelectEl.value = activeBlochQubit;
        }

        const coords = circuit.getBlochCoordinates(activeBlochQubit, currentPlaybackStep);
        blochSphere.setCoordinates(coords);
    }

    function updateAllViews() {
        renderCircuit();
        updateStateView();
        updateBlochView();
    }

    // 6. Playback & Step Controls
    document.getElementById('btnStepBack').addEventListener('click', () => {
        stopPlayback();
        if (currentPlaybackStep === null) {
            currentPlaybackStep = circuit.numSteps - 1;
        } else {
            currentPlaybackStep = Math.max(0, currentPlaybackStep - 1);
        }
        updateAllViews();
    });

    document.getElementById('btnStepForward').addEventListener('click', () => {
        stopPlayback();
        if (currentPlaybackStep === null) {
            currentPlaybackStep = 0;
        } else if (currentPlaybackStep < circuit.numSteps - 1) {
            currentPlaybackStep++;
        } else {
            currentPlaybackStep = null; // Full end state
        }
        updateAllViews();
    });

    document.getElementById('btnPlay').addEventListener('click', () => {
        if (playbackInterval) {
            stopPlayback();
        } else {
            startPlayback();
        }
    });

    document.getElementById('btnResetStep').addEventListener('click', () => {
        stopPlayback();
        currentPlaybackStep = null;
        updateAllViews();
    });

    function startPlayback() {
        document.getElementById('btnPlay').innerHTML = '⏸ Pausar';
        currentPlaybackStep = 0;
        updateAllViews();

        playbackInterval = setInterval(() => {
            if (currentPlaybackStep < circuit.numSteps - 1) {
                currentPlaybackStep++;
            } else {
                currentPlaybackStep = null;
                stopPlayback();
            }
            updateAllViews();
        }, 800);
    }

    function stopPlayback() {
        if (playbackInterval) {
            clearInterval(playbackInterval);
            playbackInterval = null;
            document.getElementById('btnPlay').innerHTML = '▶ Reproducir';
        }
    }

    // 7. Global Actions & Selectors
    document.getElementById('btnClearCircuit').addEventListener('click', () => {
        if (confirm('¿Deseas limpiar todas las puertas del circuito?')) {
            circuit.clearCircuit();
            currentPlaybackStep = null;
            currentCircuitId = null; // Reset DB circuit ID
            updateAllViews();
            showToast('Circuito reiniciado.');
        }
    });

    // Guardar circuito en QSimDB
    const btnSaveCircuit = document.getElementById('btnSaveCircuit');
    if (btnSaveCircuit && window.QSimDB) {
        btnSaveCircuit.addEventListener('click', () => {
            const name = prompt('Nombre del circuito:', currentCircuitName) || currentCircuitName;
            currentCircuitName = name;
            const circuitJson = JSON.stringify(circuit.grid || {});
            const saved = QSimDB.saveCircuit({
                id:           currentCircuitId,
                name:         name,
                description:  'Guardado desde Quantum Circuit Simulator',
                qubits:       circuit.numQubits,
                steps:        circuit.numSteps,
                circuit_json: circuitJson
            });
            currentCircuitId = saved.id;
            const stats = QSimDB.getDBStats();
            showToast(`💾 Circuito "${name}" guardado. Total: ${stats.circuits} circuito(s).`);
        });
    }

    // Exportar dump SQL de QSimDB
    const btnExportDB = document.getElementById('btnExportDB');
    if (btnExportDB && window.QSimDB) {
        btnExportDB.addEventListener('click', () => {
            QSimDB.exportSQLiteDump();
            showToast('📥 Dump SQL exportado.');
        });
    }

    qubitCountSelectEl.addEventListener('change', (e) => {
        const n = parseInt(e.target.value, 10);
        circuit.setNumQubits(n);
        activeBlochQubit = 0;
        updateAllViews();
        showToast(`Número de qubits actualizado a ${n}.`);
    });

    stepCountSelectEl.addEventListener('change', (e) => {
        const s = parseInt(e.target.value, 10);
        circuit.setNumSteps(s);
        updateAllViews();
    });

    blochQubitSelectEl.addEventListener('change', (e) => {
        activeBlochQubit = parseInt(e.target.value, 10);
        updateBlochView();
    });

    // 8. Presets Catalog
    presetSelectEl.addEventListener('change', (e) => {
        const presetKey = e.target.value;
        if (!presetKey || !QuantumPresets[presetKey]) return;

        const preset = QuantumPresets[presetKey];
        circuit.setNumQubits(preset.numQubits);
        circuit.setNumSteps(preset.numSteps);
        circuit.clearCircuit();

        qubitCountSelectEl.value = preset.numQubits;
        stepCountSelectEl.value = preset.numSteps;

        preset.gates.forEach(g => {
            circuit.setGate(g.qubit, g.step, {
                type: g.type,
                control: g.control,
                control2: g.control2,
                theta: g.theta || 0
            });
        });

        currentPlaybackStep = null;
        updateAllViews();
        showToast(`Preset cargado: ${preset.name}`);
        presetSelectEl.value = '';
    });

    // 9. Measurement Simulator
    document.getElementById('btnOpenMeasure').addEventListener('click', () => {
        runMeasurement();
        measureModalEl.classList.remove('hidden');
    });

    document.getElementById('btnRunMeasure').addEventListener('click', () => {
        runMeasurement();
    });

    document.getElementById('btnCloseMeasure').addEventListener('click', () => {
        measureModalEl.classList.add('hidden');
    });

    function runMeasurement() {
        const shots = parseInt(measureShotsSelectEl.value, 10);
        const result = circuit.simulateMeasurement(shots);

        measureChartContainerEl.innerHTML = '';
        const sortedEntries = Object.entries(result.counts).filter(([_, count]) => count > 0);

        sortedEntries.sort((a, b) => b[1] - a[1]);

        sortedEntries.forEach(([bitstring, count]) => {
            const pct = ((count / shots) * 100).toFixed(1);
            const row = document.createElement('div');
            row.className = 'measure-result-row';
            row.innerHTML = `
                <span class="measure-bit-label">|${bitstring}⟩</span>
                <div class="prob-bar-track">
                    <div class="prob-bar-fill" style="width: ${pct}%; background: var(--neon-cyan);"></div>
                </div>
                <span class="measure-count-val">${count} (${pct}%)</span>
            `;
            measureChartContainerEl.appendChild(row);
        });
    }

    // 10. Code Exporter Modal
    document.getElementById('btnOpenExport').addEventListener('click', () => {
        renderExportCode();
        exportModalEl.classList.remove('hidden');
    });

    document.getElementById('btnCloseExport').addEventListener('click', () => {
        exportModalEl.classList.add('hidden');
    });

    tabQasmBtn.addEventListener('click', () => {
        currentExportTab = 'qasm';
        updateExportTabs();
        renderExportCode();
    });

    tabQiskitBtn.addEventListener('click', () => {
        currentExportTab = 'qiskit';
        updateExportTabs();
        renderExportCode();
    });

    tabJsonBtn.addEventListener('click', () => {
        currentExportTab = 'json';
        updateExportTabs();
        renderExportCode();
    });

    function updateExportTabs() {
        [tabQasmBtn, tabQiskitBtn, tabJsonBtn].forEach(b => b.classList.remove('active'));
        if (currentExportTab === 'qasm') tabQasmBtn.classList.add('active');
        if (currentExportTab === 'qiskit') tabQiskitBtn.classList.add('active');
        if (currentExportTab === 'json') tabJsonBtn.classList.add('active');
    }

    function renderExportCode() {
        if (currentExportTab === 'qasm') {
            exportCodeAreaEl.value = CircuitExporter.toQASM(circuit);
        } else if (currentExportTab === 'qiskit') {
            exportCodeAreaEl.value = CircuitExporter.toQiskitPython(circuit);
        } else if (currentExportTab === 'json') {
            exportCodeAreaEl.value = CircuitExporter.toJSON(circuit);
        }
    }

    document.getElementById('btnCopyCode').addEventListener('click', () => {
        exportCodeAreaEl.select();
        navigator.clipboard.writeText(exportCodeAreaEl.value).then(() => {
            showToast('¡Código copiado al portapapeles!');
        });
    });

    // Toast Utility
    function showToast(msg) {
        const toast = document.getElementById('toastNotification');
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('visible');
        setTimeout(() => toast.classList.remove('visible'), 3000);
    }

    // Initial Render
    updateAllViews();
    updateHelperPrompt();
});
