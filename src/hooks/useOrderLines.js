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
          menu_item:menu_items(id, name, type, price, tags),
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

// Kitchen view: all order lines with joined data, grouped for prep
export function useKitchenLines(eventId) {
  return useQuery({
    queryKey: ['order_lines', 'kitchen', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_lines')
        .select(`
          *,
          meal_slot:meal_slots(id, slot_date, slot_type),
          menu_item:menu_items(id, name, type, price),
          order:orders!inner(id, event_id, customer_first_name, customer_last_name, customer_phone, stand, order_number)
        `)
        .eq('order.event_id', eventId)
        .in('prep_status', ['pending', 'preparing', 'ready'])
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
    refetchInterval: 30000,
  });
}

// Delivery view: ready + delivered lines for today
export function useDeliveryLines(eventId) {
  return useQuery({
    queryKey: ['order_lines', 'delivery', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_lines')
        .select(`
          *,
          meal_slot:meal_slots(id, slot_date, slot_type),
          menu_item:menu_items(id, name, type, price),
          order:orders!inner(id, event_id, customer_first_name, customer_last_name, customer_phone, stand, order_number)
        `)
        .eq('order.event_id', eventId)
        .in('prep_status', ['ready', 'delivered'])
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
    refetchInterval: 30000,
  });
}

export function useDeleteOrderLines() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids) => {
      const { error } = await supabase
        .from('order_lines')
        .delete()
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order_lines'] });
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useUpdateOrderLineStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, prep_status, prepared_by, delivered_by }) => {
      const updates = { prep_status };
      if (prep_status === 'ready' || prep_status === 'preparing') {
        updates.prepared_at = new Date().toISOString();
        if (prepared_by) updates.prepared_by = prepared_by;
      }
      if (prep_status === 'delivered') {
        updates.delivered_at = new Date().toISOString();
        if (delivered_by) updates.delivered_by = delivered_by;
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
    },
  });
}

export function useDeliverWithPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ lineId, lineIds, photo, delivered_by }) => {
      const ids = lineIds || [lineId];
      let delivery_photo_url = null;

      if (photo) {
        const ext = photo.name?.split('.').pop() || 'jpg';
        const path = `${ids[0]}-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('delivery-photos')
          .upload(path, photo);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('delivery-photos')
          .getPublicUrl(path);

        delivery_photo_url = urlData.publicUrl;
      }

      const { data, error } = await supabase
        .from('order_lines')
        .update({
          prep_status: 'delivered',
          delivered_at: new Date().toISOString(),
          delivered_by: delivered_by || null,
          delivery_photo_url,
        })
        .in('id', ids)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order_lines'] });
    },
  });
}
