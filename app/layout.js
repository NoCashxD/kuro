import './globals.css';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <main className="" style={{ minHeight: '100vh', boxSizing: 'border-box' }}>
            {children}
          </main>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#131313',
                color: '#fff',
                border: '1px solid #232323',
                fontFamily: "'IBM Plex Mono', monospace",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}