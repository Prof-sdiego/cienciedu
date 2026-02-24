-- Make audio_url nullable since questions can have only a statement
ALTER TABLE public.questions ALTER COLUMN audio_url DROP NOT NULL;
ALTER TABLE public.questions ALTER COLUMN audio_url SET DEFAULT '';