import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStudent } from "@/contexts/StudentContext";
import { BookOpen } from "lucide-react";

interface Exam {
  id: string;
  title: string;
}

const StudentExamList = () => {
  const { student } = useStudent();
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student) {
      navigate("/aluno");
      return;
    }
    loadExams();
  }, [student]);

  const loadExams = async () => {
    if (!student) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/student-api?action=get-exams`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          body: JSON.stringify({ studentId: student.id }),
        }
      );
      const { exams: data } = await res.json();
      setExams(data || []);
    } catch {
      setExams([]);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-student-bg flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-student-bg p-6 select-none">
      <h1 className="text-3xl sm:text-4xl font-display font-black text-foreground text-center mb-8">
        Suas Provas
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
        {exams.map(exam => (
          <button
            key={exam.id}
            onClick={() => navigate(`/aluno/prova/${exam.id}`)}
            className="touch-target-xl bg-card rounded-2xl shadow-lg border-2 border-border p-8 flex flex-col items-center gap-4 hover:border-primary hover:shadow-xl active:scale-95 transition-all duration-200"
          >
            <BookOpen className="w-12 h-12 text-primary" />
            <span className="text-xl font-display font-bold text-foreground text-center">
              {exam.title}
            </span>
          </button>
        ))}

        {exams.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-xl font-display text-muted-foreground">
              Nenhuma prova disponível
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentExamList;
