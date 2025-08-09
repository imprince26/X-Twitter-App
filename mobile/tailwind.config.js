/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // X/Twitter Brand Colors
        'x-blue': '#1DA1F2',
        'x-blue-hover': '#1991DA',
        'x-blue-pressed': '#1681C0',
        
        // Background Colors
        'background': {
          light: '#FFFFFF',
          dark: '#000000',
        },
        
        // Text Colors
        'foreground': {
          primary: {
            light: '#0F1419',
            dark: '#FFFFFF',
          },
          secondary: {
            light: '#536471',
            dark: '#E7E9EA',
          },
          tertiary: {
            light: '#657786',
            dark: '#71767B',
          },
        },
        
        // Border Colors
        'x-border': {
          light: '#CFD9DE',
          dark: '#2F3336',
        },
        'x-border-strong': {
          light: '#8B98A5',
          dark: '#3E4144',
        },
        
        // Gray Scale
        'x-gray': {
          50: '#F7F9FA',
          100: '#E1E8ED',
          200: '#AAB8C2',
          300: '#657786',
          400: '#536471',
          500: '#3E4144',
          600: '#2F3336',
          700: '#202327',
          800: '#15181C',
          900: '#0F1419',
        },
        
        // Button Colors
        'x-button': {
          primary: {
            bg: '#1DA1F2',
            hover: '#1991DA',
            pressed: '#1681C0',
            text: '#FFFFFF',
          },
          secondary: {
            bg: {
              light: '#0F1419',
              dark: '#FFFFFF',
            },
            hover: {
              light: '#272C30',
              dark: '#E7E9EA',
            },
            text: {
              light: '#FFFFFF',
              dark: '#0F1419',
            },
          },
          outline: {
            border: {
              light: '#CFD9DE',
              dark: '#536471',
            },
            text: {
              light: '#0F1419',
              dark: '#FFFFFF',
            },
          },
        },
        
        // Interactive States
        'x-hover': {
          light: '#F7F9FA',
          dark: '#080808',
        },
        'x-selected': {
          light: '#E1E8ED',
          dark: '#16181C',
        },
        
        // Error/Success States
        'x-error': '#F4212E',
        'x-success': '#00BA7C',
        'x-warning': '#FFD400',
        
        // Accent Colors
        'x-like': '#F91880',
        'x-retweet': '#00BA7C',
        'x-reply': '#1DA1F2',
        'x-share': '#1DA1F2',
      },
    },
  },
  plugins: [],
};