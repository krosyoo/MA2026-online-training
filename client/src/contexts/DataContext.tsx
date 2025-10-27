import { createContext, useContext, useState, ReactNode } from 'react';
import { Semester } from '@shared/types';
import { INITIAL_SEMESTERS } from '@shared/data';

interface DataContextType {
  semesters: Semester[];
  setSemesters: (semesters: Semester[]) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [semesters, setSemesters] = useState<Semester[]>(INITIAL_SEMESTERS);

  return (
    <DataContext.Provider value={{ semesters, setSemesters }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
