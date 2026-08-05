import { Switch, Route } from "wouter";
import { Loader2 } from "lucide-react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DataProvider, useData } from "@/contexts/DataContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LandingPage } from "@/pages/LandingPage";
import { CoursesPage } from "@/pages/CoursesPage";
import { CourseDetailPage } from "@/pages/CourseDetailPage";
import { MyStatusPage } from "@/pages/MyStatusPage";
import { AdminPage } from "@/pages/AdminPage";
import { AuthPage } from "@/pages/AuthPage";
import { ProfilePage } from "@/pages/ProfilePage";
import NotFound from "@/pages/not-found";

function Router() {
  const {
    user,
    isLoading: isAuthLoading,
    login,
    logout,
    signup,
    enrollCourse,
    unenrollCourse,
    setCourseCompleted,
    changePassword,
  } = useAuth();
  const {
    semesters,
    setSemesters,
    createSemester,
    deleteSemester,
    createCourse,
    deleteCourse,
    isLoading: isDataLoading,
    error,
  } = useData();

  // The curriculum and the session both come from the API, so hold the first
  // paint until they resolve rather than flashing an empty page.
  if (isAuthLoading || isDataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="status-loading">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md" data-testid="status-error">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            데이터를 불러오지 못했습니다
          </h1>
          <p className="text-muted-foreground">
            서버에 연결할 수 없습니다. 데이터베이스 설정을 확인한 뒤 페이지를 새로고침해주세요.
          </p>
        </div>
      </div>
    );
  }

  // Get all courses from all semesters
  const allCourses = semesters.flatMap(s => s.courses);

  // Get enrolled courses for current user
  const enrolledCourses = user
    ? allCourses.filter(course => user.enrolledCourses.includes(course.id))
    : [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} onLogout={logout} />
      <main className="flex-1">
        <Switch>
          <Route path="/">
            <LandingPage semesters={semesters} />
          </Route>
          
          <Route path="/courses">
            <CoursesPage semesters={semesters} />
          </Route>
          
          <Route path="/course/:id">
            {(params) => {
              const courseId = parseInt(params.id);
              const course = allCourses.find(c => c.id === courseId);
              const isEnrolled = user?.enrolledCourses.includes(courseId) || false;
              
              return (
                <CourseDetailPage
                  course={course}
                  user={user}
                  isEnrolled={isEnrolled}
                  onEnroll={enrollCourse}
                  onUnenroll={unenrollCourse}
                />
              );
            }}
          </Route>
          
          <Route path="/my-status">
            <MyStatusPage
              user={user}
              enrolledCourses={enrolledCourses}
              onSetCompleted={setCourseCompleted}
            />
          </Route>

          <Route path="/admin">
            <AdminPage
              user={user}
              semesters={semesters}
              onSave={setSemesters}
              onCreateSemester={createSemester}
              onDeleteSemester={deleteSemester}
              onCreateCourse={createCourse}
              onDeleteCourse={deleteCourse}
            />
          </Route>
          
          <Route path="/profile">
            <ProfilePage user={user} onChangePassword={changePassword} />
          </Route>

          <Route path="/auth">
            <AuthPage onLogin={login} onSignup={signup} />
          </Route>
          
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <DataProvider>
            <Router />
          </DataProvider>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
