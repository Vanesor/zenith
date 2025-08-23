/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'zenith': {
          primary: 'var(--primary-brand)',
          secondary: 'var(--text-secondary)',
          accent: 'var(--secondary-accent)',
          muted: 'var(--text-muted)',
          card: 'var(--bg-card)',
          section: 'var(--bg-section)',
          hover: 'var(--bg-hover)',
          border: 'var(--border-color)',
          sidebar: '#0f172a',  // Dark blue sidebar
          nav: '#1e293b',      // Slightly lighter blue for navigation
        },
        // Custom color scheme for the college theme
        'college': {
          primary: '#3b82f6',  // Bright blue
          secondary: '#8b5cf6', // Purple
          dark: '#0f172a',     // Very dark blue
          medium: '#1e293b',   // Dark blue
          light: '#f8fafc',    // Light blue-gray
          accent: '#60a5fa',   // Light blue
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
      },
    },
  },
  plugins: [],
}