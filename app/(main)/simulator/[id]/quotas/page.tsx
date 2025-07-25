"use client";

import React from "react";
import SimulatorTabs from "../../SimulatorTabs";
import { useParams } from "next/navigation";

export default function QuotasPage() {
  const params = useParams();
  const surveyId = params?.id;

  return (
    <div className="p-6 space-y-6">
      <SimulatorTabs id={surveyId} />
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500 text-lg">
        Coming soon.
      </div>
    </div>
  );
}