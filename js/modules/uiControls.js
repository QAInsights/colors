/**
 * UI controls module for the image generator
 */

import { state, updateState } from './state.js';
import { drawPattern } from './patterns.js';
import { updateTextPreview, centerText } from './textHandling.js';

/**
 * Update control visibility based on current state
 * @param {Object} elements - Object containing UI elements
 */
function updateControlVisibility(elements) {
    const { colorControls, gradientControls, imageControls, patternOptions, btnTypeColor, btnTypeGradient, btnTypeImage } = elements;
    
    colorControls.classList.add('hidden');
    gradientControls.classList.add('hidden');
    imageControls.classList.add('hidden');
    
    const controlMap = { color: colorControls, gradient: gradientControls, image: imageControls };
    controlMap[state.bgType].classList.remove('hidden');

    const btnMap = { color: btnTypeColor, gradient: btnTypeGradient, image: btnTypeImage };
    Object.values(btnMap).forEach(btn => btn.classList.remove('bg-blue-500', 'text-white'));
    btnMap[state.bgType].classList.add('bg-blue-500', 'text-white');

    patternOptions.classList.toggle('hidden', state.pattern === 'none');
}

/**
 * Handle dimension change
 * @param {HTMLElement} widthInput - Width input element
 * @param {HTMLElement} heightInput - Height input element
 * @param {HTMLElement} dimensionPreset - Dimension preset dropdown
 * @param {Function} updatePreview - Function to update preview
 */
function handleDimensionChange(widthInput, heightInput, dimensionPreset, updatePreview) {
    // Ensure positive integers
    const newWidth = parseInt(widthInput.value, 10);
    const newHeight = parseInt(heightInput.value, 10);
    
    if (!isNaN(newWidth) && newWidth > 0) {
        updateState({ width: newWidth });
    }
    
    if (!isNaN(newHeight) && newHeight > 0) {
        updateState({ height: newHeight });
    }
    
    updatePreview();
    
    // Update preset selection to custom when manually changing dimensions
    if (dimensionPreset.value !== 'custom') {
        const currentValue = `${state.width}x${state.height}`;

        const matchingOption = Array.from(dimensionPreset.options).find(opt => opt.value === currentValue);
        dimensionPreset.value = matchingOption ? currentValue : 'custom';
    }
}

/**
 * Apply zoom level to the preview area
 * @param {string} zoomValue - Zoom level value
 * @param {HTMLElement} previewArea - Preview area element
 * @param {HTMLElement} previewContainer - Preview container element
 */
function applyZoom(zoomValue, previewArea, previewContainer) {
    // Get the actual preview element that contains the content
    const preview = document.getElementById('preview');
    const currentZoom = zoomValue;
    
    // Get accurate container dimensions using getBoundingClientRect for better precision
    const containerRect = previewContainer.getBoundingClientRect();
    
    // Account for padding, margins, and UI elements - more generous spacing for Instagram dimensions
    const horizontalPadding = 80; // Increased padding for better spacing
    const verticalPadding = 100;  // Extra vertical padding for tall Instagram formats
    
    const containerWidth = Math.max(containerRect.width - horizontalPadding, 200); // Minimum 200px width
    const containerHeight = Math.max(containerRect.height - verticalPadding, 200); // Minimum 200px height
    
    if (currentZoom === 'fit') {
        // Calculate the scale to fit the preview within the container
        const scaleWidth = containerWidth / state.width;
        const scaleHeight = containerHeight / state.height;
        
        // Use the smaller scale to ensure full visibility
        let scale = Math.min(scaleWidth, scaleHeight);
        
        // For Instagram dimensions, ensure minimum readable size
        const minScale = 0.1; // Minimum 10% scale
        const maxScale = 1.0;  // Maximum 100% scale for crisp display
        
        scale = Math.max(minScale, Math.min(scale, maxScale));
        
        // Apply the calculated scale to the actual preview element
        if (preview) {
            preview.style.transform = `scale(${scale})`;
            preview.style.transformOrigin = 'center center';
        }
        
        // For 'fit' mode, we should always hide scrollbars as the content fits
        previewContainer.style.overflow = 'hidden';
        
        // Remove max-height constraint to allow full visibility of scaled content
        previewContainer.style.maxHeight = 'none';
        
        // Center the preview in the container
        previewContainer.style.display = 'flex';
        previewContainer.style.justifyContent = 'center';
        previewContainer.style.alignItems = 'center';
    } else {
        // Apply the selected zoom level
        const zoom = parseFloat(currentZoom);
        if (preview) {
            preview.style.transform = `scale(${zoom})`;
            preview.style.transformOrigin = 'center center'; // Keep consistent with fit mode
        }
        
        // Calculate if scrollbars are needed based on content size vs container size
        const scaledWidth = state.width * zoom;
        const scaledHeight = state.height * zoom;
        
        // For non-fit modes, maintain the centering but allow scrolling when needed
        previewContainer.style.display = 'flex';
        previewContainer.style.justifyContent = 'center';
        previewContainer.style.alignItems = 'center';
        
        // Restore max-height constraint for non-fit modes
        previewContainer.style.maxHeight = 'calc(100vh - 250px)';
        
        // Use the same improved container dimensions for consistency
        const availableWidth = containerWidth + horizontalPadding; // Add back padding for scroll calculation
        const availableHeight = containerHeight + verticalPadding;
        
        // Only show scrollbars if the scaled content exceeds the available space
        if (scaledWidth > availableWidth || scaledHeight > availableHeight) {
            previewContainer.style.overflow = 'auto';
        } else {
            previewContainer.style.overflow = 'hidden';
        }
    }
}

