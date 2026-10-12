/**
 * COMPLEX NUMBER MATH LIBRARY FOR QUANTUM COMPUTING
 * Handles arithmetic, polar forms, Euler's formula e^(i*theta), and formatting.
 */

class Complex {
    constructor(real = 0, imag = 0) {
        this.real = real;
        this.imag = imag;
    }

    static fromPolar(r, theta) {
        return new Complex(r * Math.cos(theta), r * Math.sin(theta));
    }

    static zero() {
        return new Complex(0, 0);
    }

    static one() {
        return new Complex(1, 0);
    }

    static i() {
        return new Complex(0, 1);
    }

    copy() {
        return new Complex(this.real, this.imag);
    }

    add(other) {
        if (typeof other === 'number') {
            return new Complex(this.real + other, this.imag);
        }
        return new Complex(this.real + other.real, this.imag + other.imag);
    }

    sub(other) {
        if (typeof other === 'number') {
            return new Complex(this.real - other, this.imag);
        }
        return new Complex(this.real - other.real, this.imag - other.imag);
    }

    mult(other) {
        if (typeof other === 'number') {
            return new Complex(this.real * other, this.imag * other);
        }
        // (a + bi)(c + di) = (ac - bd) + (ad + bc)i
        return new Complex(
            this.real * other.real - this.imag * other.imag,
            this.real * other.imag + this.imag * other.real
        );
    }

    div(other) {
        if (typeof other === 'number') {
            return new Complex(this.real / other, this.imag / other);
        }
        const denom = other.real * other.real + other.imag * other.imag;
        if (denom === 0) throw new Error('Division by zero in Complex.div');
        return new Complex(
            (this.real * other.real + this.imag * other.imag) / denom,
            (this.imag * other.real - this.real * other.imag) / denom
        );
    }

    conj() {
        return new Complex(this.real, -this.imag);
    }

    magSq() {
        return this.real * this.real + this.imag * this.imag;
    }

    mag() {
        return Math.sqrt(this.magSq());
    }

    phase() {
        return Math.atan2(this.imag, this.real);
    }

    isZero(tolerance = 1e-10) {
        return Math.abs(this.real) < tolerance && Math.abs(this.imag) < tolerance;
    }

    toString(decimals = 3) {
        const r = parseFloat(this.real.toFixed(decimals));
        const i = parseFloat(this.imag.toFixed(decimals));

        if (i === 0) return `${r}`;
        if (r === 0) {
            if (i === 1) return 'i';
            if (i === -1) return '-i';
            return `${i}i`;
        }
        const sign = i > 0 ? '+' : '-';
        const absI = Math.abs(i);
        const iStr = absI === 1 ? 'i' : `${absI}i`;
        return `${r} ${sign} ${iStr}`;
    }
}

// Global export for vanilla browser usage
window.Complex = Complex;
