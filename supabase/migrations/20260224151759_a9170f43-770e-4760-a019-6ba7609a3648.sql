
-- Add statement text to questions
ALTER TABLE public.questions ADD COLUMN statement TEXT;

-- Add shuffle option to exams
ALTER TABLE public.exams ADD COLUMN shuffle_questions BOOLEAN NOT NULL DEFAULT false;

-- Create student_exam_assignments table for assigning exams to specific students
CREATE TABLE public.student_exam_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, exam_id)
);

-- Enable RLS
ALTER TABLE public.student_exam_assignments ENABLE ROW LEVEL SECURITY;

-- Teachers can manage assignments for their own students/exams
CREATE POLICY "Teachers manage own assignments"
  ON public.student_exam_assignments
  FOR ALL
  USING (
    student_id IN (SELECT id FROM students WHERE teacher_id = auth.uid())
    AND exam_id IN (SELECT id FROM exams WHERE teacher_id = auth.uid())
  )
  WITH CHECK (
    student_id IN (SELECT id FROM students WHERE teacher_id = auth.uid())
    AND exam_id IN (SELECT id FROM exams WHERE teacher_id = auth.uid())
  );
