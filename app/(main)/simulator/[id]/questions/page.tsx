// app/simulator/[id]/questions/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import SimulatorTabs from '../../SimulatorTabs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SurveyQuestionsPage() {
  const { id } = useParams();
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    const fetchQuestions = async () => {
      const { data } = await supabase
        .from('Questions')
        .select('*')
        .eq('survey_id', id)
        .order('order_index', { ascending: true });

      setQuestions(data || []);
    };

    fetchQuestions();
  }, [id]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Survey Questions</h1>
      {questions.map((q, idx) => (
        <div key={idx} className="my-4 p-3 border rounded">
          <p><strong>Q{idx + 1}:</strong> {q.question_text}</p>
          <ul className="list-disc ml-6">
            {q.answer_options?.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
