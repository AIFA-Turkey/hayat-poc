import { Component } from 'react';
import { I18nContext } from '../contexts/I18nContext';

export class ErrorBoundary extends Component {
    static contextType = I18nContext;

    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            const t = this.context?.t;
            return (
                <div className="p-8 max-w-2xl mx-auto mt-10 bg-red-50 border border-red-200 rounded-xl text-red-900 font-sans">
                    <h1 className="text-2xl font-bold mb-4">{t ? t('errorBoundary.title') : 'Bir şeyler yanlış gitti.'}</h1>
                    <p className="mb-4">{t ? t('errorBoundary.subtitle') : 'Uygulama aşağıdaki hatayı üretti:'}</p>
                    <pre className="bg-white p-4 rounded-lg overflow-auto text-sm font-mono border border-red-100">
                        {this.state.error && this.state.error.toString()}
                        <br />
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </pre>
                </div>
            );
        }

        return this.props.children;
    }
}
