
'use client';

import React, { useEffect, useState, useRef } from 'react';
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
import { cn } from '@/lib/utils';
import DashboardChart from '@/components/dashboard/chart';
import { toast } from 'react-hot-toast';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// StatusDropdown component for status dot and menu
const StatusDropdown = ({ survey, fetchInitialData }) => {
  const [open, setOpen] = useState(false);
  const dotRef = useRef(null);
  const statusOptions = [
    { value: 'live', label: 'Live', color: 'bg-gradient-to-br from-green-400 to-blue-400' },
    { value: 'paused', label: 'Paused', color: 'bg-yellow-400' },
    { value: 'archived', label: 'Archived', color: 'bg-gray-400' }
  ];
  const currentStatus = statusOptions.find(opt => opt.value === survey.status) || statusOptions[0];
  const handleStatusChange = async (newStatus) => {
    if (newStatus === survey.status) return;
    const { error } = await supabase
      .from('surveys')
      .update({ status: newStatus })
      .eq('id', survey.id);
    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success(`Survey status changed to ${newStatus}`);
      fetchInitialData();
    }
    setOpen(false);
  };
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (dotRef.current && !dotRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);
  return (
    <div className="relative inline-block" ref={dotRef}>
      <button
        className={`h-3 w-3 rounded-full inline-block border-2 border-white shadow cursor-pointer ${currentStatus.color}`}
        title={currentStatus.label}
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
      />
      {open && (
        <div className="absolute z-20 mt-2 right-0 bg-white border rounded shadow-lg min-w-[120px]">
          {statusOptions.map(opt => (
            <button
              key={opt.value}
              className={`flex items-center w-full px-3 py-2 text-sm hover:bg-gray-100 ${opt.value === survey.status ? 'font-bold text-blue-700' : ''}`}
              onClick={() => handleStatusChange(opt.value)}
            >
              <span className={`h-3 w-3 rounded-full mr-2 inline-block ${opt.color}`}></span>
              {opt.label}
            </button>
          ))}
        </div>
      )}

    </div>
  );
}


const navItems = [
  { href: '/simulator', label: 'Dashboard' },
  { href: '/simulator/new', label: 'Create Survey' },
  // Add more navigation items as needed
];

export default function SimulatorDashboard() {
  const [surveys, setSurveys] = useState<
    {
      id: string;
      title: string;
      status: string;
      target_n: number;
      completed_n: number;
      actual_completed_n?: number;
      rerun_n?: number;
      created_at: string;
      creator_id: string | null;
      client_id?: string;
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
  const [companies, setCompanies] = useState<{ id: string; company_name: string }[]>([]);
  const [companyFilter, setCompanyFilter] = useState('all');
  const [adminUsers, setAdminUsers] = useState<{ id: string; first_name: string; last_name: string; email?: string }[]>([]);
  const [adminFilter, setAdminFilter] = useState('all'); // will set to user after auth
  const [menuOpen, setMenuOpen] = useState(false);
  const [clients, setClients] = useState<{ id: string; company_id: string }[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copyingId, setCopyingId] = useState<string | null>(null);

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
      if (userError) {
        console.error('❌ Error fetching user:', userError);
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
      // Fetch surveys
      const { data: surveysData, error: surveysError } = await supabase
        .from('surveys')
        .select(`*, client_id, client:client_id (id, first_name, last_name, company_id)`)
        .order('created_at', { ascending: false });
      console.log('📊 Surveys fetch result:', { surveysData, surveysError });
      if (surveysError) {
        console.error('❌ Error fetching surveys:', surveysError);
      } else {
        console.log(`📊 Found ${(surveysData || []).length} surveys`);
        // Fetch all simulation_results for these surveys in one query
        const surveyIds = (surveysData || []).map(s => s.id);
        let allResults = [];
        if (surveyIds.length > 0) {
          const { data: simResults, error: simError } = await supabase
            .from('simulation_results')
            .select('survey_id, run_number')
            .in('survey_id', surveyIds);
          if (simError) {
            console.error('Error fetching simulation_results:', simError);
          } else {
            allResults = simResults || [];
          }
        }
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
        // Aggregate counts in-memory
        const surveysWithCounts = (surveysData || []).map(survey => {
          const completedCount = allResults.filter(r => r.survey_id === survey.id && r.run_number === 1).length;
          const rerunCount = allResults.filter(r => r.survey_id === survey.id && r.run_number > 1).length;
          const creator = usersForMatching.find(user => user.id === survey.creator_id);
          return {
            ...survey,
            actual_completed_n: completedCount || 0,
            rerun_n: rerunCount || 0,
            creator: creator ? {
              id: creator.id,
              first_name: creator.first_name,
              last_name: creator.last_name
            } : null
          };
        });
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
        setClients(clientsData || []);
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
      setIsLoading(false);
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
    const client = clients.find(c => c.id === survey.client_id);
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
          status: 'live', // New copies start as live
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
                {/* Survey Mode Label */}
                <span className={`ml-2 px-2 py-1 text-xs rounded font-bold ${survey.survey_mode === 'matrix' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{survey.survey_mode === 'matrix' ? 'Matrix' : 'Simulator'}</span>
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
                  {/* Status dot with dropdown */}
                  <StatusDropdown survey={survey} fetchInitialData={fetchInitialData} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 relative">
              <p className="text-sm font-semibold">
                {(() => {
                  let companyId = survey.client?.company_id;
                  if (!companyId && survey.client_id && clients.length > 0) {
                    const client = clients.find(c => String(c.id) === String(survey.client_id));
                    companyId = client?.company_id;
                  }
                  if (companyId && companies.length > 0) {
                    const company = companies.find(co => String(co.id) === String(companyId));
                    if (!company) {
                      console.log('Company not found for companyId:', companyId, 'companies:', companies);
                    }
                    return company?.company_name || '—';
                  }
                  if (!companyId) {
                    console.log('No companyId found for survey:', survey);
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
                <span>Re-runs: <strong>{survey.rerun_n ?? 0}</strong></span>
              </div>
              <Button className="mt-2 text-sm px-3 py-1"
                onClick={() => {
                  if (survey.survey_mode === 'matrix') {
                    window.location.href = `/matrix/${survey.id}/general`;
                  } else {
                    window.location.href = `/simulator/${survey.id}/general`;
                  }
                }}
              >
                Edit Survey →
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
        </div>
      )}
    </>
  );
}
