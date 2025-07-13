document.addEventListener('DOMContentLoaded', () => {
    // --- Theme Management ---
    const THEME_STORAGE_KEY = 'imageGenerator_theme';
    
    function initializeTheme() {
        const themeToggle = document.getElementById('themeToggle');
        const sunIcon = document.getElementById('sunIcon');
        const moonIcon = document.getElementById('moonIcon');
        
        // Get saved theme or default to light
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'light';
        
        // Apply theme
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark');
            sunIcon.classList.remove('hidden');
            moonIcon.classList.add('hidden');
        } else {
            document.documentElement.classList.remove('dark');
            sunIcon.classList.add('hidden');
            moonIcon.classList.remove('hidden');
        }
        
        // Theme toggle event listener
        themeToggle.addEventListener('click', () => {
            const isDark = document.documentElement.classList.contains('dark');
            
            if (isDark) {
                // Switch to light mode
                document.documentElement.classList.remove('dark');
                sunIcon.classList.add('hidden');
                moonIcon.classList.remove('hidden');
                localStorage.setItem(THEME_STORAGE_KEY, 'light');
            } else {
                // Switch to dark mode
                document.documentElement.classList.add('dark');
                sunIcon.classList.remove('hidden');
                moonIcon.classList.add('hidden');
                localStorage.setItem(THEME_STORAGE_KEY, 'dark');
            }
        });
    }

    // --- State Management ---
    let state = {
        width: 1200,
        height: 630,
        bgType: 'color',
        color1: '#3b82f6',
        gradientColors: ['#8b5cf6', '#ec4899'],
        gradientAngle: 90,
        imageSrc: null,
        text: 'Hello, World!',
        fontFamily: 'Montserrat',
        fontSize: 72,
        textColor: '#ffffff',
        textAlign: 'center',
        textX: null,
        textY: null,
        pattern: 'none',
        patternColor: '#ffffff',
        patternOpacity: 0.2,
        patternCount: 20,
        borderRadius: 0,
    };

    // --- Dimension Preset Management ---
    const STORAGE_KEY = 'imageGenerator_customPresets';
    
    function getCustomPresets() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.warn('Failed to load custom presets:', e);
            return [];
        }
    }
    
    function saveCustomPresets(presets) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
        } catch (e) {
            console.warn('Failed to save custom presets:', e);
        }
    }
    
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
            updateDimensionPresetOptions();
            return true;
        }
        return false;
    }
    
    function removeCustomPreset(id) {
        const presets = getCustomPresets().filter(p => p.id !== id);
        saveCustomPresets(presets);
        updateDimensionPresetOptions();
    }
    
    function updateDimensionPresetOptions() {
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
    
    function applyDimensionPreset(value) {
        if (value === 'custom') {
            return; // Keep current dimensions
        }
        
        const [width, height] = value.split('x').map(Number);
        if (width && height) {
            state.width = width;
            state.height = height;
            widthInput.value = width;
            heightInput.value = height;
            updatePreview();
        }
    }

    // --- DOM Element References ---
    const dimensionPreset = document.getElementById('dimensionPreset');
    const saveCustomPreset = document.getElementById('saveCustomPreset');
    const widthInput = document.getElementById('widthInput');
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

    // --- Core Functions ---



    function updatePreview() {
        preview.style.width = `${state.width}px`;
        preview.style.height = `${state.height}px`;
        preview.style.borderRadius = `${state.borderRadius}px`;

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

        drawPattern();
        updateTextPreview();
    }

    function updateTextPreview() {
        textPreview.innerText = state.text;
        textPreview.style.fontFamily = `'${state.fontFamily}', sans-serif`;
        textPreview.style.fontSize = `${state.fontSize}px`;
        textPreview.style.color = state.textColor;
        textPreview.style.textAlign = state.textAlign;
    }

    function centerText() {
        const previewRect = preview.getBoundingClientRect();
        const textRect = textPreview.getBoundingClientRect();
        // Set the state first
        state.textX = (previewRect.width - textRect.width) / 2;
        state.textY = (previewRect.height - textRect.height) / 2;
        // Then update the position
        repositionText();
    }

    function repositionText() {
        if (state.textX !== null && state.textY !== null) {
            textPreview.style.left = `${state.textX}px`;
            textPreview.style.top = `${state.textY}px`;
        } else {
            // If position is not set, ensure it's not absolutely positioned
            textPreview.style.left = '';
            textPreview.style.top = '';
        }
    }

    function updateControlVisibility() {
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

    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                state.imageSrc = event.target.result;
                updatePreview();
            };
            reader.readAsDataURL(file);
        }
    }
    
    function triggerDownload(filename, dataUrl) {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function escapeHtml(unsafe) {
        return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }

    function getPatternSvgString() {
        let patternContent = '';
        const { width, height, pattern, patternColor, patternOpacity, patternCount } = state;
        let seed = 12345; // Fixed seed for consistent patterns
        const random = () => {
            const x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
        };

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
                patternContent += `<polygon points='${x},${y-size/2} ${x-size/2},${y+size/2} ${x+size/2},${y+size/2}' transform='rotate(${angle} ${x} ${y})' fill='${patternColor}' opacity='${patternOpacity * (random() * 0.5 + 0.5)}' />`;
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



    function drawPattern() {
        patternSvg.innerHTML = getPatternSvgString();
    }

    function renderGradientColorPickers() {
        gradientColorsContainer.innerHTML = '';
        state.gradientColors.forEach((color, index) => {
            const colorPickerWrapper = document.createElement('div');
            colorPickerWrapper.className = 'flex items-center gap-3';
            
            const colorInput = document.createElement('input');
            colorInput.type = 'color';
            colorInput.value = color;
            colorInput.addEventListener('input', (e) => {
                state.gradientColors[index] = e.target.value;
                textInput.value = e.target.value;
                updatePreview();
            });

            const textInput = document.createElement('input');
            textInput.type = 'text';
            textInput.value = color;
            textInput.className = 'w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 border-transparent';
            textInput.addEventListener('change', (e) => {
                state.gradientColors[index] = e.target.value;
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

    // --- Event Listeners ---

    // Dimension Presets
    dimensionPreset.addEventListener('change', (e) => {
        applyDimensionPreset(e.target.value);
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
            const success = addCustomPreset(width, height, name.trim() || undefined);
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

    // Background
    widthInput.addEventListener('change', (e) => { 
        state.width = parseInt(e.target.value, 10); 
        updatePreview();
        // Update preset selection to custom when manually changing dimensions
        if (dimensionPreset.value !== 'custom') {
            const currentValue = `${state.width}x${state.height}`;
            const matchingOption = Array.from(dimensionPreset.options).find(opt => opt.value === currentValue);
            dimensionPreset.value = matchingOption ? currentValue : 'custom';
        }
    });
    heightInput.addEventListener('change', (e) => { 
        state.height = parseInt(e.target.value, 10); 
        updatePreview();
        // Update preset selection to custom when manually changing dimensions
        if (dimensionPreset.value !== 'custom') {
            const currentValue = `${state.width}x${state.height}`;
            const matchingOption = Array.from(dimensionPreset.options).find(opt => opt.value === currentValue);
            dimensionPreset.value = matchingOption ? currentValue : 'custom';
        }
    });
    btnTypeColor.addEventListener('click', () => { state.bgType = 'color'; updatePreview(); updateControlVisibility(); });
    btnTypeGradient.addEventListener('click', () => { state.bgType = 'gradient'; updatePreview(); updateControlVisibility(); });
    btnTypeImage.addEventListener('click', () => { state.bgType = 'image'; updatePreview(); updateControlVisibility(); });
    color1Input.addEventListener('input', (e) => { state.color1 = e.target.value; color1Text.value = e.target.value; updatePreview(); });
    color1Text.addEventListener('change', (e) => { state.color1 = e.target.value; color1Input.value = e.target.value; updatePreview(); });
    gradientDirection.addEventListener('input', (e) => { state.gradientAngle = parseInt(e.target.value, 10); updatePreview(); });

    addGradientColor.addEventListener('click', () => {
        if (state.gradientColors.length < 5) {
            state.gradientColors.push('#ffffff'); // Add white as default
            renderGradientColorPickers();
            updatePreview();
        }
    });

    removeGradientColor.addEventListener('click', () => {
        if (state.gradientColors.length > 2) {
            state.gradientColors.pop();
            renderGradientColorPickers();
            updatePreview();
        }
    });
    imageUpload.addEventListener('change', handleImageUpload);

    // Text
    textContent.addEventListener('input', (e) => { state.text = e.target.value; updatePreview(); });
    fontFamily.addEventListener('change', (e) => { state.fontFamily = e.target.value; updatePreview(); });
    fontSize.addEventListener('input', (e) => { 
        state.fontSize = parseInt(e.target.value, 10); 
        fontSizeValue.textContent = `${e.target.value}px`;
        updatePreview();
        centerText(); // Re-center text when font size changes
    });
    textColor.addEventListener('input', (e) => { state.textColor = e.target.value; textColorText.value = e.target.value; updatePreview(); });
    textColorText.addEventListener('change', (e) => { state.textColor = e.target.value; textColor.value = e.target.value; updatePreview(); });
    textAlignContainer.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            state.textAlign = e.target.dataset.align;
            document.querySelectorAll('#textAlign button').forEach(btn => btn.classList.remove('bg-blue-500', 'text-white'));
            e.target.classList.add('bg-blue-500', 'text-white');
            updatePreview();
        }
    });

    // Pattern
    patternType.addEventListener('change', (e) => { state.pattern = e.target.value; updatePreview(); updateControlVisibility(); });
    patternColor.addEventListener('input', (e) => { state.patternColor = e.target.value; patternColorText.value = e.target.value; drawPattern(); });
    patternColorText.addEventListener('change', (e) => { state.patternColor = e.target.value; patternColor.value = e.target.value; drawPattern(); });
    patternOpacity.addEventListener('input', (e) => { state.patternOpacity = parseFloat(e.target.value); drawPattern(); });
    patternCount.addEventListener('input', (e) => { state.patternCount = parseInt(e.target.value, 10); drawPattern(); });

    // Border Radius
    borderRadius.addEventListener('input', (e) => { 
        state.borderRadius = parseInt(e.target.value, 10); 
        borderRadiusValue.textContent = `${e.target.value}px`;
        updatePreview(); 
    });

    // Drag and Drop for Text
    let isDragging = false;
    let dragStartX, dragStartY, textStartX, textStartY;

    function hideSnapGuides() {
        guideV.style.display = 'none';
        guideH.style.display = 'none';
    }

    function dragStart(e) {
        isDragging = true;
        textPreview.classList.add('dragging');
        const event = e.type.startsWith('touch') ? e.touches[0] : e;
        dragStartX = event.clientX;
        dragStartY = event.clientY;
        textStartX = state.textX;
        textStartY = state.textY;

        document.addEventListener('mousemove', dragMove);
        document.addEventListener('mouseup', dragEnd);
        document.addEventListener('touchmove', dragMove, { passive: false });
        document.addEventListener('touchend', dragEnd);
        e.preventDefault();
    }

    function dragMove(e) {
        if (!isDragging) return;
        const event = e.type.startsWith('touch') ? e.touches[0] : e;
        const dx = event.clientX - dragStartX;
        const dy = event.clientY - dragStartY;
        let newX = textStartX + dx;
        let newY = textStartY + dy;

        // Snapping logic
        const snapThreshold = 8;
        const previewRect = preview.getBoundingClientRect();
        const textRect = textPreview.getBoundingClientRect(); // Note: width/height are fine regardless of position

        // Calculate text center relative to the preview area's coordinate system
        const textCenterX = newX + textRect.width / 2;
        const textCenterY = newY + textRect.height / 2;

        // Calculate preview center in its own coordinate system
        const previewCenterX = previewRect.width / 2;
        const previewCenterY = previewRect.height / 2;

        // Snap to vertical center
        if (Math.abs(textCenterY - previewCenterY) < snapThreshold) {
            newY = (previewRect.height - textRect.height) / 2;
            guideV.style.display = 'block';
        } else {
            guideV.style.display = 'none';
        }

        // Snap to horizontal center
        if (Math.abs(textCenterX - previewCenterX) < snapThreshold) {
            newX = (previewRect.width - textRect.width) / 2;
            guideH.style.display = 'block';
        } else {
            guideH.style.display = 'none';
        }

        state.textX = newX;
        state.textY = newY;
        repositionText();
    }

    function dragEnd() {
        if (!isDragging) return;
        isDragging = false;
        textPreview.classList.remove('dragging');
        hideSnapGuides();
        document.removeEventListener('mousemove', dragMove);
        document.removeEventListener('mouseup', dragEnd);
        document.removeEventListener('touchmove', dragMove);
        document.removeEventListener('touchend', dragEnd);
    }

    textPreview.addEventListener('mousedown', dragStart);
    textPreview.addEventListener('touchstart', dragStart, { passive: false });

    // --- Download Logic ---
    function downloadRasterImage(format = 'png') {
        // Temporarily remove text drag handles for clean capture
        textPreview.style.cursor = 'default';
        
        html2canvas(preview, {
            backgroundColor: null, // Use transparent background
            logging: false,
            useCORS: true,
            scale: 2 // Increase resolution
        }).then(canvas => {
            const mimeType = `image/${format}`;
            const dataUrl = canvas.toDataURL(mimeType, format === 'jpeg' ? 0.9 : 1.0);
            triggerDownload(`image.${format}`, dataUrl);

            // Restore text drag handles
            textPreview.style.cursor = 'grab';
        });
    }

    downloadPNG.addEventListener('click', () => downloadRasterImage('png'));
    downloadJPG.addEventListener('click', () => downloadRasterImage('jpg'));

    // --- Initial Setup ---
    function initialize() {
        // Load custom presets
        updateDimensionPresetOptions();
        
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

        renderGradientColorPickers();
        updateControlVisibility();
        updatePreview();
        centerText();
    }

    // Wait for fonts to be ready before initializing to ensure correct text dimensions
    document.fonts.ready.then(() => {
        initializeTheme();
        initialize();
    });

    // Get current year
    document.getElementById("year").innerHTML = getYear();
});

function getYear() {
    return new Date().getFullYear();
}
