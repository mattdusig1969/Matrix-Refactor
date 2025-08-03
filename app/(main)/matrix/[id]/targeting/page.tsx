'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'react-hot-toast';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select';
import MatrixTabs from '../../MatrixTabs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function MatrixTargetingPage({ params }) {
  const [countries, setCountries] = useState<{ id: string; country_name: string }[]>([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [categories] = useState(['Demographics', 'Geographics', 'Psychographics']);
  const [activeCategory, setActiveCategory] = useState('Demographics');
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [activeSubcategory, setActiveSubcategory] = useState('');
  const [attributeValues, setAttributeValues] = useState<{ id: string; value: string }[]>([]);
  const [selectedValues, setSelectedValues] = useState<Record<string, string[]>>({});
  const [surveyData, setSurveyData] = useState(null);
  const [targetingMode, setTargetingMode] = useState('demographic');

  // --- CONSOLIDATED DATA FETCHING ---
  useEffect(() => {
    if (!params.id) return;

    const getInitialData = async () => {
      const loadingToast = toast.loading("Loading targeting data...");
      try {
        const [countriesRes, surveyRes] = await Promise.all([
          supabase.from('country').select('id, country_name').order('country_name'),
          supabase.from('surveys').select('country_id, targeting, survey_mode').eq('id', params.id).single()
        ]);

        if (countriesRes.error) throw new Error(`Countries: ${countriesRes.error.message}`);
        if (surveyRes.error && surveyRes.error.code !== 'PGRST116') throw new Error(`Survey: ${surveyRes.error.message}`);

        const countriesData = countriesRes.data || [];
        const surveyData = surveyRes.data;

        setCountries(countriesData);
        setSurveyData(surveyData);

        let countryId = '';
        if (surveyData && surveyData.country_id) {
          countryId = surveyData.country_id;
        } else {
          // Try to find United States in countries list
          const usCountry = countriesData.find(c => c.country_name.toLowerCase().includes('united states'));
          if (usCountry) {
            countryId = usCountry.id;
          } else if (countriesData.length > 0) {
            countryId = countriesData[0].id;
          }
        }
        setSelectedCountry(countryId);

        // If targeting is an object with per-country keys, use the selected country
        let targeting = (surveyData && surveyData.targeting) || {};
        if (typeof targeting === 'object' && targeting !== null) {
          if (countryId && targeting[countryId]) {
            setSelectedValues(targeting[countryId]);
          } else {
            setSelectedValues({});
          }
        } else {
          setSelectedValues({});
        }

        // No need to manually call loadSubcategories; useEffect will handle updates

        toast.dismiss(loadingToast);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error(error.message, { id: loadingToast });
      }
    };

    getInitialData();
  }, [params.id]);

  // --- LOAD SUBCATEGORIES ---
  useEffect(() => {
    if (!selectedCountry || !activeCategory) return;
    const tableMap = {
      Demographics: 'demoattributes',
      Geographics: 'geoattributes',
      Psychographics: 'psychoattributes'
    };
    const table = tableMap[activeCategory];
    if (!table) return;

    const fetchAttributes = async () => {
      const { data, error } = await supabase
        .from(table)
        .select('field_name, value, id')
        .eq('country_id', selectedCountry);

      if (error) {
        toast.error(`Could not load attributes for ${activeCategory}`);
        return;
      }
      const uniqueFields = Array.from(new Set(data.map(d => d.field_name)));
      setSubcategories(uniqueFields);
      const firstSubcategory = uniqueFields[0] || '';
      setActiveSubcategory(firstSubcategory);
      const valuesForFirstSubcategory = data.filter(d => d.field_name === firstSubcategory);
      setAttributeValues(valuesForFirstSubcategory);
    };
    fetchAttributes();
  }, [selectedCountry, activeCategory]);

  // --- LOAD ATTRIBUTE VALUES ---
  useEffect(() => {
    if (!activeSubcategory) {
      setAttributeValues([]);
      return;
    }
    const tableMap = {
      Demographics: 'demoattributes',
      Geographics: 'geoattributes',
      Psychographics: 'psychoattributes'
    };
    const table = tableMap[activeCategory];
    if (!table) return;

    supabase
      .from(table)
      .select('id, value')
      .eq('country_id', selectedCountry)
      .eq('field_name', activeSubcategory)
      .then(({ data }) => setAttributeValues(data || []));
  }, [activeSubcategory, selectedCountry, activeCategory]);

  // --- EVENT HANDLERS ---
  const handleCountryChange = async (countryId) => {
    if (countryId === selectedCountry) return;

    const changingToast = toast.loading("Changing country and resetting target...");
    try {
      // Update the database: set new country_id and clear the entire targeting object
      const { error } = await supabase
        .from('surveys')
        .update({ 
          country_id: countryId,
          targeting: {} // Reset targeting object
        })
        .eq('id', params.id);

      if (error) throw error;

      // Update local state on success
      setSelectedCountry(countryId);
      setSelectedValues({});
      setSurveyData(prev => ({ ...prev, country_id: countryId, targeting: {} }));
      setActiveCategory('Demographics');

      toast.success("Country changed and targeting has been reset.", { id: changingToast });
    } catch (err) {
      console.error('Country Change Error:', err);
      toast.error(`Failed to change country: ${err.message}`, { id: changingToast });
    }
  };

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    setActiveSubcategory('');
    setAttributeValues([]);
  };

  const handleSubcategoryChange = (subcategory) => {
    setActiveSubcategory(subcategory);
  };

  const handleCheck = (value) => {
    setSelectedValues(prev => {
      const currentValuesArr = Array.isArray(prev[activeSubcategory]) ? prev[activeSubcategory] : [];
      const currentValuesSet = new Set(currentValuesArr);
      if (currentValuesSet.has(value)) {
        currentValuesSet.delete(value);
      } else {
        currentValuesSet.add(value);
      }
      const newSubcategoryValues = Array.from(currentValuesSet);
      const newSelectedValues = { ...prev, [activeSubcategory]: newSubcategoryValues };
      if (newSelectedValues[activeSubcategory].length === 0) {
        delete newSelectedValues[activeSubcategory];
      }
      return newSelectedValues;
    });
  };

  const handleSave = async () => {
    const savingToast = toast.loading("Saving targeting selections...");
    try {
      // Get the current survey data to ensure we have the latest state
      const { data: currentSurvey, error: fetchError } = await supabase
        .from('surveys')
        .select('targeting, country_id')
        .eq('id', params.id)
        .single();

      if (fetchError) throw fetchError;

      // Merge new selections for the current country into the existing targeting object
      const newTargeting = {
        ...(currentSurvey?.targeting || {}),
        [selectedCountry]: selectedValues
      };

      // Update both targeting and country_id in the database
      const { error: updateError } = await supabase
        .from('surveys')
        .update({ 
          targeting: newTargeting,
          country_id: selectedCountry
        })
        .eq('id', params.id);

      if (updateError) throw updateError;

      // Update local state with both targeting and country_id
      setSurveyData(prev => ({
        ...prev,
        targeting: newTargeting,
        country_id: selectedCountry
      }));
      
      toast.success('Targeting and country saved successfully!', { id: savingToast });
    } catch (err) {
      console.error('Save Error:', err);
      toast.error(`Error saving targeting: ${err.message}`, { id: savingToast });
    }
  };

  // --- RENDER ---
  return (
    <div className="p-8">
      <MatrixTabs id={params.id} />

      <div className="flex items-center space-x-2 my-4">
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            targetingMode === 'demographic' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
          onClick={() => setTargetingMode('demographic')}
        >
          Demographic Targeting
        </button>
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            targetingMode === 'persona' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
          onClick={() => setTargetingMode('persona')}
        >
          Personas
        </button>
      </div>

      {targetingMode === 'demographic' && (
        <>
          <div className="mb-6 max-w-xs">
            <label className="form-label mb-1 block font-semibold">Select Country:</label>
            <Select value={selectedCountry} onValueChange={handleCountryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a country..." />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {countries.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.country_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded shadow p-4">
              {categories.map(cat => (
                <div key={cat} className={`cursor-pointer py-2 px-2 font-semibold border-b last:border-b-0 ${activeCategory === cat ? 'text-blue-600' : 'text-gray-700'}`} onClick={() => handleCategoryChange(cat)}>
                  {cat}
                </div>
              ))}
            </div>

            <div className="bg-white rounded shadow p-4">
              {subcategories.map(sub => (
                <div key={sub} className={`cursor-pointer py-2 px-2 border-b last:border-b-0 ${activeSubcategory === sub ? 'text-blue-600 font-bold' : 'text-gray-700'}`} onClick={() => handleSubcategoryChange(sub)}>
                  {sub}
                </div>
              ))}
            </div>

            <div className="bg-white rounded shadow p-4">
              {attributeValues.map(attr => (
                <div key={attr.id} className="flex items-center gap-2 mb-2">
                  <input type="checkbox" checked={selectedValues[activeSubcategory]?.includes(attr.value) || false} onChange={() => handleCheck(attr.value)} className="accent-blue-600"/>
                  <span>{attr.value}</span>
                </div>
              ))}
            </div>

            <div className="bg-white rounded shadow p-4">
              <h3 className="text-lg font-bold mb-2">Matrix Targeting Summary</h3>
              <div className="text-blue-600 font-semibold mb-2">
                {countries.find(c => c.id === selectedCountry)?.country_name}
              </div>
              {Object.entries(selectedValues).map(([subcategory, values]) =>
                Array.isArray(values) && values.length > 0 ? (
                  <div key={subcategory} className="mb-4">
                    <div className="font-semibold">{subcategory}</div>
                    <ul className="ml-4 list-disc">
                      {values.map(val => <li key={subcategory + '-' + val}>{val}</li>)}
                    </ul>
                  </div>
                ) : null
              )}
            </div>
          </div>

          <div className="mt-8">
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold shadow hover:bg-blue-700 transition" onClick={handleSave}>
              <span className="mr-2">✅</span>Save Matrix Targeting
            </button>
          </div>
        </>
      )}

      {targetingMode === 'persona' && (
        <div className="bg-white rounded shadow p-8 mt-4">
          <h2 className="text-xl font-bold mb-4">Persona Targeting</h2>
          <p>This feature is coming soon for Matrix projects.</p>
        </div>
      )}
    </div>
  );
}
