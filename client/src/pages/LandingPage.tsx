import { Link } from 'wouter';
import { Semester } from '@shared/types';
import { Button } from '@/components/ui/button';
import { BookCard } from '@/components/BookCard';
import { GraduationCap, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  semesters: Semester[];
}

export function LandingPage({ semesters }: LandingPageProps) {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-brand-primary via-brand-secondary to-brand-accent py-20 md:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-full mb-6">
              <GraduationCap className="h-12 w-12" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6" data-testid="text-hero-title">
              마하나임 온라인 훈련 시스템
            </h1>
            <p className="text-lg md:text-xl mb-8 text-white/90" data-testid="text-hero-description">
              체계적인 신앙 훈련 커리큘럼으로 믿음의 여정을 시작하세요.
              <br />
              4학기 과정의 전문적인 온라인 학습 플랫폼입니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/courses">
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-white text-brand-primary hover:bg-white/90 gap-2"
                  data-testid="button-browse-courses"
                  asChild
                >
                  <span className="cursor-pointer">
                    강의 둘러보기
                    <ArrowRight className="h-5 w-5" />
                  </span>
                </Button>
              </Link>
              <Link href="/auth">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10 backdrop-blur-sm"
                  data-testid="button-signup"
                  asChild
                >
                  <span className="cursor-pointer">회원가입</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Semesters Section */}
      {semesters.map((semester, index) => (
        <section
          key={semester.id}
          className={`py-16 ${index % 2 === 0 ? 'bg-white' : 'bg-brand-light/30'}`}
          data-testid={`section-semester-${semester.id}`}
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              {/* Semester Header */}
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2" data-testid="text-semester-title">
                  {semester.title}
                </h2>
                <p className="text-lg text-brand-primary font-medium mb-2" data-testid="text-semester-subtitle">
                  {semester.subtitle}
                </p>
                <p className="text-muted-foreground" data-testid="text-semester-description">
                  {semester.description}
                </p>
              </div>

              {/* Book Categories */}
              <div className="space-y-12">
                {/* Lecture Books */}
                {semester.books.lecture.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-4" data-testid="text-lecture-books">
                      강의 도서
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {semester.books.lecture.map((book, idx) => (
                        <BookCard key={idx} book={book} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Required Books */}
                {semester.books.required.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-4" data-testid="text-required-books">
                      필수 도서
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {semester.books.required.map((book, idx) => (
                        <BookCard key={idx} book={book} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended Books */}
                {semester.books.recommended.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-4" data-testid="text-recommended-books">
                      추천 도서
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {semester.books.recommended.map((book, idx) => (
                        <BookCard key={idx} book={book} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
