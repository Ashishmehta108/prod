module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        erp: {
          bg: "var(--erp-bg)",
          surface: "var(--erp-surface)",
          "surface-muted": "var(--erp-surface-muted)",
          "surface-hover": "var(--erp-surface-hover)",
          "surface-active": "var(--erp-surface-active)",
          border: "var(--erp-border)",
          "border-strong": "var(--erp-border-strong)",
          text: {
            primary: "var(--neutral-900)",
            secondary: "var(--erp-text-secondary)",
            tertiary: "var(--erp-text-tertiary)",
          },
          accent: "var(--erp-accent)",
          "accent-soft": "var(--erp-accent-soft)",
        },
      },
    },
  },
  plugins: []
};
