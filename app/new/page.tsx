"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function NewSurveyPage() {
  const [clientId, setClientId] = useState('');
  const [clients, setClients] = useState<{ id: string; first_name: string; last_name: string }[]>([]);

  useEffect(() => {
    const fetchClients = async () => {
      const { data } = await supabase
        .from('clients')
        .select('id, first_name, last_name')
        .order('first_name');
      if (data) setClients(data);
    };
    fetchClients();
  }, []);

  const handleSubmit = async () => {
    const payload = {
      client_id: clientId,
    };
    const { data, error } = await supabase
      .from('surveys')
      .insert(payload);
    // handle result (show toast, redirect, etc.)
  };

  return (
    <form onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
      <select
        value={clientId}
        onChange={e => setClientId(e.target.value)}
        className="w-full border rounded px-2 py-1"
      >
        <option value="">Select a client...</option>
        {clients.map(client => (
          <option key={client.id} value={client.id}>
            {client.first_name} {client.last_name}
          </option>
        ))}
      </select>
      <button type="submit" disabled={!clientId}>
        Save New Survey
      </button>
    </form>
  );
}