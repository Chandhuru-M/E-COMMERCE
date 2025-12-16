import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    // Check localStorage first
    const saved = localStorage.getItem('theme-mode');
    if (saved) return saved === 'dark';
    
    // Check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark-mode');
      root.classList.remove('light-mode');
      // Set dark mode CSS variables for outlines and text
      root.style.setProperty('--outline-color', 'rgba(255,255,255,0.7)');
      root.style.setProperty('--text-color', '#f5f5f5');
      root.style.setProperty('--chatbot-bg', '#23272f');
      root.style.setProperty('--product-outline', '1.5px solid rgba(255,255,255,0.5)');
    } else {
      root.classList.add('light-mode');
      root.classList.remove('dark-mode');
      // Set light mode CSS variables for outlines and text
      root.style.setProperty('--outline-color', 'rgba(0,0,0,0.2)');
      root.style.setProperty('--text-color', '#222');
      root.style.setProperty('--chatbot-bg', '#fff');
      root.style.setProperty('--product-outline', '1.5px solid rgba(0,0,0,0.1)');
    }
    
    // Save preference
    localStorage.setItem('theme-mode', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};