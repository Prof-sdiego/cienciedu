import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStudent } from "@/contexts/StudentContext";
import { Star } from "lucide-react";

const StudentComplete = () => {
  const navigate = useNavigate();
  const { setStudent } = useStudent();

  useEffect(() => {
    const timer = setTimeout(() => {
      setStudent(null);
      navigate("/aluno");
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-student-bg flex flex-col items-center justify-center p-8 select-none">
      <div className="flex flex-col items-center gap-8 animate-bounce-in">
        <div className="w-40 h-40 rounded-full bg-success flex items-center justify-center shadow-2xl">
          <Star className="w-20 h-20 text-success-foreground fill-current" />
        </div>
        <h1 className="text-5xl sm:text-6xl font-display font-black text-foreground text-center">
          Parabéns! 🎉
        </h1>
        <p className="text-2xl font-display font-bold text-muted-foreground text-center">
          Você terminou a prova!
        </p>
      </div>

      <div className="mt-12 flex gap-4">
        {["⭐", "🌟", "✨"].map((emoji, i) => (
          <span
            key={i}
            className="text-5xl animate-bounce-in"
            style={{ animationDelay: `${i * 200}ms` }}
          >
            {emoji}
          </span>
        ))}
      </div>
    </div>
  );
};

export default StudentComplete;
