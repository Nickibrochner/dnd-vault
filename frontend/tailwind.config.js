import colors from 'tailwindcss/colors'

// Lyst tema i sand, pergament og træ. Komponenterne er skrevet med "mørke" klasser (bg-gray-900, text-gray-100 …),
// så skalaerne er vendt om her: lave tal er mørk blæk, høje tal er lyst pergament. Det holder klasserne ét sted.

/** Varm sand/pergament-skala – vendt om. */
const gray = {
  50: '#1c130b',
  100: '#2a1d12', // brødtekst (blæk)
  200: '#3a2a1c',
  300: '#4a3524',
  400: '#5f4630',
  500: '#735a3f', // dæmpet tekst og labels
  600: '#b39770', // kraftige kanter
  700: '#d2bd95', // kanter
  800: '#eadcbe', // sandfarvede felter og knapper
  900: '#f6ecd8', // pergament (paneler)
  950: '#fbf6ea', // lyseste pergament
}

/** Dyb crimson som accent – mørk nok til tekst på pergament og til knapper med hvid tekst. */
const red = {
  50: '#2e0707',
  100: '#3d0b0b',
  200: '#5c1010',
  300: '#761414',
  400: '#8f1a1a',
  500: '#9e1f1f',
  600: '#8a1b1b',
  700: '#721616',
  800: '#8a1b1b',
  900: '#f0d2c6',
  950: '#f6e1d8',
}

/**
 * Tilpasser en standardskala til lys baggrund: lyse tekstnuancer (200–400) bliver mørke,
 * mørke baggrunde (900–950) bliver lyse toninger, og 600–800 forbliver mørke nok til knapper og kanter.
 */
const light = p => ({
  50: p[950], 100: p[950], 200: p[900], 300: p[800], 400: p[700], 500: p[600],
  600: p[700], 700: p[600], 800: p[700], 900: p[200], 950: p[100],
})

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gray,
        red,
        ...Object.fromEntries(
          ['emerald', 'green', 'amber', 'yellow', 'sky', 'indigo', 'violet', 'pink', 'orange', 'slate'].map(c => [c, light(colors[c])]),
        ),
        // Navngivne farver til temaets flader
        sand: '#e6d6b3',
        wood: { light: '#7a5232', DEFAULT: '#5a3a22', dark: '#2f1d10' },
        gold: '#e3c27a',
      },
      fontFamily: {
        sans: ['var(--font-body)', 'Georgia', 'Cambria', '"Times New Roman"', 'serif'],
        display: ['Cinzel', '"Trajan Pro"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
