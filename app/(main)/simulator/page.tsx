// app/simulator/page.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { toast, Toaster } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import DashboardChart from '@/components/DashboardChart';

const tabs = [
  { name: 'Clients', path: 'clients' },
  { name: 'Surveys', path: 'surveys' },
  { name: 'Results', path: 'results' },
  { name: 'Settings', path: 'settings' }
];

export const dynamic = 'force-dynamic';

export default function ClientsPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [formData, setFormData] = useState({ first_name: '', last_name: '', email: '', company_id: '' });
  const [companies, setCompanies] = useState<{ id: string; company_name: string }[]>([]);
  const [clients, setClients] = useState<
    { id: string; first_name: string; last_name: string; email: string; company: { company_name: string } | null }[]
  >([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [surveys, setSurveys] = useState<
    {
      id: string;
      title: string;
      status: string;
      target_n: number;
      completed_n: number;
      actual_completed_n?: number;
      created_at: string;
      creator_id: string | null;
      creator: {
        id: string;
        first_name: string;
        last_name: string;
      } | null;
      client: {
        first_name: string;
        last_name: string;
        company_id: string;
        company: {
          id: string;
          company_name: string;
        } | null;
      } | null;
    }[]
  >([]);
  const [statusFilter, setStatusFilter] = useState('live');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [adminUsers, setAdminUsers] = useState<{ id: string; first_name: string; last_name: string; email?: string }[]>([]);
  const [adminFilter, setAdminFilter] = useState('all'); // will set to user after auth
  const [menuOpen, setMenuOpen] = useState(false);
  const [clientsData, setClientsData] = useState<{ id: string; company_id: string }[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [chartData, setChartData] = useState([]); // Initialize with an empty array

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      
      // First check if there's an active session
      console.log('🔍 Checking existing session...');
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log('📱 Session data:', { sessionData, sessionError });
      
      // Fetch current user and set as default filter
      console.log('🔍 Fetching user authentication...');
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      console.log('🔍 Auth response:', { userData, userError });

      // Fetch chart data
      try {
        const response = await fetch('/api/dashboard/completions');
        const data = await response.json();
        // Ensure data is an array before setting state
        if (response.ok && Array.isArray(data)) {
          setChartData(data);
        } else {
          console.error("Failed to fetch chart data or data is not an array:", data);
          setChartData([]); // Reset to empty array on failure
        }
      } catch (error) {
        console.error("Error fetching chart data:", error);
        setChartData([]); // Reset to empty array on error
      }

      if (userError) {
        console.error('Authentication error:', userError.message);
        setCurrentUser(null);
        return;
      }

      console.log('👤 User data:', userData.user);
      setCurrentUser(userData.user);
      // Set default user filter to logged-in user
      if (userData.user) {
        setAdminFilter(userData.user.id);
      }

      // Only proceed with data fetching if user is authenticated
      if (!userData.user) {
        console.log('❌ No authenticated user found');
        console.log('💡 Please log in at: http://localhost:3003/login');
        return;
      }

      console.log('✅ User authenticated, fetching surveys...');

      // Fetch surveys - remove the problematic creator join
      const { data: surveysData, error: surveysError } = await supabase
        .from('surveys')
        .select(`
          *,
          client:client_id (id, first_name, last_name, company_id)
        `)
        .order('created_at', { ascending: false });

      console.log('📊 Surveys fetch result:', { surveysData, surveysError });

      if (surveysError) {
        console.error('❌ Error fetching surveys:', surveysError);
      } else {
        console.log(`📊 Found ${(surveysData || []).length} surveys`);
        
        // First fetch users to match with survey creators
        let usersForMatching = [];
        try {
          const usersResponse = await fetch('/api/users');
          if (usersResponse.ok) {
            const usersData = await usersResponse.json();
            usersForMatching = usersData.users || [];
          }
        } catch (error) {
          console.log('Could not fetch users for creator matching:', error);
        }
        
        // Fetch simulation result counts for each survey and add creator info
        const surveysWithCounts = await Promise.all(
          (surveysData || []).map(async (survey) => {
            try {
              const { count } = await supabase
                .from('simulation_results')
                .select('*', { count: 'exact', head: true })
                .eq('survey_id', survey.id);
              
              // Find creator info from users list
              const creator = usersForMatching.find(user => user.id === survey.creator_id);
              
              return {
                ...survey,
                actual_completed_n: count || 0,
                creator: creator ? {
                  id: creator.id,
                  first_name: creator.first_name,
                  last_name: creator.last_name
                } : null
              };
            } catch (error) {
              console.error(`Error fetching count for survey ${survey.id}:`, error);
              return {
                ...survey,
                actual_completed_n: 0,
                creator: null
              };
            }
          })
        );

        console.log('📊 Surveys with counts and creators:', surveysWithCounts);
        setSurveys(surveysWithCounts);
      }

      // Fetch companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('company') // <-- singular!
        .select('*')
        .order('company_name');

      if (companiesError) {
        console.error('Error fetching companies:', companiesError);
      } else {
        setCompanies(companiesData || []);
      }

      // Fetch clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('first_name');

      if (clientsError) {
        console.error('Error fetching clients:', clientsError);
      } else {
        setClientsData(clientsData || []);
      }

      // Fetch users from our API route (which uses service role key server-side)
      console.log('👥 Fetching users from API...');
      try {
        const usersResponse = await fetch('/api/users');
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          console.log('👥 Users from API:', usersData.users);
          setAdminUsers(usersData.users || []);
        } else {
          console.error('Failed to fetch users from API');
          // Fallback to current user only
          setAdminUsers([{
            id: userData.user.id,
            first_name: userData.user.user_metadata?.first_name || userData.user.email?.split('@')[0] || 'Current User',
            last_name: userData.user.user_metadata?.last_name || '',
            email: userData.user.email
          }]);
        }
      } catch (error) {
        console.error('Error fetching users from API:', error);
        // Fallback to current user only
        setAdminUsers([{
          id: userData.user.id,
          first_name: userData.user.user_metadata?.first_name || userData.user.email?.split('@')[0] || 'Current User',
          last_name: userData.user.user_metadata?.last_name || '',
          email: userData.user.email
        }]);
      }

    } catch (error) {
      console.error('Error in fetchInitialData:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔔 Auth state changed:', event, session?.user?.email);
      if (event === 'SIGNED_IN') {
        console.log('✅ User signed in, refreshing data...');
        fetchInitialData();
      } else if (event === 'SIGNED_OUT') {
        console.log('🚪 User signed out');
        setCurrentUser(null);
        setSurveys([]);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const filteredSurveys = surveys.filter((s) => {
    const status = s.status ?? 'paused';
    const matchesStatus = statusFilter === 'all' || status === statusFilter;

    // Correctly access the nested company_id from the client object
    const clientCompanyId = s.client?.company_id;
    const matchesCompany = companyFilter === 'all' || clientCompanyId === companyFilter;

    const matchesAdmin = adminFilter === 'all' || s.creator_id === adminFilter;

    return matchesStatus && matchesCompany && matchesAdmin;
  });

  const getCompanyName = (survey) => {
    const client = clientsData.find(c => c.id === survey.client_id);
    const company = companies.find(co => co.id === client?.company_id);
    return company?.company_name || '—';
  };

  const copySurvey = async (originalSurvey) => {
    if (!currentUser) {
      toast.error('Authentication required');
      return;
    }

    setCopyingId(originalSurvey.id);
    
    try {
      // Step 1: Copy the main survey
      const { data: newSurvey, error: surveyError } = await supabase
        .from('surveys')
        .insert([{
          title: `${originalSurvey.title} Copy`,
          description: originalSurvey.description,
          questions: originalSurvey.questions,
          target_n: originalSurvey.target_n,
          client_id: originalSurvey.client_id,
          survey_mode: originalSurvey.survey_mode,
          country_id: originalSurvey.country_id, // ensure country_id is copied
          targeting: originalSurvey.targeting, // ensure targeting field is copied
          status: 'draft', // New copies start as draft
          creator_id: currentUser.id,
          created_at: new Date().toISOString()
        }])
        .select('id')
        .single();

      if (surveyError) throw surveyError;

      const newSurveyId = newSurvey.id;

      // Step 2: Copy questions
      const { data: originalQuestions, error: questionsSelectError } = await supabase
        .from('questions')
        .select('*')
        .eq('survey_id', originalSurvey.id);

      if (questionsSelectError) {
        console.error('Error fetching questions:', questionsSelectError);
      }

      if (originalQuestions && originalQuestions.length > 0) {
        const newQuestions = originalQuestions.map(q => ({
          survey_id: newSurveyId,
          question_number: q.question_number,
          question_text: q.question_text,
          question_type: q.question_type,
          answer_option: q.answer_option,
          question_order: q.question_order
        }));

        const { error: questionsError } = await supabase
          .from('questions')
          .insert(newQuestions);

        if (questionsError) throw questionsError;
      }

      // Step 3: Copy targeting criteria
      const { data: originalTargeting, error: targetingSelectError } = await supabase
        .from('targeting')
        .select('*')
        .eq('survey_id', originalSurvey.id);

      if (targetingSelectError) {
        console.error('Error fetching targeting:', targetingSelectError);
      }

      if (originalTargeting && originalTargeting.length > 0) {
        const newTargeting = originalTargeting.map(t => ({
          ...t,
          survey_id: newSurveyId
        }));

        const { error: targetingError } = await supabase
          .from('targeting')
          .insert(newTargeting);

        if (targetingError) throw targetingError;
      }

      toast.success(`Survey "${originalSurvey.title}" copied successfully!`);
      
      // Refresh the surveys list by refetching data instead of reload
      await fetchInitialData();

    } catch (error) {
      console.error('Error copying survey:', error);
      toast.error('Failed to copy survey: ' + (error?.message || 'Unknown error'));
    } finally {
      setCopyingId(null);
    }
  };

  return (
    <>
      {/* Show loading while authentication is being determined */}
      {isLoading && (
        <div className="p-8">
          <div className="text-center">Loading...</div>
        </div>
      )}

      {/* Show login required if no user */}
      {!isLoading && !currentUser && (
        <div className="p-8">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Please log in to access the simulator</p>
            <button 
              onClick={() => window.location.href = '/login'}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Go to Login
            </button>
          </div>
        </div>
      )}

      {/* Main dashboard content - only show when authenticated */}
      {!isLoading && currentUser && (
        <div className="p-6 space-y-6">

          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Simulator Dashboard</h1>
            <Button>
              <Link href="/simulator/new">+ New Survey</Link>
            </Button>
          </div>

      <div className="flex gap-4 items-center">
        <label>Status Filter:</label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-white">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="live">Live</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
        <label>Company Filter:</label>
        <Select value={companyFilter} onValueChange={setCompanyFilter}>
          <SelectTrigger className="w-[180px] bg-white">
            <SelectValue placeholder="Filter by company..." />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="all">All Companies</SelectItem>
            {companies.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                {company.company_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <label>User Filter:</label>
        <Select value={adminFilter} onValueChange={setAdminFilter}>
          <SelectTrigger className="w-[180px] bg-white">
            <SelectValue placeholder="Filter by user..." />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="all">All Users</SelectItem>
            {adminUsers.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.first_name} {user.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {filteredSurveys.length === 0 && surveys.length > 0 && (
          <div className="col-span-full bg-yellow-100 p-4 rounded">
            <h3 className="font-bold text-yellow-800">No surveys match current filters</h3>
            <p className="text-yellow-700">Try changing the filter settings above.</p>
          </div>
        )}
        
        {surveys.length === 0 && (
          <div className="col-span-full bg-blue-100 p-4 rounded">
            <h3 className="font-bold text-blue-800">No surveys found</h3>
            <p className="text-blue-700">Create your first survey using the "New Survey" button.</p>
          </div>
        )}

        {filteredSurveys.map((survey) => (
          <Card key={survey.id} className="bg-white/70 backdrop-blur-lg border border-blue-200 rounded-xl shadow-lg hover:shadow-xl transition-all">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex-1">{survey.title}</CardTitle>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      copySurvey(survey);
                    }}
                    disabled={copyingId === survey.id}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded"
                    title="Copy Survey"
                  >
                    {copyingId === survey.id ? (
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                  {survey.status === 'live' && (
                    <span className="h-3 w-3 rounded-full bg-gradient-to-br from-green-400 to-blue-400 inline-block" title="Live"></span>
                  )}
                  {survey.status === 'paused' && (
                    <span className="h-3 w-3 rounded-full bg-yellow-400 inline-block" title="Paused"></span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 relative">
              <p className="text-sm font-semibold">
                {(() => {
                  let companyId = survey.client?.company_id;

                  // Now lookup the company name
                  if (companyId && companies.length > 0) {
                    const company = companies.find(co => String(co.id) === String(companyId));
                    return company?.company_name || '—';
                  }
                  return '—';
                })()}
              </p>
              <p className="text-sm text-gray-500">
                {survey.client ? `${survey.client.first_name} ${survey.client.last_name}` : '—'}
              </p>
              <p className="text-xs text-gray-400">
                Created: {survey.created_at ? new Date(survey.created_at).toLocaleDateString() : '—'}
              </p>
              <div className="flex gap-4 text-xs mt-1">
                <span>Target N: <strong>{survey.target_n ?? '—'}</strong></span>
                <span>Completed N: <strong>{survey.actual_completed_n ?? survey.completed_n ?? 0}</strong></span>
              </div>
              <Button className="mt-2 text-sm px-3 py-1">
                <Link href={`/simulator/${survey.id}/general`}>
                  Edit Survey →
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart section */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Survey Completions Overview</h2>
        <DashboardChart chartData={chartData} />
      </div>
        </div>
      )}
    </>
  );
}
