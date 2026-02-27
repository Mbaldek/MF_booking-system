import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabase';

export function useMealSlots(eventId) {
  return useQuery({
    queryKey: ['meal_slots', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meal_slots')
        .select('*')
        .eq('event_id', eventId)
        .eq('is_active', true)
        .order('slot_date', { ascending: true })
        .order('slot_type', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });
}
