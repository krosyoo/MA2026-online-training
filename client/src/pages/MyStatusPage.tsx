import { useState } from 'react';
import { Course, User } from '@shared/types';
import { Link } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { User as UserIcon, ArrowRight, BookOpen, CheckCircle2, Circle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MyStatusPageProps {
  user: User | null;
  enrolledCourses: Course[];
  onSetCompleted: (courseId: number, completed: boolean) => Promise<void>;
}

export function MyStatusPage({ user, enrolledCourses, onSetCompleted }: MyStatusPageProps) {
  const { toast } = useToast();
  const [pendingId, setPendingId] = useState<number | null>(null);

  if (!user) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center justify-center p-3 bg-brand-light rounded-full mb-4">
              <UserIcon className="h-8 w-8 text-brand-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">로그인이 필요합니다</h1>
            <p className="text-muted-foreground mb-6">
              수강 현황을 확인하려면 먼저 로그인해주세요.
            </p>
            <Link href="/auth">
              <Button variant="default" data-testid="button-login" asChild>
                <span className="cursor-pointer">로그인하기</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const completedCount = enrolledCourses.filter((c) =>
    user.completedCourses.includes(c.id),
  ).length;
  const overallPercent =
    enrolledCourses.length > 0
      ? Math.round((completedCount / enrolledCourses.length) * 100)
      : 0;

  const handleToggle = async (course: Course, completed: boolean) => {
    setPendingId(course.id);
    try {
      await onSetCompleted(course.id, completed);
      toast({
        title: completed ? '수강 완료로 표시했습니다' : '완료 표시를 취소했습니다',
        description: course.title,
      });
    } catch {
      toast({
        title: '처리하지 못했습니다',
        description: '잠시 후 다시 시도해주세요.',
        variant: 'destructive',
      });
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Page Header */}
          <div className="mb-12">
            <div className="inline-flex items-center justify-center p-3 bg-brand-light rounded-full mb-4">
              <UserIcon className="h-8 w-8 text-brand-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2" data-testid="text-page-title">
              나의 수강현황
            </h1>
            <p className="text-lg text-muted-foreground">
              안녕하세요, <span className="font-medium text-foreground" data-testid="text-username">{user.name}</span>님
            </p>
          </div>

          {/* Enrolled Courses */}
          {enrolledCourses.length > 0 ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <h2 className="text-2xl font-semibold text-foreground">
                  수강 중인 강의 ({enrolledCourses.length})
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    전체 진행률
                  </span>
                  <span className="text-sm font-semibold text-brand-primary" data-testid="text-overall-progress">
                    {completedCount} / {enrolledCourses.length} ({overallPercent}%)
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-6">
                {enrolledCourses.map((course) => {
                  const isCompleted = user.completedCourses.includes(course.id);
                  const isPending = pendingId === course.id;
                  return (
                    <Card
                      key={course.id}
                      className="hover-elevate transition-all"
                      data-testid={`card-enrolled-course-${course.id}`}
                    >
                      <div className="p-6">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-foreground mb-2" data-testid="text-course-title">
                              {course.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-1">
                              강사: <span data-testid="text-course-instructor">{course.instructor}</span>
                            </p>
                            <p className="text-sm text-muted-foreground">
                              기간: <span data-testid="text-course-weeks">{course.weeks}주</span>
                            </p>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Link href={`/course/${course.id}`}>
                              <Button variant="default" className="gap-2 whitespace-nowrap" data-testid={`button-enter-course-${course.id}`} asChild>
                                <span className="cursor-pointer">
                                  강의실 입장
                                  <ArrowRight className="h-4 w-4" />
                                </span>
                              </Button>
                            </Link>
                            <Button
                              variant={isCompleted ? 'outline' : 'secondary'}
                              className="gap-2 whitespace-nowrap"
                              disabled={isPending}
                              onClick={() => handleToggle(course, !isCompleted)}
                              data-testid={`button-toggle-completed-${course.id}`}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="h-4 w-4 text-brand-primary" />
                              ) : (
                                <Circle className="h-4 w-4" />
                              )}
                              {isCompleted ? '완료됨' : '완료로 표시'}
                            </Button>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-foreground">학습 상태</span>
                            <span className="text-sm font-medium text-brand-primary" data-testid={`text-progress-${course.id}`}>
                              {isCompleted ? '100%' : '0%'}
                            </span>
                          </div>
                          <Progress value={isCompleted ? 100 : 0} className="h-2" data-testid={`progress-${course.id}`} />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : (
            <Card>
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center p-4 bg-brand-light rounded-full mb-4">
                  <BookOpen className="h-10 w-10 text-brand-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  아직 수강 중인 강의가 없습니다
                </h3>
                <p className="text-muted-foreground mb-6">
                  강의 목록에서 원하는 강의를 찾아 수강 신청하세요.
                </p>
                <Link href="/courses">
                  <Button variant="default" data-testid="button-browse-courses" asChild>
                    <span className="cursor-pointer">강의 둘러보기</span>
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
