'use client';

/** Last-resort boundary for errors in the root layout itself. Must render its own <html>. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'grid',
          placeItems: 'center',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
          color: '#1d1d1f',
          textAlign: 'center',
          padding: '1rem',
        }}
      >
        <main role="alert">
          <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>Something went wrong.</h1>
          <p style={{ color: '#6e6e73', margin: '0 0 1.5rem' }}>Please reload the page or try again shortly.</p>
          <button
            type="button"
            onClick={reset}
            style={{
              minHeight: 44,
              padding: '0.5rem 1.5rem',
              border: 0,
              borderRadius: 999,
              background: '#0066cc',
              color: '#fff',
              font: 'inherit',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
