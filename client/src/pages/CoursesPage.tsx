import { Semester } from '@shared/types';
import { CourseCard } from '@/components/CourseCard';
import { Library } from 'lucide-react';

interface CoursesPageProps {
  semesters: Semester[];
}

export function CoursesPage({ semesters }: CoursesPageProps) {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center p-3 bg-brand-light rounded-full mb-4">
              <Library className="h-8 w-8 text-brand-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4" data-testid="text-page-title">
              전체 강의
            </h1>
            <p className="text-lg text-muted-foreground" data-testid="text-page-description">
              4학기 과정의 모든 강의를 확인하고 수강 신청하세요.
            </p>
          </div>

          {/* Semesters */}
          <div className="space-y-16">
            {semesters.map((semester) => (
              <div key={semester.id} data-testid={`section-semester-${semester.id}`}>
                {/* Semester Header */}
                <div className="mb-8">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2" data-testid="text-semester-title">
                    {semester.title}
                  </h2>
                  <p className="text-brand-primary font-medium mb-1" data-testid="text-semester-subtitle">
                    {semester.subtitle}
                  </p>
                  <p className="text-muted-foreground" data-testid="text-semester-description">
                    {semester.description}
                  </p>
                </div>

                {/* Courses Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {semester.courses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
