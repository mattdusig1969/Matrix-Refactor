'use client'

import { useState } from 'react'
import { 
  LayoutDashboard, 
  Gift, 
  User, 
  Settings, 
  LogOut, 
  Bell,
  Search,
  DollarSign,
  Clock,
  Target,
  TrendingUp,
  Star,
  Plus
} from 'lucide-react'

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('dashboard')

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'rewards', label: 'Rewards', icon: Gift },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  const availableSurveys = [
    {
      id: 1,
      title: 'Brand Awareness Study',
      description: 'Share your thoughts about popular consumer brands',
      reward: 8.50,
      duration: 12,
      category: 'Marketing',
      urgency: 'high'
    },
    {
      id: 2,
      title: 'Shopping Habits Survey',
      description: 'Tell us about your online and in-store shopping preferences',
      reward: 6.25,
      duration: 8,
      category: 'Retail',
      urgency: 'medium'
    },
    {
      id: 3,
      title: 'Technology Usage Study',
      description: 'How do you use technology in your daily life?',
      reward: 12.00,
      duration: 15,
      category: 'Technology',
      urgency: 'low'
    }
  ]

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Earnings</p>
              <p className="text-2xl font-semibold text-gray-900">$127.50</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Surveys Completed</p>
              <p className="text-2xl font-semibold text-gray-900">23</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Time</p>
              <p className="text-2xl font-semibold text-gray-900">11 min</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-semibold text-gray-900">$42.25</p>
            </div>
          </div>
        </div>
      </div>

      {/* Available Surveys */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Available Surveys</h2>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search surveys..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {availableSurveys.map((survey) => (
              <div key={survey.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{survey.title}</h3>
                      {survey.urgency === 'high' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          High Priority
                        </span>
                      )}
                      {survey.urgency === 'medium' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Medium Priority
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-3">{survey.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {survey.duration} min
                      </span>
                      <span className="flex items-center">
                        <Target className="h-4 w-4 mr-1" />
                        {survey.category}
                      </span>
                    </div>
                  </div>
                  <div className="text-right ml-6">
                    <div className="text-2xl font-bold text-green-600 mb-2">
                      ${survey.reward.toFixed(2)}
                    </div>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                      Start Survey
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderRewards = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Reward Balance</h2>
        <div className="text-3xl font-bold text-green-600 mb-4">$127.50</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors">
            <div className="text-center">
              <DollarSign className="h-8 w-8 mx-auto text-green-600 mb-2" />
              <div className="font-medium">PayPal</div>
              <div className="text-sm text-gray-600">Instant transfer</div>
            </div>
          </button>
          <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors">
            <div className="text-center">
              <Gift className="h-8 w-8 mx-auto text-purple-600 mb-2" />
              <div className="font-medium">Gift Cards</div>
              <div className="text-sm text-gray-600">Amazon, iTunes, etc.</div>
            </div>
          </button>
          <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors">
            <div className="text-center">
              <Plus className="h-8 w-8 mx-auto text-blue-600 mb-2" />
              <div className="font-medium">Bank Transfer</div>
              <div className="text-sm text-gray-600">Direct deposit</div>
            </div>
          </button>
        </div>
      </div>

      {/* Earnings History */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Earnings</h3>
        <div className="space-y-3">
          {[
            { survey: 'Brand Awareness Study', amount: 8.50, date: '2 hours ago' },
            { survey: 'Technology Usage Survey', amount: 12.00, date: '1 day ago' },
            { survey: 'Shopping Habits Survey', amount: 6.25, date: '3 days ago' },
          ].map((earning, index) => (
            <div key={index} className="flex items-center justify-between py-2">
              <div>
                <div className="font-medium text-gray-900">{earning.survey}</div>
                <div className="text-sm text-gray-600">{earning.date}</div>
              </div>
              <div className="text-green-600 font-semibold">+${earning.amount.toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderProfile = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Completion</h2>
        <div className="mb-4">
          <div className="flex justify-between text-sm">
            <span>Profile Strength</span>
            <span>75%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
          </div>
        </div>
        <p className="text-gray-600 mb-4">
          Complete your profile to get matched with more high-paying surveys.
        </p>
      </div>

      {/* Profiling Surveys */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Complete Your Profile</h3>
        <div className="space-y-3">
          {[
            { name: 'Foundational Profile', status: 'completed', reward: 5.00 },
            { name: 'Behavioral Profile', status: 'pending', reward: 3.00 },
            { name: 'Lifestyle Profile', status: 'available', reward: 4.00 },
            { name: 'Tech Savviness Profile', status: 'available', reward: 2.50 },
          ].map((profile, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  profile.status === 'completed' ? 'bg-green-500' :
                  profile.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-300'
                }`}></div>
                <div>
                  <div className="font-medium">{profile.name}</div>
                  <div className="text-sm text-gray-600 capitalize">{profile.status}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-600 font-semibold">${profile.reward.toFixed(2)}</span>
                {profile.status === 'available' && (
                  <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                    Start
                  </button>
                )}
                {profile.status === 'completed' && (
                  <Star className="h-5 w-5 text-green-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Settings</h2>
        {/* Settings content */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Notifications</label>
            <input type="checkbox" className="rounded" defaultChecked />
            <span className="ml-2 text-sm text-gray-600">Receive survey invitations via email</span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">SMS Notifications</label>
            <input type="checkbox" className="rounded" />
            <span className="ml-2 text-sm text-gray-600">Receive survey invitations via SMS</span>
          </div>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard()
      case 'rewards':
        return renderRewards()
      case 'profile':
        return renderProfile()
      case 'settings':
        return renderSettings()
      default:
        return renderDashboard()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Earnly
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-400 hover:text-gray-600">
                <Bell className="h-6 w-6" />
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">John Doe</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-white rounded-lg shadow p-6 mr-8">
            <nav className="space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === item.id
                      ? 'bg-blue-100 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              ))}
              <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-gray-600 hover:bg-gray-100 mt-8">
                <LogOut className="h-5 w-5" />
                <span>Log Out</span>
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  )
}
