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

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (action === "validate-pin") {
      const { pin } = await req.json();
      const { data: student } = await supabase
        .from("students")
        .select("id, name, pin, teacher_id")
        .eq("pin", pin)
        .maybeSingle();

      if (!student) {
        return new Response(JSON.stringify({ error: "PIN não encontrado" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ student }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get-exams") {
      const { studentId } = await req.json();

      const { data: student } = await supabase
        .from("students")
        .select("teacher_id")
        .eq("id", studentId)
        .single();

      if (!student) {
        return new Response(JSON.stringify({ error: "Student not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if there are any assignments for this student
      const { data: assignments } = await supabase
        .from("student_exam_assignments")
        .select("exam_id")
        .eq("student_id", studentId);

      let exams;
      if (assignments && assignments.length > 0) {
        // Student has specific assignments - only show those
        const examIds = assignments.map(a => a.exam_id);
        const { data } = await supabase
          .from("exams")
          .select("id, title")
          .in("id", examIds)
          .order("created_at", { ascending: false });
        exams = data;
      } else {
        // No assignments - show all teacher exams
        const { data } = await supabase
          .from("exams")
          .select("id, title")
          .eq("teacher_id", student.teacher_id)
          .order("created_at", { ascending: false });
        exams = data;
      }

      return new Response(JSON.stringify({ exams: exams || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get-questions") {
      const { examId } = await req.json();

      // Get exam to check shuffle setting
      const { data: exam } = await supabase
        .from("exams")
        .select("shuffle_questions")
        .eq("id", examId)
        .single();

      const { data: questions } = await supabase
        .from("questions")
        .select("id, audio_url, statement, order_index")
        .eq("exam_id", examId)
        .order("order_index");

      const result = [];
      for (const q of (questions || [])) {
        const { data: options } = await supabase
          .from("question_options")
          .select("id, image_url, is_correct, order_index")
          .eq("question_id", q.id)
          .order("order_index");
        result.push({ ...q, options: options || [] });
      }

      // Shuffle questions if enabled
      let finalResult = result;
      if (exam?.shuffle_questions) {
        finalResult = [...result].sort(() => Math.random() - 0.5);
      }

      return new Response(JSON.stringify({ questions: finalResult }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
