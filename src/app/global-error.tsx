'use client';

/**
 * Last-resort boundary for errors in the root layout itself. It must render its own <html> and
 * cannot rely on the i18n provider, so it shows both languages.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'grid',
          placeItems: 'center',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans Arabic", Helvetica, Arial, sans-serif',
          background: 'Canvas',
          color: 'CanvasText',
          colorScheme: 'light dark',
          textAlign: 'center',
          padding: '1rem',
        }}
      >
        <main role="alert">
          <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>Something went wrong.</h1>
          <p style={{ margin: '0 0 0.5rem' }}>Please reload the page or try again shortly.</p>
          <p lang="ar" dir="rtl" style={{ margin: '0 0 1.5rem' }}>
            حدث خطأ ما. يُرجى إعادة تحميل الصفحة أو المحاولة مجددًا بعد قليل.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              minHeight: 44,
              padding: '0.5rem 1.5rem',
              border: 0,
              borderRadius: 999,
              background: '#c9a45c',
              color: '#0b0b0c',
              font: 'inherit',
              cursor: 'pointer',
            }}
          >
            Try again · <span lang="ar">حاول مجددًا</span>
          </button>
        </main>
      </body>
    </html>
  );
}
