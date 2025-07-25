'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast, Toaster } from 'react-hot-toast';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function EditClientPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    company_id: ''
  });
  const [companies, setCompanies] = useState<{ id: string; company_name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClient = async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('first_name, last_name, email, company_id')
        .eq('id', id)
        .single();
      if (data) setFormData(data);
      if (error) toast.error('Failed to fetch client: ' + error.message);
      setLoading(false);
    };
    const fetchCompanies = async () => {
      const { data } = await supabase
        .from('company')
        .select('id, company_name')
        .order('company_name');
      if (data) setCompanies(data);
    };
    fetchClient();
    fetchCompanies();
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase
      .from('clients')
      .update(formData)
      .eq('id', id);
    setLoading(false);
    if (error) {
      toast.error('Failed to update client: ' + error.message);
    } else {
      toast.success('Client updated!');
      router.push('/simulator/clients');
    }
  };

  return (
    <div className="p-4">
      <Toaster />
      <h2 className="text-lg font-semibold mb-4">Edit Client</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
          <div>
            <label className="text-sm font-medium block mb-1">First Name</label>
            <Input name="first_name" value={formData.first_name} onChange={handleInputChange} />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Last Name</label>
            <Input name="last_name" value={formData.last_name} onChange={handleInputChange} />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Email</label>
            <Input name="email" value={formData.email} onChange={handleInputChange} />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Company</label>
            <select
              name="company_id"
              value={formData.company_id}
              onChange={handleInputChange}
              className="w-full border rounded px-2 py-1"
            >
              <option value="">Select a company...</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>
                  {company.company_name}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      )}
    </div>
  );
}