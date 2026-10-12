/**
 * QUANTUM PRESETS AND ALGORITHM CATALOG
 * Famous quantum algorithms and demonstration circuits.
 */

const QuantumPresets = {
    bellStatePhiPlus: {
        id: 'bell_phi_plus',
        name: 'Estado de Bell |Φ+⟩ (Entrelazamiento)',
        description: 'Crea un estado entrelazado bipartito maximal (|00⟩ + |11⟩)/√2 aplicando Hadamard y CNOT.',
        numQubits: 2,
        numSteps: 6,
        gates: [
            { qubit: 0, step: 0, type: 'H' },
            { qubit: 1, step: 1, type: 'CNOT', control: 0 }
        ]
    },

    bellStatePsiMinus: {
        id: 'bell_psi_minus',
        name: 'Estado de Bell |Ψ-⟩ (Singlete)',
        description: 'Estado singlete cuántico (|01⟩ - |10⟩)/√2 con correlación antisimétrica.',
        numQubits: 2,
        numSteps: 6,
        gates: [
            { qubit: 0, step: 0, type: 'X' },
            { qubit: 1, step: 0, type: 'X' },
            { qubit: 0, step: 1, type: 'H' },
            { qubit: 1, step: 2, type: 'CNOT', control: 0 }
        ]
    },

    ghzState: {
        id: 'ghz_state',
        name: 'Estado GHZ (3 Qubits Entrelazados)',
        description: 'Entrelazamiento tripartito maximal Greenberger-Horne-Zeilinger (|000⟩ + |111⟩)/√2.',
        numQubits: 3,
        numSteps: 6,
        gates: [
            { qubit: 0, step: 0, type: 'H' },
            { qubit: 1, step: 1, type: 'CNOT', control: 0 },
            { qubit: 2, step: 2, type: 'CNOT', control: 1 }
        ]
    },

    quantumTeleportation: {
        id: 'quantum_teleportation',
        name: 'Protocolo de Teletransportación Cuántica',
        description: 'Transfiere el estado cuántico de q0 a q2 utilizando un par entrelazado (q1, q2) y operaciones de corrección.',
        numQubits: 3,
        numSteps: 8,
        gates: [
            // Prepare unknown state on q0 (e.g. H + T)
            { qubit: 0, step: 0, type: 'H' },
            { qubit: 0, step: 1, type: 'T' },
            // Create EPR pair on (q1, q2)
            { qubit: 1, step: 0, type: 'H' },
            { qubit: 2, step: 1, type: 'CNOT', control: 1 },
            // Bell measurement on (q0, q1)
            { qubit: 1, step: 2, type: 'CNOT', control: 0 },
            { qubit: 0, step: 3, type: 'H' },
            // Classical correction on q2
            { qubit: 2, step: 4, type: 'CNOT', control: 1 },
            { qubit: 2, step: 5, type: 'CZ', control: 0 }
        ]
    },

    deutschAlgorithm: {
        id: 'deutsch_algorithm',
        name: 'Algoritmo de Deutsch',
        description: 'Determina si una función f(x) es constante o balanceada en una sola evaluación cuántica.',
        numQubits: 2,
        numSteps: 6,
        gates: [
            // Prepare inputs |0> and |1>
            { qubit: 1, step: 0, type: 'X' },
            // Superposition
            { qubit: 0, step: 1, type: 'H' },
            { qubit: 1, step: 1, type: 'H' },
            // Oracle (Balanced: CNOT)
            { qubit: 1, step: 2, type: 'CNOT', control: 0 },
            // Interference
            { qubit: 0, step: 3, type: 'H' }
        ]
    },

    qrngUniform: {
        id: 'qrng_uniform',
        name: 'Generador Aleatorio Cuántico (Superposición 3Q)',
        description: 'Crea una superposición equiprobable perfecta de 8 estados de base (12.5% de probabilidad cada uno).',
        numQubits: 3,
        numSteps: 6,
        gates: [
            { qubit: 0, step: 0, type: 'H' },
            { qubit: 1, step: 0, type: 'H' },
            { qubit: 2, step: 0, type: 'H' }
        ]
    },

    halfAdder: {
        id: 'half_adder',
        name: 'Sumador Cuántico (Half-Adder)',
        description: 'Calcula la suma (S = A ⊕ B) en q1 y el acarreo (C = A ∧ B) en q2 mediante Toffoli y CNOT.',
        numQubits: 3,
        numSteps: 6,
        gates: [
            // Inputs A=1, B=1
            { qubit: 0, step: 0, type: 'X' },
            { qubit: 1, step: 0, type: 'X' },
            // Carry: Toffoli
            { qubit: 2, step: 1, type: 'TOFFOLI', control: 0, control2: 1 },
            // Sum: CNOT
            { qubit: 1, step: 2, type: 'CNOT', control: 0 }
        ]
    }
};

window.QuantumPresets = QuantumPresets;
