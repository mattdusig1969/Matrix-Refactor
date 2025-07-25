'use client';

import { useState, useEffect, FormEvent } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast, Toaster } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const tabs = [
  { name: 'Clients', path: '/simulator/clients' },
  { name: 'Surveys', path: '/simulator/surveys' },
  { name: 'Results', path: '/simulator/results' },
  { name: 'Settings', path: '/simulator/settings' }
];

export const dynamic = 'force-dynamic';

export default function AddClientPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    company_id: ''
  });
  const [companies, setCompanies] = useState<{ id: string; company_name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [addingCompany, setAddingCompany] = useState(false);

  useEffect(() => {
    const fetchCompanies = async () => {
      const { data, error } = await supabase
        .from('company')
        .select('id, company_name')
        .order('company_name');
      if (!error && data) setCompanies(data);
    };
    fetchCompanies();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCompanyChange = (value: string) => {
    setFormData(prev => ({ ...prev, company_id: value }));
  };

  const handleAddCompany = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;
    setAddingCompany(true);
    const { data, error } = await supabase
      .from('company')
      .insert([{ company_name: newCompanyName }])
      .select('id, company_name')
      .single();
    setAddingCompany(false);
    if (error) {
      toast.error('Failed to add company: ' + error.message);
    } else if (data) {
      setCompanies(prev => [...prev, data]);
      setFormData(prev => ({ ...prev, company_id: data.id }));
      setNewCompanyName('');
      setShowAddCompany(false);
      toast.success('Company added!');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase
      .from('clients')
      .insert([formData]);
    setLoading(false);
    if (error) {
      toast.error('Failed to save client: ' + error.message);
    } else {
      toast.success('Client saved!');
      setFormData({ first_name: '', last_name: '', email: '', company_id: '' });
    }
  };

  return (
    <div className="p-4">
      <Toaster />
      <nav className="mb-6 border-b border-gray-200">
        <ul className="flex gap-6 text-sm font-medium text-gray-600">
          {tabs.map(tab => (
            <li key={tab.path}>
              <Link
                href={`/simulator/${tab.path}`}
                className={cn(
                  'pb-2 transition-colors hover:text-black',
                  tab.path === 'clients' && 'text-black border-b-2 border-black'
                )}
              >
                {tab.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

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
          <Select name="company_id" value={formData.company_id} onValueChange={handleCompanyChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a company..." />
            </SelectTrigger>
            <SelectContent>
              {companies.map(company => (
                <SelectItem key={company.id} value={company.id}>
                  {company.company_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="mt-2">
            {!showAddCompany ? (
              <Button type="button" variant="outline" onClick={() => setShowAddCompany(true)}>
                + Add Company
              </Button>
            ) : (
              <div className="flex gap-2 mt-2">
                <Input
                  name="newCompanyName"
                  value={newCompanyName}
                  onChange={e => setNewCompanyName(e.target.value)}
                  placeholder="New company name"
                />
                <Button
                  type="button"
                  disabled={addingCompany}
                  onClick={handleAddCompany}
                >
                  {addingCompany ? 'Adding...' : 'Save'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddCompany(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Client'}
        </Button>
      </form>
    </div>
  );
}