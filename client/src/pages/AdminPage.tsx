import { useState } from 'react';
import { Semester, User } from '@shared/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Shield, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AdminPageProps {
  user: User | null;
  semesters: Semester[];
  onSave: (semesters: Semester[]) => void;
}

export function AdminPage({ user, semesters, onSave }: AdminPageProps) {
  const { toast } = useToast();
  const [editedSemesters, setEditedSemesters] = useState<Semester[]>(semesters);

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

  const handleSave = () => {
    onSave(editedSemesters);
    toast({
      title: '변경사항 저장 완료',
      description: '모든 학기 및 강의 정보가 업데이트되었습니다.',
    });
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
              학기 및 강의 정보를 수정할 수 있습니다.
            </p>
          </div>

          {/* Semesters */}
          <div className="space-y-8">
            {editedSemesters.map((semester) => (
              <Card key={semester.id} data-testid={`card-semester-${semester.id}`}>
                <div className="p-6">
                  {/* Semester Info */}
                  <div className="mb-6 pb-6 border-b">
                    <h2 className="text-2xl font-bold text-foreground mb-4" data-testid={`text-semester-title-${semester.id}`}>
                      {semester.title}
                    </h2>
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
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-4" data-testid={`text-courses-heading-${semester.id}`}>강의 목록</h3>
                    <div className="space-y-6">
                      {semester.courses.map((course) => (
                        <div
                          key={course.id}
                          className="p-4 border rounded-lg"
                          data-testid={`section-course-${course.id}`}
                        >
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
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Save Button */}
          <div className="mt-8 flex justify-center">
            <Button
              size="lg"
              onClick={handleSave}
              className="gap-2"
              data-testid="button-save"
            >
              <Save className="h-5 w-5" />
              변경사항 저장
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
