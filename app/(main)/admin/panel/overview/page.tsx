'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  BarChart3, 
  Shield, 
  Calendar, 
  DollarSign,
  FileText,
} from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import PanelTabs from '../PanelTabs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function OverviewPage() {
  const [panelists, setPanelists] = useState([])
  const [loading, setLoading] = useState(true)

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

      if (error) throw error
      console.log('Overview - Raw panelists data:', data)
      console.log('Overview - Sample panelist earnings:', data?.[0]?.panelist_earnings)
      setPanelists(data || [])
    } catch (error) {
      console.error('Error fetching panelists:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateTotalEarnings = (earnings) => {
    if (!earnings || !Array.isArray(earnings)) return 0
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
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Panel Overview</h2>
          <p className="text-gray-600">Complete overview of your panelist community and activity</p>
        </div>

        {/* Key Metrics */}
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
                <p className="text-sm font-medium text-gray-600">Active Panelists</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {panelists.filter(p => p.is_verified && p.last_login).length}
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
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${panelists.reduce((sum, p) => sum + calculateTotalEarnings(p.panelist_earnings), 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Signups */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Signups</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {panelists.slice(0, 5).map((panelist) => (
                  <div key={panelist.id} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {panelist.first_name?.[0]}{panelist.last_name?.[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {panelist.first_name} {panelist.last_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(panelist.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        panelist.is_verified 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {panelist.is_verified ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <a 
                  href="/admin/panel/panelists"
                  className="w-full flex items-center justify-between p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-blue-600" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Manage Panelists</p>
                      <p className="text-sm text-gray-600">View and manage all registered panelists</p>
                    </div>
                  </div>
                  <div className="text-blue-600">→</div>
                </a>

                <a 
                  href="/admin/panel/profiles"
                  className="w-full flex items-center justify-between p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-purple-600" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Profile Management</p>
                      <p className="text-sm text-gray-600">Manage profiling surveys and completion</p>
                    </div>
                  </div>
                  <div className="text-purple-600">→</div>
                </a>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <BarChart3 className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">Panel Health Score</p>
                      <p className="text-sm text-gray-600">
                        {Math.round((panelists.filter(p => p.is_verified).length / Math.max(panelists.length, 1)) * 100)}% 
                        verified panelists
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
