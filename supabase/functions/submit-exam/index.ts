import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { studentId, examId, score, totalQuestions, correctAnswers, answers } = await req.json();

    if (!studentId || !examId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert exam result
    const { error: resultErr } = await supabase.from("exam_results").upsert({
      student_id: studentId,
      exam_id: examId,
      score,
      total_questions: totalQuestions,
      correct_answers: correctAnswers,
    }, { onConflict: "student_id,exam_id" });

    if (resultErr) throw resultErr;

    // Insert individual answers
    if (answers && answers.length > 0) {
      const answerRows = answers.map((a: any) => ({
        student_id: studentId,
        question_id: a.questionId,
        selected_option_id: a.optionId,
        is_correct: a.isCorrect,
      }));

      await supabase.from("student_answers").upsert(answerRows, {
        onConflict: "student_id,question_id",
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
