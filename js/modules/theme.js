/**
 * Theme management module for the image generator
 */

const THEME_STORAGE_KEY = 'imageGenerator_theme';

/**
 * Initialize theme functionality
 */
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

export { initializeTheme };
