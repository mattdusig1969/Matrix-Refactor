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
        retur
