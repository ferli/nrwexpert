// Main entry point for the Water Balance Calculator
import '../css/style.css';
import { init } from './ui.js';

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    // DOM already loaded (e.g., script at bottom of body)
    init();
}
