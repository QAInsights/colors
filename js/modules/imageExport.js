/**
 * Image export/download functionality module for the image generator
 */

import { state } from './state.js';
import { drawPatternToCanvas } from './patterns.js';
import { drawTextToCanvas } from './textHandling.js';

/**
 * Create a high-resolution canvas for export
 * @param {number} scaleFactor - Scale factor for high resolution
 * @returns {Object} Object containing canvas, context, and scaleFactor
 */
function createHighResolutionCanvas(scaleFactor = 4) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Set canvas dimensions with scale factor for high resolution
    canvas.width = state.width * scaleFactor;
    canvas.height = state.height * scaleFactor;

    // Scale the context to match
    ctx.scale(scaleFactor, scaleFactor);

    // Enable high-quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.textRenderingOptimization = 'optimizeQuality';

    return { canvas, ctx, scaleFactor };
}

/**
 * Draw background to canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context to draw on
 * @returns {Promise} Promise that resolves when background is drawn
 */
function drawBackgroundToCanvas(ctx) {
    const {
        width,
        height,
        bgType,
        color1,
        gradientColors,
        gradientAngle,
        imageSrc,
        imageBlur,
        imageOpacity,
        imageFit
    } = state;

    switch (bgType) {
        case 'color':
            ctx.fillStyle = color1;
            ctx.fillRect(0, 0, width, height);
            break;

        case 'gradient':
            if (gradientColors.length > 1) {
                const angleRad = (gradientAngle * Math.PI) / 180;
                const x1 = width / 2 - Math.cos(angleRad) * width / 2;
                const y1 = height / 2 - Math.sin(angleRad) * height / 2;
                const x2 = width / 2 + Math.cos(angleRad) * width / 2;
                const y2 = height / 2 + Math.sin(angleRad) * height / 2;

                const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
                gradientColors.forEach((color, index) => {
                    gradient.addColorStop(index / (gradientColors.length - 1), color);
                });

                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);
            }
            break;

        case 'image':
            if (imageSrc) {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.crossOrigin = "Anonymous";

                    img.onload = () => {
                        // Create a temporary canvas for applying blur
                        const tempCanvas = document.createElement('canvas');
                        const tempCtx = tempCanvas.getContext('2d');
                        tempCanvas.width = width;
                        tempCanvas.height = height;

                        // Calculate image dimensions based on fit mode
                        let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
                        const imgRatio = img.width / img.height;
                        const canvasRatio = width / height;

                        switch (imageFit) {
                            case 'cover':
                                // Cover: fill the entire canvas while maintaining aspect ratio
                                if (imgRatio > canvasRatio) {
                                    // Image is wider than canvas
                                    drawHeight = height;
                                    drawWidth = height * imgRatio;
                                    offsetX = (width - drawWidth) / 2;
                                } else {
                                    // Image is taller than canvas
                                    drawWidth = width;
                                    drawHeight = width / imgRatio;
                                    offsetY = (height - drawHeight) / 2;
                                }
                                break;

                            case 'contain':
                                // Contain: fit the entire image within the canvas while maintaining aspect ratio
                                if (imgRatio > canvasRatio) {
                                    // Image is wider than canvas
                                    drawWidth = width;
                                    drawHeight = width / imgRatio;
                                    offsetY = (height - drawHeight) / 2;
                                } else {
                                    // Image is taller than canvas
                                    drawHeight = height;
                                    drawWidth = height * imgRatio;
                                    offsetX = (width - drawWidth) / 2;
                                }
                                break;

                            case 'original':
                                // Original: use the actual image dimensions
                                drawWidth = img.width;
                                drawHeight = img.height;
                                offsetX = (width - drawWidth) / 2;
                                offsetY = (height - drawHeight) / 2;

                                // Ensure the image is centered and doesn't exceed canvas dimensions
                                if (drawWidth > width) {
                                    const scale = width / drawWidth;
                                    drawWidth *= scale;
                                    drawHeight *= scale;
                                    offsetX = 0;
                                }

                                if (drawHeight > height) {
                                    const scale = height / drawHeight;
                                    drawWidth *= scale;
                                    drawHeight *= scale;
                                    offsetY = 0;
                                }
                                break;

                            default:
                                // Default to contain
                                if (imgRatio > canvasRatio) {
                                    drawWidth = width;
                                    drawHeight = width / imgRatio;
                                    offsetY = (height - drawHeight) / 2;
                                } else {
                                    drawHeight = height;
                                    drawWidth = height * imgRatio;
                                    offsetX = (width - drawWidth) / 2;
                                }
                        }

                        // Draw the image to the temporary canvas
                        tempCtx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

                        // Apply blur if needed
                        if (imageBlur > 0) {
                            // We need to apply the blur manually since we can't use CSS filters in canvas
                            // This is a simplified blur implementation
                            const blurredCanvas = applyBlurToCanvas(tempCanvas, imageBlur);
                            tempCtx.clearRect(0, 0, width, height);
                            tempCtx.drawImage(blurredCanvas, 0, 0);
                        }

                        // Apply opacity if needed
                        if (imageOpacity < 1) {
                            tempCtx.globalCompositeOperation = 'source-atop';
                            tempCtx.fillStyle = `rgba(255, 255, 255, ${1 - imageOpacity})`;
                            tempCtx.fillRect(0, 0, width, height);
                        }

                        // Draw the processed image to the main canvas
                        ctx.drawImage(tempCanvas, 0, 0);
                        resolve();
                    };

                    img.onerror = () => {
                        console.error('Error loading image');
                        // Fallback to a colored background
                        ctx.fillStyle = '#f0f0f0';
                        ctx.fillRect(0, 0, width, height);
                        resolve();
                    };

                    img.src = imageSrc;
                });
            }
            break;
    }

    return Promise.resolve();
}

