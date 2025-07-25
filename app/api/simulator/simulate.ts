// pages/api/simulator/simulate.ts
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { survey_id, n_completes, archetype } = req.body;

  if (!survey_id || !n_completes || !archetype) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('survey_id', survey_id)
    .order('question_order', { ascending: true });

  if (!questions || questions.length === 0) {
    return res.status(404).json({ error: 'Survey questions not found' });
  }

  for (let i = 0; i < n_completes; i++) {
    const session_id = uuidv4();
    const demographicProfile = getProfileFromArchetype(archetype);

    // Simulate answers using ChatGPT or hardcoded logic
    const answers = await Promise.all(
      questions.map(async (q) => {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: `You are a ${archetype} answering a survey.` },
            { role: 'user', content: q.question_text },
          ],
        });
        return completion.choices[0]?.message?.content?.trim() || '';
      })
    );

    // Save the simulated survey response to the database
    const { error } = await supabase
      .from('responses')
      .insert([
        {
          survey_id,
          session_id,
          demographic_profile: demographicProfile,
          answers,
        },
      ]);

    if (error) {
      console.error('Error saving response:', error);
      return res.status(500).json({ error: 'Error saving response' });
    }
  }

  return res.status(200).json({ message: 'Simulation completed' });
}

// Add this function definition
function getProfileFromArchetype(archetype: any) {
  // Return a basic demographic profile - customize as needed
  return {
    age: Math.floor(Math.random() * 50) + 20,
    gender: Math.random() > 0.5 ? 'Male' : 'Female',
    location: 'Default Location',
    // Add other demographic fields as needed
  };
}
