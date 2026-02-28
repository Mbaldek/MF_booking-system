import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

export function useSlotMenuCounts(eventId) {
  return useQuery({
    queryKey: ['slot_menu_counts', eventId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_slot_menu_counts', {
        p_event_id: eventId,
      });
      if (error) throw error;
      // Convert array to map: { slotId: count }
      const counts = {};
      for (const row of data || []) {
        counts[row.meal_slot_id] = Number(row.menu_count);
      }
      return counts;
    },
    enabled: !!eventId,
  });
}

export function useUpdateSlotCapacity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, maxOrders }) => {
      const value = maxOrders === '' || maxOrders === null ? null : parseInt(maxOrders, 10);
      const { error } = await supabase
        .from('meal_slots')
        .update({ max_orders: value })
        .eq('event_id', eventId);
      if (error) throw error;
    },
    onSuccess: (_, { eventId }) => {
      qc.invalidateQueries({ queryKey: ['meal_slots', eventId] });
    },
  });
}
