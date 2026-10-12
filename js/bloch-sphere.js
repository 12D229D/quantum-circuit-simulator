/**
 * 3D INTERACTIVE BLOCH SPHERE RENDERER
 * Canvas 2D isometric/3D projection with orbit drag controls, quantum state vector, and purity metrics.
 */

class BlochSphereRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // Rotation angles (radians)
        this.yaw = 0.65;    // Horizontal rotation
        this.pitch = 0.35;  // Vertical tilt

        // Dragging state
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;

        // Vector state to render
        this.targetCoords = { rx: 0, ry: 0, rz: 1, purity: 1, theta: 0, phi: 0 };
        this.currentCoords = { rx: 0, ry: 0, rz: 1, purity: 1, theta: 0, phi: 0 };

        this.radius = 110;
        this.center = { x: this.canvas.width / 2, y: this.canvas.height / 2 };

        this.bindEvents();
        this.startLoop();
    }

    bindEvents() {
        const getPos = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            if (e.touches && e.touches[0]) {
                return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
            }
            return { x: e.clientX - rect.left, y: e.clientY - rect.top };
        };

        const onStart = (e) => {
            this.isDragging = true;
            const pos = getPos(e);
            this.lastMouseX = pos.x;
            this.lastMouseY = pos.y;
        };

        const onMove = (e) => {
            if (!this.isDragging) return;
            const pos = getPos(e);
            const dx = pos.x - this.lastMouseX;
            const dy = pos.y - this.lastMouseY;
            this.yaw += dx * 0.012;
            this.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.pitch + dy * 0.012));
            this.lastMouseX = pos.x;
            this.lastMouseY = pos.y;
        };

        const onEnd = () => {
            this.isDragging = false;
        };

        this.canvas.addEventListener('mousedown', onStart);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onEnd);

        this.canvas.addEventListener('touchstart', onStart, { passive: true });
        window.addEventListener('touchmove', onMove, { passive: true });
        window.addEventListener('touchend', onEnd);
    }

    setCoordinates(coords) {
        this.targetCoords = coords;
    }

    // 3D to 2D projection: coordinates in standard physics frame (X: right/front, Y: right/in, Z: up)
    project3D(x, y, z) {
        // Rotate around Y-axis (Yaw)
        const cosY = Math.cos(this.yaw);
        const sinY = Math.sin(this.yaw);
        const x1 = x * cosY - y * sinY;
        const y1 = x * sinY + y * cosY;

        // Rotate around X-axis (Pitch)
        const cosP = Math.cos(this.pitch);
        const sinP = Math.sin(this.pitch);
        const y2 = y1 * cosP - z * sinP;
        const z2 = y1 * sinP + z * cosP;

        // Isometric projection to canvas coordinates
        const screenX = this.center.x + x1 * this.radius;
        const screenY = this.center.y - z2 * this.radius;

        return { x: screenX, y: screenY, depth: y2 };
    }

    startLoop() {
        const render = () => {
            // Smooth interpolation towards target vector
            const lerp = 0.15;
            this.currentCoords.rx += (this.targetCoords.rx - this.currentCoords.rx) * lerp;
            this.currentCoords.ry += (this.targetCoords.ry - this.currentCoords.ry) * lerp;
            this.currentCoords.rz += (this.targetCoords.rz - this.currentCoords.rz) * lerp;
            this.currentCoords.purity += (this.targetCoords.purity - this.currentCoords.purity) * lerp;

            this.draw();
            requestAnimationFrame(render);
        };
        requestAnimationFrame(render);
    }

    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Center origin
        this.center = { x: this.canvas.width / 2, y: this.canvas.height / 2 + 10 };

        // 1. Sphere Surface Backlight Gradient
        const bgGrad = ctx.createRadialGradient(
            this.center.x, this.center.y, 10,
            this.center.x, this.center.y, this.radius
        );
        bgGrad.addColorStop(0, 'rgba(0, 240, 255, 0.08)');
        bgGrad.addColorStop(0.7, 'rgba(180, 0, 255, 0.04)');
        bgGrad.addColorStop(1, 'rgba(10, 0, 30, 0.6)');

        ctx.fillStyle = bgGrad;
        ctx.beginPath();
        ctx.arc(this.center.x, this.center.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // 2. Wireframe Circles (Equator, Prime Meridian, Latitudes)
        this.drawWireframe();

        // 3. Coordinate Axes (X, Y, Z)
        this.drawAxes();

        // 4. Bloch State Vector Arrow
        this.drawStateVector();

        // 5. HUD Info Overlay
        this.drawHUD();
    }

    drawWireframe() {
        const ctx = this.ctx;

        // Outer rim
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 8;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(this.center.x, this.center.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.shadowBlur = 0;

        // Equator Circle (XY plane at Z=0)
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const steps = 48;
        for (let i = 0; i <= steps; i++) {
            const angle = (i / steps) * Math.PI * 2;
            const p = this.project3D(Math.cos(angle), Math.sin(angle), 0);
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();

        // XZ Meridian (Y=0)
        ctx.strokeStyle = 'rgba(255, 0, 229, 0.18)';
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
            const angle = (i / steps) * Math.PI * 2;
            const p = this.project3D(Math.cos(angle), 0, Math.sin(angle));
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();

        // YZ Meridian (X=0)
        ctx.strokeStyle = 'rgba(180, 0, 255, 0.18)';
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
            const angle = (i / steps) * Math.PI * 2;
            const p = this.project3D(0, Math.cos(angle), Math.sin(angle));
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
    }

    drawAxes() {
        const ctx = this.ctx;
        const origin = this.project3D(0, 0, 0);

        // Z-Axis (Vertical: |0> Top, |1> Bottom)
        const zPlus = this.project3D(0, 0, 1.25);
        const zMinus = this.project3D(0, 0, -1.25);

        ctx.strokeStyle = 'rgba(255, 230, 0, 0.6)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(zMinus.x, zMinus.y);
        ctx.lineTo(zPlus.x, zPlus.y);
        ctx.stroke();

        // X-Axis (|+>, |->)
        const xPlus = this.project3D(1.25, 0, 0);
        const xMinus = this.project3D(-1.25, 0, 0);

        ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
        ctx.beginPath();
        ctx.moveTo(xMinus.x, xMinus.y);
        ctx.lineTo(xPlus.x, xPlus.y);
        ctx.stroke();

        // Y-Axis (|i>, |-i>)
        const yPlus = this.project3D(0, 1.25, 0);
        const yMinus = this.project3D(0, -1.25, 0);

        ctx.strokeStyle = 'rgba(255, 0, 229, 0.5)';
        ctx.beginPath();
        ctx.moveTo(yMinus.x, yMinus.y);
        ctx.lineTo(yPlus.x, yPlus.y);
        ctx.stroke();

        // Labels
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillStyle = '#ffe600';
        ctx.fillText('|0⟩ (+Z)', zPlus.x, zPlus.y - 10);
        ctx.fillText('|1⟩ (-Z)', zMinus.x, zMinus.y + 10);

        ctx.fillStyle = '#00f0ff';
        ctx.fillText('|+⟩ (+X)', xPlus.x + 8, xPlus.y);
        ctx.fillText('|-⟩ (-X)', xMinus.x - 8, xMinus.y);

        ctx.fillStyle = '#ff00e5';
        ctx.fillText('|i⟩ (+Y)', yPlus.x + 8, yPlus.y);
        ctx.fillText('|-i⟩ (-Y)', yMinus.x - 8, yMinus.y);
    }

    drawStateVector() {
        const ctx = this.ctx;
        const origin = this.project3D(0, 0, 0);
        const tip = this.project3D(
            this.currentCoords.rx,
            this.currentCoords.ry,
            this.currentCoords.rz
        );

        const purity = Math.max(0, Math.min(1, this.currentCoords.purity));
        const isEntangled = purity < 0.95;

        // Color based on purity: green if pure, orange/red if mixed/entangled
        const vectorColor = isEntangled ? '#ff7700' : '#00ff88';

        // Shadow & glow
        ctx.save();
        ctx.shadowColor = vectorColor;
        ctx.shadowBlur = 12;
        ctx.strokeStyle = vectorColor;
        ctx.lineWidth = 3;

        // Vector line from origin to tip
        ctx.beginPath();
        ctx.moveTo(origin.x, origin.y);
        ctx.lineTo(tip.x, tip.y);
        ctx.stroke();

        // Arrow tip ball
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    drawHUD() {
        const ctx = this.ctx;
        const purity = this.targetCoords.purity;
        const isEntangled = purity < 0.95;

        ctx.save();
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillStyle = '#a0a0c0';
        ctx.textAlign = 'left';

        ctx.fillText(`θ = ${(this.targetCoords.theta * 180 / Math.PI).toFixed(1)}°`, 10, 20);
        ctx.fillText(`φ = ${(this.targetCoords.phi * 180 / Math.PI).toFixed(1)}°`, 10, 34);
        ctx.fillText(`|r| = ${purity.toFixed(3)}`, 10, 48);

        if (isEntangled) {
            ctx.fillStyle = '#ff7700';
            ctx.fillText('ENTRELAZADO (ESTADO MIXTO)', 10, 62);
        } else {
            ctx.fillStyle = '#00ff88';
            ctx.fillText('ESTADO PURO', 10, 62);
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.textAlign = 'right';
        ctx.fillText('Arrastra para rotar', this.canvas.width - 10, this.canvas.height - 10);

        ctx.restore();
    }
}

window.BlochSphereRenderer = BlochSphereRenderer;
