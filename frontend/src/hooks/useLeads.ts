import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Lead, LeadStatus } from '@/types';

export function useLeads(statusFilter?: LeadStatus) {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    let query = supabase
      .from('leads')
      .select('*')
      .eq('user_id', user.id)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (statusFilter) query = query.eq('status', statusFilter);

    const { data, error: err } = await query;
    if (err) setError(err.message);
    else setLeads(data ?? []);
    setLoading(false);
  }, [user, statusFilter]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('leads-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads', filter: `user_id=eq.${user.id}` },
        () => fetchLeads()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchLeads]);

  return { leads, loading, error, refetch: fetchLeads };
}

export function useLeadsByStatus() {
  const { leads, loading, error, refetch } = useLeads();

  const grouped = {
    new: leads.filter((l) => l.status === 'new'),
    contacted: leads.filter((l) => l.status === 'contacted'),
    interested: leads.filter((l) => l.status === 'interested'),
    client: leads.filter((l) => l.status === 'client'),
    delivered: leads.filter((l) => l.status === 'delivered'),
    lost: leads.filter((l) => l.status === 'lost'),
  };

  return { grouped, all: leads, loading, error, refetch };
}
