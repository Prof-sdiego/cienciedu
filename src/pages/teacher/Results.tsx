import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import TeacherLayout from "@/layouts/TeacherLayout";
import { BarChart3 } from "lucide-react";

interface ExamResult {
  exam_title: string;
  student_name: string;
  student_pin: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  completed_at: string;
}

const TeacherResults = () => {
  const { user } = useAuth();
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, [user]);

  const loadResults = async () => {
    if (!user) return;

    const { data: examResults } = await supabase
      .from("exam_results")
      .select(`
        score,
        total_questions,
        correct_answers,
        completed_at,
        students!inner(name, pin, teacher_id),
        exams!inner(title)
      `)
      .order("completed_at", { ascending: false });

    if (examResults) {
      const mapped = examResults
        .filter((r: any) => r.students?.teacher_id === user.id)
        .map((r: any) => ({
          exam_title: r.exams?.title || "",
          student_name: r.students?.name || "",
          student_pin: r.students?.pin || "",
          score: Number(r.score),
          total_questions: r.total_questions,
          correct_answers: r.correct_answers,
          completed_at: r.completed_at,
        }));
      setResults(mapped);
    }
    setLoading(false);
  };

  return (
    <TeacherLayout>
      <div className="max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-black text-foreground">Resultados</h1>
          <p className="text-muted-foreground mt-1">Acompanhe o desempenho dos seus alunos</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Nenhum resultado ainda</p>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-display font-bold text-foreground">Aluno</th>
                  <th className="text-left p-4 font-display font-bold text-foreground">PIN</th>
                  <th className="text-left p-4 font-display font-bold text-foreground">Prova</th>
                  <th className="text-center p-4 font-display font-bold text-foreground">Acertos</th>
                  <th className="text-center p-4 font-display font-bold text-foreground">Nota</th>
                  <th className="text-right p-4 font-display font-bold text-foreground">Data</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="p-4 font-medium">{r.student_name}</td>
                    <td className="p-4">
                      <span className="font-mono text-primary font-bold">{r.student_pin}</span>
                    </td>
                    <td className="p-4">{r.exam_title}</td>
                    <td className="p-4 text-center">
                      {r.correct_answers}/{r.total_questions}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                        r.score >= 70
                          ? "bg-success/10 text-success"
                          : r.score >= 50
                          ? "bg-warning/10 text-warning"
                          : "bg-destructive/10 text-destructive"
                      }`}>
                        {r.score.toFixed(0)}%
                      </span>
                    </td>
                    <td className="p-4 text-right text-sm text-muted-foreground">
                      {new Date(r.completed_at).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </TeacherLayout>
  );
};

export default TeacherResults;
