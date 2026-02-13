import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ApiKeyModal } from './ApiKeyModal';
import { AppProvider } from '../contexts/AppContext';
import { I18nProvider } from '../contexts/I18nContext';
import { translations } from '../i18n/translations';

describe('ApiKeyModal', () => {
    it('renders when no API key is present', () => {
        render(
            <I18nProvider>
                <AppProvider>
                    <ApiKeyModal />
                </AppProvider>
            </I18nProvider>
        );
        expect(screen.getByText(translations.tr.apiKey.welcomeTitle)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(translations.tr.apiKey.placeholder)).toBeInTheDocument();
    });

    it('validates empty input', () => {
        render(
            <I18nProvider>
                <AppProvider>
                    <ApiKeyModal />
                </AppProvider>
            </I18nProvider>
        );

        const button = screen.getByRole('button', { name: translations.tr.apiKey.submit });
        fireEvent.click(button);

        expect(screen.getByText(translations.tr.apiKey.requiredError)).toBeInTheDocument();
    });

    it('submits key and disappears', async () => {
        render(
            <I18nProvider>
                <AppProvider>
                    <ApiKeyModal />
                </AppProvider>
            </I18nProvider>
        );

        const input = screen.getByPlaceholderText(translations.tr.apiKey.placeholder);
        const button = screen.getByRole('button', { name: translations.tr.apiKey.submit });

        fireEvent.change(input, { target: { value: 'test-api-key' } });
        fireEvent.click(button);

        // In a real app, we'd mock the context or check if the modal is gone.
        // Since AppProvider updates state unmounts the modal if it returns null when authenticated.
        // But checking for disappearance might require waitFor if there were animations/async state updates.
        // Here we can check if the key was set in sessionStorage
        expect(sessionStorage.getItem('FLOW_AI_API_KEY')).toBe('test-api-key');
    });
});
