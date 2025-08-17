import { opacity } from 'html2canvas/dist/types/css/property-descriptors/opacity';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes:{
        fadeIn:{
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        fadeOut:{
          "0%": { opacity: 1 },
          "100%": { opacity: 0 },
        },
        slideDown:{
          "0%": { transform: "translateY(-10px) ",opacity: 0 },
          "100%": { transform: "translateY(0) ",opacity: 1 },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.7s ease-in-out",
        fadeOut: "fadeOut 0.7s ease-in-out",
        slideDown: "slideDown 0.7s ease-out",
      },
    },
  },
  plugins: [],
}

