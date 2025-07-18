/**
 * Pattern generation module for the image generator
 */

import { state } from './state.js';

/**
 * Generate SVG pattern string based on current state
 * @returns {string} SVG pattern content
 */
function getPatternSvgString() {
    let patternContent = '';
    const { width, height, pattern, patternColor, patternOpacity, patternCount } = state;
    let seed = 12345; // Fixed seed for consistent patterns
    const random = () => {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    };

    // Pattern generation logic based on selected pattern type
    if (pattern === 'none') {
        return '';
    }

    if (pattern === 'blobs') {
        for (let i = 0; i < patternCount; i++) {
            const r = random() * 50 + 20;
            const cx = random() * width;
            const cy = random() * height;
            patternContent += `<circle cx='${cx}' cy='${cy}' r='${r}' fill='${patternColor}' opacity='${patternOpacity * (random() * 0.5 + 0.5)}' />`;
        }
    } else if (pattern === 'triangles') {
        for (let i = 0; i < patternCount; i++) {
            const size = random() * 80 + 20;
            const x = random() * width;
            const y = random() * height;
            const angle = random() * 360;
            patternContent += `<polygon points='${x},${y - size / 2} ${x - size / 2},${y + size / 2} ${x + size / 2},${y + size / 2}' transform='rotate(${angle} ${x} ${y})' fill='${patternColor}' opacity='${patternOpacity * (random() * 0.5 + 0.5)}' />`;
        }
    } else if (pattern === 'circles') {
        for (let i = 0; i < patternCount; i++) {
            const r = random() * 30 + 5;
            const cx = random() * width;
            const cy = random() * height;
            patternContent += `<circle cx='${cx}' cy='${cy}' r='${r}' stroke='${patternColor}' stroke-width='2' fill='none' opacity='${patternOpacity * (random() * 0.5 + 0.5)}' />`;
        }
    } else if (pattern === 'lines') {
        for (let i = 0; i < patternCount; i++) {
            const x1 = random() * width;
            const y1 = random() * height;
            const x2 = x1 + (random() - 0.5) * 200;
            const y2 = y1 + (random() - 0.5) * 200;
            patternContent += `<line x1='${x1}' y1='${y1}' x2='${x2}' y2='${y2}' stroke='${patternColor}' stroke-width='3' opacity='${patternOpacity * (random() * 0.5 + 0.5)}' />`;
        }
    }

    return patternContent;
}

/**
 * Draw pattern to SVG element
 * @param {HTMLElement} patternSvg - SVG element to draw pattern on
 */
function drawPattern(patternSvg) {
    patternSvg.innerHTML = getPatternSvgString();
}

/**
 * Draw pattern to canvas context
 * @param {CanvasRenderingContext2D} ctx - Canvas context to draw on
 * @param {number} [scaleFactor=1] - Scale factor for high-resolution export
 */
function drawPatternToCanvas(ctx, scaleFactor = 1) {
    const { width, height, pattern, patternColor, patternOpacity, patternCount } = state;

    if (pattern === 'none') return;

    // Save the current context state
    ctx.save();

    // Make sure we're drawing on top of the background
    ctx.globalCompositeOperation = 'source-over';

    // Generate a consistent seed for random pattern generation
    let seed = 12345; // Fixed seed for consistent patterns
    const random = () => {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    };

    // Set pattern styles
    ctx.fillStyle = patternColor;
    ctx.strokeStyle = patternColor;

    // Adjust pattern count based on scale factor for high-res exports
    // This ensures we have enough patterns to fill the larger canvas
    const adjustedPatternCount = Math.max(patternCount, Math.floor(patternCount * Math.sqrt(scaleFactor)));

    // Draw each pattern element
    for (let i = 0; i < adjustedPatternCount; i++) {
        // Calculate opacity for this pattern element
        const opacity = patternOpacity * (random() * 0.5 + 0.5);
        ctx.globalAlpha = opacity;

        switch (pattern) {
            case 'blobs':
                // Draw blob (filled circle)
                const r = random() * 50 + 20;
                const cx = random() * width;
                const cy = random() * height;
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, 2 * Math.PI);
                ctx.fill();
                break;

            case 'triangles':
                // Draw triangle
                const size = random() * 80 + 20;
                const x = random() * width;
                const y = random() * height;
                const angle = random() * 360;

                ctx.save();
                ctx.translate(x, y);
                ctx.rotate((angle * Math.PI) / 180);
                ctx.beginPath();
                ctx.moveTo(0, -size / 2);
                ctx.lineTo(-size / 2, size / 2);
                ctx.lineTo(size / 2, size / 2);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
                break;

            case 'circles':
                // Draw circle outline
                const radius = random() * 30 + 5;
                const circleX = random() * width;
                const circleY = random() * height;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(circleX, circleY, radius, 0, 2 * Math.PI);
                ctx.stroke();
                break;

            case 'lines':
                // Draw line
                const x1 = random() * width;
                const y1 = random() * height;
                const x2 = x1 + (random() - 0.5) * 200;
                const y2 = y1 + (random() - 0.5) * 200;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
                break;
        }
    }

    // Restore the context state
    ctx.globalAlpha = 1; // Reset alpha
    ctx.restore();
}

export { getPatternSvgString, drawPattern, drawPatternToCanvas };
