import { createContext, useContext, ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Semester } from '@shared/types';
import { apiRequest } from '@/lib/queryClient';

interface DataContextType {
  semesters: Semester[];
  isLoading: boolean;
  error: Error | null;
  /** Persists the admin dashboard's edits. Rejects if the save fails. */
  setSemesters: (semesters: Semester[]) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const SEMESTERS_QUERY_KEY = ['/api/semesters'];

export function DataProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<Semester[]>({
    queryKey: SEMESTERS_QUERY_KEY,
  });

  const saveMutation = useMutation({
    mutationFn: async (semesters: Semester[]) => {
      // The endpoint only accepts the fields the dashboard can edit.
      const payload = semesters.map((semester) => ({
        id: semester.id,
        title: semester.title,
        subtitle: semester.subtitle,
        description: semester.description,
        courses: semester.courses.map((course) => ({
          id: course.id,
          title: course.title,
          weeks: course.weeks,
          description: course.description,
          instructor: course.instructor,
          videoUrl: course.videoUrl,
        })),
      }));

      const res = await apiRequest('PUT', '/api/semesters', payload);
      return (await res.json()) as Semester[];
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(SEMESTERS_QUERY_KEY, updated);
    },
  });

  return (
    <DataContext.Provider
      value={{
        semesters: data ?? [],
        isLoading,
        error: (error as Error) ?? null,
        setSemesters: async (semesters) => {
          await saveMutation.mutateAsync(semesters);
        },
      }}
    >
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
