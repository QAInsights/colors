// main.js
import { initializeTheme } from './modules/theme.js';
import { state, updateState } from './modules/state.js';
import { 
    getCustomPresets, 
    saveCustomPresets, 
    addCustomPreset, 
    removeCustomPreset, 
    updateDimensionPresetOptions, 
    applyDimensionPreset 
} from './modules/dimensionPresets.js';
import { 
    getPatternSvgString, 
    drawPattern, 
    drawPatternToCanvas 
} from './modules/patterns.js';
import { 
    updateTextPreview, 
    centerText, 
    repositionText, 
    hideSnapGuides, 
    updateGuidePositions,
    drawTextToCanvas,
    setupTextDragAndDrop
} from './modules/textHandling.js';
import { 
    createHighResolutionCanvas, 
    drawBackgroundToCanvas, 
    triggerDownload, 
    downloadHighResolutionImage, 
    downloadRasterImage,
    escapeHtml
} from './modules/imageExport.js';
import { 
    updateControlVisibility, 
    handleDimensionChange, 
    applyZoom, 
    handleImageUpload, 
    renderGradientColorPickers, 
    updatePreview,
    getYear
} from './modules/uiControls.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const dimensionPreset = document.getElementById('dimensionPreset');
    const saveCustomPreset = document.getElementById('saveCustomPreset');
    const widthInput = document.getElementById('widthInput');
    const zoomLevel = document.getElementById('zoomLevel');
    const heightInput = document.getElementById('heightInput');
    const preview = document.getElementById('preview');
    const patternSvg = document.getElementById('pattern-svg');
    const textPreview = document.getElementById('textPreview');
    const guideV = document.getElementById('guide-v');
    const guideH = document.getElementById('guide-h');
    
    const btnTypeColor = document.getElementById('btn-type-color');
    const btnTypeGradient = document.getElementById('btn-type-gradient');
    const btnTypeImage = document.getElementById('btn-type-image');
    
    const colorControls = document.getElementById('colorControls');
    const gradientControls = document.getElementById('gradientControls');
    const imageControls = document.getElementById('imageControls');

    const color1Input = document.getElementById('color1');
    const color1Text = document.getElementById('color1-text');
    
    const gradientColorsContainer = document.getElementById('gradient-colors-container');
    const addGradientColor = document.getElementById('addGradientColor');
    const removeGradientColor = document.getElementById('removeGradientColor');
    const gradientColorCount = document.getElementById('gradient-color-count');
    const gradientDirection = document.getElementById('gradientDirection');
    const imageUpload = document.getElementById('imageUpload');

    const textContent = document.getElementById('textContent');
    const fontFamily = document.getElementById('fontFamily');
    const fontSize = document.getElementById('fontSize');
    const fontSizeValue = document.getElementById('fontSizeValue');
    const textColor = document.getElementById('textColor');
    const textColorText = document.getElementById('textColorText');
    const textAlignContainer = document.getElementById('textAlign');

    const patternType = document.getElementById('patternType');
    const patternOptions = document.getElementById('patternOptions');
    const patternColor = document.getElementById('patternColor');
    const patternColorText = document.getElementById('patternColorText');
    const patternOpacity = document.getElementById('patternOpacity');
    const patternCount = document.getElementById('patternCount');

    const borderRadius = document.getElementById('borderRadius');
    const borderRadiusValue = document.getElementById('borderRadiusValue');

    const downloadPNG = document.getElementById('downloadPNG');
    const downloadJPG = document.getElementById('downloadJPG');
    const resolutionScale = document.getElementById('resolutionScale');
    
    const previewArea = document.querySelector('.preview-area');
    const previewContainer = document.querySelector('.preview-container');

    // Create UI elements object for passing to functions
    const elements = {
        preview,
        patternSvg,
        textPreview,
        guideV,
        guideH,
        colorControls,
        gradientControls,
        imageControls,
        patternOptions,
        btnTypeColor,
        btnTypeGradient,
        btnTypeImage,
        previewArea,
        previewContainer,
        zoomLevel
    };
    
    // Wrapper functions that use the imported modules with the DOM elements
    function updatePreviewWrapper() {
        updatePreview(elements);
        // Ensure guides are properly positioned after preview update
        updateGuidePositions(guideV, guideH, preview);
    }
    
    function updateTextPreviewWrapper() {
        updateTextPreview(textPreview);
    }
    
    function centerTextWrapper() {
        centerText(preview, textPreview, guideV, guideH);
    }
    
    function updateControlVisibilityWrapper() {
        updateControlVisibility(elements);
    }
    
    function handleDimensionChangeWrapper() {
        handleDimensionChange(widthInput, heightInput, dimensionPreset, updatePreviewWrapper);
    }
    
    function renderGradientColorPickersWrapper() {
        renderGradientColorPickers(gradientColorsContainer, gradientColorCount, removeGradientColor, addGradientColor, updatePreviewWrapper);
    }
    
    function drawPatternWrapper() {
        drawPattern(patternSvg);
    }
    
    function applyDimensionPresetWrapper(value) {
        applyDimensionPreset(value, widthInput, heightInput, updatePreviewWrapper);
    }
    
    function updateDimensionPresetOptionsWrapper() {
        updateDimensionPresetOptions(dimensionPreset);
    }
    
    function addCustomPresetWrapper(width, height, name) {
        const success = addCustomPreset(width, height, name);
        if (success) {
            updateDimensionPresetOptionsWrapper();
            updatePreviewWrapper();
            updateTextPreviewWrapper();
            centerTextWrapper();
            updateControlVisibilityWrapper();
            renderGradientColorPickersWrapper();
        }
        return success;
    }
    
    function handleImageUploadWrapper(e) {
        handleImageUpload(e, updatePreviewWrapper);
    }
    
    // --- Initial Setup ---
    function initialize() {
        // Load custom presets
        updateDimensionPresetOptionsWrapper();
        
        // Add event listener for zoom level changes
        if (zoomLevel) {
            zoomLevel.addEventListener('change', () => {
                // Use updatePreview to ensure proper synchronization
                updatePreviewWrapper();
            });
        }
        
        // Background type selection
        btnTypeColor.addEventListener('click', () => {
            updateState({ bgType: 'color' });
            updateControlVisibilityWrapper();
            updatePreviewWrapper();
        });
        
        btnTypeGradient.addEventListener('click', () => {
            updateState({ bgType: 'gradient' });
            updateControlVisibilityWrapper();
            updatePreviewWrapper();
        });
        
        btnTypeImage.addEventListener('click', () => {
            updateState({ bgType: 'image' });
            updateControlVisibilityWrapper();
            updatePreviewWrapper();
        });
        
        // Background color
        color1Input.addEventListener('input', (e) => { 
            updateState({ color1: e.target.value }); 
            color1Text.value = e.target.value; 
            updatePreviewWrapper(); 
        });
        
        color1Text.addEventListener('change', (e) => { 
            updateState({ color1: e.target.value }); 
            color1Input.value = e.target.value; 
            updatePreviewWrapper(); 
        });
        
        // Gradient direction
        gradientDirection.addEventListener('input', (e) => { 
            updateState({ gradientAngle: parseInt(e.target.value, 10) }); 
            updatePreviewWrapper(); 
        });
        
        // Image upload
        imageUpload.addEventListener('change', handleImageUploadWrapper);
        
        // Dimension inputs
        widthInput.addEventListener('change', handleDimensionChangeWrapper);
        heightInput.addEventListener('change', handleDimensionChangeWrapper);
        
        // Event listeners for gradient colors
        addGradientColor.addEventListener('click', () => {
            if (state.gradientColors.length < 5) {
                const newColors = [...state.gradientColors, '#ffffff'];
                updateState({ gradientColors: newColors });
                renderGradientColorPickersWrapper();
                updatePreviewWrapper();
            }
        });
        
        removeGradientColor.addEventListener('click', () => {
            if (state.gradientColors.length > 2) {
                const newColors = [...state.gradientColors];
                newColors.pop();
                updateState({ gradientColors: newColors });
                renderGradientColorPickersWrapper();
                updatePreviewWrapper();
            }
        });
        
        // Text
        textContent.addEventListener('input', (e) => { 
            updateState({ text: e.target.value }); 
            updatePreviewWrapper(); 
        });
        
        fontFamily.addEventListener('change', (e) => { 
            updateState({ fontFamily: e.target.value }); 
            updatePreviewWrapper(); 
        });
        
        fontSize.addEventListener('input', (e) => { 
            updateState({ fontSize: parseInt(e.target.value, 10) }); 
            fontSizeValue.textContent = `${state.fontSize}px`;
            updatePreviewWrapper();
            centerTextWrapper(); // Re-center text when font size changes
        });
        
        textColor.addEventListener('input', (e) => { 
            updateState({ textColor: e.target.value }); 
            textColorText.value = e.target.value; 
            updatePreviewWrapper(); 
        });
        
        textColorText.addEventListener('change', (e) => { 
            updateState({ textColor: e.target.value }); 
            textColor.value = e.target.value; 
            updatePreviewWrapper(); 
        });
        
        textAlignContainer.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                updateState({ textAlign: e.target.dataset.align });
                document.querySelectorAll('#textAlign button').forEach(btn => btn.classList.remove('bg-blue-500', 'text-white'));
                e.target.classList.add('bg-blue-500', 'text-white');
                updatePreviewWrapper();
            }
        });
        
        // Pattern
        patternType.addEventListener('change', (e) => { 
            updateState({ pattern: e.target.value }); 
            updatePreviewWrapper(); 
            updateControlVisibilityWrapper(); 
        });
        
        patternColor.addEventListener('input', (e) => { 
            updateState({ patternColor: e.target.value }); 
            patternColorText.value = e.target.value; 
            drawPatternWrapper(); 
        });
        
        patternColorText.addEventListener('change', (e) => { 
            updateState({ patternColor: e.target.value }); 
            patternColor.value = e.target.value; 
            drawPatternWrapper(); 
        });
        
        patternOpacity.addEventListener('input', (e) => { 
            updateState({ patternOpacity: parseFloat(e.target.value) }); 
            drawPatternWrapper(); 
        });
        
        patternCount.addEventListener('input', (e) => { 
            updateState({ patternCount: parseInt(e.target.value, 10) }); 
            drawPatternWrapper(); 
        });
        
        // Border radius
        borderRadius.addEventListener('input', (e) => { 
            updateState({ borderRadius: parseInt(e.target.value, 10) }); 
            borderRadiusValue.textContent = `${state.borderRadius}px`;
            updatePreviewWrapper(); 
        });
        
        // Setup text drag and drop
        setupTextDragAndDrop(textPreview, preview, guideV, guideH);
        
        // Dimension Presets
        dimensionPreset.addEventListener('change', (e) => {
            applyDimensionPresetWrapper(e.target.value);
        });
        
        saveCustomPreset.addEventListener('click', () => {
            const width = parseInt(widthInput.value);
            const height = parseInt(heightInput.value);
            
            if (!width || !height || width <= 0 || height <= 0) {
                alert('Please enter valid dimensions before saving.');
                return;
            }
            
            const name = prompt(`Enter a name for this preset (${width}×${height}):`, `Custom ${width}×${height}`);
            if (name !== null) { // User didn't cancel
                const success = addCustomPresetWrapper(width, height, name.trim() || undefined);
                if (success) {
                    // Select the newly created preset
                    dimensionPreset.value = `${width}x${height}`;
                    alert('Custom preset saved successfully!');
                } else {
                    alert('A preset with these dimensions already exists.');
                }
            }
        });
        
        // Add context menu for custom presets (right-click to delete)
        dimensionPreset.addEventListener('contextmenu', (e) => {
            const selectedOption = dimensionPreset.options[dimensionPreset.selectedIndex];
            if (selectedOption && selectedOption.getAttribute('data-custom') === 'true') {
                e.preventDefault();
                const presetId = selectedOption.getAttribute('data-preset-id');
                const presetName = selectedOption.textContent;
                
                if (confirm(`Delete custom preset "${presetName}"?`)) {
                    removeCustomPreset(presetId);
                    dimensionPreset.value = 'custom'; // Reset to custom
                }
            }
        });
        
        // Download buttons
        downloadPNG.addEventListener('click', () => {
            const scaleFactor = parseInt(resolutionScale.value);
            downloadHighResolutionImage('png', scaleFactor);
        });
        
        downloadJPG.addEventListener('click', () => {
            const scaleFactor = parseInt(resolutionScale.value);
            downloadHighResolutionImage('jpeg', scaleFactor);
        });
        
        // Set initial dimension preset selection
        const currentDimensions = `${state.width}x${state.height}`;
        const matchingOption = Array.from(dimensionPreset.options).find(opt => opt.value === currentDimensions);
        dimensionPreset.value = matchingOption ? currentDimensions : 'custom';
        
        // Set initial values from state
        widthInput.value = state.width;
        heightInput.value = state.height;
        color1Input.value = state.color1;
        color1Text.value = state.color1;
        gradientDirection.value = state.gradientAngle;
        textContent.value = state.text;
        fontFamily.value = state.fontFamily;
        fontSize.value = state.fontSize;
        fontSizeValue.textContent = `${state.fontSize}px`;
        textColor.value = state.textColor;
        textColorText.value = state.textColor;
        patternType.value = state.pattern;
        patternColor.value = state.patternColor;
        patternColorText.value = state.patternColor;
        patternOpacity.value = state.patternOpacity;
        patternCount.value = state.patternCount;
        borderRadius.value = state.borderRadius;
        borderRadiusValue.textContent = `${state.borderRadius}px`;

        renderGradientColorPickersWrapper();
        updateControlVisibilityWrapper();
        updatePreviewWrapper();
        centerTextWrapper();
        
        // Apply zoom after a short delay to ensure DOM is fully ready
        setTimeout(() => {
            updatePreviewWrapper();
        }, 100);
    }

    // Wait for fonts to be ready before initializing to ensure correct text dimensions
    document.fonts.ready.then(() => {
        initializeTheme();
        initialize();
    });

    // Get current year
    document.getElementById("year").innerHTML = getYear();
});