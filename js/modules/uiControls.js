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
    const currentZoom = zoomValue;
    
    if (currentZoom === 'fit') {
        // Calculate the scale to fit the preview within the container
        const containerWidth = previewContainer.clientWidth - 40; // Account for padding
        const scale = Math.min(0.9, containerWidth / state.width); // Cap at 90% to avoid edge cases
        
        // Apply the calculated scale
        previewArea.style.transform = `scale(${scale})`;
        previewArea.style.transformOrigin = 'top center';
    } else {
        // Apply the selected zoom level
        const zoom = parseFloat(currentZoom);
        previewArea.style.transform = `scale(${zoom})`;
        previewArea.style.transformOrigin = 'top center';
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
        previewArea.style.overflow = 'visible';
        previewArea.style.margin = 'auto'; // Center the preview area
    }
    
    // Apply the current zoom level
    if (zoomLevel) {
        applyZoom(zoomLevel.value, previewArea, previewContainer);
    }
    
    preview.style.width = `${state.width}px`;
    preview.style.height = `${state.height}px`;
    preview.style.borderRadius = `${state.borderRadius}px`;

    // Ensure SVG canvas matches new dimensions
    patternSvg.setAttribute('width', state.width);
    patternSvg.setAttribute('height', state.height);
    patternSvg.setAttribute('viewBox', `0 0 ${state.width} ${state.height}`);

    // Clear previous background
    preview.style.backgroundImage = 'none';
    preview.style.backgroundColor = 'transparent';

    switch (state.bgType) {
        case 'color':
            preview.style.backgroundColor = state.color1;
            break;
        case 'gradient':
            if (state.gradientColors.length > 1) {
                preview.style.backgroundImage = `linear-gradient(${state.gradientAngle}deg, ${state.gradientColors.join(', ')})`;
            }
            break;
        case 'image':
            if (state.imageSrc) {
                preview.style.backgroundImage = `url(${state.imageSrc})`;
                preview.style.backgroundSize = 'cover';
                preview.style.backgroundPosition = 'center';
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
