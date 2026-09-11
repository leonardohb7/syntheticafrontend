/* Tailwind 4 no Next entra pelo PostCSS. O plugin do Vite (@tailwindcss/vite)
   não se aplica aqui: quem processa o CSS é o pipeline do Next. */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
