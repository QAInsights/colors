// watermark.js - Watermark functionality module
import { state, updateState } from './state.js';

// Watermark state management
export const watermarkState = {
    images: [], // Array of uploaded images
    watermarkImage: null,
    currentImageIndex: 0,
    watermarkSettings: {
        x: 50, // percentage from left
        y: 50, // percentage from top
        opacity: 0.7,
        scale: 0.3,
        rotation: 0,
        blendMode: 'normal'
    }
};

// Initialize watermark functionality
export function initializeWatermark() {
    setupImageUpload();
    setupWatermarkUpload();
    setupWatermarkControls();
    updateWatermarkPreview();
}

// Setup multiple image upload
function setupImageUpload() {
    const imageUpload = document.getElementById('watermark-image-upload');
    const imagePreview = document.getElementById('watermark-image-preview');
    
    if (!imageUpload) return;
    
    imageUpload.addEventListener('change', handleMultipleImageUpload);
}

// Handle multiple image upload
function handleMultipleImageUpload(event) {
    const files = Array.from(event.target.files);
    const imagePreview = document.getElementById('watermark-image-preview');
    
    files.forEach((file, index) => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageData = {
                    id: Date.now() + index,
                    name: file.name,
                    src: e.target.result,
                    file: file
                };
                
                watermarkState.images.push(imageData);
                addImageToPreview(imageData);
                
                // Set first image as current if none selected
                if (watermarkState.images.length === 1) {
                    watermarkState.currentImageIndex = 0;
                    selectImage(0);
                }
            };
            reader.readAsDataURL(file);
        }
    });
}

// Add image to preview panel
function addImageToPreview(imageData) {
    const imagePreview = document.getElementById('watermark-image-preview');
    const imageIndex = watermarkState.images.length - 1;
    
    const imageContainer = document.createElement('div');
    imageContainer.className = 'relative group cursor-pointer border-2 border-transparent hover:border-blue-500 rounded-lg overflow-hidden';
    imageContainer.dataset.imageIndex = imageIndex;
    
    imageContainer.innerHTML = `
        <img src="${imageData.src}" alt="${imageData.name}" 
             class="w-full h-32 object-cover">
        <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
            <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button class="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full mr-2" 
                        onclick="removeImage(${imageIndex})">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        </div>
        <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
            <p class="text-white text-xs truncate">${imageData.name}</p>
        </div>
    `;
    
    imageContainer.addEventListener('click', () => selectImage(imageIndex));
    imagePreview.appendChild(imageContainer);
}

// Select an image for watermarking
export function selectImage(index) {
    if (index < 0 || index >= watermarkState.images.length) return;
    
    watermarkState.currentImageIndex = index;
    
    // Update visual selection
    const previews = document.querySelectorAll('#watermark-image-preview > div');
    previews.forEach((preview, i) => {
        if (i === index) {
            preview.classList.add('border-blue-500', 'border-2');
            preview.classList.remove('border-transparent');
        } else {
            preview.classList.remove('border-blue-500', 'border-2');
            preview.classList.add('border-transparent');
        }
    });
    
    updateWatermarkPreview();
}

// Remove an image
export function removeImage(index) {
    if (index < 0 || index >= watermarkState.images.length) return;
    
    watermarkState.images.splice(index, 1);
    
    // Update current index if necessary
    if (watermarkState.currentImageIndex >= watermarkState.images.length) {
        watermarkState.currentImageIndex = Math.max(0, watermarkState.images.length - 1);
    }
    
    // Rebuild preview
    rebuildImagePreview();
    updateWatermarkPreview();
}

// Rebuild image preview panel
function rebuildImagePreview() {
    const imagePreview = document.getElementById('watermark-image-preview');
    imagePreview.innerHTML = '';
    
    watermarkState.images.forEach((imageData, index) => {
        addImageToPreview(imageData);
    });
    
    if (watermarkState.images.length > 0) {
        selectImage(watermarkState.currentImageIndex);
    }
}

// Setup watermark image upload
function setupWatermarkUpload() {
    const watermarkUpload = document.getElementById('watermark-upload');
    
    if (!watermarkUpload) return;
    
    watermarkUpload.addEventListener('change', handleWatermarkUpload);
}

// Handle watermark image upload
function handleWatermarkUpload(event) {
    const file = event.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        watermarkState.watermarkImage = {
            src: e.target.result,
            name: file.name
        };
        
        // Reset watermark position to center
        watermarkState.watermarkSettings.x = 50;
        watermarkState.watermarkSettings.y = 50;
        
        updateWatermarkPreview();
        updateWatermarkControls();
    };
    reader.readAsDataURL(file);
}

