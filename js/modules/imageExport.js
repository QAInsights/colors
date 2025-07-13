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
    const { width, height, bgType, color1, gradientColors, gradientAngle, imageSrc } = state;
    
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
                    img.onload = () => {
                        ctx.drawImage(img, 0, 0, width, height);
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
