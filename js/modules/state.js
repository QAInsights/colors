/**
 * State management module for the image generator
 */

// Default application state
const initialState = {
    width: 1200,
    height: 630,
    bgType: 'color',
    color1: '#3b82f6',
    gradientColors: ['#8b5cf6', '#ec4899'],
    gradientAngle: 90,
    imageSrc: null,
    imageBlur: 0,
    imageOpacity: 1,
    imageFit: 'contain', // Options: 'cover', 'contain', 'original'
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

// Create a copy of the initial state
const state = { ...initialState };

/**
 * Reset state to initial values
 */
function resetState() {
    Object.keys(initialState).forEach(key => {
        state[key] = initialState[key];
    });
}

/**
 * Update state with new values
 * @param {Object} newState - Object containing state properties to update
 */
function updateState(newState) {
    Object.keys(newState).forEach(key => {
        if (state.hasOwnProperty(key)) {
            state[key] = newState[key];
        }
    });
}

export { state, resetState, updateState };