// Setup watermark control handlers
function setupWatermarkControls() {
    const controls = {
        'watermark-x': (value) => { watermarkState.watermarkSettings.x = parseFloat(value); },
        'watermark-y': (value) => { watermarkState.watermarkSettings.y = parseFloat(value); },
        'watermark-opacity': (value) => { watermarkState.watermarkSettings.opacity = parseFloat(value); },
        'watermark-scale': (value) => { watermarkState.watermarkSettings.scale = parseFloat(value); },
        'watermark-rotation': (value) => { watermarkState.watermarkSettings.rotation = parseFloat(value); },
        'watermark-blend-mode': (value) => { watermarkState.watermarkSettings.blendMode = value; }
    };
    
    Object.entries(controls).forEach(([id, handler]) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', (e) => {
                console.log(`Slider ${id} changed to:`, e.target.value);
                handler(e.target.value);
                console.log('Calling updateWatermarkControls...');
                updateWatermarkControls(); // Update display values
                updateWatermarkPreview();
            });
        }
    });
}

// Update watermark controls with current values
function updateWatermarkControls() {
    try {
        console.log('updateWatermarkControls called, settings:', watermarkState.watermarkSettings);
        const settings = watermarkState.watermarkSettings;
        
        const controls = {
            'watermark-x': settings.x,
            'watermark-y': settings.y,
            'watermark-opacity': settings.opacity,
            'watermark-scale': settings.scale,
            'watermark-rotation': settings.rotation,
            'watermark-blend-mode': settings.blendMode
        };
        
        Object.entries(controls).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.value = value;
            }
        });
        
        // Update display values
        const displayElements = {
            'watermark-x-display': `${settings.x}%`,
            'watermark-y-display': `${settings.y}%`,
            'watermark-opacity-display': `${Math.round(settings.opacity * 100)}%`,
            'watermark-scale-display': `${Math.round(settings.scale * 100)}%`,
            'watermark-rotation-display': `${settings.rotation}°`
        };
        
        console.log('Display elements to update:', displayElements);
        
        Object.entries(displayElements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            console.log(`Looking for display element ${id}:`, element);
            if (element) {
                console.log(`Updating ${id} to:`, value);
                element.textContent = value;
            } else {
                console.error(`Display element ${id} not found!`);
            }
        });
        
        console.log('updateWatermarkControls completed successfully');
    } catch (error) {
        console.error('Error in updateWatermarkControls:', error);
    }
}

