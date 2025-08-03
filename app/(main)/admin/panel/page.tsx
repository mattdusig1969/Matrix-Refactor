'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Users, 
  FileText, 
  BarChart3, 
  Search, 
  Filter,
  Plus,
  DollarSign,
  Shield,
  Calendar,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function PanelAdminPage() {
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState('panelists')
  const [panelists, setPanelists] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const panelTabs = [
    { id: 'panelists', label: 'Panelists', icon: Users, href: '/admin/panel' },
    { id: 'profiling', label: 'Profiling Surveys', icon: FileText, href: '/admin/panel/profiling' },
    { id: 'reports', label: 'Reports', icon: BarChart3, href: '/admin/panel/reports' },
  ]

  useEffect(() => {
    // Set active tab based on current path
    if (pathname.includes('/profiling')) {
      setActiveTab('profiling')
    } else if (pathname.includes('/reports')) {
      setActiveTab('reports')
    } else {
      setActiveTab('panelists')
    }
  }, [pathname])

  useEffect(() => {
    fetchPanelists()
  }, [])

  const fetchPanelists = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('panelists')
        .select(`
          *,
          country:country_id(name),
          panelist_profiles(
            profiling_survey_id,
            completed_at,
            profiling_surveys(name)
          ),
          panelist_rewards(
            amount,
            status
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPanelists(data || [])
    } catch (error) {
      console.error('Error fetching panelists:', error)
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

  const calculateTotalEarnings = (rewards) => {
    if (!rewards) return 0
    return rewards
      .filter(r => r.status === 'approved' || r.status === 'paid')
      .reduce((sum, r) => sum + parseFloat(r.amount || 0), 0)
  }

  const renderPanelistsTab = () => (
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
        </div>
      </div>

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
                ${panelists.reduce((sum, p) => sum + calculateTotalEarnings(p.panelist_rewards), 0).toFixed(2)}
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
                    Profile Status
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
                      {panelist.country?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {panelist.panelist_profiles?.length || 0} surveys completed
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${Math.min((panelist.panelist_profiles?.length || 0) / 5 * 100, 100)}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      ${calculateTotalEarnings(panelist.panelist_rewards).toFixed(2)}
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
  )

  return (
    <div className="p-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {panelTabs.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'panelists' && renderPanelistsTab()}
      {activeTab === 'profiling' && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Profiling Surveys</h3>
          <p className="text-gray-600">Manage profiling survey templates and configurations.</p>
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Coming Soon
          </button>
        </div>
      )}
      {activeTab === 'reports' && (
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Panel Reports</h3>
          <p className="text-gray-600">View analytics and reports for panel performance.</p>
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Coming Soon
          </button>
        </div>
      )}
    </div>
  )
}