/**
 * Handle image upload
 * @param {Event} e - Image upload event
 * @param {Function} updatePreview - Function to update preview
 */
function handleImageUpload(e, updatePreview) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            updateState({ imageSrc: event.target.result });
            updatePreview();
        };
        reader.readAsDataURL(file);
    }
}

/**
 * Render gradient color pickers
 * @param {HTMLElement} gradientColorsContainer - Container for gradient color pickers
 * @param {HTMLElement} gradientColorCount - Element to display gradient color count
 * @param {HTMLElement} removeGradientColor - Button to remove gradient color
 * @param {HTMLElement} addGradientColor - Button to add gradient color
 * @param {Function} updatePreview - Function to update preview
 */
function renderGradientColorPickers(gradientColorsContainer, gradientColorCount, removeGradientColor, addGradientColor, updatePreview) {
    gradientColorsContainer.innerHTML = '';
    state.gradientColors.forEach((color, index) => {
        const colorPickerWrapper = document.createElement('div');
        colorPickerWrapper.className = 'flex items-center gap-3';
        
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = color;
        colorInput.addEventListener('input', (e) => {
            const newGradientColors = [...state.gradientColors];
            newGradientColors[index] = e.target.value;
            updateState({ gradientColors: newGradientColors });
            textInput.value = e.target.value;
            updatePreview();
        });

        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.value = color;
        textInput.className = 'w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 border-transparent';
        textInput.addEventListener('change', (e) => {
            const newGradientColors = [...state.gradientColors];
            newGradientColors[index] = e.target.value;
            updateState({ gradientColors: newGradientColors });
            colorInput.value = e.target.value;
            updatePreview();
        });

        colorPickerWrapper.appendChild(colorInput);
        colorPickerWrapper.appendChild(textInput);
        gradientColorsContainer.appendChild(colorPickerWrapper);
    });

    gradientColorCount.textContent = state.gradientColors.length;
    removeGradientColor.disabled = state.gradientColors.length <= 2;
    addGradientColor.disabled = state.gradientColors.length >= 5;
}

/**
 * Update preview based on current state
 * @param {Object} elements - Object containing UI elements
 */
