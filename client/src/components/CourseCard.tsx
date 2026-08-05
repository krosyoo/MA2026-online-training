import { Course } from '@shared/types';
import { Link } from 'wouter';
import { Clock, User, CheckCircle2, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CourseCardProps {
  course: Course;
  /** Omitted for signed-out visitors, who have no status to show. */
  status?: 'none' | 'enrolled' | 'completed';
}

export function CourseCard({ course, status = 'none' }: CourseCardProps) {
  return (
    <Card className="h-full flex flex-col hover-elevate transition-all" data-testid={`card-course-${course.id}`}>
      <div className="p-6 flex flex-col h-full">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="text-xl font-semibold text-foreground" data-testid="text-course-title">
            {course.title}
          </h3>
          {/* Surfaced on the card so a student can see what they have already
              taken without opening each course in turn. */}
          {status === 'completed' && (
            <Badge variant="default" className="gap-1 shrink-0" data-testid={`badge-completed-${course.id}`}>
              <CheckCircle2 className="h-3 w-3" />
              완료
            </Badge>
          )}
          {status === 'enrolled' && (
            <Badge variant="secondary" className="gap-1 shrink-0" data-testid={`badge-enrolled-${course.id}`}>
              <BookOpen className="h-3 w-3" />
              수강중
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-4 mb-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1" data-testid="text-course-instructor">
            <User className="h-4 w-4" />
            {course.instructor}
          </span>
          <span className="inline-flex items-center gap-1" data-testid="text-course-weeks">
            <Clock className="h-4 w-4" />
            {course.weeks}주
          </span>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4 flex-1" data-testid="text-course-description">
          {course.description}
        </p>
        
        <Link href={`/course/${course.id}`}>
          <Button
            variant={status === 'none' ? 'default' : 'outline'}
            className="w-full"
            data-testid={`button-view-course-${course.id}`}
            asChild
          >
            <span className="cursor-pointer">
              {status === 'none' ? '강의 보기' : '이어서 보기'}
            </span>
          </Button>
        </Link>
      </div>
    </Card>
  );
}
