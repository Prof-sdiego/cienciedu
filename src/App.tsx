import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { StudentProvider } from "@/contexts/StudentContext";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import TeacherLogin from "./pages/teacher/Login";
import TeacherStudents from "./pages/teacher/Students";
import TeacherExams from "./pages/teacher/Exams";
import TeacherResults from "./pages/teacher/Results";
import ExamAssignments from "./pages/teacher/ExamAssignments";
import StudentPinEntry from "./pages/student/PinEntry";
import StudentExamList from "./pages/student/ExamList";
import StudentExam from "./pages/student/Exam";
import StudentComplete from "./pages/student/Complete";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/professor/login" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <StudentProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />

              {/* Teacher routes */}
              <Route path="/professor/login" element={<TeacherLogin />} />
              <Route path="/professor" element={<ProtectedRoute><TeacherStudents /></ProtectedRoute>} />
              <Route path="/professor/provas" element={<ProtectedRoute><TeacherExams /></ProtectedRoute>} />
              <Route path="/professor/atribuicoes" element={<ProtectedRoute><ExamAssignments /></ProtectedRoute>} />
              <Route path="/professor/resultados" element={<ProtectedRoute><TeacherResults /></ProtectedRoute>} />

              {/* Student routes */}
              <Route path="/aluno" element={<StudentPinEntry />} />
              <Route path="/aluno/provas" element={<StudentExamList />} />
              <Route path="/aluno/prova/:examId" element={<StudentExam />} />
              <Route path="/aluno/concluido" element={<StudentComplete />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </StudentProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
