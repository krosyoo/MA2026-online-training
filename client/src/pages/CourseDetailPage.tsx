import { Course, User } from '@shared/types';
import { Link } from 'wouter';
import { YouTubeEmbed } from '@/components/YouTubeEmbed';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Clock, User as UserIcon, Download, ChevronLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CourseDetailPageProps {
  course: Course | undefined;
  user: User | null;
  isEnrolled: boolean;
  onEnroll: (courseId: number) => void;
  onUnenroll: (courseId: number) => void;
}

export function CourseDetailPage({
  course,
  user,
  isEnrolled,
  onEnroll,
  onUnenroll,
}: CourseDetailPageProps) {
  const { toast } = useToast();

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

  const handleEnroll = () => {
    if (!user) {
      toast({
        title: '로그인이 필요합니다',
        description: '수강 신청을 하려면 먼저 로그인해주세요.',
        variant: 'destructive',
      });
      return;
    }
    onEnroll(course.id);
    toast({
      title: '수강 신청 완료',
      description: `${course.title} 강의를 수강 신청했습니다.`,
    });
  };

  const handleUnenroll = () => {
    onUnenroll(course.id);
    toast({
      title: '수강 취소 완료',
      description: `${course.title} 강의를 수강 취소했습니다.`,
    });
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
                      {isEnrolled
                        ? '이미 이 강의를 수강 중입니다. 나의 수강현황에서 학습 진행 상황을 확인하세요.'
                        : '이 강의를 수강하시겠습니까? 수강 신청 후 언제든지 강의를 시청할 수 있습니다.'}
                    </p>
                    {isEnrolled ? (
                      <div className="flex gap-2">
                        <Link href="/my-status">
                          <Button variant="default" data-testid="button-my-status" asChild>
                            <span className="cursor-pointer">나의 수강현황 보기</span>
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
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

            {/* Materials Section */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">강의 자료</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  강의 자료 다운로드 기능은 준비 중입니다.
                </p>
                <Button variant="outline" disabled className="w-full gap-2" data-testid="button-download">
                  <Download className="h-4 w-4" />
                  자료 다운로드
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
