import React from 'react';

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: string;
  storageKey?: string;
}

export function ThemeProvider({ 
  children, 
  defaultTheme = "system",
  storageKey = "app-theme",
  ...props 
}: ThemeProviderProps) {
  // Simple passthrough without next-themes for now to prevent React context errors
  return <div className="theme-provider">{children}</div>;
}