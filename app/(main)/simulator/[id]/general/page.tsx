// ✅ REWRITTEN: GeneralTab Component

'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import SimulatorTabs from '../../SimulatorTabs';

// This client uses the public ANON key and is subject to RLS policies.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const tabs = [
  { name: 'General', path: 'general' },
  { name: 'Targeting', path: 'targeting' },
  { name: 'Questions', path: 'questions' },
  { name: 'Preview', path: 'preview' },
  { name: 'Quotas', path: 'quotas' },
  { name: 'Reporting', path: 'reporting' }
];

// Define a type for our form data for better type safety
type SurveyFormData = {
  title: string;
  description: string;
  target_n: string;
  status: string;
  notes: string;
  survey_mode: string;
};

export default function GeneralTab({ params }) {
  const { id } = useParams();
  const pathname = usePathname();
  const active = pathname.split('/')[3];

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<SurveyFormData>({
    title: '',
    description: '',
    target_n: '',
    status: 'live', // Changed from 'draft' to 'live'
    notes: '',
    survey_mode: ''
  });

  const [companyName, setCompanyName] = useState('');
  const [clientFirstName, setClientFirstName] = useState('');
  const [clientLastName, setClientLastName] = useState('');

  useEffect(() => {
    const fetchSurvey = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('surveys')
        .select('*, client_id')
        .eq('id', id)
        .single();

      if (error) {
        setError('Failed to load survey data. ' + error.message);
        toast.error('Failed to load survey data.');
        setLoading(false);
        return;
      }

      if (data) {
        setFormData({
          title: data.title || '',
          description: data.description || '',
          target_n: data.target_n?.toString() || '',
          status: data.status || 'live', // Changed fallback from 'draft' to 'live'
          notes: data.notes || '',
          survey_mode: data.survey_mode || ''
        });

        if (data.client_id) {
          const { data: client, error: clientError } = await supabase
            .from('clients')
            .select('first_name, last_name, company_id')
            .eq('id', data.client_id)
            .single();

          if (clientError) {
            setError('Failed to load client data. ' + clientError.message);
            toast.error('Failed to load client data.');
          } else if (client) {
            setClientFirstName(client.first_name);
            setClientLastName(client.last_name);

            if (client.company_id) {
              const { data: company, error: companyError } = await supabase
                .from('company')
                .select('company_name')
                .eq('id', client.company_id)
                .single();

              if (companyError) {
                setError('Failed to load company data. ' + companyError.message);
                toast.error('Failed to load company data.');
              } else if (company) {
                setCompanyName(company.company_name);
              }
            }
          }
        }
      }
      setLoading(false);
    };

    if (id) {
      fetchSurvey();
    }
  }, [id]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (value: string) => {
    setFormData(prev => ({ ...prev, status: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); // Prevent default form submission

    // Prepare payload, ensuring target_n is a number or null
    const updatePayload = {
      ...formData,
      target_n: formData.target_n === '' ? null : parseInt(formData.target_n, 10)
    };
    
    // Ensure we don't send NaN if parsing fails for any reason
    if (isNaN(updatePayload.target_n as number)) {
        updatePayload.target_n = null;
    }

    const { error } = await supabase
      .from('surveys')
      .update(updatePayload)
      .eq('id', id);

    if (error) {
      toast.error('Failed to save survey: ' + error.message);
    } else {
      toast.success('Survey updated successfully!');
    }
  };

  console.log('Survey type:', formData.type);

  if (loading) return <p className="p-4 text-center">Loading...</p>;
  if (error) return <p className="p-4 text-center text-red-500">{error}</p>;

  return (
    <div className="p-8">
      <SimulatorTabs active="general" id={params.id} surveyType={formData.survey_mode} />

      {/* Mode row */}
      <div className="mb-4">
        <label className="form-label">Mode:</label>
        <div className="text-base text-gray-700">
          {formData.survey_mode === 'synthetic'
            ? 'Simulator'
            : formData.survey_mode === 'matrix'
            ? 'Matrix'
            : ''}
        </div>
      </div>

      <div className="mb-4">
        <label className="form-label">Company Name:</label>
        <div className="text-base text-gray-700">{companyName}</div>
      </div>

      <div className="mb-4">
        <label className="form-label">Client:</label>
        <div className="text-base text-gray-700">
          {clientFirstName} {clientLastName}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div>
          <label className="text-sm font-medium block mb-1">Survey Status</label>
          <Select value={formData.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Title</label>
          <Input name="title" value={formData.title} onChange={handleInputChange} />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Description</label>
          <Textarea name="description" value={formData.description} onChange={handleInputChange} />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Target N</label>
          <Input
            name="target_n"
            type="number"
            value={formData.target_n}
            onChange={handleInputChange}
          />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Internal Notes</label>
          <Textarea name="notes" value={formData.notes} onChange={handleInputChange} />
        </div>

        <Button type="submit">Save Changes</Button>
      </form>
    </div>
  );
}