import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import TeacherLayout from "@/layouts/TeacherLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Student {
  id: string;
  name: string;
  pin: string;
  created_at: string;
}

const generatePin = (): string => {
  return String(Math.floor(1000 + Math.random() * 9000));
};

const TeacherStudents = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadStudents();
  }, [user]);

  const loadStudents = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("students")
      .select("*")
      .eq("teacher_id", user.id)
      .order("created_at", { ascending: false });
    setStudents(data || []);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!user || !newName.trim()) return;
    setCreating(true);

    let pin = generatePin();
    // Ensure unique PIN
    let attempts = 0;
    while (attempts < 10) {
      const { data: existing } = await supabase
        .from("students")
        .select("id")
        .eq("pin", pin)
        .maybeSingle();
      if (!existing) break;
      pin = generatePin();
      attempts++;
    }

    const { error } = await supabase.from("students").insert({
      name: newName.trim(),
      pin,
      teacher_id: user.id,
    });

    if (error) {
      toast.error("Erro ao cadastrar aluno");
    } else {
      toast.success(`Aluno cadastrado! PIN: ${pin}`);
      setNewName("");
      setDialogOpen(false);
      loadStudents();
    }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir aluno");
    } else {
      toast.success("Aluno excluído");
      loadStudents();
    }
  };

  const copyPin = (pin: string) => {
    navigator.clipboard.writeText(pin);
    toast.success("PIN copiado!");
  };

  return (
    <TeacherLayout>
      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-black text-foreground">Alunos</h1>
            <p className="text-muted-foreground mt-1">Gerencie seus alunos e seus códigos de acesso</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 font-display font-bold">
                <UserPlus className="w-4 h-4" />
                Novo Aluno
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">Cadastrar Aluno</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Nome do aluno</Label>
                  <Input
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="Nome completo"
                    maxLength={100}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Um código PIN de 4 dígitos será gerado automaticamente.
                </p>
                <Button onClick={handleCreate} disabled={creating || !newName.trim()} className="w-full font-display font-bold">
                  {creating ? "Cadastrando..." : "Cadastrar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <UserPlus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Nenhum aluno cadastrado</p>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-display font-bold text-foreground">Nome</th>
                  <th className="text-left p-4 font-display font-bold text-foreground">PIN</th>
                  <th className="text-right p-4 font-display font-bold text-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="p-4 font-medium">{s.name}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-lg font-mono font-bold text-lg">
                        {s.pin}
                        <button onClick={() => copyPin(s.pin)} className="hover:opacity-70">
                          <Copy className="w-4 h-4" />
                        </button>
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)} className="text-destructive hover:text-destructive">
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

export default TeacherStudents;
