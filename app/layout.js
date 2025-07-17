"use client";
import './globals.css';
import { AuthProvider, ThemeProvider ,  } from './context/AuthContext';

import { Toaster } from 'react-hot-toast';
import { SidebarProvider, SidebarTrigger } from "./components/ui/sidebar"

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-background text-text">
      <SidebarProvider>
      {/* <AppSidebar /> */}
      
        <ThemeProvider>
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
        </ThemeProvider>
        </SidebarProvider>

      </body>
    </html>
  );
}