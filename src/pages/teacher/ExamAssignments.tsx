import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import TeacherLayout from "@/layouts/TeacherLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Link2, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Student { id: string; name: string; pin: string; }
interface Exam { id: string; title: string; }
interface Assignment { id: string; student_id: string; exam_id: string; student_name: string; exam_title: string; }

const ExamAssignments = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => { if (user) loadData(); }, [user]);

  const loadData = async () => {
    if (!user) return;
    const [{ data: s }, { data: e }, { data: a }] = await Promise.all([
      supabase.from("students").select("id, name, pin").eq("teacher_id", user.id).order("name"),
      supabase.from("exams").select("id, title").eq("teacher_id", user.id).order("title"),
      supabase.from("student_exam_assignments").select("id, student_id, exam_id"),
    ]);

    setStudents(s || []);
    setExams(e || []);

    if (a && s && e) {
      const mapped = a.map(assignment => ({
        ...assignment,
        student_name: s.find(st => st.id === assignment.student_id)?.name || "—",
        exam_title: e.find(ex => ex.id === assignment.exam_id)?.title || "—",
      }));
      setAssignments(mapped);
    }
    setLoading(false);
  };

  const handleAssign = async () => {
    if (!selectedExam || selectedStudents.length === 0) return;
    setAssigning(true);
    const rows = selectedStudents.map(sid => ({ student_id: sid, exam_id: selectedExam }));
    const { error } = await supabase.from("student_exam_assignments").upsert(rows, { onConflict: "student_id,exam_id" });
    if (error) toast.error("Erro ao atribuir");
    else {
      toast.success("Provas atribuídas!");
      setSelectedStudents([]);
      setSelectedExam("");
      loadData();
    }
    setAssigning(false);
  };

  const handleRemove = async (id: string) => {
    const { error } = await supabase.from("student_exam_assignments").delete().eq("id", id);
    if (error) toast.error("Erro ao remover");
    else { toast.success("Atribuição removida"); loadData(); }
  };

  const toggleStudent = (id: string) => {
    setSelectedStudents(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  return (
    <TeacherLayout>
      <div className="max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-black text-foreground">Atribuir Provas</h1>
          <p className="text-muted-foreground mt-1">Defina quais provas cada aluno deve fazer</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 mb-8">
          <h3 className="text-lg font-display font-bold mb-4">Nova Atribuição</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Prova</Label>
              <Select value={selectedExam} onValueChange={setSelectedExam}>
                <SelectTrigger><SelectValue placeholder="Selecione uma prova" /></SelectTrigger>
                <SelectContent>
                  {exams.map(e => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {selectedExam && (
              <div className="space-y-2">
                <Label>Alunos</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border border-border rounded-xl">
                  {students.map(s => (
                    <label key={s.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted cursor-pointer">
                      <Checkbox checked={selectedStudents.includes(s.id)} onCheckedChange={() => toggleStudent(s.id)} />
                      <span className="text-sm">{s.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={handleAssign} disabled={assigning || !selectedExam || selectedStudents.length === 0} className="gap-2 font-display font-bold">
              <Link2 className="w-4 h-4" />
              {assigning ? "Atribuindo..." : "Atribuir Prova"}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <Link2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Nenhuma atribuição feita</p>
            <p className="text-sm text-muted-foreground mt-1">Sem atribuições, o aluno verá todas as provas do professor</p>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-display font-bold text-foreground">Aluno</th>
                  <th className="text-left p-4 font-display font-bold text-foreground">Prova</th>
                  <th className="text-right p-4 font-display font-bold text-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map(a => (
                  <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="p-4 font-medium">{a.student_name}</td>
                    <td className="p-4">{a.exam_title}</td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleRemove(a.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
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

export default ExamAssignments;
