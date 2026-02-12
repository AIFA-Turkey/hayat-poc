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

        expect(screen.getByText(/Excel'den Bilgi Bankasına/i)).toBeInTheDocument();
        expect(screen.getByText(/Azure Blob İndirme/i)).toBeInTheDocument();
        expect(screen.getByText(/Veri Hazırlama/i)).toBeInTheDocument();
        expect(screen.getByText(/Azure Doc Intelligence/i)).toBeInTheDocument();
        expect(screen.getByText(/KB Oluşturucu/i)).toBeInTheDocument();
        expect(screen.getByText(/Azure Blob Yükleme/i)).toBeInTheDocument();
    });

    it('updates form values', () => {
        render(
            <AppProvider>
                <ExcelToKB />
            </AppProvider>
        );

        const titleInput = screen.getByDisplayValue('Başlık');
        fireEvent.change(titleInput, { target: { value: 'Yeni Başlık' } });
        expect(titleInput.value).toBe('Yeni Başlık');
    });
});
