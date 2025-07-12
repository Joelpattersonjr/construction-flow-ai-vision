import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory = [] } = await req.json();

    // Search knowledge base for relevant information
    const searchTerms = message.toLowerCase().split(' ').filter(term => term.length > 2);
    
    const { data: knowledgeEntries, error: kbError } = await supabase
      .from('knowledge_base')
      .select('category, question, answer')
      .eq('is_active', true)
      .or(
        searchTerms.map(term => 
          `question.ilike.%${term}%,answer.ilike.%${term}%,keywords.cs.{${term}}`
        ).join(',')
      )
      .limit(3);

    if (kbError) {
      console.error('Knowledge base search error:', kbError);
    }

    // Build context from knowledge base
    let knowledgeContext = '';
    if (knowledgeEntries && knowledgeEntries.length > 0) {
      knowledgeContext = '\n\nRelevant ConexusPM Information:\n' + 
        knowledgeEntries.map(entry => 
          `Q: ${entry.question}\nA: ${entry.answer}`
        ).join('\n\n');
    }

    // Build conversation context
    const systemPrompt = `You are a helpful customer support assistant for ConexusPM, a comprehensive project management platform designed for construction and project-based businesses.

ConexusPM Features:
- Project Management: Create and track projects with team collaboration
- Task Management: Create, assign, and track tasks with Kanban boards and lists
- File Management: Upload, organize, and share project documents and photos  
- Time Tracking: Log time spent on tasks with timers and manual entries
- Team Collaboration: Manage project members with role-based permissions
- Calendar Integration: View project schedules and deadlines
- Reporting: Generate time reports and project analytics

Be friendly, professional, and concise. Use the relevant information provided below to give specific, accurate answers about ConexusPM features. If you don't find specific information in the knowledge base, provide general guidance based on typical project management workflows.${knowledgeContext}`;

    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...conversationHistory.map((msg: any) => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.text
      })),
      {
        role: 'user',
        content: message
      }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-chat function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});