'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';

export default function NewSimulatorSurveyPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState('');
  const [targetN, setTargetN] = useState('100');
  const [companyId, setCompanyId] = useState('');
  const [clientId, setClientId] = useState('');
  const [companies, setCompanies] = useState<{ id: string; company_name: string }[]>([]);
  const [clients, setClients] = useState<{ id: string; first_name: string; last_name: string }[]>([]);
  const [showAddClient, setShowAddClient] = useState(false);
  const [newClient, setNewClient] = useState({ first_name: '', last_name: '', email: '' });
  const [addingClient, setAddingClient] = useState(false);
  const [surveyMode, setSurveyMode] = useState<'synthetic' | 'matrix'>('synthetic');
  const [status, setStatus] = useState<'live' | 'draft' | 'archived'>('live'); // Changed default to 'live'
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCompanies = async () => {
      const { data } = await supabase.from('company').select('id, company_name').order('company_name');
      if (data) setCompanies(data);
    };
    fetchCompanies();
  }, []);

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

  // Replace the existing auth check effect with this:
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('Session check:', { session, error }); // Debug log
        
        if (error) {
          console.error('Session error:', error);
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(!!session);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [supabase.auth]);

  const handleAddClient = async () => {
    if (!newClient.first_name.trim() || !newClient.last_name.trim() || !newClient.email.trim()) return;
    setAddingClient(true);
    const { data, error } = await supabase
      .from('clients')
      .insert([{ ...newClient, company_id: companyId }])
      .select('id, first_name, last_name')
      .single();
    setAddingClient(false);
    if (error) {
      toast.error('Failed to add client: ' + error.message);
    } else if (data) {
      setClients(prev => [...prev, data]);
      setClientId(data.id);
      setNewClient({ first_name: '', last_name: '', email: '' });
      setShowAddClient(false);
      toast.success('Client added!');
    }
  };

  // Update the handleSubmit function
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!title || !questions || !companyId || !clientId) {
        toast.error("Please fill in all required fields");
        return;
      }

      // Get current user with multiple attempts
      let user = null;
      let userError = null;

      // Try method 1: getUser()
      const userResult1 = await supabase.auth.getUser();
      if (userResult1.data?.user && !userResult1.error) {
        user = userResult1.data.user;
      } else {
        console.log('Method 1 failed:', userResult1.error);
        
        // Try method 2: getSession()
        const sessionResult = await supabase.auth.getSession();
        if (sessionResult.data?.session?.user && !sessionResult.error) {
          user = sessionResult.data.session.user;
        } else {
          console.log('Method 2 failed:', sessionResult.error);
          userError = sessionResult.error || userResult1.error;
        }
      }
      
      if (!user) {
        console.error('No user found:', userError);
        toast.error('Authentication error. Please log in again.');
        // Redirect to login or handle authentication
        return;
      }

      console.log('Current user:', user); // Debug log

      const payload = {
        title: title.trim(),
        description: description.trim(),
        questions: questions.trim(),
        target_n: parseInt(targetN) || 100,
        company_id: companyId,
        client_id: clientId,
        survey_mode: surveyMode,
        status: status,
        creator_id: user.id
      };

      console.log('Sending payload:', payload); // Debug log

      const response = await fetch('/api/surveys/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create survey');
      }

      const data = await response.json();
      
      if (!data.survey_id) {
        throw new Error('No survey ID returned');
      }

      toast.success('Survey created successfully!');
      await router.replace(`/simulator/${data.survey_id}/general`);

    } catch (error) {
      console.error('Error creating survey:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create survey');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add loading state to your return
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Authentication required</p>
          <Button onClick={() => window.location.href = '/login'}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mt-8">
      <Card>
        <CardHeader>
          <CardTitle>Create New Survey</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Company dropdown */}
          <div>
            <label className="text-sm font-medium block mb-1">Company</label>
            <select
              value={companyId}
              onChange={e => setCompanyId(e.target.value)}
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
          {/* Client dropdown and add client inline */}
          {companyId && (
            <div>
              <label className="text-sm font-medium block mb-1">Client</label>
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
              <div className="mt-2">
                {!showAddClient ? (
                  <Button type="button" variant="outline" onClick={() => setShowAddClient(true)}>
                    + Add Client
                  </Button>
                ) : (
                  <div className="flex gap-2 mt-2">
                    <Input
                      name="first_name"
                      value={newClient.first_name}
                      onChange={e => setNewClient({ ...newClient, first_name: e.target.value })}
                      placeholder="First name"
                    />
                    <Input
                      name="last_name"
                      value={newClient.last_name}
                      onChange={e => setNewClient({ ...newClient, last_name: e.target.value })}
                      placeholder="Last name"
                    />
                    <Input
                      name="email"
                      value={newClient.email}
                      onChange={e => setNewClient({ ...newClient, email: e.target.value })}
                      placeholder="Email"
                    />
                    <Button
                      type="button"
                      disabled={addingClient}
                      onClick={handleAddClient}
                    >
                      {addingClient ? 'Adding...' : 'Save'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowAddClient(false)}>
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
          <Input
            required
            placeholder="Survey Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            placeholder="Survey Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Textarea
            required
            placeholder={`Paste Q&A blocks:\nQ: What is your favorite color?\nA: Red\nA: Blue`}
            rows={10}
            value={questions}
            onChange={(e) => setQuestions(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Target N"
            value={targetN}
            onChange={(e) => setTargetN(e.target.value)}
          />
          {/* 5. Add the Status dropdown to the form */}
          <div>
            <label className="text-sm font-medium block mb-1">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as 'live' | 'draft' | 'archived')}
              className="w-full border rounded px-2 py-1"
            >
              <option value="live">Live</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          {/* Survey mode selection */}
          <div className="mb-4">
            <label className="form-label">Survey Mode:</label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="survey_mode"
                  value="synthetic"
                  checked={surveyMode === 'synthetic'}
                  onChange={e => setSurveyMode(e.target.value as 'synthetic' | 'matrix')}
                />
                Synthetic Simulator
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="survey_mode"
                  value="matrix"
                  checked={surveyMode === 'matrix'}
                  onChange={e => setSurveyMode(e.target.value as 'synthetic' | 'matrix')}
                />
                Matrix Sampling
              </label>
            </div>
          </div>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Creating...' : 'Create Survey'}
          </Button>
        </CardContent>
      </Card>
    </form> {/* Added a comment here to trigger a new build */}
  );
}
