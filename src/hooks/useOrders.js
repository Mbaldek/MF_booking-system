import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabase';

export function useOrders(eventId) {
  return useQuery({
    queryKey: ['orders', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });
}

export function useAllOrders() {
  return useQuery({
    queryKey: ['orders', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderData, orderLines }) => {
      const { data: numResult, error: numError } = await supabase
        .rpc('generate_order_number');

      const orderNumber = numError
        ? `CMD-${Date.now()}`
        : numResult;

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          ...orderData,
          order_number: orderNumber,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const linesWithOrderId = orderLines.map((line) => ({
        ...line,
        order_id: order.id,
      }));

      const { data: lines, error: linesError } = await supabase
        .from('order_lines')
        .insert(linesWithOrderId)
        .select();

      if (linesError) throw linesError;

      return { order, lines };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useOrderById(orderId) {
  return useQuery({
    queryKey: ['orders', 'detail', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, event:events(id, name, start_date, end_date, image_url)')
        .eq('id', orderId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });
}

export function useMyOrders() {
  return useQuery({
    queryKey: ['orders', 'mine'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('orders')
        .select('*, event:events(id, name)')
        .eq('customer_email', user.email)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useDeleteOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      // Delete order lines first, then the order
      const { error: linesError } = await supabase
        .from('order_lines')
        .delete()
        .eq('order_id', id);
      if (linesError) throw linesError;

      const { error } = await supabase.from('orders').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['order_lines'] });
    },
  });
}

export function useUpdateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useLookupOrders() {
  return useMutation({
    mutationFn: async ({ email, orderNumber }) => {
      let query = supabase.from('orders').select('*, event:events(id, name)');
      if (email) query = query.eq('customer_email', email);
      if (orderNumber) query = query.eq('order_number', orderNumber);
      query = query.order('created_at', { ascending: false });
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}
