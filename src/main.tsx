import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './App.css'

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('TRACE RUNTIME ERROR:', error)
    console.error('TRACE COMPONENT STACK:', info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#080a09',
          color: '#fff',
          padding: '32px',
          fontFamily: 'monospace'
        }}>
          <h1 style={{ color: '#d8ff3e' }}>TRACE ERROR</h1>
          <p>{this.state.error.message}</p>
          <pre style={{
            whiteSpace: 'pre-wrap',
            color: '#ff7777',
            marginTop: '24px'
          }}>
            {this.state.error.stack}
          </pre>
        </div>
      )
    }

    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)
