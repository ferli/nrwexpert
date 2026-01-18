import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Retrieve window/document from the global JSDOM environment set by Vitest
// But we need to make sure ui.js attaches things to THIS window.
// Since ui.js executes side effects on import (attaching to window), we need to ensure the DOM exists first.

describe('Wizard UI Logic', () => {
    let uiModule;

    beforeEach(async () => {
        // Reset DOM
        document.body.innerHTML = `
            <div class="calculator-container"></div>
            <div class="hero"></div>
        `;

        // Mock window methods that might be called
        window.alert = vi.fn();
        window.confirm = vi.fn(() => true);
        window.scroll = vi.fn();
        window.HTMLElement.prototype.scrollIntoView = vi.fn();

        // Re-import ui.js to re-attach handlers or reset state if possible.
        // Since ES modules are cached, we might need to rely on the side effects having happened once,
        // OR we need to expose a reset function. Be careful with module state.
        // For this test, we assume window.nextStep etc are available if we import it.

        // We use a query parameter or similar to force re-evaluation if needed, but in Vitest 
        // usually we test the side-effects. 
        // Ideally ui.js should export the logic. 
        // Let's rely on the window attachments established by the module.
        if (!window.nextStep) {
            uiModule = await import('../src/js/ui.js');
        }

        // Reset wizard state? 
        // We can't easily reset module-level variables (currentWizardStep) without an exported resetter.
        // This is a limitation of the current ui.js design. 
        // Workaround: We can use goToStep(1) to reset.
        if (window.goToStep) {
            window.goToStep(1);
        }
    });

    it('should initialize at Step 1', () => {
        // Check if Step 1 content is rendered
        const step1Title = document.querySelector('h3');
        expect(step1Title).not.toBeNull();
        expect(step1Title.textContent).toContain('Langkah 1');

        // Check wizard stepper
        const activeStep = document.querySelector('.step-item.active .step-circle');
        expect(activeStep.textContent).toBe('1');
    });

    it('should navigate to next step (1 -> 2)', () => {
        // Verify we are at step 1
        expect(document.querySelector('h3').textContent).toContain('Langkah 1');

        // Fill some data (simulate user input)
        const nameInput = document.getElementById('pdamName');
        if (nameInput) nameInput.value = "Test PDAM";

        // Trigger Next
        window.nextStep();

        // Verify Step 2
        const step2Title = document.querySelector('h3');
        expect(step2Title.textContent).toContain('Langkah 2');

        // Verify 2 is active
        const activeStep = document.querySelector('.step-item.active .step-circle');
        expect(activeStep.textContent).toBe('2');
    });

    it('should navigate back (2 -> 1) and preserve data', () => {
        // Go to Step 2
        window.nextStep();
        expect(document.querySelector('h3').textContent).toContain('Langkah 2');

        // Enter data in Step 2
        const sivInput = document.getElementById('systemInputVolume');
        sivInput.value = "1000";

        // Go back
        window.prevStep();
        expect(document.querySelector('h3').textContent).toContain('Langkah 1');

        // Go forward again
        window.nextStep();

        // Check if SIV is preserved
        const sivInputRef = document.getElementById('systemInputVolume');
        expect(sivInputRef.value).toBe("1000");
    });

    it('should load Presets correctly', () => {
        // We are at Step 1
        window.goToStep(1);

        // Click Preset Button (simulated via function call)
        window.loadPreset('medium');

        // Check fields
        const customers = document.getElementById('numberOfCustomers');
        const pipe = document.getElementById('pipeLengthKm');

        expect(customers.value).toBe('50000');
        expect(pipe.value).toBe('850');
    });

    it('should prevent going beyond Step 3', () => {
        window.goToStep(3);
        expect(document.querySelector('h3').textContent).toContain('Langkah 3');

        window.nextStep(); // Should stay at 3 or loop? Logic says if(current > 3) current = 3

        // Actually the logic in the code:
        // if (currentWizardStep < 1) currentWizardStep = 1;
        // if (currentWizardStep > 3) currentWizardStep = 3;
        // window.nextStep() does currentWizardStep++ BEFORE check.
        // Wait, window.nextStep implementation:
        // currentWizardStep++; renderPDAMForm();
        // inside renderPDAMForm: if (currentWizardStep > 3) currentWizardStep = 3;
        // So effectively it stays at 3.

        expect(document.querySelector('h3').textContent).toContain('Langkah 3');
    });

    it('should render correct HTML structure for Wizard', () => {
        // Check stepper existence
        const stepper = document.querySelector('.wizard-stepper');
        expect(stepper).toBeTruthy();
        expect(document.querySelectorAll('.step-item').length).toBe(3);
    });
});
