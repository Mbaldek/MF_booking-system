import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabase';

export function useEmailLogs({ page = 1, pageSize = 20, notificationKey, status } = {}) {
  return useQuery({
    queryKey: ['email_logs', page, notificationKey, status],
    queryFn: async () => {
      let query = supabase
        .from('email_logs')
        .select('*', { count: 'exact' });

      if (notificationKey) query = query.eq('notification_key', notificationKey);
      if (status) query = query.eq('status', status);

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { logs: data, total: count };
    },
  });
}
