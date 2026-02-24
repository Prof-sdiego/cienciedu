import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import TeacherLayout from "@/layouts/TeacherLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Upload, Check, Image, Volume2 } from "lucide-react";
import { toast } from "sonner";

interface Exam {
  id: string;
  title: string;
  created_at: string;
  question_count?: number;
}

const TeacherExams = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);

  // Question creation state
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<(File | null)[]>([null, null, null, null]);
  const [correctIndex, setCorrectIndex] = useState<number>(0);
  const [optionCount, setOptionCount] = useState(2);
  const [addingQuestion, setAddingQuestion] = useState(false);

  useEffect(() => {
    loadExams();
  }, [user]);

  const loadExams = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("exams")
      .select("id, title, created_at")
      .eq("teacher_id", user.id)
      .order("created_at", { ascending: false });

    if (data) {
      const examsWithCount = await Promise.all(
        data.map(async (exam) => {
          const { count } = await supabase
            .from("questions")
            .select("id", { count: "exact", head: true })
            .eq("exam_id", exam.id);
          return { ...exam, question_count: count || 0 };
        })
      );
      setExams(examsWithCount);
    }
    setLoading(false);
  };

  const handleCreateExam = async () => {
    if (!user || !newTitle.trim()) return;
    setCreating(true);
    const { error } = await supabase.from("exams").insert({ title: newTitle.trim(), teacher_id: user.id });
    if (error) {
      toast.error("Erro ao criar prova");
    } else {
      toast.success("Prova criada!");
      setNewTitle("");
      setDialogOpen(false);
      loadExams();
    }
    setCreating(false);
  };

  const handleDeleteExam = async (id: string) => {
    const { error } = await supabase.from("exams").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir prova");
    else { toast.success("Prova excluída"); loadExams(); }
  };

  const handleAddQuestion = async () => {
    if (!selectedExam || !audioFile) return;
    setAddingQuestion(true);

    try {
      // Upload audio
      const audioName = `${crypto.randomUUID()}.${audioFile.name.split('.').pop()}`;
      const { error: audioErr } = await supabase.storage.from("exam-audio").upload(audioName, audioFile);
      if (audioErr) throw audioErr;
      const { data: audioUrl } = supabase.storage.from("exam-audio").getPublicUrl(audioName);

      // Get question count for order
      const { count } = await supabase.from("questions").select("id", { count: "exact", head: true }).eq("exam_id", selectedExam);

      // Create question
      const { data: question, error: qErr } = await supabase.from("questions").insert({
        exam_id: selectedExam,
        audio_url: audioUrl.publicUrl,
        order_index: (count || 0),
      }).select("id").single();
      if (qErr) throw qErr;

      // Upload images and create options
      for (let i = 0; i < optionCount; i++) {
        const img = imageFiles[i];
        if (!img) continue;

        const imgName = `${crypto.randomUUID()}.${img.name.split('.').pop()}`;
        const { error: imgErr } = await supabase.storage.from("exam-images").upload(imgName, img);
        if (imgErr) throw imgErr;
        const { data: imgUrl } = supabase.storage.from("exam-images").getPublicUrl(imgName);

        await supabase.from("question_options").insert({
          question_id: question.id,
          image_url: imgUrl.publicUrl,
          is_correct: i === correctIndex,
          order_index: i,
        });
      }

      toast.success("Questão adicionada!");
      setAudioFile(null);
      setImageFiles([null, null, null, null]);
      setCorrectIndex(0);
      setSelectedExam(null);
      loadExams();
    } catch (err: any) {
      toast.error(err.message || "Erro ao adicionar questão");
    } finally {
      setAddingQuestion(false);
    }
  };

  return (
    <TeacherLayout>
      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-black text-foreground">Provas</h1>
            <p className="text-muted-foreground mt-1">Crie e gerencie suas avaliações</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 font-display font-bold">
                <Plus className="w-4 h-4" />
                Nova Prova
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">Criar Prova</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Título da prova</Label>
                  <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Ex: Animais" maxLength={100} />
                </div>
                <Button onClick={handleCreateExam} disabled={creating || !newTitle.trim()} className="w-full font-display font-bold">
                  {creating ? "Criando..." : "Criar Prova"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Add question panel */}
        {selectedExam && (
          <div className="bg-card rounded-2xl border border-border p-6 mb-8 animate-slide-up">
            <h3 className="text-lg font-display font-bold mb-4">Adicionar Questão</h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4" /> Áudio da pergunta
                </Label>
                <Input type="file" accept="audio/*" onChange={e => setAudioFile(e.target.files?.[0] || null)} />
              </div>

              <div className="space-y-2">
                <Label>Número de alternativas</Label>
                <div className="flex gap-2">
                  {[2, 3, 4].map(n => (
                    <Button
                      key={n}
                      variant={optionCount === n ? "default" : "outline"}
                      size="sm"
                      onClick={() => { setOptionCount(n); setCorrectIndex(0); }}
                    >
                      {n}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: optionCount }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Image className="w-4 h-4" /> Imagem {i + 1}
                      {correctIndex === i && (
                        <span className="text-xs bg-success text-success-foreground px-2 py-0.5 rounded-full">Correta</span>
                      )}
                    </Label>
                    <Input type="file" accept="image/*" onChange={e => {
                      const files = [...imageFiles];
                      files[i] = e.target.files?.[0] || null;
                      setImageFiles(files);
                    }} />
                    <Button variant="outline" size="sm" onClick={() => setCorrectIndex(i)} className="gap-1">
                      <Check className="w-3 h-3" /> Marcar correta
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleAddQuestion}
                  disabled={addingQuestion || !audioFile || imageFiles.slice(0, optionCount).some(f => !f)}
                  className="font-display font-bold gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {addingQuestion ? "Enviando..." : "Salvar Questão"}
                </Button>
                <Button variant="outline" onClick={() => setSelectedExam(null)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : exams.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <Plus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Nenhuma prova criada</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {exams.map(exam => (
              <div key={exam.id} className="bg-card rounded-2xl border border-border p-6 flex items-center justify-between hover:border-primary/30 transition-colors">
                <div>
                  <h3 className="text-lg font-display font-bold">{exam.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {exam.question_count} {exam.question_count === 1 ? "questão" : "questões"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedExam(exam.id)} className="gap-1 font-display">
                    <Plus className="w-4 h-4" /> Questão
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteExam(exam.id)} className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </TeacherLayout>
  );
};

export default TeacherExams;
