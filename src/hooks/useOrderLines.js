import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabase';

export function useOrderLines(eventId) {
  return useQuery({
    queryKey: ['order_lines', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_lines')
        .select(`
          *,
          meal_slot:meal_slots(id, slot_date, slot_type),
          menu_item:menu_items(id, name, type, price),
          order:orders!inner(id, event_id, customer_first_name, customer_last_name, customer_email, customer_phone, stand, order_number, payment_status)
        `)
        .eq('order.event_id', eventId);

      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });
}

export function useOrderLinesByOrder(orderId) {
  return useQuery({
    queryKey: ['order_lines', 'order', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_lines')
        .select(`
          *,
          meal_slot:meal_slots(id, slot_date, slot_type),
          menu_item:menu_items(id, name, type, price)
        `)
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });
}

export function useKitchenView() {
  return useQuery({
    queryKey: ['kitchen_view'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kitchen_view')
        .select('*');

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // auto-refresh every 30s
  });
}

export function useUpdateOrderLineStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, prep_status, prepared_by }) => {
      const updates = { prep_status };
      if (prep_status === 'ready' || prep_status === 'preparing') {
        updates.prepared_at = new Date().toISOString();
        if (prepared_by) updates.prepared_by = prepared_by;
      }
      if (prep_status === 'delivered') {
        updates.delivered_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('order_lines')
        .update(updates)
        .in('id', ids)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order_lines'] });
      qc.invalidateQueries({ queryKey: ['kitchen_view'] });
    },
  });
}
