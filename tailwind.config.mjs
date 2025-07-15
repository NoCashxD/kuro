// tailwind.config.mjs
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        accent: 'var(--accent)',
        text: 'var(--text)',
        primary: 'var(--primary)',
        secondary: 'var(--secondary)',
        border: 'var(--border)',
        danger: 'var(--danger)',
        success: 'var(--success)',
        gray: {
          900: '#131313',
          800: '#181818',
          700: '#232323',
          600: '#333333',
          500: '#444444',
        },
      },
      fontFamily: {
        mono: ["'IBM Plex Mono'", 'monospace'],
        sans: ["'IBM Plex Mono'", 'monospace'],
      },
      boxShadow: {
        card: '0 2px 16px 0 rgba(0,0,0,0.7)',
        btn: '0 1px 4px 0 rgba(0,0,0,0.5)',
        code: '0 1px 8px 0 rgba(0,0,0,0.5)',
      },
      borderRadius: {
        DEFAULT: '8px',
      },
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [],
}; 