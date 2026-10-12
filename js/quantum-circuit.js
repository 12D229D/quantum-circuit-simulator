/**
 * QUANTUM CIRCUIT SIMULATOR ENGINE
 * State vector evolution, Dirac notation, measurement collapse, and reduced density matrix calculations.
 */

class QuantumCircuit {
    constructor(numQubits = 3, numSteps = 8) {
        this.numQubits = numQubits;
        this.numSteps = numSteps;
        this.initialState = new Array(numQubits).fill(0); // 0 or 1 for each qubit
        this.grid = []; // grid[qubit][step] = gateObject or null
        this.stepStates = []; // State vector at each step [0..numSteps]
        this.initGrid();
        this.simulate();
    }

    initGrid() {
        this.grid = [];
        for (let q = 0; q < this.numQubits; q++) {
            const row = [];
            for (let s = 0; s < this.numSteps; s++) {
                row.push(null);
            }
            this.grid.push(row);
        }
    }

    setNumQubits(n) {
        if (n < 1 || n > 5) return;
        const oldGrid = this.grid;
        const oldQubits = this.numQubits;
        this.numQubits = n;
        this.initialState = new Array(n).fill(0);
        this.initGrid();

        // Copy existing gates that still fit
        const minQ = Math.min(oldQubits, n);
        for (let q = 0; q < minQ; q++) {
            for (let s = 0; s < this.numSteps; s++) {
                const gate = oldGrid[q][s];
                if (gate) {
                    // Check if multi-qubit gate dependencies fit
                    if (gate.control !== undefined && gate.control >= n) continue;
                    if (gate.control2 !== undefined && gate.control2 >= n) continue;
                    this.grid[q][s] = gate;
                }
            }
        }
        this.simulate();
    }

    setNumSteps(s) {
        if (s < 4 || s > 20) return;
        const oldSteps = this.numSteps;
        this.numSteps = s;
        for (let q = 0; q < this.numQubits; q++) {
            while (this.grid[q].length < s) {
                this.grid[q].push(null);
            }
            if (this.grid[q].length > s) {
                this.grid[q] = this.grid[q].slice(0, s);
            }
        }
        this.simulate();
    }

    setGate(qubit, step, gate) {
        if (qubit >= 0 && qubit < this.numQubits && step >= 0 && step < this.numSteps) {
            this.grid[qubit][step] = gate;
            this.simulate();
        }
    }

    removeGate(qubit, step) {
        if (qubit >= 0 && qubit < this.numQubits && step >= 0 && step < this.numSteps) {
            const current = this.grid[qubit][step];
            this.grid[qubit][step] = null;

            // If it was a multi-qubit target/control, clean up linked controls in other wires if needed
            this.simulate();
        }
    }

    clearCircuit() {
        this.initGrid();
        this.simulate();
    }

    toggleInitialState(qubit) {
        if (qubit >= 0 && qubit < this.numQubits) {
            this.initialState[qubit] = this.initialState[qubit] === 0 ? 1 : 0;
            this.simulate();
        }
    }

    // Main Simulation Function
    simulate() {
        const dim = 1 << this.numQubits;
        this.stepStates = [];

        // 1. Initial State Vector |initialState>
        let initialIndex = 0;
        for (let q = 0; q < this.numQubits; q++) {
            if (this.initialState[q] === 1) {
                initialIndex |= (1 << (this.numQubits - 1 - q));
            }
        }

        let currentState = [];
        for (let i = 0; i < dim; i++) {
            currentState.push(i === initialIndex ? new Complex(1, 0) : new Complex(0, 0));
        }
        this.stepStates.push(currentState);

        // 2. Iterate through each column/step
        for (let s = 0; s < this.numSteps; s++) {
            const actions = [];
            for (let q = 0; q < this.numQubits; q++) {
                const gate = this.grid[q][s];
                if (gate) {
                    actions.push({
                        type: gate.type,
                        target: q,
                        control: gate.control,
                        control2: gate.control2,
                        theta: gate.theta || 0
                    });
                }
            }

            if (actions.length > 0) {
                const stepOp = QuantumMatrix.buildCircuitStepOperator(this.numQubits, actions);
                currentState = stepOp.multVec(currentState);
            }

            this.stepStates.push(currentState);
        }
    }

    getFinalState() {
        return this.stepStates[this.stepStates.length - 1];
    }

    getStateAtStep(step) {
        const idx = Math.min(step, this.stepStates.length - 1);
        return this.stepStates[idx];
    }

