
-- Teachers profile table
CREATE TABLE public.teachers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can read own profile" ON public.teachers FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Teachers can update own profile" ON public.teachers FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Teachers can insert own profile" ON public.teachers FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create teacher profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_teacher()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.teachers (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_teacher();

-- Students table
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  pin TEXT NOT NULL UNIQUE,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers manage own students" ON public.students FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

-- Exams table
CREATE TABLE public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers manage own exams" ON public.exams FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

-- Questions table
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  audio_url TEXT NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers manage questions of own exams" ON public.questions FOR ALL
  USING (exam_id IN (SELECT id FROM public.exams WHERE teacher_id = auth.uid()))
  WITH CHECK (exam_id IN (SELECT id FROM public.exams WHERE teacher_id = auth.uid()));

-- Question options (images)
CREATE TABLE public.question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  order_index INT NOT NULL DEFAULT 0
);
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers manage options of own questions" ON public.question_options FOR ALL
  USING (question_id IN (SELECT id FROM public.questions WHERE exam_id IN (SELECT id FROM public.exams WHERE teacher_id = auth.uid())))
  WITH CHECK (question_id IN (SELECT id FROM public.questions WHERE exam_id IN (SELECT id FROM public.exams WHERE teacher_id = auth.uid())));

-- Exam results
CREATE TABLE public.exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  score NUMERIC(5,2) NOT NULL DEFAULT 0,
  total_questions INT NOT NULL DEFAULT 0,
  correct_answers INT NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, exam_id)
);
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers view results of own students" ON public.exam_results FOR SELECT
  USING (student_id IN (SELECT id FROM public.students WHERE teacher_id = auth.uid()));

-- Student answers (individual)
CREATE TABLE public.student_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_option_id UUID REFERENCES public.question_options(id) ON DELETE SET NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, question_id)
);
ALTER TABLE public.student_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers view answers of own students" ON public.student_answers FOR SELECT
  USING (student_id IN (SELECT id FROM public.students WHERE teacher_id = auth.uid()));

-- Storage buckets for audio and images
INSERT INTO storage.buckets (id, name, public) VALUES ('exam-audio', 'exam-audio', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('exam-images', 'exam-images', true);

-- Storage policies
CREATE POLICY "Teachers can upload audio" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'exam-audio' AND auth.role() = 'authenticated');
CREATE POLICY "Anyone can read audio" ON storage.objects FOR SELECT USING (bucket_id = 'exam-audio');
CREATE POLICY "Teachers can delete audio" ON storage.objects FOR DELETE USING (bucket_id = 'exam-audio' AND auth.role() = 'authenticated');

CREATE POLICY "Teachers can upload images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'exam-images' AND auth.role() = 'authenticated');
CREATE POLICY "Anyone can read images" ON storage.objects FOR SELECT USING (bucket_id = 'exam-images');
CREATE POLICY "Teachers can delete images" ON storage.objects FOR DELETE USING (bucket_id = 'exam-images' AND auth.role() = 'authenticated');
