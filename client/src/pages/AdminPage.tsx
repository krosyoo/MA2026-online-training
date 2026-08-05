import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminUserSummary, Book, Semester, User } from '@shared/types';
import type { CourseCreateInput, SemesterCreateInput } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Shield, Save, Plus, Trash2, Users, KeyRound, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, ApiError } from '@/lib/queryClient';

interface AdminPageProps {
  user: User | null;
  semesters: Semester[];
  onSave: (semesters: Semester[]) => Promise<void>;
  onCreateSemester: (input: SemesterCreateInput) => Promise<void>;
  onDeleteSemester: (id: number, force?: boolean) => Promise<void>;
  onCreateCourse: (semesterId: number, input: CourseCreateInput) => Promise<void>;
  onDeleteCourse: (id: number, force?: boolean) => Promise<void>;
}

type BookCategory = 'lecture' | 'required' | 'recommended';
const BOOK_CATEGORIES: { key: BookCategory; label: string }[] = [
  { key: 'lecture', label: '강의 도서' },
  { key: 'required', label: '필수 도서' },
  { key: 'recommended', label: '추천 도서' },
];

const blankBook: Book = { title: '', publisher: '', link: '' };
const blankCourseDraft: CourseCreateInput = {
  title: '',
  weeks: 1,
  description: '',
  instructor: '',
  videoUrl: '',
};
const blankSemesterDraft: SemesterCreateInput = {
  title: '',
  subtitle: '',
  description: '',
};

