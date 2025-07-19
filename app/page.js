'use client';

import { useAuth } from './context/AuthContext';
import { LoginForm } from "./components/loginForm" 
import { useTheme } from './context/AuthContext';
import { ChevronsUpDown, Plus , GalleryVerticalEnd , Moon , Sun} from "lucide-react"
export default function LoginPage() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 min-w-screen overflow-y-hidden">
       <button
                onClick={toggleTheme}
                className="flex items-center gap-2 px-3 py-1 rounded bg-gray-700 text-text hover:bg-gray-600 border border-gray-600 shadow-none group-data-[collapsible=icon]:hidden fixed top-5 right-5"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                {/* <span className="hidden sm:inline spbl">{theme === 'dark' ? 'Light' : 'Dark'} Mode</span> */}
              </button>
      <div className="max-w-md w-full space-y-8 max-h-screen">
        <LoginForm login={login} />
        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Secure authentication with device binding
          </p>
        </div>
      </div>
    </div>
  );
}
