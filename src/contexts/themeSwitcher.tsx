import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';

type Theme = 'light' | 'dark';

interface ThemeSwitcherType {
    themeMode: Theme;
    toggleTheme: () => void;
}

const ThemeSwitcher = createContext<ThemeSwitcherType | undefined>(undefined);

export const ThemeSwitcherProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Initialize themeMode from local storage or default to 'light'
    const [themeMode, setTheme] = useState<Theme>(() => {
        const storedTheme = localStorage.getItem('theme');
        return storedTheme === 'dark' ? 'dark' : 'light'; // Ensure valid theme
    });
    const toggleTheme = () => {
        setTheme((prevTheme) => {
            const newTheme = prevTheme === 'light' ? 'dark' : 'light';

            // Save the new theme to local storage
            localStorage.setItem('theme', newTheme);
            localStorage.setItem('mui-color-scheme-dark', newTheme) // Save new theme to local storage
            localStorage.setItem('mui-color-scheme-light', newTheme);
            localStorage.setItem('mui-mode', newTheme);
            localStorage.setItem('themeMode', newTheme);
            // Apply the new theme immediately by updating the `data-theme` attribute
            document.body.setAttribute('data-theme', newTheme);

            return newTheme;
        });
    };


    const value = useMemo(() => ({ themeMode, toggleTheme }), [themeMode]);

    useEffect(() => {
        document.body.setAttribute('data-theme', themeMode); // Use data-theme attribute for theming
    }, [themeMode]);

    return (
        <ThemeSwitcher.Provider value={value}>
            {children}
        </ThemeSwitcher.Provider>
    );
};

export const useThemeSwitcher = (): ThemeSwitcherType => {
    const context = useContext(ThemeSwitcher);
    if (context === undefined) {
        throw new Error('useThemeSwitcher must be used within a ThemeSwitcherProvider');
    }
    return context;
};
