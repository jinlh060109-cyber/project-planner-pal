import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { taskContent } = await req.json();
    if (!taskContent?.trim()) {
      return new Response(
        JSON.stringify({ error: "Task content is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader! } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch profile and SWOT items in parallel
    const [profileRes, swotRes] = await Promise.all([
      supabase.from("profiles").select("role_situation, north_star").eq("user_id", user.id).single(),
      supabase.from("swot_items").select("quadrant, content").eq("user_id", user.id),
    ]);

    const profile = profileRes.data;
    const swotItems = swotRes.data || [];

    const strengths = swotItems.filter((i: any) => i.quadrant === "strength").map((i: any) => i.content);
    const weaknesses = swotItems.filter((i: any) => i.quadrant === "weakness").map((i: any) => i.content);
    const opportunities = swotItems.filter((i: any) => i.quadrant === "opportunity").map((i: any) => i.content);
    const threats = swotItems.filter((i: any) => i.quadrant === "threat").map((i: any) => i.content);

    const systemPrompt = `You are a Strategic Life Analyst. Your sole job is to classify a task into exactly ONE SWOT quadrant based strictly on the user's personal profile below.

USER PROFILE:
- Role: ${profile?.role_situation || "Not specified"}
- North star objective: ${profile?.north_star || "Not specified"}
- Strengths: ${strengths.length ? strengths.join(", ") : "None specified"}
- Weaknesses: ${weaknesses.length ? weaknesses.join(", ") : "None specified"}
- Opportunities: ${opportunities.length ? opportunities.join(", ") : "None specified"}
- Threats: ${threats.length ? threats.join(", ") : "None specified"}

CLASSIFICATION RULES — read carefully before deciding:

S (Strength): The task directly builds or exercises a capability listed in the user's Strengths. The primary benefit is skill development or compounding a natural advantage.
DISQUALIFY if the task is primarily defensive or reactive.

W (Weakness): The task directly confronts something listed in the user's Weaknesses. The primary benefit is closing a personal gap.
DISQUALIFY if the task is driven by an external deadline or risk.

O (Opportunity): The task captures a time-sensitive external circumstance listed in the user's Opportunities. The primary driver is external conditions, not internal development.
DISQUALIFY if the benefit is primarily internal skill growth.

T (Threat): The task neutralizes or prevents an external risk listed in the user's Threats. The primary driver is protection, not growth.
DISQUALIFY if the task primarily builds capability.

TIEBREAKER RULE: If a task fits multiple quadrants, choose the quadrant whose profile item is most SPECIFICALLY referenced. Vague connections do not count. If still tied, prefer W over S, T over O.

REASONING RULES — strictly follow these:
1. Your reasoning MUST reference a specific item from the profile (name the actual strength, weakness, opportunity, or threat).
2. NEVER end reasoning with a reference to the north star objective unless the connection is direct and explicit.
3. The north star objective is context only — mention it maximum once, only if genuinely relevant.
4. Reasoning must be exactly 1 sentence. No more.
5. Start reasoning with the profile item, not the task description.

Return ONLY valid JSON, no preamble:
{
  "quadrant": "S" | "W" | "O" | "T",
  "reasoning": "One sentence starting with the specific profile item",
  "priority": "High" | "Medium" | "Low"
}

PRIORITY RULES:
- High: time-sensitive OR directly blocks/enables a core goal
- Medium: important but not urgent
- Low: beneficial but deferrable`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI gateway not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: taskContent },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "classify_task",
                description:
                  "Classify a task into a SWOT quadrant with reasoning and priority.",
                parameters: {
                  type: "object",
                  properties: {
                    quadrant: {
                      type: "string",
                      enum: ["strength", "weakness", "opportunity", "threat"],
                    },
                    reasoning: {
                      type: "string",
                      description:
                        "One sentence referencing something specific from the user profile.",
                    },
                    priority: {
                      type: "string",
                      enum: ["High", "Medium", "Low"],
                    },
                  },
                  required: ["quadrant", "reasoning", "priority"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "classify_task" },
          },
          temperature: 0.2,
          max_tokens: 300,
        }),
      }
    );

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings → Workspace → Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", status, errText);
      return new Response(
        JSON.stringify({ error: "Classification failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();

    // Extract from tool call
    let classification: { quadrant: string; reasoning: string; priority: string };
    try {
      const toolCall = aiData.choices[0].message.tool_calls[0];
      classification = JSON.parse(toolCall.function.arguments);
    } catch {
      console.error("Failed to parse AI response:", JSON.stringify(aiData));
      return new Response(
        JSON.stringify({ error: "Classification failed — invalid AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate quadrant value
    const validQuadrants = ["strength", "weakness", "opportunity", "threat"];
    if (!validQuadrants.includes(classification.quadrant)) {
      return new Response(
        JSON.stringify({ error: "Classification failed — invalid quadrant" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert task
    const { data: task, error: insertError } = await supabase
      .from("tasks")
      .insert({
        user_id: user.id,
        content: taskContent.trim(),
        quadrant: classification.quadrant,
        reasoning: classification.reasoning,
        priority: classification.priority,
        is_completed: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to save task" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ task }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("classify-task error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
