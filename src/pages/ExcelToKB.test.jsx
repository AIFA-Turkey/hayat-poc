import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ExcelToKB } from '../pages/ExcelToKB';
import { AppProvider } from '../contexts/AppContext';
import { I18nProvider } from '../contexts/I18nContext';
import { translations } from '../i18n/translations';

describe('ExcelToKB', () => {
    it('renders all form sections', () => {
        render(
            <I18nProvider>
                <AppProvider>
                    <ExcelToKB />
                </AppProvider>
            </I18nProvider>
        );

        expect(screen.getByText(translations.tr.excelToKb.title)).toBeInTheDocument();
        expect(screen.getByText(translations.tr.common.fileUpload)).toBeInTheDocument();
        expect(screen.getByText(translations.tr.common.dataPrep)).toBeInTheDocument();
        expect(screen.getByText(translations.tr.common.kbBuilder)).toBeInTheDocument();
    });

    it('updates form values', () => {
        render(
            <I18nProvider>
                <AppProvider>
                    <ExcelToKB />
                </AppProvider>
            </I18nProvider>
        );

        const titleInput = screen.getByDisplayValue('Başlık');
        fireEvent.change(titleInput, { target: { value: 'Yeni Başlık' } });
        expect(titleInput.value).toBe('Yeni Başlık');
    });
});
