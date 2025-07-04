import React from 'react';

function ThemeToggle({ theme, toggleTheme }) {
  return (
    <button
      className="btn btn-link text-decoration-none p-2"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
    >
      {theme === 'light' ? (
        // Moon icon for dark mode
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        // Sun icon for light mode
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="5" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
          <line x1="12" y1="1" x2="12" y2="3" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
          <line x1="12" y1="21" x2="12" y2="23" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
          <line x1="1" y1="12" x2="3" y2="12" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
          <line x1="21" y1="12" x2="23" y2="12" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
        </svg>
      )}
    </button>
  );
}

export default ThemeToggle;