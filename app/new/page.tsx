// Remove companyId state and references
// const [companyId, setCompanyId] = useState('');
// const [companies, setCompanies] = useState<{ id: string; company_name: string }[]>([]);

// Remove company dropdown JSX
// <select ...>{companies.map(...)}...</select>

// Remove company_id from payload and insert
const payload = {
  title,
  description,
  questions,
  target_n: parseInt(targetN),
  client_id: clientId,
  survey_mode: surveyMode,
};

await supabase
  .from('surveys')
  .insert({
    title: payload.title,
    description: payload.description,
    target_n: payload.target_n,
    survey_mode: payload.survey_mode,
    questions: payload.questions,
    client_id: payload.client_id, // <-- ADD THIS LINE
  });

// New code for client selection
const [clientId, setClientId] = useState('');
const [clients, setClients] = useState<{ id: string; first_name: string; last_name: string }[]>([]);

useEffect(() => {
  if (!companyId) {
    setClients([]);
    setClientId('');
    return;
  }
  const fetchClients = async () => {
    const { data } = await supabase
      .from('clients')
      .select('id, first_name, last_name')
      .eq('company_id', companyId)
      .order('first_name');
    if (data) setClients(data);
  };
  fetchClients();
}, [companyId]);

<select
  value={clientId}
  onChange={e => setClientId(e.target.value)}
  className="w-full border rounded px-2 py-1"
>
  <option value="">Select a client...</option>
  {clients.map(client => (
    <option key={client.id} value={client.id}>
      {client.first_name} {client.last_name}
    </option>
  ))}
</select>
<Button onClick={handleSubmit} disabled={!clientId}>
  Save New Survey
</Button>

// Example for /app/api/surveys/create/route.ts

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  const payload = await request.json();

  // Log the object you are about to insert
  console.log('Inserting into Surveys:', payload);

  // The fix is to include all necessary fields from the payload
  // in the object you pass to .insert()
  const { data, error } = await supabase
    .from('surveys')
    .insert({
      title: payload.title,
      description: payload.description,
      questions: payload.questions,
      target_n: payload.target_n,
      survey_mode: payload.survey_mode,
      client_id: payload.client_id, // <-- THIS LINE FIXES THE ERROR
    })
    .select('id')
    .single();

  if (error) {
    console.error('Survey insert error:', error);
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ survey_id: data.id });
}