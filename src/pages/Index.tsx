import { useNavigate } from "react-router-dom";
import { GraduationCap, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="flex flex-col items-center gap-4 mb-12 animate-slide-up">
        <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center shadow-xl">
          <GraduationCap className="w-10 h-10 text-primary-foreground" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-display font-black text-foreground text-center">
          EduAccess
        </h1>
        <p className="text-lg text-muted-foreground text-center max-w-md">
          Sistema educacional acessível para todos
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-lg animate-fade-in">
        <button
          onClick={() => navigate("/aluno")}
          className="bg-student-primary text-primary-foreground rounded-2xl p-8 flex flex-col items-center gap-4 shadow-xl hover:opacity-90 active:scale-95 transition-all duration-200 touch-target-xl"
        >
          <BookOpen className="w-12 h-12" />
          <span className="text-2xl font-display font-black">Sou Aluno</span>
        </button>

        <button
          onClick={() => navigate("/professor/login")}
          className="bg-card text-foreground border-2 border-border rounded-2xl p-8 flex flex-col items-center gap-4 shadow-xl hover:border-primary active:scale-95 transition-all duration-200 touch-target-xl"
        >
          <GraduationCap className="w-12 h-12 text-primary" />
          <span className="text-2xl font-display font-black">Sou Professor</span>
        </button>
      </div>
    </div>
  );
};

export default Index;
