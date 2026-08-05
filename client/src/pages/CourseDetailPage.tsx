import { useState } from 'react';
import { Course, Semester, User } from '@shared/types';
import { Link } from 'wouter';
import { YouTubeEmbed } from '@/components/YouTubeEmbed';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Clock,
  User as UserIcon,
  ChevronLeft,
  CheckCircle2,
  Circle,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CourseDetailPageProps {
  course: Course | undefined;
  /** The semester the course sits in, for its reading list. */
  semester: Semester | undefined;
  user: User | null;
  isEnrolled: boolean;
  isCompleted: boolean;
  onEnroll: (courseId: number) => Promise<void>;
  onUnenroll: (courseId: number) => Promise<void>;
  onSetCompleted: (courseId: number, completed: boolean) => Promise<void>;
}

export function CourseDetailPage({
  course,
  semester,
  user,
  isEnrolled,
  isCompleted,
  onEnroll,
  onUnenroll,
  onSetCompleted,
}: CourseDetailPageProps) {
  const { toast } = useToast();
  const [isTogglingCompletion, setIsTogglingCompletion] = useState(false);

  const semesterBooks = semester
    ? [...semester.books.lecture, ...semester.books.required]
    : [];

  if (!course) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-foreground mb-4">강의를 찾을 수 없습니다</h1>
            <Link href="/courses">
              <Button variant="default" className="gap-2" asChild>
                <span className="cursor-pointer">
                  <ChevronLeft className="h-4 w-4" />
                  강의 목록으로
                </span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleEnroll = async () => {
    if (!user) {
      toast({
        title: '로그인이 필요합니다',
        description: '수강 신청을 하려면 먼저 로그인해주세요.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await onEnroll(course.id);
      toast({
        title: '수강 신청 완료',
        description: `${course.title} 강의를 수강 신청했습니다.`,
      });
    } catch {
      toast({
        title: '수강 신청 실패',
        description: '잠시 후 다시 시도해주세요.',
        variant: 'destructive',
      });
    }
  };

  /**
   * Offered here as well as on the status page: this is the screen a student
   * is on when they finish watching, so making them navigate elsewhere to
   * record it is the wrong shape.
   */
  const handleToggleCompleted = async () => {
    setIsTogglingCompletion(true);
    try {
      await onSetCompleted(course.id, !isCompleted);
      toast({
        title: isCompleted ? '완료 표시를 취소했습니다' : '수강 완료로 표시했습니다',
        description: course.title,
      });
    } catch {
      toast({
        title: '처리하지 못했습니다',
        description: '잠시 후 다시 시도해주세요.',
        variant: 'destructive',
      });
    } finally {
      setIsTogglingCompletion(false);
    }
  };

  const handleUnenroll = async () => {
    try {
      await onUnenroll(course.id);
      toast({
        title: '수강 취소 완료',
        description: `${course.title} 강의를 수강 취소했습니다.`,
      });
    } catch {
      toast({
        title: '수강 취소 실패',
        description: '잠시 후 다시 시도해주세요.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Breadcrumb */}
          <Link href="/courses">
            <span className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-brand-primary transition-colors mb-6 cursor-pointer" data-testid="link-back">
              <ChevronLeft className="h-4 w-4" />
              전체 강의로 돌아가기
            </span>
          </Link>

          {/* Course Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4" data-testid="text-course-title">
              {course.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
              <span className="inline-flex items-center gap-1" data-testid="text-course-instructor">
                <UserIcon className="h-5 w-5" />
                <span className="font-medium">{course.instructor}</span>
              </span>
              <span className="inline-flex items-center gap-1" data-testid="text-course-weeks">
                <Clock className="h-5 w-5" />
                <span>{course.weeks}주 과정</span>
              </span>
            </div>
            <p className="text-muted-foreground mt-4" data-testid="text-course-description">
              {course.description}
            </p>
          </div>

          {/* Video Section */}
          <Card className="mb-8">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">강의 영상</h2>
              <YouTubeEmbed url={course.videoUrl} title={course.title} />
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Enrollment Section */}
            <Card className="lg:col-span-2">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">수강 신청</h2>
                {user ? (
                  <div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {isCompleted
                        ? '이 강의를 완료하셨습니다. 다시 시청하실 수 있습니다.'
                        : isEnrolled
                          ? '이 강의를 수강 중입니다. 다 보셨다면 아래에서 완료로 표시해주세요.'
                          : '이 강의를 수강하시겠습니까? 수강 신청 후 언제든지 강의를 시청할 수 있습니다.'}
                    </p>
                    {isEnrolled ? (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant={isCompleted ? 'outline' : 'default'}
                          className="gap-2"
                          disabled={isTogglingCompletion}
                          onClick={handleToggleCompleted}
                          data-testid="button-toggle-completed"
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-4 w-4 text-brand-primary" />
                          ) : (
                            <Circle className="h-4 w-4" />
                          )}
                          {isCompleted ? '완료됨' : '수강 완료로 표시'}
                        </Button>
                        <Link href="/my-status">
                          <Button variant="outline" data-testid="button-my-status" asChild>
                            <span className="cursor-pointer">나의 수강현황 보기</span>
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          onClick={handleUnenroll}
                          data-testid="button-unenroll"
                        >
                          수강 취소
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="default"
                        onClick={handleEnroll}
                        data-testid="button-enroll"
                      >
                        수강 신청하기
                      </Button>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-muted-foreground mb-4">
                      수강 신청을 하려면 로그인이 필요합니다.
                    </p>
                    <Link href="/auth">
                      <Button variant="default" data-testid="button-login-to-enroll" asChild>
                        <span className="cursor-pointer">로그인하기</span>
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </Card>

            {/* Reading list for the semester this course belongs to. Replaces a
                permanently disabled "materials download" button that promised a
                feature nobody was building — this shows books the curriculum
                already lists. */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">이 학기의 도서</h2>
                {semesterBooks.length > 0 ? (
                  <ul className="space-y-3" data-testid="list-course-books">
                    {semesterBooks.map((book, index) => (
                      <li key={`${book.title}-${index}`}>
                        <a
                          href={book.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group block"
                          data-testid="link-course-book"
                        >
                          <span className="text-sm font-medium text-foreground group-hover:text-brand-primary transition-colors">
                            {book.title}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            {book.publisher}
                            <ExternalLink className="h-3 w-3" />
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground" data-testid="text-no-course-books">
                    등록된 도서가 없습니다.
                  </p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
