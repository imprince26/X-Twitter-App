/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#1DA1F2', // X's blue for light mode
          dark: '#1DA1F2', // Same blue for dark mode
        },
        background: {
          light: '#FFFFFF', // White for light mode
          dark: '#000000', // Black for dark mode
        },
        text: {
          light: '#000000', // Black text for light mode
          dark: '#FFFFFF', // White text for dark mode
        },
        gray: {
          light: '#AAB8C2', // Light gray for light mode
          dark: '#657786', // Darker gray for dark mode
        },
      },
    },
  },
  plugins: [],
};