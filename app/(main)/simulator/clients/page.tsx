'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Toaster, toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const tabs = [
  { name: 'Clients', path: 'clients' }
];

export default function ClientsPage() {
  const [clients, setClients] = useState<
    { id: string; first_name: string; last_name: string; email: string; company: { company_name: string } | null }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name, email, company:company_id(company_name)');
      if (error) {
        toast.error('Failed to fetch clients: ' + error.message);
      } else if (data) {
        setClients(data);
      }
      setLoading(false);
    };
    fetchClients();
  }, []);

  return (
    <div className="p-4">
      <Toaster />
      <nav className="mb-6 border-b border-gray-200">
        <ul className="flex gap-6 text-sm font-medium text-gray-600">
          {tabs.map(tab => (
            <li key={tab.path}>
              <Link
                href={`/simulator/${tab.path}`}
                className={cn(
                  'pb-2 transition-colors hover:text-black',
                  tab.path === 'clients' && 'text-black border-b-2 border-black'
                )}
              >
                {tab.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Clients Directory</h2>
        <Link href="/simulator/clients/addclient">
          <Button>Add Client</Button>
        </Link>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">First Name</th>
              <th className="p-2 text-left">Last Name</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Company</th>
              <th className="p-2 text-left">Edit</th>
            </tr>
          </thead>
          <tbody>
            {clients.map(client => (
              <tr key={client.id} className="border-t">
                <td className="p-2">{client.first_name}</td>
                <td className="p-2">{client.last_name}</td>
                <td className="p-2">{client.email}</td>
                <td className="p-2">{client.company?.company_name || ''}</td>
                <td className="p-2">
                  <Link href={`/simulator/clients/edit/${client.id}`}>
                    <Button variant="outline" size="sm">Edit</Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}