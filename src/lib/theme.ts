//-- Function to apply theme based on dark mode preference --
export const applyTheme = (dark: boolean) => {
  const root = document.documentElement;
  if (dark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};
