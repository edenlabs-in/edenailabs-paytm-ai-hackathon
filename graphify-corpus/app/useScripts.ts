import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Script } from '@/types';

export function useScripts(type?: 'call' | 'sms' | 'whatsapp') {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      let query = supabase.from('scripts').select('*').eq('is_active', true);
      if (type) query = query.eq('type', type);
      const { data } = await query.order('title');
      setScripts(data ?? []);
      setLoading(false);
    }
    fetch();
  }, [type]);

  return { scripts, loading };
}
