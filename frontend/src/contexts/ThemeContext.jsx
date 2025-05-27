// ThemeContext.js
import { createContext, useContext, useEffect, useState } from 'react';
const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'light';
    }
    return 'light';
  });

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Update classes for backward compatibility
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    
    // Set data-theme attribute for new color system
    root.setAttribute('data-theme', theme);
    
    // Update theme color meta for mobile using new color system
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', theme === 'dark' ? '#0A0C0F' : '#FFFFFF');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;