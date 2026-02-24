import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStudent } from "@/contexts/StudentContext";
import NumericKeypad from "@/components/student/NumericKeypad";
import { GraduationCap } from "lucide-react";

const StudentPinEntry = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setStudent } = useStudent();

  const handleSubmit = async (pin: string) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/student-api?action=validate-pin`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          body: JSON.stringify({ pin }),
        }
      );

      if (!res.ok) {
        setError("Código não encontrado!");
        setLoading(false);
        return;
      }

      const { student } = await res.json();
      setStudent(student);
      navigate("/aluno/provas");
    } catch {
      setError("Erro ao conectar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-student-bg flex flex-col items-center justify-center p-6 select-none">
      <div className="mb-8 flex flex-col items-center gap-4 animate-slide-up">
        <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center shadow-xl">
          <GraduationCap className="w-12 h-12 text-primary-foreground" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-display font-black text-foreground text-center">
          Digite seu código
        </h1>
      </div>

      <div className="animate-fade-in">
        <NumericKeypad onSubmit={handleSubmit} loading={loading} error={error} />
      </div>
    </div>
  );
};

export default StudentPinEntry;
