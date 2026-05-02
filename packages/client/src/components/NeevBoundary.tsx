import React, { Component, ErrorInfo, ReactNode, Suspense } from 'react'

export interface NeevBoundaryProps {
  children: ReactNode
  loadingFallback?: ReactNode
  errorFallback?: (error: Error, resetErrorBoundary: () => void) => ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class NeevErrorBoundary extends Component<
  { children: ReactNode; fallback?: (error: Error, reset: () => void) => ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode; fallback?: (error: Error, reset: () => void) => ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('NeevBoundary caught an error:', error, errorInfo)
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetErrorBoundary)
      }
      return (
        <div style={{ padding: '1rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', fontFamily: 'sans-serif' }}>
          <h3 style={{ margin: '0 0 8px 0' }}>Data Error</h3>
          <p style={{ margin: 0, fontSize: '14px' }}>{this.state.error.message}</p>
          <button 
            onClick={this.resetErrorBoundary}
            style={{ marginTop: '12px', padding: '6px 12px', background: '#b91c1c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
          >
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export function NeevBoundary({ children, loadingFallback, errorFallback }: NeevBoundaryProps): React.ReactElement {
  return (
    <NeevErrorBoundary fallback={errorFallback}>
      <Suspense fallback={loadingFallback ?? <div style={{ padding: '1rem', color: '#6b7280', fontFamily: 'sans-serif' }}>Loading data...</div>}>
        {children}
      </Suspense>
    </NeevErrorBoundary>
  )
}
