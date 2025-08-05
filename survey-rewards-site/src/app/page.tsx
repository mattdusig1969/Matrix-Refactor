'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Mail, Phone, ArrowRight, DollarSign, Trophy, Users, Zap } from 'lucide-react'
import { supabase } from '../../lib/supabase-client'
import bcrypt from 'bcryptjs'

export default function HomePage() {
  const router = useRouter()
  const formRef = useRef<HTMLDivElement>(null)
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loginType, setLoginType] = useState<'mobile' | 'email'>('mobile')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    password: '',
    country: 'United States',
    language: 'English'
  })

  // Country-specific configurations
  const countryConfigs = {
    'United States': {
      code: 'US',
      flag: '🇺🇸',
      dialCode: '+1',
      mobilePattern: /^\+1\s?\(?[0-9]{3}\)?\s?[0-9]{3}-?[0-9]{4}$/,
      mobileExample: '+1 (555) 123-4567',
      emailDomains: ['.com', '.org', '.net', '.edu', '.gov']
    },
    'Canada': {
      code: 'CA',
      flag: '🇨🇦',
      dialCode: '+1',
      mobilePattern: /^\+1\s?\(?[0-9]{3}\)?\s?[0-9]{3}-?[0-9]{4}$/,
      mobileExample: '+1 (416) 123-4567',
      emailDomains: ['.ca', '.com', '.org', '.net']
    },
    'United Kingdom': {
      code: 'GB',
      flag: '🇬🇧',
      dialCode: '+44',
      mobilePattern: /^\+44\s?[0-9]{4}\s?[0-9]{6}$/,
      mobileExample: '+44 7123 456789',
      emailDomains: ['.uk', '.co.uk', '.com', '.org']
    },
    'Australia': {
      code: 'AU',
      flag: '🇦🇺',
      dialCode: '+61',
      mobilePattern: /^\+61\s?[0-9]{3}\s?[0-9]{3}\s?[0-9]{3}$/,
      mobileExample: '+61 412 345 678',
      emailDomains: ['.au', '.com.au', '.com', '.org']
    }
  }

  const currentCountryConfig = countryConfigs[formData.country as keyof typeof countryConfigs]

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Auto-format mobile number when country changes
  const handleCountryChange = (country: string) => {
    const newConfig = countryConfigs[country as keyof typeof countryConfigs]
    const currentMobile = formData.mobile
    
    // Extract just the number part without any country code
    const cleanNumber = currentMobile.replace(/^\+\d+\s?/, '').trim()
    
    // Always format with the new country code
    const newMobile = cleanNumber ? newConfig.dialCode + ' ' + cleanNumber : newConfig.dialCode + ' '
    
    setFormData(prev => ({
      ...prev,
      country,
      mobile: newMobile
    }))
  }

  // Validate mobile format
  const validateMobile = (mobile: string) => {
    if (!mobile) return false
    return currentCountryConfig.mobilePattern.test(mobile)
  }

  // Validate email format
  const validateEmail = (email: string) => {
    if (!email) return false
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailPattern.test(email)
  }

  const getCountryId = (countryName: string) => {
    const countryMap: { [key: string]: string } = {
      'United States': 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc',
      'Canada': 'b3c6831c-0eb8-5135-bb48-40afbf75aedf',
      'United Kingdom': 'c4d7942d-1fc9-6246-cc59-51b0c086bfef',
      'Australia': 'd5e8053e-20da-7357-dd6a-62c1d197c0f0'
    }
    return countryMap[countryName] || countryMap['United States']
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted, isLoginMode:', isLoginMode)
    console.log('Form data:', formData)
    setLoading(true)
    setError('')

    try {
      if (isLoginMode) {
        console.log('Attempting login...')
        console.log('Environment:', process.env.NODE_ENV)
        console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
        
        // Login logic - Try Supabase auth first
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        })

        if (error) {
          console.error('Supabase auth login error:', error)
          console.error('Error details:', {
            message: error.message,
            status: error.status,
            name: error.name
          })
          
          // Fallback: Try authenticating against panelists table
          console.log('Trying fallback authentication against panelists table...')
          const { data: panelistData, error: panelistError } = await supabase
            .from('panelists')
            .select('id, email, password_hash, first_name, last_name')
            .eq('email', formData.email)
            .single()

          if (panelistError || !panelistData) {
            console.error('Panelist lookup error:', panelistError)
            console.error('Panelist lookup details:', {
              error: panelistError?.message,
              code: panelistError?.code,
              details: panelistError?.details
            })
            setError('Invalid login credentials. Please check your email and password.')
            return
          }

          // Check password against stored hash
          const passwordMatch = await bcrypt.compare(formData.password, panelistData.password_hash || '')
          
          if (!passwordMatch) {
            console.error('Password does not match')
            setError('Invalid login credentials. Please check your email and password.')
            return
          }

          console.log('Fallback authentication successful')
          // Store user info in localStorage for dashboard to use
          localStorage.setItem('fallback_auth_user', JSON.stringify({
            id: panelistData.id,
            email: panelistData.email,
            first_name: panelistData.first_name,
            last_name: panelistData.last_name,
            auth_method: 'panelists_table'
          }))
          
          console.log('Redirecting to dashboard with fallback auth')
          router.push('/dashboard')
          return
        }

        console.log('Supabase auth login successful, redirecting to dashboard')
        // Redirect to dashboard on successful login
        router.push('/dashboard')
      } else {
        console.log('Attempting registration...')
        
        // Validation for registration
        if (!formData.firstName.trim()) {
          setError('First name is required')
          return
        }
        if (!formData.lastName.trim()) {
          setError('Last name is required')
          return
        }
        if (!formData.email.trim()) {
          setError('Email address is required')
          return
        }
        if (!validateEmail(formData.email)) {
          setError('Please enter a valid email address')
          return
        }
        if (!formData.mobile.trim()) {
          setError('Mobile number is required')
          return
        }
        if (!validateMobile(formData.mobile)) {
          setError(`Please enter a valid mobile number for ${formData.country} (e.g., ${currentCountryConfig.mobileExample})`)
          return
        }
        if (!formData.password.trim()) {
          setError('Password is required')
          return
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters long')
          return
        }

        // Registration logic - disable email confirmation
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: undefined, // Disable email confirmation
            data: {
              first_name: formData.firstName,
              last_name: formData.lastName,
              mobile: formData.mobile,
              country: formData.country,
              language: formData.language
            }
          }
        })

        if (error) {
          console.error('Registration error:', error)
          setError(error.message)
          return
        }

        console.log('Registration successful, user data:', data.user)

        if (data.user) {
          console.log('Creating panelist record...')
          // Hash the password before storing
          const saltRounds = 12
          const hashedPassword = await bcrypt.hash(formData.password, saltRounds)
          
          // Check if panelist record already exists
          const { data: existingPanelist } = await supabase
            .from('panelists')
            .select('id')
            .eq('id', data.user.id)
            .single()

          if (existingPanelist) {
            console.log('Panelist record already exists, updating...')
            // Update existing record
            const { error: panelistError } = await supabase
              .from('panelists')
              .update({
                email: formData.email,
                first_name: formData.firstName,
                last_name: formData.lastName,
                mobile: formData.mobile,
                password_hash: hashedPassword,
                country_id: getCountryId(formData.country),
                language: formData.language,
                is_verified: true
              })
              .eq('id', data.user.id)

            if (panelistError) {
              console.error('Error updating panelist record:', panelistError)
              setError('Account created but profile setup failed. Please contact support.')
              return
            }
          } else {
            console.log('Creating new panelist record...')
            // Create new panelist record
            const { error: panelistError } = await supabase
              .from('panelists')
              .insert({
                id: data.user.id,
                email: formData.email,
                first_name: formData.firstName,
                last_name: formData.lastName,
                mobile: formData.mobile,
                password_hash: hashedPassword,
                country_id: getCountryId(formData.country),
                language: formData.language,
                is_verified: true
              })

            if (panelistError) {
              console.error('Error creating panelist record:', panelistError)
              setError('Account created but profile setup failed. Please contact support.')
              return
            }
          }

          console.log('Panelist record created/updated successfully')

          console.log('Checking for existing signup bonus...')
          // Check if signup bonus already exists
          const { data: existingBonus } = await supabase
            .from('panelist_earnings')
            .select('id')
            .eq('panelist_id', data.user.id)
            .eq('source', 'signup_bonus')
            .single()

          if (!existingBonus) {
            console.log('Creating signup bonus...')
            // Create initial earnings record for signup bonus
            const { error: earningsError } = await supabase
              .from('panelist_earnings')
              .insert({
                panelist_id: data.user.id,
                transaction_type: 'earning',
                amount: 5.00,
                description: 'Welcome bonus for joining Earnly',
                source: 'signup_bonus',
                status: 'completed'
              })

            if (earningsError) {
              console.error('Error creating signup bonus record:', earningsError)
              // Don't fail registration for bonus error, just log it
            } else {
              console.log('Signup bonus created successfully')
            }
          } else {
            console.log('Signup bonus already exists, skipping creation')
          }

          console.log('Registration complete, redirecting to dashboard')
          // Clear any errors and redirect directly to dashboard
          setError('')
          
          // Store the user session info in localStorage for immediate access
          localStorage.setItem('registration_user', JSON.stringify({
            id: data.user.id,
            email: formData.email,
            first_name: formData.firstName,
            last_name: formData.lastName,
            auth_method: 'supabase_auth',
            just_registered: true
          }))
          
          setLoading(false)
          console.log('About to navigate to dashboard...')
          
          // Small delay to ensure session is properly established
          setTimeout(() => {
            router.push('/dashboard')
          }, 100)
        } else {
          console.error('No user data received from Supabase signup')
          setError('Registration failed. Please try again.')
        }
      }
    } catch (error) {
      console.error('Authentication error:', error)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode)
    
    // Scroll to form on mobile/tablet devices
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        })
      }
    }, 100) // Small delay to allow state to update first
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
            <div ref={formRef} className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">
                  {isLoginMode ? 'Welcome Back' : 'Get Started Today'}
                </h2>
                <p className="text-gray-600 mt-2">
                  {isLoginMode 
                    ? 'Sign in to continue earning rewards' 
                    : 'Create your account with both email and mobile number'
                  }
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {!isLoginMode && (
                  <>
                    {/* Name Fields */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="John"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Doe"
                          required
                        />
                      </div>
                    </div>

                    {/* Country and Language */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Country
                        </label>
                        <select 
                          value={formData.country}
                          onChange={(e) => handleCountryChange(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="United States">🇺🇸 United States</option>
                          <option value="Canada">🇨🇦 Canada</option>
                          <option value="United Kingdom">🇬🇧 United Kingdom</option>
                          <option value="Australia">🇦🇺 Australia</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Language
                        </label>
                        <select 
                          value={formData.language}
                          onChange={(e) => handleInputChange('language', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="English">English</option>
                          <option value="Spanish">Spanish</option>
                          <option value="French">French</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {/* Email and Mobile Fields for Registration (Both Required) */}
                {!isLoginMode ? (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-700 flex items-center">
                        <Mail className="h-4 w-4 mr-1" />
                        <Phone className="h-4 w-4 mr-2" />
                        Both email and mobile are required for account verification and survey notifications
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Mail className="h-4 w-4 inline mr-1" />
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          formData.email && !validateEmail(formData.email) 
                            ? 'border-red-300 bg-red-50' 
                            : 'border-gray-300'
                        }`}
                        placeholder="your@email.com"
                        required
                      />
                      {formData.email && !validateEmail(formData.email) && (
                        <p className="text-xs text-red-600 mt-1">Please enter a valid email address</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Phone className="h-4 w-4 inline mr-1" />
                        Mobile Number *
                      </label>
                      <div className="flex items-center space-x-2">
                        {/* Fixed Country Code Display */}
                        <div className="flex items-center bg-gray-50 border border-gray-300 rounded-lg px-3 py-3 min-w-[100px]">
                          <span className="text-sm font-medium text-gray-700">
                            {currentCountryConfig.flag} {currentCountryConfig.dialCode}
                          </span>
                        </div>
                        {/* Mobile Number Input */}
                        <div className="flex-1">
                          <input
                            type="tel"
                            value={formData.mobile.replace(currentCountryConfig.dialCode, '').trim()}
                            onChange={(e) => {
                              // Keep only the user's input (don't strip out their numbers!)
                              const userInput = e.target.value
                              // Format with country code
                              const fullNumber = userInput ? currentCountryConfig.dialCode + ' ' + userInput : currentCountryConfig.dialCode + ' '
                              handleInputChange('mobile', fullNumber)
                            }}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              formData.mobile && !validateMobile(formData.mobile) 
                                ? 'border-red-300 bg-red-50' 
                                : 'border-gray-300'
                            }`}
                            placeholder={currentCountryConfig.mobileExample.replace(currentCountryConfig.dialCode, '').trim()}
                            required
                          />
                        </div>
                      </div>
                      {formData.mobile && !validateMobile(formData.mobile) && (
                        <p className="text-xs text-red-600 mt-1">
                          Please use format: {currentCountryConfig.mobileExample}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Email Input for Login (Single Field) */
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                )}

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                      placeholder="Enter your password"
                      required
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

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <span>{isLoginMode ? 'Sign In' : 'Create Account & Earn $5'}</span>
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
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
