/**
 * Text handling module for the image generator
 */

import { state, updateState } from './state.js';

// Drag and drop state
let isDragging = false;
let dragStartX, dragStartY;

/**
 * Update text preview based on current state
 * @param {HTMLElement} textPreview - The text preview element
 */
function updateTextPreview(textPreview) {
    textPreview.innerText = state.text;
    textPreview.style.fontFamily = `'${state.fontFamily}', sans-serif`;
    textPreview.style.fontSize = `${state.fontSize}px`;
    textPreview.style.color = state.textColor;
    textPreview.style.textAlign = state.textAlign;
}

/**
 * Center text in the preview
 * @param {HTMLElement} preview - The preview element
 * @param {HTMLElement} textPreview - The text preview element
 * @param {HTMLElement} guideV - The vertical guide element
 * @param {HTMLElement} guideH - The horizontal guide element
 */
function centerText(preview, textPreview, guideV, guideH) {
    // Get the actual dimensions of the preview and text
    const previewWidth = parseInt(preview.style.width) || state.width;
    const previewHeight = parseInt(preview.style.height) || state.height;
    const textWidth = textPreview.offsetWidth;
    const textHeight = textPreview.offsetHeight;
    
    // Calculate center position
    updateState({
        textX: (previewWidth - textWidth) / 2,
        textY: (previewHeight - textHeight) / 2
    });
    
    // Update the position
    repositionText(textPreview);
    
    // Show guides briefly to indicate centering
    guideV.style.display = 'block';
    guideH.style.display = 'block';
    
    // Hide guides after a short delay
    setTimeout(() => hideSnapGuides(guideV, guideH), 800);
}

/**
 * Reposition text based on current state
 * @param {HTMLElement} textPreview - The text preview element
 */
function repositionText(textPreview) {
    if (state.textX !== null && state.textY !== null) {
        textPreview.style.left = `${state.textX}px`;
        textPreview.style.top = `${state.textY}px`;
    } else {
        // If position is not set, ensure it's not absolutely positioned
        textPreview.style.left = '';
        textPreview.style.top = '';
    }
}

/**
 * Hide snap guides
 * @param {HTMLElement} guideV - The vertical guide element
 * @param {HTMLElement} guideH - The horizontal guide element
 */
function hideSnapGuides(guideV, guideH) {
    guideV.style.display = 'none';
    guideH.style.display = 'none';
}

/**
 * Handle drag start event
 * @param {Event} e - The drag start event
 * @param {HTMLElement} textPreview - The text preview element
 */
function dragStart(e, textPreview) {
    isDragging = true;
    textPreview.classList.add('dragging');
    
    // Get the starting position (handle both mouse and touch events)
    dragStartX = e.clientX || (e.touches && e.touches[0].clientX);
    dragStartY = e.clientY || (e.touches && e.touches[0].clientY);
    
    // Prevent default to avoid text selection during drag
    e.preventDefault();
}

/**
 * Handle drag move event
 * @param {Event} e - The drag move event
 * @param {HTMLElement} preview - The preview element
 * @param {HTMLElement} textPreview - The text preview element
 * @param {HTMLElement} guideV - The vertical guide element
 * @param {HTMLElement} guideH - The horizontal guide element
 */
function dragMove(e, preview, textPreview, guideV, guideH) {
    if (!isDragging) return;
    e.preventDefault();
    
    // Get event position (handle both mouse and touch)
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    // Calculate new position
    let newX = state.textX + (clientX - dragStartX);
    let newY = state.textY + (clientY - dragStartY);
    
    // Update drag start position for next move
    dragStartX = clientX;
    dragStartY = clientY;
    
    // Snap to guides logic
    const snapThreshold = 10; // Slightly increased threshold for easier snapping
    
    // Get the actual dimensions of the preview and text
    const previewWidth = parseInt(preview.style.width) || state.width;
    const previewHeight = parseInt(preview.style.height) || state.height;
    const textWidth = textPreview.offsetWidth;
    const textHeight = textPreview.offsetHeight;

    // Calculate text center position
    const textCenterX = newX + textWidth / 2;
    const textCenterY = newY + textHeight / 2;

    // Calculate preview center
    const previewCenterX = previewWidth / 2;
    const previewCenterY = previewHeight / 2;

    // Snap to vertical center (horizontal guide)
    if (Math.abs(textCenterY - previewCenterY) < snapThreshold) {
        newY = previewCenterY - (textHeight / 2);
        guideH.style.display = 'block';
    } else {
        guideH.style.display = 'none';
    }

    // Snap to horizontal center (vertical guide)
    if (Math.abs(textCenterX - previewCenterX) < snapThreshold) {
        newX = previewCenterX - (textWidth / 2);
        guideV.style.display = 'block';
    } else {
        guideV.style.display = 'none';
    }

    // Update state and reposition text
    updateState({
        textX: newX,
        textY: newY
    });
    repositionText(textPreview);
}

