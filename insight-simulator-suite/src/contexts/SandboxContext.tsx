// src/contexts/SandboxContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SandboxData {
  // Define the shape of your sandbox data (e.g., form inputs, selections, charts)
  // Example: Replace with your actual sandbox state structure
  selectedProducts: string[];
  customSettings: { [key: string]: any };
  // Add other fields as needed
}

interface SandboxContextType {
  sandboxData: SandboxData | null;
  setSandboxData: (data: SandboxData | null) => void;
  commitSandbox: () => void; // Saves data and clears state
  discardSandbox: () => void; // Resets state
  isSandboxActive: boolean;
  setSandboxActive: (active: boolean) => void;
}

const SandboxContext = createContext<SandboxContextType | undefined>(undefined);

export const useSandbox = () => {
  const context = useContext(SandboxContext);
  if (!context) {
    throw new Error('useSandbox must be used within a SandboxProvider');
  }
  return context;
};

interface SandboxProviderProps {
  children: ReactNode;
}

export const SandboxProvider: React.FC<SandboxProviderProps> = ({ children }) => {
  const [sandboxData, setSandboxDataState] = useState<SandboxData | null>(null);
  const [isSandboxActive, setSandboxActive] = useState(false);

  // Load persisted state from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('sandboxData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setSandboxDataState(parsed);
        setSandboxActive(true);
      } catch (error) {
        console.error('Failed to parse sandbox data from localStorage:', error);
      }
    }
  }, []);

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    if (sandboxData) {
      localStorage.setItem('sandboxData', JSON.stringify(sandboxData));
    } else {
      localStorage.removeItem('sandboxData');
    }
  }, [sandboxData]);

  const setSandboxData = (data: SandboxData | null) => {
    setSandboxDataState(data);
    if (data) {
      setSandboxActive(true);
    }
  };

  const commitSandbox = () => {
    // Implement commit logic here (e.g., save to backend, apply changes)
    console.log('Committing sandbox data:', sandboxData);
    // After committing, clear the state
    setSandboxData(null);
    setSandboxActive(false);
    localStorage.removeItem('sandboxData');
  };

  const discardSandbox = () => {
    setSandboxData(null);
    setSandboxActive(false);
    localStorage.removeItem('sandboxData');
  };

  return (
    <SandboxContext.Provider
      value={{
        sandboxData,
        setSandboxData,
        commitSandbox,
        discardSandbox,
        isSandboxActive,
        setSandboxActive,
      }}
    >
      {children}
    </SandboxContext.Provider>
  );
};