export function AdminPage({
  user,
  semesters,
  onSave,
  onCreateSemester,
  onDeleteSemester,
  onCreateCourse,
  onDeleteCourse,
}: AdminPageProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editedSemesters, setEditedSemesters] = useState<Semester[]>(semesters);
  const [isSaving, setIsSaving] = useState(false);
  const [newSemester, setNewSemester] = useState(blankSemesterDraft);
  const [isCreatingSemester, setIsCreatingSemester] = useState(false);
  const [newCourseDrafts, setNewCourseDrafts] = useState<Record<number, CourseCreateInput>>({});
  const [creatingCourseFor, setCreatingCourseFor] = useState<number | null>(null);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, string>>({});

  const isAdmin = Boolean(user && user.role === 'admin');

  // Re-syncs after every successful create/delete (which refresh `semesters`
  // from the server) as well as the initial load. Any unsaved text edits
  // elsewhere on the page are reset along with it — acceptable for an
  // admin-only tool, and simpler than diffing drafts against a moving base.
  useEffect(() => {
    setEditedSemesters(semesters);
  }, [semesters]);

  const { data: adminUsers, isLoading: isUsersLoading } = useQuery<AdminUserSummary[]>({
    queryKey: ['/api/admin/users'],
    enabled: isAdmin,
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest('POST', `/api/admin/users/${userId}/reset-password`, {});
      return (await res.json()) as { email: string; temporaryPassword: string };
    },
    onSuccess: (data, userId) => {
      setRevealedPasswords((prev) => ({ ...prev, [userId]: data.temporaryPassword }));
      toast({
        title: '임시 비밀번호를 생성했습니다',
        description: `${data.email}님에게 안전한 방법으로 전달해주세요. 이 화면을 벗어나면 다시 볼 수 없습니다.`,
      });
    },
    onError: (error) => {
      toast({
        title: '재설정하지 못했습니다',
        description: (error as Error).message,
        variant: 'destructive',
      });
    },
  });

  const setRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'student' | 'admin' }) => {
      const res = await apiRequest('PATCH', `/api/admin/users/${userId}`, { role });
      return (await res.json()) as AdminUserSummary[];
    },
    onSuccess: (rows) => {
      queryClient.setQueryData(['/api/admin/users'], rows);
      toast({ title: '권한을 변경했습니다' });
    },
    onError: (error) => {
      toast({
        title: '권한을 변경하지 못했습니다',
        description: (error as Error).message,
        variant: 'destructive',
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest('DELETE', `/api/admin/users/${userId}`);
      return (await res.json()) as AdminUserSummary[];
    },
    onSuccess: (rows) => {
      queryClient.setQueryData(['/api/admin/users'], rows);
      toast({ title: '사용자를 삭제했습니다' });
    },
    onError: (error) => {
      toast({
        title: '삭제하지 못했습니다',
        description: (error as Error).message,
        variant: 'destructive',
      });
    },
  });

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center justify-center p-3 bg-destructive/10 rounded-full mb-4">
              <Shield className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4" data-testid="text-access-denied">접근 권한이 없습니다</h1>
            <p className="text-muted-foreground" data-testid="text-access-denied-message">
              이 페이지는 관리자만 접근할 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const updateSemester = (semesterId: number, field: string, value: string) => {
    setEditedSemesters(prev =>
      prev.map(semester =>
        semester.id === semesterId
          ? { ...semester, [field]: value }
          : semester
      )
    );
  };

  const updateCourse = (semesterId: number, courseId: number, field: string, value: string | number) => {
    setEditedSemesters(prev =>
      prev.map(semester =>
        semester.id === semesterId
          ? {
              ...semester,
              courses: semester.courses.map(course =>
                course.id === courseId
                  ? { ...course, [field]: value }
                  : course
              )
            }
          : semester
      )
    );
  };

  const updateBook = (
    semesterId: number,
    category: BookCategory,
    index: number,
    field: keyof Book,
    value: string,
  ) => {
    setEditedSemesters((prev) =>
      prev.map((semester) =>
        semester.id === semesterId
          ? {
              ...semester,
              books: {
                ...semester.books,
                [category]: semester.books[category].map((book, i) =>
                  i === index ? { ...book, [field]: value } : book,
                ),
              },
            }
          : semester,
      ),
    );
  };

  const addBook = (semesterId: number, category: BookCategory) => {
    setEditedSemesters((prev) =>
      prev.map((semester) =>
        semester.id === semesterId
          ? {
              ...semester,
              books: {
                ...semester.books,
                [category]: [...semester.books[category], { ...blankBook }],
              },
            }
          : semester,
      ),
    );
  };

  const removeBook = (semesterId: number, category: BookCategory, index: number) => {
    setEditedSemesters((prev) =>
      prev.map((semester) =>
        semester.id === semesterId
          ? {
              ...semester,
              books: {
                ...semester.books,
                [category]: semester.books[category].filter((_, i) => i !== index),
              },
            }
          : semester,
      ),
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(editedSemesters);
      toast({
        title: '변경사항 저장 완료',
        description: '모든 학기, 강의, 도서 정보가 업데이트되었습니다.',
      });
    } catch {
      toast({
        title: '저장 실패',
        description: '변경사항을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateSemester = async () => {
    if (!newSemester.title.trim()) {
      toast({ title: '학기 제목을 입력해주세요.', variant: 'destructive' });
      return;
    }
    setIsCreatingSemester(true);
    try {
      await onCreateSemester(newSemester);
      setNewSemester(blankSemesterDraft);
      toast({ title: '새 학기를 추가했습니다' });
    } catch (error) {
      toast({
        title: '추가하지 못했습니다',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsCreatingSemester(false);
    }
  };

  const handleDeleteSemester = async (semester: Semester) => {
    if (!window.confirm(`"${semester.title}" 학기를 삭제하시겠습니까?\n포함된 모든 강의와 도서 목록도 함께 삭제됩니다.`)) {
      return;
    }
    try {
      await onDeleteSemester(semester.id);
      toast({ title: '학기를 삭제했습니다', description: semester.title });
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        if (window.confirm(`${error.message}\n\n계속 삭제하시겠습니까?`)) {
          try {
            await onDeleteSemester(semester.id, true);
            toast({ title: '학기를 삭제했습니다', description: semester.title });
          } catch {
            toast({ title: '삭제하지 못했습니다', description: '잠시 후 다시 시도해주세요.', variant: 'destructive' });
          }
        }
        return;
      }
      toast({
        title: '삭제하지 못했습니다',
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  };

  const getCourseDraft = (semesterId: number): CourseCreateInput =>
    newCourseDrafts[semesterId] ?? blankCourseDraft;

  const updateCourseDraft = (semesterId: number, field: string, value: string | number) => {
    setNewCourseDrafts((prev) => ({
      ...prev,
      [semesterId]: { ...getCourseDraft(semesterId), [field]: value },
    }));
  };

  const handleCreateCourse = async (semesterId: number) => {
    const draft = getCourseDraft(semesterId);
    if (!draft.title.trim()) {
      toast({ title: '강의 제목을 입력해주세요.', variant: 'destructive' });
      return;
    }
    setCreatingCourseFor(semesterId);
    try {
      await onCreateCourse(semesterId, draft);
      setNewCourseDrafts((prev) => ({ ...prev, [semesterId]: blankCourseDraft }));
      toast({ title: '새 강의를 추가했습니다' });
    } catch (error) {
      toast({
        title: '추가하지 못했습니다',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setCreatingCourseFor(null);
    }
  };

  const handleDeleteCourse = async (semesterTitle: string, courseId: number, courseTitle: string) => {
    if (!window.confirm(`"${courseTitle}" 강의를 삭제하시겠습니까?`)) {
      return;
    }
    try {
      await onDeleteCourse(courseId);
      toast({ title: '강의를 삭제했습니다', description: courseTitle });
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        if (window.confirm(`${error.message}\n\n계속 삭제하시겠습니까?`)) {
          try {
            await onDeleteCourse(courseId, true);
            toast({ title: '강의를 삭제했습니다', description: courseTitle });
          } catch {
            toast({ title: '삭제하지 못했습니다', description: '잠시 후 다시 시도해주세요.', variant: 'destructive' });
          }
        }
        return;
      }
      toast({
        title: '삭제하지 못했습니다',
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-12">
            <div className="inline-flex items-center justify-center p-3 bg-brand-light rounded-full mb-4">
              <Shield className="h-8 w-8 text-brand-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2" data-testid="text-page-title">
              관리자 대시보드
            </h1>
            <p className="text-lg text-muted-foreground" data-testid="text-page-description">
              학기, 강의, 도서, 사용자를 관리할 수 있습니다.
            </p>
          </div>

          {/* User Management */}
          <Card className="mb-12" data-testid="card-user-management">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Users className="h-5 w-5 text-brand-primary" />
                <h2 className="text-xl font-semibold text-foreground">사용자 관리</h2>
              </div>

              {isUsersLoading ? (
                <p className="text-sm text-muted-foreground">불러오는 중…</p>
              ) : (
                <div className="space-y-3">
                  {(adminUsers ?? []).map((u) => (
                    <div
                      key={u.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border rounded-lg"
                      data-testid={`row-user-${u.id}`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{u.name}</span>
                          <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                            {u.role === 'admin' ? '관리자' : '학생'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {u.email} · 수강 {u.enrolledCount}건
                        </p>
                        {revealedPasswords[u.id] && (
                          <p className="text-sm mt-1" data-testid={`text-temp-password-${u.id}`}>
                            임시 비밀번호: <code className="px-1.5 py-0.5 bg-muted rounded font-mono">{revealedPasswords[u.id]}</code>
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 whitespace-nowrap"
                          disabled={resetPasswordMutation.isPending}
                          onClick={() => resetPasswordMutation.mutate(u.id)}
                          data-testid={`button-reset-password-${u.id}`}
                        >
                          <KeyRound className="h-4 w-4" />
                          비밀번호 재설정
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 whitespace-nowrap"
                          disabled={setRoleMutation.isPending}
                          onClick={() =>
                            setRoleMutation.mutate({
                              userId: u.id,
                              role: u.role === 'admin' ? 'student' : 'admin',
                            })
                          }
                          data-testid={`button-toggle-role-${u.id}`}
                        >
                          <ShieldCheck className="h-4 w-4" />
                          {u.role === 'admin' ? '학생으로' : '관리자로'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2 whitespace-nowrap text-destructive hover:text-destructive"
                          disabled={deleteUserMutation.isPending || u.id === user.id}
                          onClick={() => {
                            if (
                              window.confirm(
                                `"${u.name}"(${u.email}) 계정을 삭제하시겠습니까?\n수강 신청 내역도 함께 삭제되며 되돌릴 수 없습니다.`,
                              )
                            ) {
                              deleteUserMutation.mutate(u.id);
                            }
                          }}
                          data-testid={`button-delete-user-${u.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                          삭제
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Semesters */}
          <div className="space-y-8">
            {editedSemesters.map((semester) => (
              <Card key={semester.id} data-testid={`card-semester-${semester.id}`}>
                <div className="p-6">
                  {/* Semester Info */}
                  <div className="mb-6 pb-6 border-b">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <h2 className="text-2xl font-bold text-foreground" data-testid={`text-semester-title-${semester.id}`}>
                        {semester.title}
                      </h2>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 text-destructive hover:text-destructive whitespace-nowrap"
                        onClick={() => handleDeleteSemester(semester)}
                        data-testid={`button-delete-semester-${semester.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                        학기 삭제
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor={`semester-${semester.id}-title`}>학기 제목</Label>
                        <Input
                          id={`semester-${semester.id}-title`}
                          value={semester.title}
                          onChange={(e) => updateSemester(semester.id, 'title', e.target.value)}
                          data-testid={`input-semester-title-${semester.id}`}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`semester-${semester.id}-subtitle`}>부제</Label>
                        <Input
                          id={`semester-${semester.id}-subtitle`}
                          value={semester.subtitle}
                          onChange={(e) => updateSemester(semester.id, 'subtitle', e.target.value)}
                          data-testid={`input-semester-subtitle-${semester.id}`}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`semester-${semester.id}-description`}>설명</Label>
                        <Textarea
                          id={`semester-${semester.id}-description`}
                          value={semester.description}
                          onChange={(e) => updateSemester(semester.id, 'description', e.target.value)}
                          data-testid={`input-semester-description-${semester.id}`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Courses */}
                  <div className="mb-6 pb-6 border-b">
                    <h3 className="text-xl font-semibold text-foreground mb-4" data-testid={`text-courses-heading-${semester.id}`}>강의 목록</h3>
                    <div className="space-y-6">
                      {semester.courses.map((course) => (
                        <div
                          key={course.id}
                          className="p-4 border rounded-lg"
                          data-testid={`section-course-${course.id}`}
                        >
                          <div className="flex justify-end mb-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-2 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteCourse(semester.title, course.id, course.title)}
                              data-testid={`button-delete-course-${course.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                              강의 삭제
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                              <Label htmlFor={`course-${course.id}-title`}>강의 제목</Label>
                              <Input
                                id={`course-${course.id}-title`}
                                value={course.title}
                                onChange={(e) => updateCourse(semester.id, course.id, 'title', e.target.value)}
                                data-testid={`input-course-title-${course.id}`}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`course-${course.id}-instructor`}>강사</Label>
                              <Input
                                id={`course-${course.id}-instructor`}
                                value={course.instructor}
                                onChange={(e) => updateCourse(semester.id, course.id, 'instructor', e.target.value)}
                                data-testid={`input-course-instructor-${course.id}`}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`course-${course.id}-weeks`}>기간 (주)</Label>
                              <Input
                                id={`course-${course.id}-weeks`}
                                type="number"
                                value={course.weeks}
                                onChange={(e) => updateCourse(semester.id, course.id, 'weeks', parseInt(e.target.value))}
                                data-testid={`input-course-weeks-${course.id}`}
                              />
                            </div>
                            <div className="md:col-span-2">
                              <Label htmlFor={`course-${course.id}-description`}>설명</Label>
                              <Textarea
                                id={`course-${course.id}-description`}
                                value={course.description}
                                onChange={(e) => updateCourse(semester.id, course.id, 'description', e.target.value)}
                                data-testid={`input-course-description-${course.id}`}
                              />
                            </div>
                            <div className="md:col-span-2">
                              <Label htmlFor={`course-${course.id}-videoUrl`}>영상 URL</Label>
                              <Input
                                id={`course-${course.id}-videoUrl`}
                                value={course.videoUrl}
                                onChange={(e) => updateCourse(semester.id, course.id, 'videoUrl', e.target.value)}
                                data-testid={`input-course-videoUrl-${course.id}`}
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Add Course */}
                      <div className="p-4 border border-dashed rounded-lg">
                        <p className="text-sm font-medium text-foreground mb-3">새 강의 추가</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <Label htmlFor={`new-course-${semester.id}-title`}>강의 제목</Label>
                            <Input
                              id={`new-course-${semester.id}-title`}
                              value={getCourseDraft(semester.id).title}
                              onChange={(e) => updateCourseDraft(semester.id, 'title', e.target.value)}
                              data-testid={`input-new-course-title-${semester.id}`}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`new-course-${semester.id}-instructor`}>강사</Label>
                            <Input
                              id={`new-course-${semester.id}-instructor`}
                              value={getCourseDraft(semester.id).instructor}
                              onChange={(e) => updateCourseDraft(semester.id, 'instructor', e.target.value)}
                              data-testid={`input-new-course-instructor-${semester.id}`}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`new-course-${semester.id}-weeks`}>기간 (주)</Label>
                            <Input
                              id={`new-course-${semester.id}-weeks`}
                              type="number"
                              min={1}
                              value={getCourseDraft(semester.id).weeks}
                              onChange={(e) => updateCourseDraft(semester.id, 'weeks', parseInt(e.target.value) || 1)}
                              data-testid={`input-new-course-weeks-${semester.id}`}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label htmlFor={`new-course-${semester.id}-videoUrl`}>영상 URL</Label>
                            <Input
                              id={`new-course-${semester.id}-videoUrl`}
                              value={getCourseDraft(semester.id).videoUrl}
                              onChange={(e) => updateCourseDraft(semester.id, 'videoUrl', e.target.value)}
                              data-testid={`input-new-course-videoUrl-${semester.id}`}
                            />
                          </div>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="gap-2 mt-3"
                          disabled={creatingCourseFor === semester.id}
                          onClick={() => handleCreateCourse(semester.id)}
                          data-testid={`button-add-course-${semester.id}`}
                        >
                          <Plus className="h-4 w-4" />
                          강의 추가
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Books */}
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-4">도서 목록</h3>
                    <div className="space-y-6">
                      {BOOK_CATEGORIES.map(({ key, label }) => (
                        <div key={key}>
                          <p className="text-sm font-medium text-foreground mb-3">{label}</p>
                          <div className="space-y-3">
                            {semester.books[key].map((book, index) => (
                              <div
                                key={index}
                                className="p-3 border rounded-lg grid grid-cols-1 md:grid-cols-2 gap-3"
                                data-testid={`section-book-${key}-${semester.id}-${index}`}
                              >
                                <Input
                                  placeholder="제목"
                                  value={book.title}
                                  onChange={(e) => updateBook(semester.id, key, index, 'title', e.target.value)}
                                  data-testid={`input-book-title-${key}-${semester.id}-${index}`}
                                />
                                <Input
                                  placeholder="저자 (선택)"
                                  value={book.author ?? ''}
                                  onChange={(e) => updateBook(semester.id, key, index, 'author', e.target.value)}
                                  data-testid={`input-book-author-${key}-${semester.id}-${index}`}
                                />
                                <Input
                                  placeholder="출판사"
                                  value={book.publisher}
                                  onChange={(e) => updateBook(semester.id, key, index, 'publisher', e.target.value)}
                                  data-testid={`input-book-publisher-${key}-${semester.id}-${index}`}
                                />
                                <Input
                                  placeholder="구매 링크"
                                  value={book.link}
                                  onChange={(e) => updateBook(semester.id, key, index, 'link', e.target.value)}
                                  data-testid={`input-book-link-${key}-${semester.id}-${index}`}
                                />
                                <div className="md:col-span-2 flex justify-end">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="gap-2 text-destructive hover:text-destructive"
                                    onClick={() => removeBook(semester.id, key, index)}
                                    data-testid={`button-remove-book-${key}-${semester.id}-${index}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    삭제
                                  </Button>
                                </div>
                              </div>
                            ))}
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => addBook(semester.id, key)}
                              data-testid={`button-add-book-${key}-${semester.id}`}
                            >
                              <Plus className="h-4 w-4" />
                              도서 추가
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Add Semester */}
          <Card className="mt-8" data-testid="card-add-semester">
            <div className="p-6">
              <p className="text-sm font-medium text-foreground mb-3">새 학기 추가</p>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="new-semester-title">학기 제목</Label>
                  <Input
                    id="new-semester-title"
                    value={newSemester.title}
                    onChange={(e) => setNewSemester({ ...newSemester, title: e.target.value })}
                    data-testid="input-new-semester-title"
                  />
                </div>
                <div>
                  <Label htmlFor="new-semester-subtitle">부제</Label>
                  <Input
                    id="new-semester-subtitle"
                    value={newSemester.subtitle}
                    onChange={(e) => setNewSemester({ ...newSemester, subtitle: e.target.value })}
                    data-testid="input-new-semester-subtitle"
                  />
                </div>
                <div>
                  <Label htmlFor="new-semester-description">설명</Label>
                  <Textarea
                    id="new-semester-description"
                    value={newSemester.description}
                    onChange={(e) => setNewSemester({ ...newSemester, description: e.target.value })}
                    data-testid="input-new-semester-description"
                  />
                </div>
              </div>
              <Button
                variant="secondary"
                className="gap-2 mt-4"
                disabled={isCreatingSemester}
                onClick={handleCreateSemester}
                data-testid="button-add-semester"
              >
                <Plus className="h-4 w-4" />
                학기 추가
              </Button>
            </div>
          </Card>

          {/* Save Button */}
          <div className="mt-8 flex justify-center">
            <Button
              size="lg"
              onClick={handleSave}
              disabled={isSaving}
              className="gap-2"
              data-testid="button-save"
            >
              <Save className="h-5 w-5" />
              {isSaving ? '저장 중…' : '변경사항 저장'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