/**
 * Apply blur effect to a canvas
 * @param {HTMLCanvasElement} canvas - Canvas to blur
 * @param {number} blurAmount - Amount of blur to apply
 * @returns {HTMLCanvasElement} Blurred canvas
 */
function applyBlurToCanvas(canvas, blurAmount) {
    // Amplify the blur amount to make it more noticeable
    // The CSS blur and canvas blur don't match exactly, so we need to increase it
    const amplifiedBlur = blurAmount * 3;

    const blurCanvas = document.createElement('canvas');
    const blurCtx = blurCanvas.getContext('2d');
    blurCanvas.width = canvas.width;
    blurCanvas.height = canvas.height;

    // Draw the original canvas to the blur canvas
    blurCtx.drawImage(canvas, 0, 0);

    // Use stack blur algorithm for better quality
    stackBlur(blurCanvas, 0, 0, blurCanvas.width, blurCanvas.height, amplifiedBlur);

    return blurCanvas;
}

/**
 * Stack Blur Algorithm by Mario Klingemann <mario@quasimondo.com>
 * Modified for our use case
 */
function stackBlur(canvas, x, y, width, height, radius) {
    const context = canvas.getContext('2d');
    const imageData = context.getImageData(x, y, width, height);
    const pixels = imageData.data;

    let x1, y1, x2, y2, i, p, yp, yi, yw, r_sum, g_sum, b_sum, a_sum,
        r_out_sum, g_out_sum, b_out_sum, a_out_sum,
        r_in_sum, g_in_sum, b_in_sum, a_in_sum,
        pr, pg, pb, pa, rbs;

    const div = radius + radius + 1;
    const widthMinus1 = width - 1;
    const heightMinus1 = height - 1;
    const radiusPlus1 = radius + 1;
    const sumFactor = radiusPlus1 * (radiusPlus1 + 1) / 2;

    const stackStart = new BlurStack();
    let stack = stackStart;
    let stackEnd;
    for (i = 1; i < div; i++) {
        stack = stack.next = new BlurStack();
        if (i === radiusPlus1) stackEnd = stack;
    }
    stack.next = stackStart;

    let stackIn, stackOut, stackCurrent;

    yw = yi = 0;

    const mul_sum = mul_table[radius];
    const shg_sum = shg_table[radius];

    for (y1 = 0; y1 < height; y1++) {
        r_in_sum = g_in_sum = b_in_sum = a_in_sum = r_sum = g_sum = b_sum = a_sum = 0;

        r_out_sum = radiusPlus1 * (pr = pixels[yi]);
        g_out_sum = radiusPlus1 * (pg = pixels[yi + 1]);
        b_out_sum = radiusPlus1 * (pb = pixels[yi + 2]);
        a_out_sum = radiusPlus1 * (pa = pixels[yi + 3]);

        r_sum += sumFactor * pr;
        g_sum += sumFactor * pg;
        b_sum += sumFactor * pb;
        a_sum += sumFactor * pa;

        stack = stackStart;

        for (i = 0; i < radiusPlus1; i++) {
            stack.r = pr;
            stack.g = pg;
            stack.b = pb;
            stack.a = pa;
            stack = stack.next;
        }

        for (i = 1; i < radiusPlus1; i++) {
            p = yi + ((widthMinus1 < i ? widthMinus1 : i) << 2);
            r_sum += (stack.r = (pr = pixels[p])) * (rbs = radiusPlus1 - i);
            g_sum += (stack.g = (pg = pixels[p + 1])) * rbs;
            b_sum += (stack.b = (pb = pixels[p + 2])) * rbs;
            a_sum += (stack.a = (pa = pixels[p + 3])) * rbs;

            r_in_sum += pr;
            g_in_sum += pg;
            b_in_sum += pb;
            a_in_sum += pa;

            stack = stack.next;
        }

        stackIn = stackStart;
        stackOut = stackEnd;

        for (x1 = 0; x1 < width; x1++) {
            pixels[yi] = (r_sum * mul_sum) >> shg_sum;
            pixels[yi + 1] = (g_sum * mul_sum) >> shg_sum;
            pixels[yi + 2] = (b_sum * mul_sum) >> shg_sum;
            pixels[yi + 3] = (a_sum * mul_sum) >> shg_sum;

            r_sum -= r_out_sum;
            g_sum -= g_out_sum;
            b_sum -= b_out_sum;
            a_sum -= a_out_sum;

            r_out_sum -= stackIn.r;
            g_out_sum -= stackIn.g;
            b_out_sum -= stackIn.b;
            a_out_sum -= stackIn.a;

            p = (yw + ((p = x1 + radius + 1) < widthMinus1 ? p : widthMinus1)) << 2;

            r_in_sum += (stackIn.r = pixels[p]);
            g_in_sum += (stackIn.g = pixels[p + 1]);
            b_in_sum += (stackIn.b = pixels[p + 2]);
            a_in_sum += (stackIn.a = pixels[p + 3]);

            r_sum += r_in_sum;
            g_sum += g_in_sum;
            b_sum += b_in_sum;
            a_sum += a_in_sum;

            stackIn = stackIn.next;

            r_out_sum += (pr = stackOut.r);
            g_out_sum += (pg = stackOut.g);
            b_out_sum += (pb = stackOut.b);
            a_out_sum += (pa = stackOut.a);

            r_in_sum -= pr;
            g_in_sum -= pg;
            b_in_sum -= pb;
            a_in_sum -= pa;

            stackOut = stackOut.next;

            yi += 4;
        }
        yw += width;
    }

    for (x1 = 0; x1 < width; x1++) {
        g_in_sum = b_in_sum = a_in_sum = r_in_sum = g_sum = b_sum = a_sum = r_sum = 0;

        yi = x1 << 2;
        r_out_sum = radiusPlus1 * (pr = pixels[yi]);
        g_out_sum = radiusPlus1 * (pg = pixels[yi + 1]);
        b_out_sum = radiusPlus1 * (pb = pixels[yi + 2]);
        a_out_sum = radiusPlus1 * (pa = pixels[yi + 3]);

        r_sum += sumFactor * pr;
        g_sum += sumFactor * pg;
        b_sum += sumFactor * pb;
        a_sum += sumFactor * pa;

        stack = stackStart;

        for (i = 0; i < radiusPlus1; i++) {
            stack.r = pr;
            stack.g = pg;
            stack.b = pb;
            stack.a = pa;
            stack = stack.next;
        }

        yp = width;

        for (i = 1; i <= radius; i++) {
            yi = (yp + x1) << 2;

            r_sum += (stack.r = (pr = pixels[yi])) * (rbs = radiusPlus1 - i);
            g_sum += (stack.g = (pg = pixels[yi + 1])) * rbs;
            b_sum += (stack.b = (pb = pixels[yi + 2])) * rbs;
            a_sum += (stack.a = (pa = pixels[yi + 3])) * rbs;

            r_in_sum += pr;
            g_in_sum += pg;
            b_in_sum += pb;
            a_in_sum += pa;

            stack = stack.next;

            if (i < heightMinus1) {
                yp += width;
            }
        }

        yi = x1;
        stackIn = stackStart;
        stackOut = stackEnd;

        for (y1 = 0; y1 < height; y1++) {
            p = yi << 2;
            pixels[p] = (r_sum * mul_sum) >> shg_sum;
            pixels[p + 1] = (g_sum * mul_sum) >> shg_sum;
            pixels[p + 2] = (b_sum * mul_sum) >> shg_sum;
            pixels[p + 3] = (a_sum * mul_sum) >> shg_sum;

            r_sum -= r_out_sum;
            g_sum -= g_out_sum;
            b_sum -= b_out_sum;
            a_sum -= a_out_sum;

            r_out_sum -= stackIn.r;
            g_out_sum -= stackIn.g;
            b_out_sum -= stackIn.b;
            a_out_sum -= stackIn.a;

            p = (x1 + (((p = y1 + radiusPlus1) < heightMinus1 ? p : heightMinus1) * width)) << 2;

            r_sum += (r_in_sum += (stackIn.r = pixels[p]));
            g_sum += (g_in_sum += (stackIn.g = pixels[p + 1]));
            b_sum += (b_in_sum += (stackIn.b = pixels[p + 2]));
            a_sum += (a_in_sum += (stackIn.a = pixels[p + 3]));

            stackIn = stackIn.next;

            r_out_sum += (pr = stackOut.r);
            g_out_sum += (pg = stackOut.g);
            b_out_sum += (pb = stackOut.b);
            a_out_sum += (pa = stackOut.a);

            r_in_sum -= pr;
            g_in_sum -= pg;
            b_in_sum -= pb;
            a_in_sum -= pa;

            stackOut = stackOut.next;

            yi += width;
        }
    }

    context.putImageData(imageData, x, y);
}

