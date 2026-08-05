import { createContext, useContext, ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Semester } from '@shared/types';
import type { CourseCreateInput, SemesterCreateInput } from '@shared/schema';
import { ApiError, apiRequest } from '@/lib/queryClient';

interface DataContextType {
  semesters: Semester[];
  isLoading: boolean;
  error: Error | null;
  /** Persists the admin dashboard's text edits. Rejects if the save fails. */
  setSemesters: (semesters: Semester[]) => Promise<void>;
  createSemester: (input: SemesterCreateInput) => Promise<void>;
  /** Rejects with the server's message if `force` is needed and not set. */
  deleteSemester: (id: number, force?: boolean) => Promise<void>;
  createCourse: (semesterId: number, input: CourseCreateInput) => Promise<void>;
  deleteCourse: (id: number, force?: boolean) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const SEMESTERS_QUERY_KEY = ['/api/semesters'];

export function DataProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<Semester[]>({
    queryKey: SEMESTERS_QUERY_KEY,
  });

  const applyCurriculum = (updated: Semester[]) => {
    queryClient.setQueryData(SEMESTERS_QUERY_KEY, updated);
  };

  const saveMutation = useMutation({
    mutationFn: async (semesters: Semester[]) => {
      // The endpoint only accepts the fields the dashboard can edit.
      const payload = semesters.map((semester) => ({
        id: semester.id,
        version: semester.version,
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
        books: semester.books,
      }));

      const res = await apiRequest('PUT', '/api/semesters', payload);
      return (await res.json()) as Semester[];
    },
    onSuccess: applyCurriculum,
    onError: (error) => {
      // A concurrent-edit rejection ships the current server state. Adopt it
      // so the admin is looking at what actually exists before retrying —
      // retrying against the stale version would only conflict again.
      if (error instanceof ApiError && error.status === 409) {
        const latest = (error.body as { curriculum?: Semester[] })?.curriculum;
        if (latest) applyCurriculum(latest);
      }
    },
  });

  const createSemesterMutation = useMutation({
    mutationFn: async (input: SemesterCreateInput) => {
      const res = await apiRequest('POST', '/api/admin/semesters', input);
      return (await res.json()) as Semester[];
    },
    onSuccess: applyCurriculum,
  });

  const deleteSemesterMutation = useMutation({
    mutationFn: async ({ id, force }: { id: number; force?: boolean }) => {
      const res = await apiRequest(
        'DELETE',
        `/api/admin/semesters/${id}${force ? '?force=true' : ''}`,
      );
      return (await res.json()) as Semester[];
    },
    onSuccess: applyCurriculum,
  });

  const createCourseMutation = useMutation({
    mutationFn: async ({
      semesterId,
      input,
    }: {
      semesterId: number;
      input: CourseCreateInput;
    }) => {
      const res = await apiRequest(
        'POST',
        `/api/admin/semesters/${semesterId}/courses`,
        input,
      );
      return (await res.json()) as Semester[];
    },
    onSuccess: applyCurriculum,
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async ({ id, force }: { id: number; force?: boolean }) => {
      const res = await apiRequest(
        'DELETE',
        `/api/admin/courses/${id}${force ? '?force=true' : ''}`,
      );
      return (await res.json()) as Semester[];
    },
    onSuccess: applyCurriculum,
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
        createSemester: async (input) => {
          await createSemesterMutation.mutateAsync(input);
        },
        deleteSemester: async (id, force) => {
          await deleteSemesterMutation.mutateAsync({ id, force });
        },
        createCourse: async (semesterId, input) => {
          await createCourseMutation.mutateAsync({ semesterId, input });
        },
        deleteCourse: async (id, force) => {
          await deleteCourseMutation.mutateAsync({ id, force });
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
