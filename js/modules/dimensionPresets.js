/**
 * Dimension preset management module for the image generator
 */

import { state, updateState } from './state.js';

const STORAGE_KEY = 'imageGenerator_customPresets';

/**
 * Get custom presets from localStorage
 * @returns {Array} Array of custom presets
 */
function getCustomPresets() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.warn('Failed to load custom presets:', e);
        return [];
    }
}

/**
 * Save custom presets to localStorage
 * @param {Array} presets - Array of custom presets to save
 */
function saveCustomPresets(presets) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
    } catch (e) {
        console.warn('Failed to save custom presets:', e);
    }
}

/**
 * Add a new custom preset
 * @param {number} width - Width of the preset
 * @param {number} height - Height of the preset
 * @param {string} name - Name of the preset
 * @returns {boolean} True if preset was added, false if it already exists
 */
function addCustomPreset(width, height, name) {
    const presets = getCustomPresets();
    const newPreset = {
        id: `custom_${Date.now()}`,
        name: name || `Custom ${width}×${height}`,
        width: parseInt(width),
        height: parseInt(height),
        value: `${width}x${height}`
    };
    
    // Check if preset already exists
    const exists = presets.find(p => p.width === newPreset.width && p.height === newPreset.height);
    if (!exists) {
        presets.push(newPreset);
        saveCustomPresets(presets);
        return true;
    }
    return false;
}

/**
 * Remove a custom preset by ID
 * @param {string} id - ID of the preset to remove
 */
function removeCustomPreset(id) {
    const presets = getCustomPresets().filter(p => p.id !== id);
    saveCustomPresets(presets);
}

/**
 * Update dimension preset options in the dropdown
 * @param {HTMLElement} dimensionPreset - The dimension preset dropdown element
 */
function updateDimensionPresetOptions(dimensionPreset) {
    const customPresets = getCustomPresets();
    
    // Remove existing custom options
    const existingCustomOptions = dimensionPreset.querySelectorAll('option[data-custom="true"]');
    existingCustomOptions.forEach(option => option.remove());
    
    // Add custom presets
    if (customPresets.length > 0) {
        let customGroup = dimensionPreset.querySelector('optgroup[label="Custom Presets"]');
        if (!customGroup) {
            customGroup = document.createElement('optgroup');
            customGroup.label = 'Custom Presets';
            dimensionPreset.insertBefore(customGroup, dimensionPreset.children[1]);
        }
        
        customGroup.innerHTML = '';
        customPresets.forEach(preset => {
            const option = document.createElement('option');
            option.value = preset.value;
            option.textContent = `${preset.name} (${preset.width}×${preset.height})`;
            option.setAttribute('data-custom', 'true');
            option.setAttribute('data-preset-id', preset.id);
            customGroup.appendChild(option);
        });
    } else {
        // Remove empty custom group
        const customGroup = dimensionPreset.querySelector('optgroup[label="Custom Presets"]');
        if (customGroup) {
            customGroup.remove();
        }
    }
}

/**
 * Apply a dimension preset
 * @param {string} value - The preset value (e.g. "1200x630")
 * @param {HTMLElement} widthInput - The width input element
 * @param {HTMLElement} heightInput - The height input element
 * @param {Function} updatePreview - Function to update the preview
 */
function applyDimensionPreset(value, widthInput, heightInput, updatePreview) {
    if (value === 'custom') {
        return; // Keep current dimensions
    }
    
    const [width, height] = value.split('x').map(Number);
    if (width && height) {
        updateState({
            width: width,
            height: height
        });
        widthInput.value = width;
        heightInput.value = height;
        updatePreview();
    }
}

export { 
    getCustomPresets, 
    saveCustomPresets, 
    addCustomPreset, 
    removeCustomPreset, 
    updateDimensionPresetOptions, 
    applyDimensionPreset 
};
