import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabase';

// floors
export function useFloors(eventId) {
  return useQuery({
    queryKey: ['floors', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurant_floors')
        .select('*')
        .eq('event_id', eventId);
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });
}

export function useCreateFloor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (floor) => {
      const { data, error } = await supabase
        .from('restaurant_floors')
        .insert(floor)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['floors', vars.event_id] });
    },
  });
}

// tables
export function useTables(floorId) {
  return useQuery({
    queryKey: ['tables', floorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurant_tables')
        .select('*')
        .eq('floor_id', floorId);
      if (error) throw error;
      return data;
    },
    enabled: !!floorId,
  });
}

export function useCreateTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (table) => {
      const { data, error } = await supabase
        .from('restaurant_tables')
        .insert(table)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['tables', vars.floor_id] });
    },
  });
}

// shifts & tours
export function useShifts(eventId) {
  return useQuery({
    queryKey: ['shifts', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meal_shifts')
        .select('*')
        .eq('event_id', eventId)
        .order('start_time');
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });
}

export function useCreateShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (shift) => {
      const { data, error } = await supabase
        .from('meal_shifts')
        .insert(shift)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['shifts', vars.event_id] });
    },
  });
}

export function useTours(shiftId) {
  return useQuery({
    queryKey: ['tours', shiftId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meal_tours')
        .select('*')
        .eq('shift_id', shiftId)
        .order('start_time');
      if (error) throw error;
      return data;
    },
    enabled: !!shiftId,
  });
}

export function useCreateTour() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tour) => {
      const { data, error } = await supabase
        .from('meal_tours')
        .insert(tour)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['tours', vars.shift_id] });
    },
  });
}

// reservations (public)
export function useReservations(tourId) {
  return useQuery({
    queryKey: ['reservations', tourId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('tour_id', tourId);
      if (error) throw error;
      return data;
    },
    enabled: !!tourId,
  });
}

export function useCreateReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (res) => {
      const { data, error } = await supabase
        .from('reservations')
        .insert(res)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['reservations', vars.tour_id] });
    },
  });
}
