import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabase';

// Global catalog: all menu items (event_id IS NULL)
export function useMenuCatalog() {
  return useQuery({
    queryKey: ['menu_items', 'catalog'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .is('event_id', null)
        .order('type', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}

// Event-specific menu: items linked via event_menu_items junction
// Returns items with effective price (custom_price ?? catalog price)
export function useEventMenuItems(eventId) {
  return useQuery({
    queryKey: ['event_menu_items', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_menu_items')
        .select(`
          id,
          custom_price,
          available,
          menu_item:menu_items(id, name, type, price, unit_price, is_supplement, description, image_url, tags)
        `)
        .eq('event_id', eventId)
        .eq('available', true);

      if (error) throw error;

      // Flatten: merge menu_item fields with effective price
      return data
        .filter((emi) => emi.menu_item)
        .map((emi) => ({
          ...emi.menu_item,
          event_menu_item_id: emi.id,
          price: emi.custom_price ?? emi.menu_item.price,
          unit_price: emi.menu_item.unit_price,
          is_supplement: emi.menu_item.is_supplement,
          available: emi.available,
        }));
    },
    enabled: !!eventId,
  });
}

// All event_menu_items for admin (including unavailable), with catalog info
export function useAllEventMenuItems(eventId) {
  return useQuery({
    queryKey: ['event_menu_items', 'all', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_menu_items')
        .select(`
          id,
          menu_item_id,
          custom_price,
          available,
          menu_item:menu_items(id, name, type, price, unit_price, is_supplement, description, image_url, tags)
        `)
        .eq('event_id', eventId);

      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });
}

// CRUD for catalog items
export function useCreateMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (itemData) => {
      // Catalog items: no event_id
      const { data, error } = await supabase
        .from('menu_items')
        .insert({ ...itemData, event_id: null })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menu_items'] });
    },
  });
}

export function useUpdateMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from('menu_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menu_items'] });
      qc.invalidateQueries({ queryKey: ['event_menu_items'] });
    },
  });
}

export function useDeleteMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('menu_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menu_items'] });
      qc.invalidateQueries({ queryKey: ['event_menu_items'] });
    },
  });
}

// Link/unlink catalog items to an event
export function useLinkMenuToEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, menuItemId, customPrice }) => {
      const { data, error } = await supabase
        .from('event_menu_items')
        .upsert({
          event_id: eventId,
          menu_item_id: menuItemId,
          custom_price: customPrice ?? null,
          available: true,
        }, { onConflict: 'event_id,menu_item_id' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event_menu_items'] });
    },
  });
}

export function useUnlinkMenuFromEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, menuItemId }) => {
      const { error } = await supabase
        .from('event_menu_items')
        .delete()
        .eq('event_id', eventId)
        .eq('menu_item_id', menuItemId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event_menu_items'] });
    },
  });
}

export function useUpdateEventMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from('event_menu_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event_menu_items'] });
    },
  });
}
