"use client";
import { useState, useEffect } from 'react';
import MatrixTabs from '../../MatrixTabs';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function MatrixAdCodePage({ params }) {
  // const [surveys, setSurveys] = useState([]);
  // const [selectedSurvey, setSelectedSurvey] = useState('');
  const [targetingSummary, setTargetingSummary] = useState(null);
  const [countryName, setCountryName] = useState('United States');
  const [designs, setDesigns] = useState([]);
  const [selectedDesign, setSelectedDesign] = useState('');
  const [adCode, setAdCode] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [selectedHeadline, setSelectedHeadline] = useState('');

  const headlines = [
    "Make Money in 30 Seconds",
    "Get Paid for Your Opinion",
    "Short Poll. Real Cash.",
    "Earn While You Scroll",
    "Cash In on Your Clicks",
    "Quick Poll = Quick Cash",
    "Cha-Ching! What’s Your Pick?",
    "Your Opinion’s Worth 💰",
    "Poll Your Way to a Payday"
  ];

  // Load designs and targeting summary for current survey
  useEffect(() => {
    async function fetchData() {
      const { data: designData } = await supabase
        .from('surveydesigns')
        .select('id, name, css, description');
      setDesigns(designData || []);
      // Fetch targeting and country_id for current survey
      const { data: surveyData } = await supabase
        .from('surveys')
        .select('targeting, country_id')
        .eq('id', params.id)
        .single();
      let summary = null;
      let countryName = 'United States';
      if (surveyData) {
        // Fetch country name
        if (surveyData.country_id) {
          const { data: countryData } = await supabase
            .from('country')
            .select('country_name')
            .eq('id', surveyData.country_id)
            .single();
          if (countryData && countryData.country_name) {
            countryName = countryData.country_name;
          }
        }
        // Use targeting for selected country
        if (surveyData.targeting && typeof surveyData.targeting === 'object') {
          summary = surveyData.targeting[surveyData.country_id] || {};
        }
      }
      setCountryName(countryName);
      setTargetingSummary(summary);
    }
    fetchData();
  }, [params.id]);

  // Removed: targeting summary useEffect for dropdown

  // Generate ad code
  const handleGenerateAdCode = () => {
    if (!selectedDesign || !selectedHeadline) return;
    const encodedHeadline = encodeURIComponent(selectedHeadline);
    const code = `<iframe src="${window.location.origin}/survey-preview/${params.id}?design_id=${selectedDesign}&headline=${encodedHeadline}" width="400" height="600" style="border:none"></iframe>`;
    setAdCode(code);
    setShowPreview(true);
  };

  // Preview Survey button handler
  const handlePreviewSurvey = () => {
    if (!selectedDesign || !selectedHeadline) return;
    const encodedHeadline = encodeURIComponent(selectedHeadline);
    const previewUrl = `/survey-preview/${params.id}?design_id=${selectedDesign}&headline=${encodedHeadline}`;
    window.open(previewUrl, 'surveyPreview', 'width=800,height=600,scrollbars=yes,resizable=yes');
  };

  return (
    <div className="p-8">
      <MatrixTabs id={params.id} />
      <h2 className="text-2xl font-bold mb-6">Generate Ad Code</h2>
      {targetingSummary && (
        <div className="mb-4 p-4 bg-gray-50 rounded border max-w-xs">
          <h3 className="text-xl font-bold mb-2">Matrix Targeting Summary</h3>
          <div className="text-blue-600 font-semibold mb-2">{countryName}</div>
          {Object.entries(targetingSummary).map(([subcategory, values]) => (
            Array.isArray(values) && values.length > 0 ? (
              <div key={subcategory} className="mb-4">
                <div className="font-semibold">{subcategory}</div>
                <ul className="ml-4 list-disc">
                  {values.map(val => <li key={subcategory + '-' + val}>{val}</li>)}
                </ul>
              </div>
            ) : null
          ))}
        </div>
      )}
      <div className="mb-4">
        <label className="font-semibold mr-2">Select Design:</label>
        <select value={selectedDesign} onChange={e => setSelectedDesign(e.target.value)} className="border rounded px-2 py-1">
          <option value="">Select...</option>
          {designs.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        {selectedDesign && (
          <div className="mt-2 text-xs text-gray-500">{designs.find(d => d.id === selectedDesign)?.description}</div>
        )}
      </div>
      <div className="mb-4">
        <label className="font-semibold mr-2">Select Headline:</label>
        <select value={selectedHeadline} onChange={e => setSelectedHeadline(e.target.value)} className="border rounded px-2 py-1">
          <option value="">Select...</option>
          {headlines.map(h => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
      </div>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded font-bold mb-4"
        onClick={handleGenerateAdCode}
        disabled={!selectedDesign || !selectedHeadline}
      >
        Generate Ad Code
      </button>
      {adCode && (
        <div className="mb-4">
          <label className="font-semibold">Ad Code Snippet:</label>
          <textarea className="w-full border rounded p-2 text-xs" rows={3} value={adCode} readOnly />
        </div>
      )}
      {showPreview && (
        <div className="mb-4 flex gap-4 items-start">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded font-bold"
            onClick={handlePreviewSurvey}
            style={{ minWidth: 180 }}
          >
            Preview Survey
          </button>
        </div>
      )}
    </div>
  );
}
