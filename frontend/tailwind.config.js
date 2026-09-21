/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F0F7FF',
          100: '#E0EFFF',
          200: '#B9DDFF',
          500: '#0066CC',
          600: '#0052A3',
          700: '#1E3E62',
          800: '#132B45',
          900: '#0B192C', // Core Dark Navy
          950: '#060E18'
        },
        cyan: {
          accent: '#06B6D4',
          glow: '#22D3EE'
        },
        verified: {
          light: '#ECFDF5',
          border: '#A7F3D0',
          text: '#065F46',
          DEFAULT: '#10B981'
        },
        review: {
          light: '#FFFBEB',
          border: '#FDE68A',
          text: '#92400E',
          DEFAULT: '#F59E0B'
        },
        suspicious: {
          light: '#FEF2F2',
          border: '#FECACA',
          text: '#991B1B',
          DEFAULT: '#EF4444'
        }
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 10px 25px -5px rgba(11, 25, 44, 0.08), 0 8px 10px -6px rgba(11, 25, 44, 0.04)',
        'elevated': '0 20px 25px -5px rgba(11, 25, 44, 0.1), 0 8px 10px -6px rgba(11, 25, 44, 0.05)'
      }
    },
  },
  plugins: [],
}
