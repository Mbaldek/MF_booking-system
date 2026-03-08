import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabase';

/**
 * Charge les menu_items disponibles pour un créneau via slot_menu_items
 */
export function useSlotMenuItems(slotId) {
  return useQuery({
    queryKey: ['slot_menu_items', slotId],
    enabled: !!slotId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('slot_menu_items')
        .select(`
          id,
          menu_item_id,
          menu_items (
            id, name, type, price, unit_price, is_supplement,
            description, image_url, available, tags
          )
        `)
        .eq('meal_slot_id', slotId);

      if (error) throw error;
      return data;
    },
  });
}

/**
 * Associe un menu_item à un créneau
 */
export function useLinkMenuToSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slotId, menuItemId }) => {
      const { data, error } = await supabase
        .from('slot_menu_items')
        .insert({ meal_slot_id: slotId, menu_item_id: menuItemId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { slotId }) => {
      queryClient.invalidateQueries({ queryKey: ['slot_menu_items', slotId] });
    },
  });
}

/**
 * Retire un menu_item d'un créneau
 */
export function useUnlinkMenuFromSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slotId, menuItemId }) => {
      const { error } = await supabase
        .from('slot_menu_items')
        .delete()
        .eq('meal_slot_id', slotId)
        .eq('menu_item_id', menuItemId);

      if (error) throw error;
    },
    onSuccess: (_, { slotId }) => {
      queryClient.invalidateQueries({ queryKey: ['slot_menu_items', slotId] });
    },
  });
}
