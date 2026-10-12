/**
 * QUANTUM MATRIX AND TENSOR ENGINE
 * Unitary gates, Kronecker products, and operator expansions for N-qubit systems.
 */

class QuantumMatrix {
    constructor(rows, cols, data = null) {
        this.rows = rows;
        this.cols = cols;
        if (data) {
            this.data = data;
        } else {
            this.data = [];
            for (let r = 0; r < rows; r++) {
                const row = [];
                for (let c = 0; c < cols; c++) {
                    row.push(new Complex(0, 0));
                }
                this.data.push(row);
            }
        }
    }

    static identity(n) {
        const mat = new QuantumMatrix(n, n);
        for (let i = 0; i < n; i++) {
            mat.data[i][i] = new Complex(1, 0);
        }
        return mat;
    }

    static fromArray(arr) {
        const rows = arr.length;
        const cols = arr[0].length;
        const mat = new QuantumMatrix(rows, cols);
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const val = arr[r][c];
                if (val instanceof Complex) {
                    mat.data[r][c] = val.copy();
                } else if (typeof val === 'number') {
                    mat.data[r][c] = new Complex(val, 0);
                }
            }
        }
        return mat;
    }

    mult(other) {
        if (this.cols !== other.rows) {
            throw new Error(`Matrix dimension mismatch: ${this.rows}x${this.cols} * ${other.rows}x${other.cols}`);
        }
        const result = new QuantumMatrix(this.rows, other.cols);
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < other.cols; c++) {
                let sum = new Complex(0, 0);
                for (let k = 0; k < this.cols; k++) {
                    sum = sum.add(this.data[r][k].mult(other.data[k][c]));
                }
                result.data[r][c] = sum;
            }
        }
        return result;
    }

    multVec(vec) {
        if (this.cols !== vec.length) {
            throw new Error(`Dimension mismatch: Matrix ${this.rows}x${this.cols} * Vector ${vec.length}`);
        }
        const result = [];
        for (let r = 0; r < this.rows; r++) {
            let sum = new Complex(0, 0);
            for (let c = 0; c < this.cols; c++) {
                sum = sum.add(this.data[r][c].mult(vec[c]));
            }
            result.push(sum);
        }
        return result;
    }

    // Kronecker / Tensor Product (A ⊗ B)
    tensor(other) {
        const rows = this.rows * other.rows;
        const cols = this.cols * other.cols;
        const result = new QuantumMatrix(rows, cols);

        for (let r1 = 0; r1 < this.rows; r1++) {
            for (let c1 = 0; c1 < this.cols; c1++) {
                const a = this.data[r1][c1];
                for (let r2 = 0; r2 < other.rows; r2++) {
                    for (let c2 = 0; c2 < other.cols; c2++) {
                        const b = other.data[r2][c2];
                        result.data[r1 * other.rows + r2][c1 * other.cols + c2] = a.mult(b);
                    }
                }
            }
        }
        return result;
    }

    // Standard Elementary Gates
    static get I() {
        return QuantumMatrix.fromArray([
            [1, 0],
            [0, 1]
        ]);
    }

    static get H() {
        const invSqrt2 = 1 / Math.SQRT2;
        return QuantumMatrix.fromArray([
            [invSqrt2, invSqrt2],
            [invSqrt2, -invSqrt2]
        ]);
    }

    static get X() {
        return QuantumMatrix.fromArray([
            [0, 1],
            [1, 0]
        ]);
    }

    static get Y() {
        return QuantumMatrix.fromArray([
            [0, new Complex(0, -1)],
            [new Complex(0, 1), 0]
        ]);
    }

    static get Z() {
        return QuantumMatrix.fromArray([
            [1, 0],
            [0, -1]
        ]);
    }

    static get S() {
        return QuantumMatrix.fromArray([
            [1, 0],
            [0, new Complex(0, 1)]
        ]);
    }

    static get S_DAGGER() {
        return QuantumMatrix.fromArray([
            [1, 0],
            [0, new Complex(0, -1)]
        ]);
    }

    static get T() {
        const angle = Math.PI / 4;
        return QuantumMatrix.fromArray([
            [1, 0],
            [0, Complex.fromPolar(1, angle)]
        ]);
    }

    static get T_DAGGER() {
        const angle = -Math.PI / 4;
        return QuantumMatrix.fromArray([
            [1, 0],
            [0, Complex.fromPolar(1, angle)]
        ]);
    }

    static Rx(theta) {
        const cos = Math.cos(theta / 2);
        const sin = Math.sin(theta / 2);
        return QuantumMatrix.fromArray([
            [cos, new Complex(0, -sin)],
            [new Complex(0, -sin), cos]
        ]);
    }

    static Ry(theta) {
        const cos = Math.cos(theta / 2);
        const sin = Math.sin(theta / 2);
        return QuantumMatrix.fromArray([
            [cos, -sin],
            [sin, cos]
        ]);
    }

    static Rz(theta) {
        const half = theta / 2;
        return QuantumMatrix.fromArray([
            [Complex.fromPolar(1, -half), 0],
            [0, Complex.fromPolar(1, half)]
        ]);
    }

    static Phase(phi) {
        return QuantumMatrix.fromArray([
            [1, 0],
            [0, Complex.fromPolar(1, phi)]
        ]);
    }

    static get SWAP() {
        return QuantumMatrix.fromArray([
            [1, 0, 0, 0],
            [0, 0, 1, 0],
            [0, 1, 0, 0],
            [0, 0, 0, 1]
        ]);
    }

    // Build Full Circuit Operator for Single/Multi-qubit gates on an N-qubit system
    static buildCircuitStepOperator(numQubits, gateActions) {
        const dim = 1 << numQubits;
        const fullOp = QuantumMatrix.identity(dim);

        // Process individual gates
        // Sort or apply gates step by step
        let currentMat = QuantumMatrix.identity(dim);

        for (const action of gateActions) {
            const op = QuantumMatrix.buildGateMatrix(numQubits, action);
            currentMat = op.mult(currentMat);
        }

        return currentMat;
    }

    static buildGateMatrix(numQubits, action) {
        const dim = 1 << numQubits;
        const { type, target, control, control2, theta = 0 } = action;

        // 1. Single Qubit Gate
        if (control === undefined || control === null) {
            let singleGate;
            switch (type) {
                case 'H': singleGate = QuantumMatrix.H; break;
                case 'X': singleGate = QuantumMatrix.X; break;
                case 'Y': singleGate = QuantumMatrix.Y; break;
                case 'Z': singleGate = QuantumMatrix.Z; break;
                case 'S': singleGate = QuantumMatrix.S; break;
                case 'SDG': singleGate = QuantumMatrix.S_DAGGER; break;
                case 'T': singleGate = QuantumMatrix.T; break;
                case 'TDG': singleGate = QuantumMatrix.T_DAGGER; break;
                case 'RX': singleGate = QuantumMatrix.Rx(theta); break;
                case 'RY': singleGate = QuantumMatrix.Ry(theta); break;
                case 'RZ': singleGate = QuantumMatrix.Rz(theta); break;
                case 'I':
                default:
                    singleGate = QuantumMatrix.I; break;
            }

            // Kronecker product: I ⊗ ... ⊗ SingleGate ⊗ ... ⊗ I
            let mat = (target === 0) ? singleGate : QuantumMatrix.I;
            for (let q = 1; q < numQubits; q++) {
                const nextGate = (q === target) ? singleGate : QuantumMatrix.I;
                mat = mat.tensor(nextGate);
            }
            return mat;
        }

        // 2. Multi-Qubit Controlled Gates (CNOT, CZ, Toffoli, SWAP)
        const mat = new QuantumMatrix(dim, dim);

        for (let i = 0; i < dim; i++) {
            // Check bit conditions for state |i>
            // bit at position q is ((i >> (numQubits - 1 - q)) & 1)
            const getBit = (state, q) => (state >> (numQubits - 1 - q)) & 1;
            const flipBit = (state, q) => state ^ (1 << (numQubits - 1 - q));

            if (type === 'CNOT' || type === 'CX') {
                const ctrlBit = getBit(i, control);
                if (ctrlBit === 1) {
                    const targetState = flipBit(i, target);
                    mat.data[targetState][i] = new Complex(1, 0);
                } else {
                    mat.data[i][i] = new Complex(1, 0);
                }
            } else if (type === 'CZ') {
                const ctrlBit = getBit(i, control);
                const targetBit = getBit(i, target);
                if (ctrlBit === 1 && targetBit === 1) {
                    mat.data[i][i] = new Complex(-1, 0);
                } else {
                    mat.data[i][i] = new Complex(1, 0);
                }
            } else if (type === 'SWAP') {
                const b1 = getBit(i, control);
                const b2 = getBit(i, target);
                if (b1 !== b2) {
                    let targetState = flipBit(i, control);
                    targetState = flipBit(targetState, target);
                    mat.data[targetState][i] = new Complex(1, 0);
                } else {
                    mat.data[i][i] = new Complex(1, 0);
                }
            } else if (type === 'TOFFOLI' || type === 'CCNOT') {
                const c1 = getBit(i, control);
                const c2 = getBit(i, control2);
                if (c1 === 1 && c2 === 1) {
                    const targetState = flipBit(i, target);
                    mat.data[targetState][i] = new Complex(1, 0);
                } else {
                    mat.data[i][i] = new Complex(1, 0);
                }
            }
        }

        return mat;
    }
}

window.QuantumMatrix = QuantumMatrix;
