import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ExcelToKB } from '../pages/ExcelToKB';
import { AppProvider } from '../contexts/AppContext';

describe('ExcelToKB', () => {
    it('renders all form sections', () => {
        render(
            <AppProvider>
                <ExcelToKB />
            </AppProvider>
        );

        expect(screen.getByText(/Excel to KB/i)).toBeInTheDocument();
        expect(screen.getByText(/Azure Blob Download/i)).toBeInTheDocument();
        expect(screen.getByText(/Data Prep/i)).toBeInTheDocument();
        expect(screen.getByText(/Azure Doc Intelligence/i)).toBeInTheDocument();
        expect(screen.getByText(/KB Builder/i)).toBeInTheDocument();
        expect(screen.getByText(/Azure Blob Upload/i)).toBeInTheDocument();
    });

    it('updates form values', () => {
        render(
            <AppProvider>
                <ExcelToKB />
            </AppProvider>
        );

        const titleInput = screen.getByDisplayValue('Title');
        fireEvent.change(titleInput, { target: { value: 'New Title' } });
        expect(titleInput.value).toBe('New Title');
    });
});
