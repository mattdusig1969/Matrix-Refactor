'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  Search, 
  Filter,
  Shield,
  Calendar,
  DollarSign,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import PanelTabs from '../PanelTabs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function PanelistsPage() {
  const [panelists, setPanelists] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    // Debug Supabase configuration
    console.log('Supabase config check:', {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
      urlPreview: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...'
    })
    
    fetchPanelists()
  }, [])

  const fetchPanelists = async () => {
    try {
      setLoading(true)
      console.log('Fetching panelists from database...')
      
      // Query panelists with correct table names based on schema
      const { data, error } = await supabase
        .from('panelists')
        .select(`
          *,
          country!inner(country_name),
          panelist_profiles(
            id,
            completed_at,
            profiling_survey_id
          ),
          panelist_earnings(
            amount,
            status,
            transaction_type,
            description
          )
        `)
        .order('created_at', { ascending: false })

      console.log('Panelists query result:', { data, error, count: data?.length })
      
      if (data && data.length > 0) {
        console.log('First panelist data structure:', data[0])
        console.log('Country data:', data[0].country)
        console.log('Profiles data:', data[0].panelist_profiles)
        console.log('Earnings data:', data[0].panelist_earnings)
      }

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      
      setPanelists(data || [])
      console.log('Successfully loaded', data?.length || 0, 'panelists')
    } catch (error) {
      console.error('Error fetching panelists:', error)
      setPanelists([])
    } finally {
      setLoading(false)
    }
  }

  const filteredPanelists = panelists.filter(panelist => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      panelist.first_name?.toLowerCase().includes(searchLower) ||
      panelist.last_name?.toLowerCase().includes(searchLower) ||
      panelist.email?.toLowerCase().includes(searchLower) ||
      panelist.mobile?.includes(searchTerm)
    )
  })

  const calculateTotalEarnings = (earnings) => {
    if (!earnings || !Array.isArray(earnings)) return 0
    // Only sum if amount is a valid number and status is approved/paid/completed
    return earnings
      .filter(e => ['approved', 'paid', 'completed'].includes(e.status) && !isNaN(parseFloat(e.amount)))
      .reduce((sum, e) => sum + parseFloat(e.amount), 0)
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Panel Administration</h1>
        <p className="text-gray-600">Manage your panelist community and survey profiles</p>
      </div>

      <PanelTabs />

      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Panel Management</h2>
            <p className="text-gray-600">Manage registered panelists and their profiles</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search panelists..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-64"
              />
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </button>
            <button 
              onClick={fetchPanelists}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Users className="h-4 w-4" />
              <span>Refresh Data</span>
            </button>
          </div>
        </div>

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Debug Info</h3>
            <p className="text-xs text-gray-600">
              Panelists loaded: {panelists.length} | 
              Loading: {loading.toString()} | 
              Search term: "{searchTerm}" | 
              Filtered results: {filteredPanelists.length}
            </p>
            <button 
              onClick={() => console.log('Current panelists data:', panelists)}
              className="mt-2 text-xs bg-gray-600 text-white px-2 py-1 rounded"
            >
              Log Data to Console
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Panelists</p>
                <p className="text-2xl font-semibold text-gray-900">{panelists.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Verified Users</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {panelists.filter(p => p.is_verified).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">New This Month</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {panelists.filter(p => {
                    const created = new Date(p.created_at)
                    const now = new Date()
                    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
                  }).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Paid Out</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${panelists.reduce((sum, p) => sum + calculateTotalEarnings(p.panelist_earnings), 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Panelists Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Panelists</h3>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading panelists...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Panelist
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Country
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Profiles Completed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Surveys Completed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Earnings
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPanelists.map((panelist) => (
                    <tr key={panelist.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {panelist.first_name?.[0]}{panelist.last_name?.[0]}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {panelist.first_name} {panelist.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {panelist.is_verified ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Verified
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Pending
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {panelist.email || panelist.mobile}
                        </div>
                        <div className="text-sm text-gray-500">
                          {panelist.email ? 'Email' : 'Mobile'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {panelist.country?.country_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {panelist.panelist_profiles?.length || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {panelist.panelist_profiles?.filter(p => p.completed_at)?.length || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        ${calculateTotalEarnings(panelist.panelist_earnings).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(panelist.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-gray-600 hover:text-gray-900">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