    // Formatted Dirac Bra-Ket string (e.g. "0.707|00> + 0.707|11>")
    getDiracNotation(step = null, maxTerms = 8) {
        const state = (step !== null) ? this.getStateAtStep(step) : this.getFinalState();
        const terms = [];

        for (let i = 0; i < state.length; i++) {
            const c = state[i];
            const prob = c.magSq();
            if (prob > 0.0001) {
                const bitstring = i.toString(2).padStart(this.numQubits, '0');
                const ampStr = c.toString(3);
                terms.push({ bitstring, ampStr, prob, amp: c });
            }
        }

        if (terms.length === 0) return '|0...0⟩';

        return terms.slice(0, maxTerms).map(t => {
            const amp = t.amp;
            const r = amp.real;
            const im = amp.imag;

            // Simplified display for common amplitudes like 1, 1/sqrt(2), etc.
            let coeff = '';
            if (Math.abs(r - 1) < 0.001 && Math.abs(im) < 0.001) coeff = '';
            else if (Math.abs(r + 1) < 0.001 && Math.abs(im) < 0.001) coeff = '-';
            else if (Math.abs(im - 1) < 0.001 && Math.abs(r) < 0.001) coeff = 'i';
            else if (Math.abs(im + 1) < 0.001 && Math.abs(r) < 0.001) coeff = '-i';
            else if (Math.abs(r - 1 / Math.SQRT2) < 0.01 && Math.abs(im) < 0.01) coeff = '1/√2 ';
            else if (Math.abs(r + 1 / Math.SQRT2) < 0.01 && Math.abs(im) < 0.01) coeff = '-1/√2 ';
            else coeff = `(${amp.toString(2)}) `;

            return `${coeff}|${t.bitstring}⟩`;
        }).join(' + ');
    }

    // Get probability distribution for all basis states
    getProbabilities(step = null) {
        const state = (step !== null) ? this.getStateAtStep(step) : this.getFinalState();
        return state.map((c, i) => ({
            index: i,
            bitstring: i.toString(2).padStart(this.numQubits, '0'),
            amplitude: c,
            probability: c.magSq(),
            phase: c.phase()
        }));
    }

    // Calculate Reduced Density Matrix ρ for target Qubit (for Bloch Sphere coordinates)
    getReducedDensityMatrix(targetQubit, step = null) {
        const state = (step !== null) ? this.getStateAtStep(step) : this.getFinalState();
        const dim = 1 << this.numQubits;

        // rho = [ [rho_00, rho_01], [rho_10, rho_11] ]
        let rho00 = new Complex(0, 0);
        let rho01 = new Complex(0, 0);
        let rho10 = new Complex(0, 0);
        let rho11 = new Complex(0, 0);

        for (let i = 0; i < dim; i++) {
            const bit = (i >> (this.numQubits - 1 - targetQubit)) & 1;
            const partnerState = i ^ (1 << (this.numQubits - 1 - targetQubit));

            const ci = state[i];
            const cPartner = state[partnerState];

            if (bit === 0) {
                // Diagonal rho_00 += |c_i|^2
                rho00 = rho00.add(ci.mult(ci.conj()));
                // Off-diagonal rho_01 += c_i * c_partner*
                rho01 = rho01.add(ci.mult(cPartner.conj()));
            } else {
                // Diagonal rho_11 += |c_i|^2
                rho11 = rho11.add(ci.mult(ci.conj()));
                // Off-diagonal rho_10 += c_i * c_partner*
                rho10 = rho10.add(ci.mult(cPartner.conj()));
            }
        }

        return [
            [rho00, rho01],
            [rho10, rho11]
        ];
    }

    // Extract Bloch Sphere Coordinates (rx, ry, rz) from reduced density matrix
    getBlochCoordinates(targetQubit, step = null) {
        const rho = this.getReducedDensityMatrix(targetQubit, step);

        // rx = 2 * Re(rho_01)
        const rx = 2 * rho[0][1].real;

        // ry = 2 * Im(rho_10) = -2 * Im(rho_01)
        const ry = 2 * rho[1][0].imag;

        // rz = rho_00 - rho_11
        const rz = rho[0][0].real - rho[1][1].real;

        // Vector length |r| <= 1.0 (purity indicator)
        const purity = Math.sqrt(rx * rx + ry * ry + rz * rz);

        // Spherical angles theta and phi
        const theta = Math.acos(Math.max(-1, Math.min(1, rz / (purity > 0.001 ? purity : 1))));
        const phi = Math.atan2(ry, rx);

        return { rx, ry, rz, purity, theta, phi };
    }

    // Measurement Simulation: Sample N shots
    simulateMeasurement(shots = 1024) {
        const probs = this.getProbabilities();
        const counts = {};

        // Initialize counts
        probs.forEach(p => counts[p.bitstring] = 0);

        // Cumulative distribution
        const cumulative = [];
        let sum = 0;
        for (let i = 0; i < probs.length; i++) {
            sum += probs[i].probability;
            cumulative.push(sum);
        }

        // Sampling
        for (let shot = 0; shot < shots; shot++) {
            const rand = Math.random();
            let selectedBitstring = probs[probs.length - 1].bitstring;
            for (let i = 0; i < cumulative.length; i++) {
                if (rand <= cumulative[i]) {
                    selectedBitstring = probs[i].bitstring;
                    break;
                }
            }
            counts[selectedBitstring]++;
        }

        return {
            shots,
            counts,
            probabilities: probs
        };
    }
}

window.QuantumCircuit = QuantumCircuit;
