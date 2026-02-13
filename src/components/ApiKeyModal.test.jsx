import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { ApiKeyModal } from './ApiKeyModal';
import { AppProvider } from '../contexts/AppContext';
import { I18nProvider } from '../contexts/I18nContext';
import { translations } from '../i18n/translations';

describe('ApiKeyModal', () => {
    beforeEach(() => {
        sessionStorage.clear();
    });

    it('renders when no API key is present', () => {
        render(
            <I18nProvider>
                <AppProvider>
                    <ApiKeyModal />
                </AppProvider>
            </I18nProvider>
        );
        expect(screen.getByText(translations.tr.apiKey.welcomeTitle)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: translations.tr.apiKey.submit })).toBeInTheDocument();
    });

    it('stays visible until authenticated', async () => {
        render(
            <I18nProvider>
                <AppProvider>
                    <ApiKeyModal />
                </AppProvider>
            </I18nProvider>
        );

        const button = screen.getByRole('button', { name: translations.tr.apiKey.submit });
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText(translations.tr.apiKey.welcomeTitle)).toBeInTheDocument();
        });
    });
});
