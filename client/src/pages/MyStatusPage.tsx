import { Course, User } from '@shared/types';
import { Link } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { User as UserIcon, ArrowRight, BookOpen } from 'lucide-react';

interface MyStatusPageProps {
  user: User | null;
  enrolledCourses: Course[];
}

export function MyStatusPage({ user, enrolledCourses }: MyStatusPageProps) {
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

  // Generate mock progress for each course (between 10% and 90%)
  const getProgress = (courseId: number) => {
    const hash = courseId * 17;
    return 10 + (hash % 81);
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
              <h2 className="text-2xl font-semibold text-foreground mb-6">
                수강 중인 강의 ({enrolledCourses.length})
              </h2>
              <div className="grid grid-cols-1 gap-6">
                {enrolledCourses.map((course) => {
                  const progress = getProgress(course.id);
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
                          <Link href={`/course/${course.id}`}>
                            <Button variant="default" className="gap-2 whitespace-nowrap" data-testid={`button-enter-course-${course.id}`} asChild>
                              <span className="cursor-pointer">
                                강의실 입장
                                <ArrowRight className="h-4 w-4" />
                              </span>
                            </Button>
                          </Link>
                        </div>

                        {/* Progress Bar */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-foreground">학습 진척도</span>
                            <span className="text-sm font-medium text-brand-primary" data-testid={`text-progress-${course.id}`}>
                              {progress}%
                            </span>
                          </div>
                          <Progress value={progress} className="h-2" data-testid={`progress-${course.id}`} />
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