// BlurStack class for the stack blur algorithm
class BlurStack {
    constructor() {
        this.r = 0;
        this.g = 0;
        this.b = 0;
        this.a = 0;
        this.next = null;
    }
}

// Pre-calculated tables for the stack blur algorithm
const mul_table = [
    512, 512, 456, 512, 328, 456, 335, 512, 405, 328, 271, 456, 388, 335, 292, 512,
    454, 405, 364, 328, 298, 271, 496, 456, 420, 388, 360, 335, 312, 292, 273, 512,
    482, 454, 428, 405, 383, 364, 345, 328, 312, 298, 284, 271, 259, 496, 475, 456,
    437, 420, 404, 388, 374, 360, 347, 335, 323, 312, 302, 292, 282, 273, 265, 512,
    497, 482, 468, 454, 441, 428, 417, 405, 394, 383, 373, 364, 354, 345, 337, 328,
    320, 312, 305, 298, 291, 284, 278, 271, 265, 259, 507, 496, 485, 475, 465, 456,
    446, 437, 428, 420, 412, 404, 396, 388, 381, 374, 367, 360, 354, 347, 341, 335,
    329, 323, 318, 312, 307, 302, 297, 292, 287, 282, 278, 273, 269, 265, 261, 512,
    505, 497, 489, 482, 475, 468, 461, 454, 447, 441, 435, 428, 422, 417, 411, 405,
    399, 394, 389, 383, 378, 373, 368, 364, 359, 354, 350, 345, 341, 337, 332, 328,
    324, 320, 316, 312, 309, 305, 301, 298, 294, 291, 287, 284, 281, 278, 274, 271,
    268, 265, 262, 259, 257, 507, 501, 496, 491, 485, 480, 475, 470, 465, 460, 456,
    451, 446, 442, 437, 433, 428, 424, 420, 416, 412, 408, 404, 400, 396, 392, 388,
    385, 381, 377, 374, 370, 367, 363, 360, 357, 354, 350, 347, 344, 341, 338, 335,
    332, 329, 326, 323, 320, 318, 315, 312, 310, 307, 304, 302, 299, 297, 294, 292,
    289, 287, 285, 282, 280, 278, 275, 273, 271, 269, 267, 265, 263, 261, 259
];

