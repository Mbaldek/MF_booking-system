import { useState, useEffect } from 'react';
import { Plus, Trash2, Table as TableIcon, Clock } from 'lucide-react';
import {
  useActiveEvent,
} from '@/hooks/useEvents';
import {
  useFloors,
  useCreateFloor,
  useTables,
  useCreateTable,
  useShifts,
  useCreateShift,
  useTours,
  useCreateTour,
} from '@/hooks/useReservation';

export default function AdminRestaurant() {
  const { data: activeEvent } = useActiveEvent();
  const eventId = activeEvent?.id;

  const { data: floors = [] } = useFloors(eventId);
  const createFloor = useCreateFloor();

  const [selectedFloor, setSelectedFloor] = useState(null);
  const { data: tables = [] } = useTables(selectedFloor?.id);
  const createTable = useCreateTable();

  const { data: shifts = [] } = useShifts(eventId);
  const createShift = useCreateShift();

  const [selectedShift, setSelectedShift] = useState(null);
  const { data: tours = [] } = useTours(selectedShift?.id);
  const createTour = useCreateTour();

  // simple handlers
  const handleAddFloor = () => {
    const name = prompt('Nom du plan (ex. Salle principale)');
    if (name) createFloor.mutate({ event_id: eventId, name });
  };

  const handleAddTable = () => {
    const number = parseInt(prompt('Numéro de la table'), 10);
    const seats = parseInt(prompt('Nombre de sièges'), 10);
    if (selectedFloor && number && seats) {
      createTable.mutate({ floor_id: selectedFloor.id, number, seats });
    }
  };

  const handleAddShift = () => {
    const name = prompt('Nom du shift (ex. midi)');
    const start = prompt('Heure de début (HH:MM)');
    const end = prompt('Heure de fin (HH:MM)');
    if (name && start && end) {
      createShift.mutate({ event_id: eventId, name, start_time: start, end_time: end, slot_interval_minutes: 30 });
    }
  };

  const handleAddTour = () => {
    const start = prompt('Heure de début (HH:MM)');
    const dur = parseInt(prompt('Durée en minutes'), 10);
    if (selectedShift && start && dur) {
      createTour.mutate({ shift_id: selectedShift.id, start_time: start, duration_minutes: dur });
    }
  };

  useEffect(() => {
    if (!selectedFloor && floors.length) setSelectedFloor(floors[0]);
  }, [floors]);

  useEffect(() => {
    if (!selectedShift && shifts.length) setSelectedShift(shifts[0]);
  }, [shifts]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <TableIcon className="w-6 h-6" /> Plan de salle & réservations
      </h1>

      <section className="mb-8">
        <h2 className="text-xl font-medium">Plans de salle</h2>
        <div className="flex gap-2 mt-2">
          {floors.map((f) => (
            <button
              key={f.id}
              className={`px-3 py-1 rounded-lg border ${selectedFloor?.id === f.id ? 'bg-blue-50 border-blue-500' : 'border-gray-200'}`}
              onClick={() => setSelectedFloor(f)}
            >
              {f.name}
            </button>
          ))}
          <button
            className="px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-100"
            onClick={handleAddFloor}
          >
            <Plus className="w-4 h-4 inline" /> Ajouter
          </button>
        </div>
        {selectedFloor && (
          <div className="mt-4">
            <h3 className="font-medium">Tables sur « {selectedFloor.name} »</h3>
            <ul className="mt-2 space-y-1">
              {tables.map((t) => (
                <li key={t.id} className="flex justify-between items-center">
                  <span>Table {t.number} – {t.seats} sièges</span>
                  <button className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                </li>
              ))}
            </ul>
            <button
              className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg text-sm"
              onClick={handleAddTable}
            >
              <Plus className="w-4 h-4" /> Ajouter table
            </button>
          </div>
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-medium">Shifts & tours</h2>
        <div className="flex gap-2 mt-2">
          {shifts.map((s) => (
            <button
              key={s.id}
              className={`px-3 py-1 rounded-lg border ${selectedShift?.id === s.id ? 'bg-blue-50 border-blue-500' : 'border-gray-200'}`}
              onClick={() => setSelectedShift(s)}
            >
              {s.name} ({s.start_time.slice(0,5)}–{s.end_time.slice(0,5)})
            </button>
          ))}
          <button className="px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-100" onClick={handleAddShift}>
            <Plus className="w-4 h-4 inline" /> Ajouter
          </button>
        </div>
        {selectedShift && (
          <div className="mt-4">
            <h3 className="font-medium">Tours pour « {selectedShift.name} »</h3>
            <ul className="mt-2 space-y-1">
              {tours.map((t) => (
                <li key={t.id} className="flex justify-between items-center">
                  <span>{t.start_time.slice(0,5)} ({t.duration_minutes} min)</span>
                  <button className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                </li>
              ))}
            </ul>
            <button
              className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg text-sm"
              onClick={handleAddTour}
            >
              <Plus className="w-4 h-4" /> Ajouter tour
            </button>
          </div>
        )}
      </section>

      <p className="text-sm text-gray-500">Le module de réservation (front) utilisera ces données pour afficher la carte, les heures et créer des réservations.</p>
    </div>
  );
}
