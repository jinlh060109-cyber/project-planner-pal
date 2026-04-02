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
    const { taskContent, taskDate } = await req.json();
    if (!taskContent?.trim()) {
      return new Response(
        JSON.stringify({ error: "Task content is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (taskContent.trim().length > 200) {
      return new Response(
        JSON.stringify({ error: "Task content must be 200 characters or less" }),
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

    // Fetch profile, SWOT items, and skill profiles in parallel
    const [profileRes, swotRes, subSwotRes] = await Promise.all([
      supabase.from("profiles").select("role_situation, north_star").eq("user_id", user.id).single(),
      supabase.from("swot_items").select("quadrant, content").eq("user_id", user.id),
      supabase.from("sub_swots").select("name, description, strength, weakness, opportunity, threat").eq("user_id", user.id),
    ]);

    const profile = profileRes.data;
    const swotItems = swotRes.data || [];
    const subSwots = subSwotRes.data || [];

    const strengths = swotItems.filter((i: any) => i.quadrant === "strength").map((i: any) => i.content);
    const weaknesses = swotItems.filter((i: any) => i.quadrant === "weakness").map((i: any) => i.content);
    const opportunities = swotItems.filter((i: any) => i.quadrant === "opportunity").map((i: any) => i.content);
    const threats = swotItems.filter((i: any) => i.quadrant === "threat").map((i: any) => i.content);

    // Build skill profiles section for prompt
    let skillProfilesSection = "";
    if (subSwots.length > 0) {
      const skillLines = subSwots.map((s: any) => {
        const parts = [`  - ${s.name}`];
        if (s.description) parts.push(`    Description: ${s.description}`);
        if (s.strength?.length) parts.push(`    Strengths: ${s.strength.join(", ")}`);
        if (s.weakness?.length) parts.push(`    Weaknesses: ${s.weakness.join(", ")}`);
        if (s.opportunity?.length) parts.push(`    Opportunities: ${s.opportunity.join(", ")}`);
        if (s.threat?.length) parts.push(`    Threats: ${s.threat.join(", ")}`);
        return parts.join("\n");
      });
      skillProfilesSection = `\n\nSKILL PROFILES (active arenas the user is competing in):\n${skillLines.join("\n")}`;
    }

    // Build skill names list for matching
    const skillNames = subSwots.map((s: any) => s.name);

    const systemPrompt = `You are a Strategic Life Analyst. You have two jobs:
1. Rewrite the user's task into a clean, concise title (fix grammar, remove redundancy, keep intent — max 80 chars).
2. Classify the task into exactly ONE SWOT quadrant based strictly on the user's personal profile below.

USER PROFILE:
- Role: ${profile?.role_situation || "Not specified"}
- North star objective: ${profile?.north_star || "Not specified"}
- Strengths: ${strengths.length ? strengths.join(", ") : "None specified"}
- Weaknesses: ${weaknesses.length ? weaknesses.join(", ") : "None specified"}
- Opportunities: ${opportunities.length ? opportunities.join(", ") : "None specified"}
- Threats: ${threats.length ? threats.join(", ") : "None specified"}${skillProfilesSection}

TITLE REWRITING RULES:
1. Fix grammar, spelling, and punctuation.
2. Remove filler words and redundancy.
3. Keep the original meaning and intent intact.
4. Use action-oriented phrasing (start with a verb when natural).
5. Maximum 80 characters.
6. If the original is already clean, return it as-is.

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
2. Reasoning must be exactly 1 sentence. No more.
3. Start reasoning with the profile item, not the task description.

NORTH STAR CONNECTION RULES:
1. If the task has a clear connection to the user's north star objective, include a brief objective_connection sentence explaining the link.
2. If no meaningful connection exists, set objective_connection to null.
3. Do not force a connection — only include one when it's genuinely relevant.

SKILL MATCHING RULES:
1. If the task relates to a specific skill profile listed above, return the skill name in matched_skill.
2. If no skill profile is relevant, return null for matched_skill.
3. If a skill is matched, skill_reasoning must explain the connection in one sentence.
4. If no skill is matched, return null for skill_reasoning.

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
                  "Rewrite the task title and classify it into a SWOT quadrant.",
                parameters: {
                  type: "object",
                  properties: {
                    refined_title: {
                      type: "string",
                      description:
                        "Clean, concise rewrite of the task title (max 80 chars).",
                    },
                    quadrant: {
                      type: "string",
                      enum: ["S", "W", "O", "T"],
                    },
                    reasoning: {
                      type: "string",
                      description:
                        "One sentence starting with the specific profile item.",
                    },
                    priority: {
                      type: "string",
                      enum: ["High", "Medium", "Low"],
                    },
                    matched_skill: {
                      type: "string",
                      nullable: true,
                      description:
                        "The name of the matched skill profile, or null if none.",
                    },
                    skill_reasoning: {
                      type: "string",
                      nullable: true,
                      description:
                        "One sentence explaining the skill match, or null if none.",
                    },
                    objective_connection: {
                      type: "string",
                      nullable: true,
                      description:
                        "One sentence describing how this task connects to the north star objective, or null if no meaningful connection.",
                    },
                  },
                  required: ["refined_title", "quadrant", "reasoning", "priority", "matched_skill", "skill_reasoning", "objective_connection"],
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
          max_tokens: 500,
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
    let classification: {
      refined_title: string;
      quadrant: string;
      reasoning: string;
      priority: string;
      matched_skill: string | null;
      skill_reasoning: string | null;
      objective_connection: string | null;
    };
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

    // Map short codes to full quadrant names
    const quadrantMap: Record<string, string> = { S: "strength", W: "weakness", O: "opportunity", T: "threat" };
    const mappedQuadrant = quadrantMap[classification.quadrant];
    if (!mappedQuadrant) {
      return new Response(
        JSON.stringify({ error: "Classification failed — invalid quadrant" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    classification.quadrant = mappedQuadrant;

    // Insert task
    const insertData: Record<string, unknown> = {
      user_id: user.id,
      content: classification.refined_title || taskContent.trim(),
      quadrant: classification.quadrant,
      reasoning: classification.reasoning,
      priority: classification.priority,
      matched_skill: classification.matched_skill || null,
      skill_reasoning: classification.skill_reasoning || null,
      objective_connection: classification.objective_connection || null,
      is_completed: false,
    };
    // Use client-provided local date if available
    if (taskDate && /^\d{4}-\d{2}-\d{2}$/.test(taskDate)) {
      insertData.task_date = taskDate;
    }

    const { data: task, error: insertError } = await supabase
      .from("tasks")
      .insert(insertData)
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