function updatePreview(elements) {
    const { preview, patternSvg, previewArea, previewContainer, zoomLevel, textPreview } = elements;
    
    // Ensure outer container (preview-area) matches the requested dimensions so width is not clipped
    if (previewArea && previewArea.classList.contains('preview-area')) {
        // Set the dimensions of the preview area to match the canvas dimensions
        previewArea.style.width = `${state.width}px`;
        previewArea.style.height = `${state.height}px`;
        previewArea.style.overflow = 'visible'; // Keep the preview area's content visible
        previewArea.style.margin = 'auto'; // Center the preview area
    }
    
    // Initialize the preview container's CSS properties
    // The applyZoom function will adjust these as needed
    if (previewContainer) {
        previewContainer.style.overflow = 'hidden';
        previewContainer.style.display = 'flex';
        previewContainer.style.justifyContent = 'center';
        previewContainer.style.alignItems = 'center';
    }
    
    // Apply the current zoom level
    if (zoomLevel) {
        // For very large dimensions, automatically use 'fit' mode regardless of selection
        // This prevents issues with extremely large canvases
        const isVeryLarge = state.width > 3000 || state.height > 3000;
        const zoomValue = isVeryLarge && zoomLevel.value !== 'fit' ? 'fit' : zoomLevel.value;
        
        applyZoom(zoomValue, previewArea, previewContainer);
        
        // If dimensions are very large and not using 'fit', show a message or adjust the dropdown
        if (isVeryLarge && zoomLevel.value !== 'fit') {
            // Set the dropdown to 'fit' for better user experience
            zoomLevel.value = 'fit';
        }
    }
    
    preview.style.width = `${state.width}px`;
    preview.style.height = `${state.height}px`;
    preview.style.borderRadius = `${state.borderRadius}px`;

    // Ensure SVG canvas matches new dimensions
    patternSvg.setAttribute('width', state.width);
    patternSvg.setAttribute('height', state.height);
    patternSvg.setAttribute('viewBox', `0 0 ${state.width} ${state.height}`);

    // Get the background layer element
    const backgroundLayer = preview.querySelector('#backgroundLayer');
    
    // Clear previous background
    preview.style.backgroundColor = 'transparent';
    backgroundLayer.style.backgroundImage = 'none';
    backgroundLayer.style.backgroundColor = 'transparent';
    
    // Make sure the background layer has the same border radius as the preview
    backgroundLayer.style.borderRadius = `${state.borderRadius}px`;

    // Ensure text is above the background layer
    if (textPreview) {
        textPreview.style.position = 'relative';
        textPreview.style.zIndex = '5';
    }

    switch (state.bgType) {
        case 'color':
            backgroundLayer.style.backgroundColor = state.color1;
            break;
        case 'gradient':
            if (state.gradientColors.length > 1) {
                backgroundLayer.style.backgroundImage = `linear-gradient(${state.gradientAngle}deg, ${state.gradientColors.join(', ')})`;
            }
            break;
        case 'image':
            if (state.imageSrc) {
                // Apply background image to the background layer
                backgroundLayer.style.backgroundImage = `url(${state.imageSrc})`;
                
                // Apply different background-size based on the selected fit mode
                switch (state.imageFit) {
                    case 'cover':
                        backgroundLayer.style.backgroundSize = 'cover';
                        backgroundLayer.style.backgroundPosition = 'center';
                        break;
                    case 'contain':
                        backgroundLayer.style.backgroundSize = 'contain';
                        backgroundLayer.style.backgroundPosition = 'center';
                        backgroundLayer.style.backgroundRepeat = 'no-repeat';
                        break;
                    case 'original':
                        backgroundLayer.style.backgroundSize = 'auto';
                        backgroundLayer.style.backgroundPosition = 'center';
                        backgroundLayer.style.backgroundRepeat = 'no-repeat';
                        break;
                    default:
                        backgroundLayer.style.backgroundSize = 'contain';
                        backgroundLayer.style.backgroundPosition = 'center';
                }
                
                // Apply blur effect only to the background layer if set
                if (state.imageBlur > 0) {
                    backgroundLayer.style.filter = `blur(${state.imageBlur}px)`;
                    // Add a slight scale to prevent blur edges from showing, but only for cover mode
                    if (state.imageFit === 'cover') {
                        backgroundLayer.style.transform = 'scale(1.05)';
                    } else {
                        // For other modes, we don't want to scale as it would distort the image
                        backgroundLayer.style.transform = 'none';
                    }
                } else {
                    backgroundLayer.style.filter = 'none';
                    backgroundLayer.style.transform = 'none';
                }
                
                // Apply opacity effect if less than 1
                if (state.imageOpacity < 1) {
                    let currentBgImage = `url(${state.imageSrc})`;
                    backgroundLayer.style.backgroundImage = `linear-gradient(rgba(255,255,255,${1-state.imageOpacity}), rgba(255,255,255,${1-state.imageOpacity})), ${currentBgImage}`;
                }
            }
            break;
    }

    drawPattern(patternSvg);
    updateTextPreview(textPreview);
}

/**
 * Get current year
 * @returns {number} Current year
 */
function getYear() {
    return new Date().getFullYear();
}

export { 
    updateControlVisibility, 
    handleDimensionChange, 
    applyZoom, 
    handleImageUpload, 
    renderGradientColorPickers, 
    updatePreview,
    getYear
};
