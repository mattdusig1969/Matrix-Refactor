'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Phone, ArrowRight, DollarSign, Trophy, Users, Zap } from 'lucide-react'

export default function HomePage() {
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loginType, setLoginType] = useState<'mobile' | 'email'>('mobile')

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
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
              <button
                onClick={toggleMode}
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                {isLoginMode ? 'Need an account?' : 'Already have an account?'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side - Hero Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900">
                Your Opinion
                <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Has Value
                </span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Complete surveys, share your thoughts, and earn real rewards. 
                Join thousands of people making money from their opinions.
              </p>
            </div>

            {/* Features */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Instant $5 Bonus</h3>
                  <p className="text-sm text-gray-600">Complete your profile</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Quality Surveys</h3>
                  <p className="text-sm text-gray-600">Matched to your profile</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Trusted Platform</h3>
                  <p className="text-sm text-gray-600">1M+ active users</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Zap className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Fast Payouts</h3>
                  <p className="text-sm text-gray-600">Multiple reward options</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">$2.5M+</div>
                <div className="text-sm text-gray-600">Paid to users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">500K+</div>
                <div className="text-sm text-gray-600">Surveys completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">4.8★</div>
                <div className="text-sm text-gray-600">User rating</div>
              </div>
            </div>
          </div>

          {/* Right Side - Auth Form */}
          <div className="lg:pl-12">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">
                  {isLoginMode ? 'Welcome Back' : 'Get Started Today'}
                </h2>
                <p className="text-gray-600 mt-2">
                  {isLoginMode 
                    ? 'Sign in to continue earning rewards' 
                    : 'Create your account and earn $5 instantly'
                  }
                </p>
              </div>

              <form className="space-y-6">
                {!isLoginMode && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                )}

                {/* Login Type Toggle for Registration */}
                {!isLoginMode && (
                  <div className="flex space-x-2 bg-gray-100 rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => setLoginType('mobile')}
                      className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        loginType === 'mobile'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Phone className="h-4 w-4" />
                      <span>Mobile</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoginType('email')}
                      className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        loginType === 'email'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Mail className="h-4 w-4" />
                      <span>Email</span>
                    </button>
                  </div>
                )}

                {/* Email/Mobile Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {(isLoginMode || loginType === 'email') ? 'Email' : 'Mobile Number'}
                  </label>
                  <input
                    type={loginType === 'email' ? 'email' : 'tel'}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={loginType === 'email' ? 'your@email.com' : '+1 (555) 123-4567'}
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Country and Language for Registration */}
                {!isLoginMode && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Country
                      </label>
                      <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option>United States</option>
                        <option>Canada</option>
                        <option>United Kingdom</option>
                        <option>Australia</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Language
                      </label>
                      <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option>English</option>
                        <option>Spanish</option>
                        <option>French</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <span>{isLoginMode ? 'Sign In' : 'Create Account & Earn $5'}</span>
                  <ArrowRight className="h-5 w-5" />
                </button>

                {/* Terms for Registration */}
                {!isLoginMode && (
                  <p className="text-xs text-gray-500 text-center">
                    By creating an account, you agree to our{' '}
                    <Link href="/terms" className="text-blue-600 hover:underline">
                      Terms of Service
                    </Link>
                    {' '}and{' '}
                    <Link href="/privacy" className="text-blue-600 hover:underline">
                      Privacy Policy
                    </Link>
                  </p>
                )}

                {/* Forgot Password for Login */}
                {isLoginMode && (
                  <div className="text-center">
                    <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                      Forgot your password?
                    </Link>
                  </div>
                )}
              </form>

              {/* Toggle between Login/Register */}
              <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                <button
                  onClick={toggleMode}
                  className="text-blue-600 hover:underline font-medium"
                >
                  {isLoginMode 
                    ? "Don't have an account? Sign up free" 
                    : 'Already have an account? Sign in'
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