const shg_table = [
    9, 11, 12, 13, 13, 14, 14, 15, 15, 15, 15, 16, 16, 16, 16, 17,
    17, 17, 17, 17, 17, 17, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19,
    19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 20, 20, 20,
    20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 21,
    21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21,
    21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 22, 22, 22, 22, 22, 22,
    22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22,
    22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 23,
    23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
    23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
    23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
    23, 23, 23, 23, 23, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
    24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
    24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
    24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
    24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24
];

/**
 * Trigger download of a data URL
 * @param {string} filename - Name of the file to download
 * @param {string} dataUrl - Data URL to download
 */
function triggerDownload(filename, dataUrl) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Download high-resolution image
 * @param {string} format - Image format ('png' or 'jpeg')
 * @param {number} scaleFactor - Scale factor for high resolution
 */
async function downloadHighResolutionImage(format = 'png', scaleFactor = 4) {
    const { canvas, ctx } = createHighResolutionCanvas(scaleFactor);

    try {
        // Draw background
        await drawBackgroundToCanvas(ctx);

        // Draw pattern
        drawPatternToCanvas(ctx);

        // Draw text
        drawTextToCanvas(ctx, scaleFactor);

        // Apply border radius if needed
        if (state.borderRadius > 0) {
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;

            // Create rounded rectangle mask
            const radius = state.borderRadius * scaleFactor;
            tempCtx.beginPath();
            tempCtx.roundRect(0, 0, canvas.width, canvas.height, radius);
            tempCtx.clip();

            // Draw the original canvas onto the masked canvas
            tempCtx.drawImage(canvas, 0, 0);

            // Use the masked canvas for download
            const mimeType = `image/${format}`;
            const quality = format === 'jpeg' ? 0.95 : 1.0;
            const dataUrl = tempCanvas.toDataURL(mimeType, quality);
            const filename = `high-res-image-${state.width}x${state.height}-${scaleFactor}x.${format}`;
            triggerDownload(filename, dataUrl);
        } else {
            // No border radius, use original canvas
            const mimeType = `image/${format}`;
            const quality = format === 'jpeg' ? 0.95 : 1.0;
            const dataUrl = canvas.toDataURL(mimeType, quality);
            const filename = `high-res-image-${state.width}x${state.height}-${scaleFactor}x.${format}`;
            triggerDownload(filename, dataUrl);
        }

    } catch (error) {
        console.error('Error generating high-resolution image:', error);
        alert('Error generating high-resolution image. Please try again.');
    }
}

/**
 * Fallback function using html2canvas for compatibility
 * @param {HTMLElement} preview - The preview element
 * @param {string} format - Image format ('png' or 'jpeg')
 */
function downloadRasterImage(preview, format = 'png') {
    // Temporarily remove text drag handles for clean capture
    const textPreview = document.getElementById('textPreview');
    textPreview.style.cursor = 'default';

    html2canvas(preview, {
        backgroundColor: null, // Use transparent background
        logging: false,
        useCORS: true,
        scale: 2 // Increase resolution
    }).then(canvas => {
        const mimeType = `image/${format}`;
        const dataUrl = canvas.toDataURL(mimeType, format === 'jpeg' ? 0.9 : 1.0);
        const filename = `image-${state.width}x${state.height}.${format}`;
        triggerDownload(filename, dataUrl);

        // Restore text drag handles
        textPreview.style.cursor = 'grab';
    });
}

/**
 * Escape HTML special characters
 * @param {string} unsafe - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(unsafe) {
    return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

export {
    createHighResolutionCanvas,
    drawBackgroundToCanvas,
    triggerDownload,
    downloadHighResolutionImage,
    downloadRasterImage,
    escapeHtml
};
