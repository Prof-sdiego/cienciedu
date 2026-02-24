import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Pencil, Check, Image, Volume2, ClipboardPaste, X, Upload } from "lucide-react";
import { toast } from "sonner";

interface QuestionOption {
  id: string;
  image_url: string;
  is_correct: boolean;
  order_index: number;
}

interface Question {
  id: string;
  audio_url: string;
  statement: string | null;
  order_index: number;
  question_options: QuestionOption[];
}

interface Props {
  examId: string;
  onClose: () => void;
  onQuestionsChanged: () => void;
}

const QuestionManager = ({ examId, onClose, onQuestionsChanged }: Props) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Edit state
  const [editStatement, setEditStatement] = useState("");
  const [editAudioFile, setEditAudioFile] = useState<File | null>(null);
  const [editImageFiles, setEditImageFiles] = useState<(File | null)[]>([null, null, null, null]);
  const [editImagePreviews, setEditImagePreviews] = useState<(string | null)[]>([null, null, null, null]);
  const [editCorrectIndex, setEditCorrectIndex] = useState(0);
  const [editOptionCount, setEditOptionCount] = useState(2);
  const [saving, setSaving] = useState(false);
  const [existingOptions, setExistingOptions] = useState<QuestionOption[]>([]);
  const [keepExistingAudio, setKeepExistingAudio] = useState(true);

  useEffect(() => {
    loadQuestions();
  }, [examId]);

  const loadQuestions = async () => {
    const { data } = await supabase
      .from("questions")
      .select("id, audio_url, statement, order_index, question_options(id, image_url, is_correct, order_index)")
      .eq("exam_id", examId)
      .order("order_index");

    if (data) {
      const sorted = data.map(q => ({
        ...q,
        question_options: [...(q.question_options || [])].sort((a, b) => a.order_index - b.order_index),
      }));
      setQuestions(sorted);
    }
    setLoading(false);
  };

  const startEdit = (q: Question) => {
    setEditingId(q.id);
    setEditStatement(q.statement || "");
    setEditAudioFile(null);
    setKeepExistingAudio(true);
    setExistingOptions(q.question_options);
    setEditOptionCount(q.question_options.length || 2);
    setEditCorrectIndex(q.question_options.findIndex(o => o.is_correct) ?? 0);
    setEditImageFiles([null, null, null, null]);
    setEditImagePreviews(q.question_options.map(o => o.image_url).concat([null, null, null, null]).slice(0, 4));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditStatement("");
    setEditAudioFile(null);
    setEditImageFiles([null, null, null, null]);
    setEditImagePreviews([null, null, null, null]);
  };

  const handleEditFileChange = (index: number, file: File | null) => {
    const files = [...editImageFiles];
    files[index] = file;
    setEditImageFiles(files);
    const previews = [...editImagePreviews];
    previews[index] = file ? URL.createObjectURL(file) : (existingOptions[index]?.image_url || null);
    setEditImagePreviews(previews);
  };

  const handleEditPasteImage = useCallback((index: number) => {
    (async () => {
      try {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          const imageType = item.types.find(t => t.startsWith("image/"));
          if (imageType) {
            const blob = await item.getType(imageType);
            const ext = imageType.split("/")[1] || "png";
            const file = new File([blob], `pasted-image.${ext}`, { type: imageType });
            const files = [...editImageFiles];
            files[index] = file;
            setEditImageFiles(files);
            const previews = [...editImagePreviews];
            previews[index] = URL.createObjectURL(blob);
            setEditImagePreviews(previews);
            toast.success(`Imagem ${index + 1} colada!`);
            return;
          }
        }
        toast.error("Nenhuma imagem encontrada na área de transferência");
      } catch {
        toast.error("Não foi possível colar.");
      }
    })();
  }, [editImageFiles, editImagePreviews, existingOptions]);

  const handleSaveEdit = async () => {
    if (!editingId) return;
    if (!editStatement.trim() && !editAudioFile && !(keepExistingAudio && questions.find(q => q.id === editingId)?.audio_url)) {
      toast.error("Adicione um enunciado ou áudio");
      return;
    }
    setSaving(true);

    try {
      const currentQ = questions.find(q => q.id === editingId)!;
      let audioUrl = keepExistingAudio ? currentQ.audio_url : "";

      if (editAudioFile) {
        const audioName = `${crypto.randomUUID()}.${editAudioFile.name.split('.').pop()}`;
        const { error: audioErr } = await supabase.storage.from("exam-audio").upload(audioName, editAudioFile);
        if (audioErr) throw audioErr;
        const { data: audioData } = supabase.storage.from("exam-audio").getPublicUrl(audioName);
        audioUrl = audioData.publicUrl;
      }

      await supabase.from("questions").update({
        statement: editStatement.trim() || null,
        audio_url: audioUrl,
      }).eq("id", editingId);

      // Delete old options and recreate
      await supabase.from("question_options").delete().eq("question_id", editingId);

      for (let i = 0; i < editOptionCount; i++) {
        const newFile = editImageFiles[i];
        let imageUrl = existingOptions[i]?.image_url || "";

        if (newFile) {
          const imgName = `${crypto.randomUUID()}.${newFile.name.split('.').pop()}`;
          const { error: imgErr } = await supabase.storage.from("exam-images").upload(imgName, newFile);
          if (imgErr) throw imgErr;
          const { data: imgUrl } = supabase.storage.from("exam-images").getPublicUrl(imgName);
          imageUrl = imgUrl.publicUrl;
        }

        if (!imageUrl) {
          toast.error(`Imagem ${i + 1} é obrigatória`);
          setSaving(false);
          return;
        }

        await supabase.from("question_options").insert({
          question_id: editingId,
          image_url: imageUrl,
          is_correct: i === editCorrectIndex,
          order_index: i,
        });
      }

      toast.success("Questão atualizada!");
      cancelEdit();
      loadQuestions();
      onQuestionsChanged();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    const { error } = await supabase.from("question_options").delete().eq("question_id", questionId);
    if (error) { toast.error("Erro ao excluir opções"); return; }
    const { error: qErr } = await supabase.from("questions").delete().eq("id", questionId);
    if (qErr) { toast.error("Erro ao excluir questão"); return; }
    toast.success("Questão excluída");
    loadQuestions();
    onQuestionsChanged();
  };

  if (loading) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6 mb-8">
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6 mb-8 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-display font-bold">Questões da Prova</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {questions.length === 0 ? (
        <p className="text-muted-foreground text-center py-6">Nenhuma questão cadastrada</p>
      ) : (
        <div className="space-y-4">
          {questions.map((q, idx) => (
            <div key={q.id} className="border border-border rounded-xl p-4">
              {editingId === q.id ? (
                /* Edit form */
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Enunciado</Label>
                    <Textarea value={editStatement} onChange={e => setEditStatement(e.target.value)} rows={2} />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4" /> Áudio
                      {q.audio_url && keepExistingAudio && <span className="text-xs text-muted-foreground">(mantendo atual)</span>}
                    </Label>
                    <Input type="file" accept="audio/*" onChange={e => { setEditAudioFile(e.target.files?.[0] || null); setKeepExistingAudio(false); }} />
                  </div>

                  <div className="space-y-2">
                    <Label>Alternativas</Label>
                    <div className="flex gap-2">
                      {[2, 3, 4].map(n => (
                        <Button key={n} variant={editOptionCount === n ? "default" : "outline"} size="sm"
                          onClick={() => { setEditOptionCount(n); if (editCorrectIndex >= n) setEditCorrectIndex(0); }}>
                          {n}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {Array.from({ length: editOptionCount }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Image className="w-4 h-4" /> Imagem {i + 1}
                          {editCorrectIndex === i && (
                            <span className="text-xs bg-success text-success-foreground px-2 py-0.5 rounded-full">Correta</span>
                          )}
                        </Label>
                        {editImagePreviews[i] && (
                          <img src={editImagePreviews[i]!} alt={`Preview ${i + 1}`} className="w-full h-24 object-contain rounded-lg border border-border bg-muted" />
                        )}
                        <Input type="file" accept="image/*" onChange={e => handleEditFileChange(i, e.target.files?.[0] || null)} />
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditPasteImage(i)} className="gap-1 flex-1">
                            <ClipboardPaste className="w-3 h-3" /> Colar
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setEditCorrectIndex(i)} className="gap-1 flex-1">
                            <Check className="w-3 h-3" /> Correta
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleSaveEdit} disabled={saving} className="font-display font-bold gap-2">
                      <Upload className="w-4 h-4" /> {saving ? "Salvando..." : "Salvar"}
                    </Button>
                    <Button variant="outline" onClick={cancelEdit}>Cancelar</Button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold text-sm text-muted-foreground mb-1">Questão {idx + 1}</p>
                    {q.statement && <p className="text-foreground mb-2">{q.statement}</p>}
                    {q.audio_url && <p className="text-xs text-muted-foreground mb-2">🔊 Com áudio</p>}
                    <div className="flex gap-2 flex-wrap">
                      {q.question_options.map((opt, oi) => (
                        <div key={opt.id} className={`relative w-16 h-16 rounded-lg border-2 overflow-hidden ${opt.is_correct ? "border-success" : "border-border"}`}>
                          <img src={opt.image_url} alt={`Opção ${oi + 1}`} className="w-full h-full object-cover" />
                          {opt.is_correct && (
                            <div className="absolute top-0 right-0 bg-success rounded-bl p-0.5">
                              <Check className="w-3 h-3 text-success-foreground" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(q)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteQuestion(q.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestionManager;
