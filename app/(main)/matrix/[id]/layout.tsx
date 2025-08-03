'use client';

import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function MatrixDetailLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams();
  const [surveyTitle, setSurveyTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHeaderData = async () => {
      if (!id) return;
      setLoading(true);

      const { data: survey, error: surveyError } = await supabase
        .from('surveys')
        .select('title, client_id')
        .eq('id', id as string)
        .single();

      if (survey && survey.client_id) {
        setSurveyTitle(survey.title);
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .select('company_id')
          .eq('id', survey.client_id)
          .single();

        if (client && client.company_id) {
          const { data: company, error: companyError } = await supabase
            .from('company')
            .select('company_name')
            .eq('id', client.company_id)
            .single();
          
          if (company) {
            setCompanyName(company.company_name);
          }
        }
      }
      setLoading(false);
    };

    fetchHeaderData();
  }, [id]);

  const pageTitle = companyName && surveyTitle ? `${companyName} - ${surveyTitle}` : (surveyTitle || '');

  return (
    <div className="p-8">
      {loading ? (
        <div className="h-8 bg-gray-200 rounded w-1/2 animate-pulse mb-6"></div>
      ) : (
        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          {pageTitle}
        </h1>
      )}
      {children}
    </div>
  );
}
