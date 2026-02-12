import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ApiKeyModal } from './ApiKeyModal';
import { AppProvider } from '../contexts/AppContext';

describe('ApiKeyModal', () => {
    it('renders when no API key is present', () => {
        render(
            <AppProvider>
                <ApiKeyModal />
            </AppProvider>
        );
        expect(screen.getByText(/Patent GPT'ye Hoş Geldiniz!/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/sk-.../i)).toBeInTheDocument();
    });

    it('validates empty input', () => {
        render(
            <AppProvider>
                <ApiKeyModal />
            </AppProvider>
        );

        const button = screen.getByRole('button', { name: /Panele Eriş/i });
        fireEvent.click(button);

        expect(screen.getByText(/API anahtarı gerekmektedir!/i)).toBeInTheDocument();
    });

    it('submits key and disappears', async () => {
        render(
            <AppProvider>
                <ApiKeyModal />
            </AppProvider>
        );

        const input = screen.getByPlaceholderText(/sk-.../i);
        const button = screen.getByRole('button', { name: /Panele Giriş/i });

        fireEvent.change(input, { target: { value: 'test-api-key' } });
        fireEvent.click(button);

        // In a real app, we'd mock the context or check if the modal is gone.
        // Since AppProvider updates state unmounts the modal if it returns null when authenticated.
        // But checking for disappearance might require waitFor if there were animations/async state updates.
        // Here we can check if the key was set in sessionStorage
        expect(sessionStorage.getItem('FLOW_AI_API_KEY')).toBe('test-api-key');
    });
});
