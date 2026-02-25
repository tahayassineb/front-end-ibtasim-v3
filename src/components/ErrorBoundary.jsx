import React from 'react';

// ============================================
// ERROR BOUNDARY - Catches React render errors
// Prevents the whole app from going blank.
// Displays the error so it can be debugged.
// ============================================

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-500 text-xl">error</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">حدث خطأ في التطبيق</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">An error occurred in this section</p>
              </div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 mb-6">
              <p className="text-sm font-mono text-red-700 dark:text-red-300 break-all">
                {this.state.error?.message || String(this.state.error)}
              </p>
            </div>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="w-full py-2.5 px-4 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium transition-colors"
            >
              Try Again / حاول مجدداً
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
