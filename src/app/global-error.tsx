'use client'

import { useEffect } from 'react'
import { RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html>
      <body>
        <div
          style={{
            minHeight: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            backgroundColor: '#0a0a0a',
            color: '#f5f5f5',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <div style={{ maxWidth: '320px', width: '100%', textAlign: 'center' }}>
            <svg
              viewBox="0 0 80 80"
              style={{ width: '96px', height: '96px', margin: '0 auto 32px', opacity: 0.3 }}
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="40" cy="40" r="30" stroke="currentColor" strokeWidth="2" strokeDasharray="6 3" />
              <path d="M30 30 L50 50 M50 30 L30 50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <h1 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 8px' }}>
              Critical Error
            </h1>
            <p style={{ fontSize: '15px', color: '#a0a0a0', margin: '0 0 24px', lineHeight: 1.5 }}>
              Something went very wrong. Please try reloading.
            </p>
            <button
              onClick={reset}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 24px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: '#f5f5f5',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background-color 0.15s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)')}
            >
              <RefreshCw size={16} />
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
