import { Course } from '@shared/types';
import { Link } from 'wouter';
import { Clock, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface CourseCardProps {
  course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
  return (
    <Card className="h-full flex flex-col hover-elevate transition-all" data-testid={`card-course-${course.id}`}>
      <div className="p-6 flex flex-col h-full">
        <h3 className="text-xl font-semibold text-foreground mb-3" data-testid="text-course-title">
          {course.title}
        </h3>
        
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
          <Button variant="default" className="w-full" data-testid={`button-view-course-${course.id}`} asChild>
            <span className="cursor-pointer">강의 보기</span>
          </Button>
        </Link>
      </div>
    </Card>
  );
}
