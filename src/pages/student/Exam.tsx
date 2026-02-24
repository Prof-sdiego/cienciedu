import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useStudent } from "@/contexts/StudentContext";
import AudioPlayer from "@/components/student/AudioPlayer";
import ImageOption from "@/components/student/ImageOption";

interface QuestionOption {
  id: string;
  image_url: string;
  is_correct: boolean;
  order_index: number;
}

interface Question {
  id: string;
  audio_url: string;
  statement?: string;
  order_index: number;
  options: QuestionOption[];
}

const StudentExam = () => {
  const { examId } = useParams<{ examId: string }>();
  const { student } = useStudent();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answers, setAnswers] = useState<{ questionId: string; optionId: string; isCorrect: boolean }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student) {
      navigate("/aluno");
      return;
    }
    loadQuestions();
  }, [examId, student]);

  const loadQuestions = async () => {
    if (!examId) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/student-api?action=get-questions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          body: JSON.stringify({ examId }),
        }
      );
      const { questions: data } = await res.json();

      if (!data || data.length === 0) {
        navigate("/aluno/provas");
        return;
      }

      setQuestions(data);
    } catch {
      navigate("/aluno/provas");
      return;
    }
    setLoading(false);
  };

  const handleSelect = (optionId: string) => {
    if (selectedOption) return;
    setSelectedOption(optionId);

    const currentQ = questions[currentIndex];
    const option = currentQ.options.find(o => o.id === optionId);
    const newAnswer = {
      questionId: currentQ.id,
      optionId,
      isCorrect: option?.is_correct || false,
    };

    const newAnswers = [...answers, newAnswer];
    setAnswers(newAnswers);

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setSelectedOption(null);
      } else {
        submitExam(newAnswers);
      }
    }, 800);
  };

  const submitExam = async (finalAnswers: typeof answers) => {
    if (!student || !examId) return;

    const correct = finalAnswers.filter(a => a.isCorrect).length;
    const total = finalAnswers.length;
    const score = total > 0 ? (correct / total) * 100 : 0;

    await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-exam`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({
          studentId: student.id,
          examId,
          score,
          totalQuestions: total,
          correctAnswers: correct,
          answers: finalAnswers,
        }),
      }
    );

    navigate("/aluno/concluido");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-student-bg flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  if (!currentQuestion) return null;

  return (
    <div className="min-h-screen bg-student-bg flex flex-col p-6 select-none">
      {/* Progress */}
      <div className="w-full bg-secondary rounded-full h-4 mb-6">
        <div
          className="bg-primary h-4 rounded-full transition-all duration-500"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Statement */}
      {currentQuestion.statement && (
        <div className="bg-card rounded-2xl border-2 border-primary/20 p-6 mb-6 text-center">
          <p className="text-xl sm:text-2xl font-display font-bold text-foreground leading-relaxed">
            {currentQuestion.statement}
          </p>
        </div>
      )}

      {/* Audio */}
      {currentQuestion.audio_url && (
        <div className="flex-shrink-0 mb-8">
          <AudioPlayer
            key={currentQuestion.id}
            src={currentQuestion.audio_url}
            autoPlay={true}
            autoPlayDelay={3000}
          />
        </div>
      )}

      {/* Options */}
      <div className="flex-1 grid grid-cols-2 gap-6 max-w-2xl mx-auto w-full">
        {currentQuestion.options.map(option => (
          <ImageOption
            key={option.id}
            imageUrl={option.image_url}
            selected={selectedOption === option.id}
            onSelect={() => handleSelect(option.id)}
            disabled={!!selectedOption}
          />
        ))}
      </div>

      {/* Question counter */}
      <div className="mt-6 text-center">
        <span className="text-2xl font-display font-bold text-muted-foreground">
          {currentIndex + 1} / {questions.length}
        </span>
      </div>
    </div>
  );
};

export default StudentExam;