// Update watermark preview
export function updateWatermarkPreview() {
    const canvas = document.getElementById('watermark-preview-canvas');
    const ctx = canvas?.getContext('2d');
    
    if (!canvas || !ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const currentImage = watermarkState.images[watermarkState.currentImageIndex];
    if (!currentImage) {
        // Show placeholder when no images are uploaded
        showWatermarkPlaceholder(canvas, ctx);
        return;
    }
    
    const img = new Image();
    img.onload = () => {
        // Calculate canvas size maintaining aspect ratio
        const maxSize = 400;
        const aspectRatio = img.width / img.height;
        
        let canvasWidth, canvasHeight;
        if (aspectRatio > 1) {
            canvasWidth = Math.min(maxSize, img.width);
            canvasHeight = canvasWidth / aspectRatio;
        } else {
            canvasHeight = Math.min(maxSize, img.height);
            canvasWidth = canvasHeight * aspectRatio;
        }
        
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        
        // Draw base image
        ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
        
        // Draw watermark if available
        if (watermarkState.watermarkImage) {
            drawWatermarkOnCanvas(ctx, canvasWidth, canvasHeight);
        }
    };
    img.src = currentImage.src;
}

// Show placeholder when no images are uploaded
function showWatermarkPlaceholder(canvas, ctx) {
    // Set canvas to a reasonable default size
    canvas.width = 400;
    canvas.height = 300;
    
    // Fill with light background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add border
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
    
    // Add upload icon (simple cloud shape)
    ctx.fillStyle = '#94a3b8';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('📁', canvas.width / 2, canvas.height / 2 - 40);
    
    // Add main text
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('Upload Images to Get Started', canvas.width / 2, canvas.height / 2 + 10);
    
    // Add instruction text
    ctx.fillStyle = '#64748b';
    ctx.font = '14px Arial';
    ctx.fillText('Select multiple images using the upload button above', canvas.width / 2, canvas.height / 2 + 35);
    ctx.fillText('Then upload a watermark image to overlay', canvas.width / 2, canvas.height / 2 + 55);
}

// Draw watermark on canvas
function drawWatermarkOnCanvas(ctx, canvasWidth, canvasHeight) {
    const watermarkImg = new Image();
    watermarkImg.onload = () => {
        const settings = watermarkState.watermarkSettings;
        
        // Calculate watermark dimensions
        const watermarkWidth = watermarkImg.width * settings.scale;
        const watermarkHeight = watermarkImg.height * settings.scale;
        
        // Calculate position
        const x = (canvasWidth * settings.x / 100) - (watermarkWidth / 2);
        const y = (canvasHeight * settings.y / 100) - (watermarkHeight / 2);
        
        // Save context
        ctx.save();
        
        // Apply transformations
        ctx.globalAlpha = settings.opacity;
        ctx.globalCompositeOperation = settings.blendMode;
        
        // Apply rotation
        if (settings.rotation !== 0) {
            const centerX = x + watermarkWidth / 2;
            const centerY = y + watermarkHeight / 2;
            ctx.translate(centerX, centerY);
            ctx.rotate(settings.rotation * Math.PI / 180);
            ctx.translate(-centerX, -centerY);
        }
        
        // Draw watermark
        ctx.drawImage(watermarkImg, x, y, watermarkWidth, watermarkHeight);
        
        // Restore context
        ctx.restore();
    };
    watermarkImg.src = watermarkState.watermarkImage.src;
}

// Download all images with watermark
export function downloadAllWatermarkedImages() {
    if (watermarkState.images.length === 0 || !watermarkState.watermarkImage) {
        alert('Please upload images and a watermark first.');
        return;
    }
    
    watermarkState.images.forEach((imageData, index) => {
        setTimeout(() => {
            downloadWatermarkedImage(imageData);
        }, index * 500); // Stagger downloads
    });
}

// Download single watermarked image
export function downloadWatermarkedImage(imageData) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const img = new Image();
    img.onload = () => {
        // Set canvas to original image size for high quality
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw base image
        ctx.drawImage(img, 0, 0);
        
        // Draw watermark
        if (watermarkState.watermarkImage) {
            const watermarkImg = new Image();
            watermarkImg.onload = () => {
                const settings = watermarkState.watermarkSettings;
                
                // Calculate watermark dimensions for original size
                const watermarkWidth = watermarkImg.width * settings.scale;
                const watermarkHeight = watermarkImg.height * settings.scale;
                
                // Calculate position
                const x = (canvas.width * settings.x / 100) - (watermarkWidth / 2);
                const y = (canvas.height * settings.y / 100) - (watermarkHeight / 2);
                
                // Save context
                ctx.save();
                
                // Apply transformations
                ctx.globalAlpha = settings.opacity;
                ctx.globalCompositeOperation = settings.blendMode;
                
                // Apply rotation
                if (settings.rotation !== 0) {
                    const centerX = x + watermarkWidth / 2;
                    const centerY = y + watermarkHeight / 2;
                    ctx.translate(centerX, centerY);
                    ctx.rotate(settings.rotation * Math.PI / 180);
                    ctx.translate(-centerX, -centerY);
                }
                
                // Draw watermark
                ctx.drawImage(watermarkImg, x, y, watermarkWidth, watermarkHeight);
                
                // Restore context
                ctx.restore();
                
                // Download image
                canvas.toBlob((blob) => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    
                    // Add watermark suffix to filename
                    const originalName = imageData.name;
                    const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));
                    const ext = originalName.substring(originalName.lastIndexOf('.'));
                    a.download = `${nameWithoutExt}_watermarked${ext}`;
                    
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }, 'image/png', 1.0); // High quality PNG
            };
            watermarkImg.src = watermarkState.watermarkImage.src;
        }
    };
    img.src = imageData.src;
}

// Preset watermark positions
export function setWatermarkPosition(position) {
    const positions = {
        'top-left': { x: 15, y: 15 },
        'top-center': { x: 50, y: 15 },
        'top-right': { x: 85, y: 15 },
        'center-left': { x: 15, y: 50 },
        'center': { x: 50, y: 50 },
        'center-right': { x: 85, y: 50 },
        'bottom-left': { x: 15, y: 85 },
        'bottom-center': { x: 50, y: 85 },
        'bottom-right': { x: 85, y: 85 }
    };
    
    if (positions[position]) {
        watermarkState.watermarkSettings.x = positions[position].x;
        watermarkState.watermarkSettings.y = positions[position].y;
        updateWatermarkControls();
        updateWatermarkPreview();
    }
}

// Make functions globally available
window.removeImage = removeImage;
window.setWatermarkPosition = setWatermarkPosition;
