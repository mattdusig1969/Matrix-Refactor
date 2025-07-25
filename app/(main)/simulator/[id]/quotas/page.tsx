"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import SimulatorTabs from "../../SimulatorTabs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function QuotasPage() {
  const { id: surveyId } = useParams();
  const [surveyType, setSurveyType] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!surveyId) return;

    const fetchSurvey = async () => {
      const { data, error } = await supabase
        .from("surveys")
        .select("survey_mode")
        .eq("id", surveyId)
        .single();

      if (data) {
        setSurveyType(data.survey_mode);
      }
      setLoading(false);
    };

    fetchSurvey();
  }, [surveyId]);

  if (loading) {
    return <div className="p-6 text-center">Loading survey data...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <SimulatorTabs id={surveyId} surveyType={surveyType} active="quotas" />
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500 text-lg">
        Coming soon.
      </div>
    </div>
  );
}