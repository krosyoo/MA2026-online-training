import { Switch, Route } from "wouter";
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
import NotFound from "@/pages/not-found";

function Router() {
  const { user, login, logout, signup, enrollCourse, unenrollCourse } = useAuth();
  const { semesters, setSemesters } = useData();

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
            <MyStatusPage user={user} enrolledCourses={enrolledCourses} />
          </Route>
          
          <Route path="/admin">
            <AdminPage user={user} semesters={semesters} onSave={setSemesters} />
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