/**
 * Handle drag end event
 * @param {HTMLElement} textPreview - The text preview element
 * @param {HTMLElement} guideV - The vertical guide element
 * @param {HTMLElement} guideH - The horizontal guide element
 */
function dragEnd(textPreview, guideV, guideH) {
    if (!isDragging) return;
    isDragging = false;
    textPreview.classList.remove('dragging');
    hideSnapGuides(guideV, guideH);
}

/**
 * Draw text to canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context to draw on
 * @param {number} scaleFactor - Scale factor for high resolution
 */
function drawTextToCanvas(ctx, scaleFactor) {
    const { text, fontFamily, fontSize, textColor, textAlign, textX, textY } = state;
    
    if (!text.trim()) return;
    
    // Set font - no need to scale since canvas context is already scaled
    ctx.font = `${fontSize}px '${fontFamily}', sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textBaseline = 'top';
    
    // Handle multi-line text
    const lines = text.split('\n');
    const lineHeight = fontSize * 1.2;
    
    // Measure line widths in original units (before scaling)
    const lineWidths = lines.map(line => ctx.measureText(line).width / scaleFactor);
    const maxLineWidth = Math.max(...lineWidths);

    
    // Calculate text position
    let x, y;
    
    if (textX !== null && textY !== null) {
        // For dragged text, textX and textY represent the position of the text container
        // The text container has padding of 8px (p-2 in Tailwind CSS)
        const textPadding = 8;
        
        // The actual text starts at textX + padding, textY + padding
        // But we need to handle alignment within the container
        
        if (textAlign === 'left') {
            x = textX + textPadding;
            ctx.textAlign = 'left';
        } else if (textAlign === 'right') {
            // For right alignment, we need to find the right edge of the text container
            // The container width is determined by the longest line plus padding
            const maxLineWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
            const containerWidth = maxLineWidth + (textPadding * 2);
            x = textX + containerWidth - textPadding;
            ctx.textAlign = 'right';
        } else { // center
            // For center alignment, find the center of the text container
            const maxLineWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
            const containerWidth = maxLineWidth + (textPadding * 2);
            x = textX + containerWidth / 2;
            ctx.textAlign = 'center';
        }
        
        y = textY + textPadding;
        
        // Render each line using canvas built-in alignment
        lines.forEach((line, index) => {
            ctx.fillText(line, x, y + (index * lineHeight));
        });
        
    } else {
        // Auto-positioned text - calculate position based on alignment
        const maxLineWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
        const totalTextHeight = lines.length * lineHeight;
        
        // Calculate base position and set canvas alignment
        ctx.textAlign = textAlign;
        
        switch (textAlign) {
            case 'left':
                x = 20;
                break;
            case 'right':
                x = state.width - 20;
                break;
            case 'center':
            default:
                x = state.width / 2;
                break;
        }
        
        y = (state.height - totalTextHeight) / 2;
        
        // Render each line using canvas built-in alignment
        lines.forEach((line, index) => {
            ctx.fillText(line, x, y + (index * lineHeight));
        });
    }
    
    // Reset text alignment to avoid affecting other canvas operations
    ctx.textAlign = 'start';
}

/**
 * Setup text drag and drop event listeners
 * @param {HTMLElement} textPreview - The text preview element
 * @param {HTMLElement} preview - The preview element
 * @param {HTMLElement} guideV - The vertical guide element
 * @param {HTMLElement} guideH - The horizontal guide element
 */
function setupTextDragAndDrop(textPreview, preview, guideV, guideH) {
    // Define the event handlers as named functions so they can be properly removed
    function handleMouseMove(e) {
        dragMove(e, preview, textPreview, guideV, guideH);
    }
    
    function handleMouseUp() {
        dragEnd(textPreview, guideV, guideH);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }
    
    function handleTouchMove(e) {
        dragMove(e, preview, textPreview, guideV, guideH);
    }
    
    function handleTouchEnd() {
        dragEnd(textPreview, guideV, guideH);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
    }
    
    // Mouse events
    textPreview.addEventListener('mousedown', (e) => {
        dragStart(e, textPreview);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    });
    
    // Touch events
    textPreview.addEventListener('touchstart', (e) => {
        dragStart(e, textPreview);
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);
    }, { passive: false });
}

export { 
    updateTextPreview, 
    centerText, 
    repositionText, 
    hideSnapGuides, 
    dragStart, 
    dragMove, 
    dragEnd, 
    drawTextToCanvas,
    setupTextDragAndDrop
};
