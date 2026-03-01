import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Trash2, Table as TableIcon, ExternalLink, Pencil, Check, X, Image, Clock,
} from 'lucide-react';
import { supabase } from '@/api/supabase';
import EventSelector from '@/components/admin/EventSelector';
import { useActiveEvent, useUpdateEvent } from '@/hooks/useEvents';
import {
  useFloors, useCreateFloor, useUpdateFloor, useDeleteFloor,
  useCreateTable, useUpdateTable, useDeleteTable,
  useAllTablesForEvent,
  useShifts, useCreateShift, useUpdateShift, useDeleteShift,
  useTours, useCreateTour, useUpdateTour, useDeleteTour,
} from '@/hooks/useReservation';

const TABS = ['Config', 'Salles', 'Tables', 'Shifts'];

// --- Image upload component (pattern identique AdminEvent) ---
function ImageUpload({ currentUrl, onUpload, onRemove, uploading, inputRef }) {
  return (
    <div className="flex items-center gap-3">
      {currentUrl ? (
        <div className="relative">
          <img src={currentUrl} alt="" className="w-20 h-20 object-cover rounded-lg border border-mf-border" />
          <button
            type="button"
            onClick={onRemove}
            className="absolute -top-2 -right-2 p-0.5 bg-red-500 text-white rounded-full"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-20 h-20 border-2 border-dashed border-mf-border rounded-lg flex flex-col items-center justify-center hover:border-mf-rose transition-colors disabled:opacity-50"
        >
          {uploading
            ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-mf-rose" />
            : <><Image className="w-5 h-5 text-mf-muted" /><span className="text-[10px] text-mf-muted mt-1">Photo</span></>
          }
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" onChange={onUpload} className="hidden" />
    </div>
  );
}

// --- Confirmation delete button ---
function DeleteButton({ onConfirm, label = 'Supprimer' }) {
  const [confirm, setConfirm] = useState(false);
  if (confirm) {
    return (
      <span className="flex items-center gap-1">
        <button onClick={onConfirm} className="text-xs px-2 py-1 bg-red-500 text-white rounded">Confirmer</button>
        <button onClick={() => setConfirm(false)} className="text-xs px-2 py-1 border border-mf-border rounded"><X className="w-3 h-3" /></button>
      </span>
    );
  }
  return (
    <button onClick={() => setConfirm(true)} className="p-1.5 text-red-400 hover:text-red-600 transition-colors" title={label}>
      <Trash2 className="w-4 h-4" />
    </button>
  );
}

export default function AdminRestaurant() {
  const [tab, setTab] = useState(0);
  const { data: activeEvent } = useActiveEvent();
  const [selectedEventId, setSelectedEventId] = useState(null);
  const eventId = selectedEventId ?? activeEvent?.id;

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <TableIcon className="w-6 h-6" /> Réservations restaurant
        </h1>
        <div className="flex items-center gap-3">
          <EventSelector selectedEventId={selectedEventId} onEventChange={setSelectedEventId} />
          {eventId && (
            <Link
              to={`/reservation/${eventId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-mf-rose text-white text-sm font-medium rounded-card hover:bg-mf-vieux-rose transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Page réservation
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-mf-border">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === i
                ? 'border-mf-rose text-mf-rose'
                : 'border-transparent text-mf-muted hover:text-mf-marron-glace'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {!eventId && (
        <p className="text-mf-muted text-sm">Sélectionnez un événement pour commencer.</p>
      )}

      {eventId && tab === 0 && <TabConfig eventId={eventId} />}
      {eventId && tab === 1 && <TabSalles eventId={eventId} />}
      {eventId && tab === 2 && <TabTables eventId={eventId} />}
      {eventId && tab === 3 && <TabShifts eventId={eventId} />}
    </div>
  );
}

// ============================================================
// TAB 0 — Config réservation (message + image de l'événement)
// ============================================================
function TabConfig({ eventId }) {
  const updateEvent = useUpdateEvent();
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');
  const [imgUrl, setImgUrl] = useState('');
  const [loaded, setLoaded] = useState(false);

  // Load current values from DB
  useState(() => {
    supabase.from('events').select('reservation_message,reservation_image_url').eq('id', eventId).single()
      .then(({ data }) => {
        if (data && !loaded) {
          setMsg(data.reservation_message ?? '');
          setImgUrl(data.reservation_image_url ?? '');
          setLoaded(true);
        }
      });
  }, [eventId]);

  const handleSave = () => {
    updateEvent.mutate({ id: eventId, reservation_message: msg, reservation_image_url: imgUrl });
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `reservation-${eventId}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('event-images').upload(path, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('event-images').getPublicUrl(path);
      setImgUrl(urlData.publicUrl);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'upload.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <label className="block text-sm font-medium text-mf-marron-glace mb-2">Message clé (affiché sur la page réservation)</label>
        <textarea
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          rows={4}
          placeholder="Ex : Bienvenue au Salon Gastronomie 2026. Réservez votre table ci-dessous."
          className="w-full px-3 py-2 border border-mf-border rounded-card text-sm focus:outline-none focus:border-mf-rose resize-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-mf-marron-glace mb-2">Photo de l'événement</label>
        <ImageUpload
          currentUrl={imgUrl}
          onUpload={handleUpload}
          onRemove={() => setImgUrl('')}
          uploading={uploading}
          inputRef={fileRef}
        />
      </div>
      <button
        onClick={handleSave}
        disabled={updateEvent.isPending}
        className="px-5 py-2 bg-mf-rose text-white text-sm font-medium rounded-card hover:bg-mf-vieux-rose disabled:opacity-50 transition-colors"
      >
        {updateEvent.isPending ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </div>
  );
}

// ============================================================
// TAB 1 — Salles (floors) CRUD
// ============================================================
function TabSalles({ eventId }) {
  const { data: floors = [] } = useFloors(eventId);
  const createFloor = useCreateFloor();
  const updateFloor = useUpdateFloor();
  const deleteFloor = useDeleteFloor();

  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newImg, setNewImg] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [editUploading, setEditUploading] = useState(false);
  const editFileRef = useRef(null);

  const handleAdd = () => {
    if (!newName.trim()) return;
    createFloor.mutate(
      { event_id: eventId, name: newName.trim(), description: newDesc.trim() || null, image_url: newImg || null },
      { onSuccess: () => { setNewName(''); setNewDesc(''); setNewImg(''); } }
    );
  };

  const handleNewUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `floor-new-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('event-images').upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from('event-images').getPublicUrl(path);
      setNewImg(data.publicUrl);
    } catch (err) { alert("Erreur upload"); }
    finally { setUploading(false); }
  };

  const startEdit = (floor) => {
    setEditId(floor.id);
    setEditData({ name: floor.name, description: floor.description ?? '', image_url: floor.image_url ?? '' });
  };

  const handleEditUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `floor-${editId}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('event-images').upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from('event-images').getPublicUrl(path);
      setEditData((p) => ({ ...p, image_url: data.publicUrl }));
    } catch (err) { alert("Erreur upload"); }
    finally { setEditUploading(false); }
  };

  const saveEdit = () => {
    updateFloor.mutate(
      { id: editId, eventId, name: editData.name, description: editData.description || null, image_url: editData.image_url || null },
      { onSuccess: () => setEditId(null) }
    );
  };

  return (
    <div className="space-y-4">
      {floors.map((floor) => (
        <div key={floor.id} className="border border-mf-border rounded-card p-4">
          {editId === floor.id ? (
            <div className="space-y-3">
              <input
                value={editData.name}
                onChange={(e) => setEditData((p) => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-1.5 border border-mf-border rounded-card text-sm focus:outline-none focus:border-mf-rose"
                placeholder="Nom de la salle"
              />
              <textarea
                value={editData.description}
                onChange={(e) => setEditData((p) => ({ ...p, description: e.target.value }))}
                rows={2}
                className="w-full px-3 py-1.5 border border-mf-border rounded-card text-sm focus:outline-none focus:border-mf-rose resize-none"
                placeholder="Description (optionnel)"
              />
              <div className="flex items-center gap-3">
                <ImageUpload
                  currentUrl={editData.image_url}
                  onUpload={handleEditUpload}
                  onRemove={() => setEditData((p) => ({ ...p, image_url: '' }))}
                  uploading={editUploading}
                  inputRef={editFileRef}
                />
                <span className="text-xs text-mf-muted">Photo de la salle</span>
              </div>
              <div className="flex gap-2">
                <button onClick={saveEdit} className="flex items-center gap-1 px-3 py-1.5 bg-mf-rose text-white text-sm rounded-card">
                  <Check className="w-4 h-4" /> Enregistrer
                </button>
                <button onClick={() => setEditId(null)} className="px-3 py-1.5 border border-mf-border text-sm rounded-card">
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-4">
              {floor.image_url && (
                <img src={floor.image_url} alt={floor.name} className="w-16 h-16 object-cover rounded-lg shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-mf-marron-glace">{floor.name}</p>
                {floor.description && <p className="text-sm text-mf-muted mt-0.5">{floor.description}</p>}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => startEdit(floor)} className="p-1.5 text-mf-muted hover:text-mf-marron-glace transition-colors" title="Modifier">
                  <Pencil className="w-4 h-4" />
                </button>
                <DeleteButton onConfirm={() => deleteFloor.mutate({ id: floor.id, eventId })} />
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Formulaire ajout */}
      <div className="border-2 border-dashed border-mf-border rounded-card p-4 space-y-3">
        <p className="text-sm font-medium text-mf-marron-glace">Ajouter une salle</p>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nom de la salle *"
          className="w-full px-3 py-1.5 border border-mf-border rounded-card text-sm focus:outline-none focus:border-mf-rose"
        />
        <textarea
          value={newDesc}
          onChange={(e) => setNewDesc(e.target.value)}
          rows={2}
          placeholder="Description (optionnel)"
          className="w-full px-3 py-1.5 border border-mf-border rounded-card text-sm focus:outline-none focus:border-mf-rose resize-none"
        />
        <div className="flex items-center gap-3">
          <ImageUpload
            currentUrl={newImg}
            onUpload={handleNewUpload}
            onRemove={() => setNewImg('')}
            uploading={uploading}
            inputRef={fileRef}
          />
          <span className="text-xs text-mf-muted">Photo (optionnel)</span>
        </div>
        <button
          onClick={handleAdd}
          disabled={!newName.trim() || createFloor.isPending}
          className="flex items-center gap-1 px-4 py-2 bg-mf-rose text-white text-sm rounded-card disabled:opacity-50 hover:bg-mf-vieux-rose transition-colors"
        >
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>
    </div>
  );
}

// ============================================================
// TAB 2 — Vue globale tables
// ============================================================
function TabTables({ eventId }) {
  const { data: floors = [] } = useFloors(eventId);
  const { data: allTables = [] } = useAllTablesForEvent(eventId);
  const createTable = useCreateTable();
  const updateTable = useUpdateTable();
  const deleteTable = useDeleteTable();

  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [newFloorId, setNewFloorId] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const [newSeats, setNewSeats] = useState('');

  const startEdit = (t) => { setEditId(t.id); setEditData({ number: t.number, seats: t.seats }); };

  const saveEdit = () => {
    const t = allTables.find((x) => x.id === editId);
    updateTable.mutate(
      { id: editId, floorId: t.floor_id, number: parseInt(editData.number, 10), seats: parseInt(editData.seats, 10) },
      { onSuccess: () => setEditId(null) }
    );
  };

  const handleAdd = () => {
    if (!newFloorId || !newNumber || !newSeats) return;
    createTable.mutate(
      { floor_id: newFloorId, number: parseInt(newNumber, 10), seats: parseInt(newSeats, 10) },
      { onSuccess: () => { setNewNumber(''); setNewSeats(''); } }
    );
  };

  // Sort: by floor name, then table number
  const sorted = [...allTables].sort((a, b) =>
    (a.floor_name ?? '').localeCompare(b.floor_name ?? '') || a.number - b.number
  );

  return (
    <div className="space-y-4">
      <table className="w-full text-sm border border-mf-border rounded-card overflow-hidden">
        <thead className="bg-mf-poudre/20">
          <tr>
            <th className="text-left px-4 py-2 text-mf-marron-glace font-medium">Salle</th>
            <th className="text-left px-4 py-2 text-mf-marron-glace font-medium">N° Table</th>
            <th className="text-left px-4 py-2 text-mf-marron-glace font-medium">Sièges</th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((t) => (
            <tr key={t.id} className="border-t border-mf-border">
              <td className="px-4 py-2 text-mf-muted">{t.floor_name}</td>
              <td className="px-4 py-2">
                {editId === t.id ? (
                  <input
                    type="number" min={1} value={editData.number}
                    onChange={(e) => setEditData((p) => ({ ...p, number: e.target.value }))}
                    className="w-16 px-2 py-1 border border-mf-border rounded text-sm focus:outline-none focus:border-mf-rose"
                  />
                ) : (
                  <span className="font-medium text-mf-marron-glace">T{t.number}</span>
                )}
              </td>
              <td className="px-4 py-2">
                {editId === t.id ? (
                  <input
                    type="number" min={1} value={editData.seats}
                    onChange={(e) => setEditData((p) => ({ ...p, seats: e.target.value }))}
                    className="w-16 px-2 py-1 border border-mf-border rounded text-sm focus:outline-none focus:border-mf-rose"
                  />
                ) : (
                  <span>{t.seats} pers.</span>
                )}
              </td>
              <td className="px-4 py-2">
                <div className="flex items-center justify-end gap-1">
                  {editId === t.id ? (
                    <>
                      <button onClick={saveEdit} className="p-1.5 text-green-600 hover:text-green-700"><Check className="w-4 h-4" /></button>
                      <button onClick={() => setEditId(null)} className="p-1.5 text-mf-muted hover:text-mf-marron-glace"><X className="w-4 h-4" /></button>
                    </>
                  ) : (
                    <button onClick={() => startEdit(t)} className="p-1.5 text-mf-muted hover:text-mf-marron-glace" title="Modifier">
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                  <DeleteButton onConfirm={() => deleteTable.mutate({ id: t.id, floorId: t.floor_id })} />
                </div>
              </td>
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr><td colSpan={4} className="px-4 py-6 text-center text-mf-muted text-sm">Aucune table — créez d'abord une salle</td></tr>
          )}
        </tbody>
      </table>

      {/* Ajouter une table */}
      {floors.length > 0 && (
        <div className="flex items-end gap-3 flex-wrap border border-mf-border rounded-card p-4">
          <div>
            <label className="block text-xs text-mf-muted mb-1">Salle</label>
            <select
              value={newFloorId}
              onChange={(e) => setNewFloorId(e.target.value)}
              className="px-3 py-1.5 border border-mf-border rounded-card text-sm focus:outline-none focus:border-mf-rose"
            >
              <option value="">Choisir…</option>
              {floors.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-mf-muted mb-1">N° Table</label>
            <input
              type="number" min={1} value={newNumber}
              onChange={(e) => setNewNumber(e.target.value)}
              placeholder="1"
              className="w-20 px-3 py-1.5 border border-mf-border rounded-card text-sm focus:outline-none focus:border-mf-rose"
            />
          </div>
          <div>
            <label className="block text-xs text-mf-muted mb-1">Sièges</label>
            <input
              type="number" min={1} value={newSeats}
              onChange={(e) => setNewSeats(e.target.value)}
              placeholder="4"
              className="w-20 px-3 py-1.5 border border-mf-border rounded-card text-sm focus:outline-none focus:border-mf-rose"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={!newFloorId || !newNumber || !newSeats || createTable.isPending}
            className="flex items-center gap-1 px-4 py-1.5 bg-mf-rose text-white text-sm rounded-card disabled:opacity-50 hover:bg-mf-vieux-rose transition-colors"
          >
            <Plus className="w-4 h-4" /> Ajouter table
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// TAB 3 — Shifts & Tours
// ============================================================
function TabShifts({ eventId }) {
  const { data: shifts = [] } = useShifts(eventId);
  const createShift = useCreateShift();
  const updateShift = useUpdateShift();
  const deleteShift = useDeleteShift();

  const [selectedShift, setSelectedShift] = useState(null);
  const { data: tours = [] } = useTours(selectedShift?.id);
  const createTour = useCreateTour();
  const updateTour = useUpdateTour();
  const deleteTour = useDeleteTour();

  // Shift form
  const [editShiftId, setEditShiftId] = useState(null);
  const [editShift, setEditShift] = useState({});
  const [newShift, setNewShift] = useState({ name: '', start_time: '', end_time: '' });

  // Tour form
  const [editTourId, setEditTourId] = useState(null);
  const [editTour, setEditTour] = useState({});
  const [newTour, setNewTour] = useState({ start_time: '', duration_minutes: '60' });

  const startEditShift = (s) => { setEditShiftId(s.id); setEditShift({ name: s.name, start_time: s.start_time.slice(0, 5), end_time: s.end_time.slice(0, 5) }); };
  const saveShift = () => {
    updateShift.mutate({ id: editShiftId, eventId, ...editShift }, { onSuccess: () => setEditShiftId(null) });
  };
  const addShift = () => {
    if (!newShift.name || !newShift.start_time || !newShift.end_time) return;
    createShift.mutate(
      { event_id: eventId, ...newShift, slot_interval_minutes: 30 },
      { onSuccess: () => setNewShift({ name: '', start_time: '', end_time: '' }) }
    );
  };

  const startEditTour = (t) => { setEditTourId(t.id); setEditTour({ start_time: t.start_time.slice(0, 5), duration_minutes: String(t.duration_minutes) }); };
  const saveTour = () => {
    updateTour.mutate(
      { id: editTourId, shiftId: selectedShift.id, start_time: editTour.start_time, duration_minutes: parseInt(editTour.duration_minutes, 10) },
      { onSuccess: () => setEditTourId(null) }
    );
  };
  const addTour = () => {
    if (!selectedShift || !newTour.start_time) return;
    createTour.mutate(
      { shift_id: selectedShift.id, start_time: newTour.start_time, duration_minutes: parseInt(newTour.duration_minutes, 10) },
      { onSuccess: () => setNewTour({ start_time: '', duration_minutes: '60' }) }
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Shifts */}
      <div>
        <h2 className="text-base font-medium text-mf-marron-glace mb-3">Services (shifts)</h2>
        <div className="space-y-2">
          {shifts.map((s) => (
            <div
              key={s.id}
              className={`border rounded-card p-3 cursor-pointer transition-colors ${selectedShift?.id === s.id ? 'border-mf-rose bg-mf-rose/5' : 'border-mf-border hover:border-mf-rose/50'}`}
              onClick={() => setSelectedShift(s)}
            >
              {editShiftId === s.id ? (
                <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                  <input value={editShift.name} onChange={(e) => setEditShift((p) => ({ ...p, name: e.target.value }))}
                    className="w-full px-2 py-1 border border-mf-border rounded text-sm focus:outline-none focus:border-mf-rose" placeholder="Nom" />
                  <div className="flex gap-2">
                    <input type="time" value={editShift.start_time} onChange={(e) => setEditShift((p) => ({ ...p, start_time: e.target.value }))}
                      className="flex-1 px-2 py-1 border border-mf-border rounded text-sm focus:outline-none focus:border-mf-rose" />
                    <input type="time" value={editShift.end_time} onChange={(e) => setEditShift((p) => ({ ...p, end_time: e.target.value }))}
                      className="flex-1 px-2 py-1 border border-mf-border rounded text-sm focus:outline-none focus:border-mf-rose" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveShift} className="px-3 py-1 bg-mf-rose text-white text-xs rounded-card"><Check className="w-3 h-3 inline" /> OK</button>
                    <button onClick={() => setEditShiftId(null)} className="px-3 py-1 border border-mf-border text-xs rounded-card">Annuler</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm text-mf-marron-glace">{s.name}</p>
                    <p className="text-xs text-mf-muted flex items-center gap-1"><Clock className="w-3 h-3" />{s.start_time.slice(0, 5)} — {s.end_time.slice(0, 5)}</p>
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => startEditShift(s)} className="p-1 text-mf-muted hover:text-mf-marron-glace"><Pencil className="w-3.5 h-3.5" /></button>
                    <DeleteButton onConfirm={() => deleteShift.mutate({ id: s.id, eventId })} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Ajouter shift */}
        <div className="mt-3 border border-dashed border-mf-border rounded-card p-3 space-y-2">
          <p className="text-xs text-mf-muted font-medium">Nouveau service</p>
          <input value={newShift.name} onChange={(e) => setNewShift((p) => ({ ...p, name: e.target.value }))}
            placeholder="Nom (ex. Midi)" className="w-full px-2 py-1 border border-mf-border rounded text-sm focus:outline-none focus:border-mf-rose" />
          <div className="flex gap-2">
            <input type="time" value={newShift.start_time} onChange={(e) => setNewShift((p) => ({ ...p, start_time: e.target.value }))}
              className="flex-1 px-2 py-1 border border-mf-border rounded text-sm focus:outline-none focus:border-mf-rose" />
            <input type="time" value={newShift.end_time} onChange={(e) => setNewShift((p) => ({ ...p, end_time: e.target.value }))}
              className="flex-1 px-2 py-1 border border-mf-border rounded text-sm focus:outline-none focus:border-mf-rose" />
          </div>
          <button onClick={addShift} disabled={!newShift.name || !newShift.start_time} className="flex items-center gap-1 px-3 py-1 bg-mf-rose text-white text-xs rounded-card disabled:opacity-50">
            <Plus className="w-3.5 h-3.5" /> Ajouter
          </button>
        </div>
      </div>

      {/* Tours */}
      <div>
        <h2 className="text-base font-medium text-mf-marron-glace mb-3">
          Créneaux{selectedShift ? ` — ${selectedShift.name}` : ' (sélectionnez un service)'}
        </h2>
        {selectedShift ? (
          <>
            <div className="space-y-2">
              {tours.map((t) => (
                <div key={t.id} className="border border-mf-border rounded-card p-3">
                  {editTourId === t.id ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input type="time" value={editTour.start_time} onChange={(e) => setEditTour((p) => ({ ...p, start_time: e.target.value }))}
                          className="flex-1 px-2 py-1 border border-mf-border rounded text-sm focus:outline-none focus:border-mf-rose" />
                        <input type="number" min={1} value={editTour.duration_minutes} onChange={(e) => setEditTour((p) => ({ ...p, duration_minutes: e.target.value }))}
                          placeholder="min" className="w-20 px-2 py-1 border border-mf-border rounded text-sm focus:outline-none focus:border-mf-rose" />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={saveTour} className="px-3 py-1 bg-mf-rose text-white text-xs rounded-card"><Check className="w-3 h-3 inline" /> OK</button>
                        <button onClick={() => setEditTourId(null)} className="px-3 py-1 border border-mf-border text-xs rounded-card">Annuler</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-mf-muted" />
                        <span className="font-medium text-sm text-mf-marron-glace">{t.start_time.slice(0, 5)}</span>
                        <span className="text-xs text-mf-muted">{t.duration_minutes} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => startEditTour(t)} className="p-1 text-mf-muted hover:text-mf-marron-glace"><Pencil className="w-3.5 h-3.5" /></button>
                        <DeleteButton onConfirm={() => deleteTour.mutate({ id: t.id, shiftId: selectedShift.id })} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {tours.length === 0 && <p className="text-sm text-mf-muted">Aucun créneau</p>}
            </div>

            {/* Ajouter tour */}
            <div className="mt-3 border border-dashed border-mf-border rounded-card p-3 space-y-2">
              <p className="text-xs text-mf-muted font-medium">Nouveau créneau</p>
              <div className="flex gap-2">
                <input type="time" value={newTour.start_time} onChange={(e) => setNewTour((p) => ({ ...p, start_time: e.target.value }))}
                  className="flex-1 px-2 py-1 border border-mf-border rounded text-sm focus:outline-none focus:border-mf-rose" />
                <input type="number" min={1} value={newTour.duration_minutes} onChange={(e) => setNewTour((p) => ({ ...p, duration_minutes: e.target.value }))}
                  placeholder="min" className="w-20 px-2 py-1 border border-mf-border rounded text-sm focus:outline-none focus:border-mf-rose" />
              </div>
              <button onClick={addTour} disabled={!newTour.start_time} className="flex items-center gap-1 px-3 py-1 bg-mf-rose text-white text-xs rounded-card disabled:opacity-50">
                <Plus className="w-3.5 h-3.5" /> Ajouter
              </button>
            </div>
          </>
        ) : (
          <p className="text-sm text-mf-muted">Cliquez sur un service pour voir ses créneaux.</p>
        )}
      </div>
    </div>
  );
}

