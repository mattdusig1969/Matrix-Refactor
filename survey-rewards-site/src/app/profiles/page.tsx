'use client';

import { useState, useEffect } from 'react';
import AttributeProfiles from '@/components/AttributeProfiles';
import { toast } from 'react-hot-toast';

// This would typically come from your auth context or session
interface PanelistData {
  id: string;
  country_id: string;
  first_name: string;
  last_name: string;
}

export default function ProfilesPage() {
  const [panelist, setPanelist] = useState<PanelistData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This is a placeholder - replace with your actual panelist fetching logic
    fetchPanelistData();
  }, []);

  const fetchPanelistData = async () => {
    try {
      // TODO: Replace this with actual panelist authentication/session logic
      // For now, we'll simulate a logged-in US panelist with real country ID
      const mockPanelist: PanelistData = {
        id: 'a1b2c3d4-e5f6-7890-abcd-123456789012', // Replace with real panelist UUID
        country_id: 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', // US country ID from your data
        first_name: 'John',
        last_name: 'Doe'
      };
      
      setPanelist(mockPanelist);
    } catch (error) {
      console.error('Error fetching panelist data:', error);
      toast.error('Failed to load panelist data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!panelist) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600">Please log in to access your profiles.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {panelist.first_name}!
          </h1>
          <p className="text-gray-600 mt-2">
            Complete your profiles to earn rewards and get better survey matches.
          </p>
        </div>

        {/* Attribute Profiles Component */}
        <AttributeProfiles 
          panelistId={panelist.id}
          countryId={panelist.country_id}
        />
      </div>
    </div>
  );
}
