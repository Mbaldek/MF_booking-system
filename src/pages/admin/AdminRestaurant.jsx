import { useState, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Trash2, Table as TableIcon, ExternalLink, Pencil, Check, X, Image, Clock, Mail, Users,
} from 'lucide-react';
import { supabase } from '@/api/supabase';
import EventSelector from '@/components/admin/EventSelector';
import { useActiveEvent, useUpdateEvent, useEventById } from '@/hooks/useEvents';
import {
  useFloors, useCreateFloor, useUpdateFloor, useDeleteFloor,
  useCreateTable, useUpdateTable, useDeleteTable,
  useAllTablesForEvent,
  useShifts, useCreateShift, useUpdateShift, useDeleteShift,
  useTours, useCreateTour, useUpdateTour, useDeleteTour,
  useAllReservationsForEvent, useUpdateReservation, useCreateReservation,
} from '@/hooks/useReservation';

const TABS = ['Config', 'Salles', 'Tables', 'Shifts', 'Réservations', 'Gestion salle'];

// --- helpers ---
function getEventDays(startDate, endDate) {
  const days = [];
  const cur = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  while (cur <= end) {
    days.push(cur.toISOString().split('T')[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}
function formatDay(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}
function tableCode(floorName, number) {
  const prefix = (floorName ?? 'T').charAt(0).toUpperCase();
  return `${prefix}${number}`;
}

// --- Image upload component ---
function ImageUpload({ currentUrl, onUpload, onRemove, uploading, inputRef }) {
  return (
    <div className="flex items-center gap-3">
      {currentUrl ? (
        <div className="relative">
          <img src={currentUrl} alt="" className="w-20 h-20 object-cover rounded-lg border border-mf-border" />
          <button type="button" onClick={onRemove} className="absolute -top-2 -right-2 p-0.5 bg-red-500 text-white rounded-full">
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          className="w-20 h-20 border-2 border-dashed border-mf-border rounded-lg flex flex-col items-center justify-center hover:border-mf-rose transition-colors disabled:opacity-50">
          {uploading
            ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-mf-rose" />
            : <><Image className="w-5 h-5 text-mf-muted" /><span className="text-[10px] text-mf-muted mt-1">Photo</span></>}
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" onChange={onUpload} className="hidden" />
    </div>
  );
}

function DeleteButton({ onConfirm }) {
  const [confirm, setConfirm] = useState(false);
  if (confirm) return (
    <span className="flex items-center gap-1">
      <button onClick={onConfirm} className="text-xs px-2 py-1 bg-red-500 text-white rounded">Confirmer</button>
      <button onClick={() => setConfirm(false)} className="text-xs px-2 py-1 border border-mf-border rounded"><X className="w-3 h-3" /></button>
    </span>
  );
  return (
    <button onClick={() => setConfirm(true)} className="p-1.5 text-red-400 hover:text-red-600 transition-colors">
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
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <TableIcon className="w-6 h-6" /> Réservations restaurant
        </h1>
        <div className="flex items-center gap-3">
          <EventSelector selectedEventId={selectedEventId} onEventChange={setSelectedEventId} />
          {eventId && (
            <Link to={`/reservation/${eventId}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-mf-rose text-white text-sm font-medium rounded-card hover:bg-mf-vieux-rose transition-colors">
              <ExternalLink className="w-4 h-4" /> Page réservation
            </Link>
          )}
        </div>
      </div>

      <div className="flex gap-1 mb-6 border-b border-mf-border overflow-x-auto">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === i ? 'border-mf-rose text-mf-rose' : 'border-transparent text-mf-muted hover:text-mf-marron-glace'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {!eventId && <p className="text-mf-muted text-sm">Sélectionnez un événement pour commencer.</p>}
      {eventId && tab === 0 && <TabConfig eventId={eventId} />}
      {eventId && tab === 1 && <TabSalles eventId={eventId} />}
      {eventId && tab === 2 && <TabTables eventId={eventId} />}
      {eventId && tab === 3 && <TabShifts eventId={eventId} />}
      {eventId && tab === 4 && <TabReservations eventId={eventId} />}
      {eventId && tab === 5 && <TabGestionSalle eventId={eventId} />}
    </div>
  );
}

// ============================================================
// TAB 0 — Config
// ============================================================
function TabConfig({ eventId }) {
  const updateEvent = useUpdateEvent();
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');
  const [imgUrl, setImgUrl] = useState('');
  const [loaded, setLoaded] = useState(false);

  useState(() => {
    supabase.from('events').select('reservation_message,reservation_image_url').eq('id', eventId).single()
      .then(({ data }) => {
        if (data && !loaded) { setMsg(data.reservation_message ?? ''); setImgUrl(data.reservation_image_url ?? ''); setLoaded(true); }
      });
  }, [eventId]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `reservation-${eventId}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('event-images').upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from('event-images').getPublicUrl(path);
      setImgUrl(data.publicUrl);
    } catch { alert("Erreur upload"); } finally { setUploading(false); }
  };

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <label className="block text-sm font-medium text-mf-marron-glace mb-2">Message (affiché sur la page réservation)</label>
        <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={4}
          placeholder="Ex : Bienvenue au Salon 2026. Réservez votre table ci-dessous."
          className="w-full px-3 py-2 border border-mf-border rounded-card text-sm focus:outline-none focus:border-mf-rose resize-none" />
      </div>
      <div>
        <label className="block text-sm font-medium text-mf-marron-glace mb-2">Photo de l'événement</label>
        <ImageUpload currentUrl={imgUrl} onUpload={handleUpload} onRemove={() => setImgUrl('')} uploading={uploading} inputRef={fileRef} />
      </div>
      <button onClick={() => updateEvent.mutate({ id: eventId, reservation_message: msg, reservation_image_url: imgUrl })}
        disabled={updateEvent.isPending}
        className="px-5 py-2 bg-mf-rose text-white text-sm font-medium rounded-card hover:bg-mf-vieux-rose disabled:opacity-50 transition-colors">
        {updateEvent.isPending ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </div>
  );
}

// ============================================================
// TAB 1 — Salles CRUD
// ============================================================
function TabSalles({ eventId }) {
  const { data: floors = [] } = useFloors(eventId);
  const createFloor = useCreateFloor();
  const updateFloor = useUpdateFloor();
  const deleteFloor = useDeleteFloor();
  const [newName, setNewName] = useState(''); const [newDesc, setNewDesc] = useState(''); const [newImg, setNewImg] = useState('');
  const [uploading, setUploading] = useState(false); const fileRef = useRef(null);
  const [editId, setEditId] = useState(null); const [editData, setEditData] = useState({});
  const [editUploading, setEditUploading] = useState(false); const editFileRef = useRef(null);

  const upload = async (file, setImg, setLoad) => {
    setLoad(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `floor-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('event-images').upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from('event-images').getPublicUrl(path);
      setImg(data.publicUrl);
    } catch { alert("Erreur upload"); } finally { setLoad(false); }
  };

  return (
    <div className="space-y-4">
      {floors.map((floor) => (
        <div key={floor.id} className="border border-mf-border rounded-card p-4">
          {editId === floor.id ? (
            <div className="space-y-3">
              <input value={editData.name} onChange={(e) => setEditData((p) => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-1.5 border border-mf-border rounded-card text-sm focus:outline-none focus:border-mf-rose" placeholder="Nom de la salle" />
              <textarea value={editData.description} onChange={(e) => setEditData((p) => ({ ...p, description: e.target.value }))} rows={2}
                className="w-full px-3 py-1.5 border border-mf-border rounded-card text-sm focus:outline-none focus:border-mf-rose resize-none" placeholder="Description (optionnel)" />
              <ImageUpload currentUrl={editData.image_url}
                onUpload={(e) => { const f = e.target.files?.[0]; if (f) upload(f, (u) => setEditData((p) => ({ ...p, image_url: u })), setEditUploading); }}
                onRemove={() => setEditData((p) => ({ ...p, image_url: '' }))} uploading={editUploading} inputRef={editFileRef} />
              <div className="flex gap-2">
                <button onClick={() => updateFloor.mutate({ id: editId, eventId, name: editData.name, description: editData.description || null, image_url: editData.image_url || null }, { onSuccess: () => setEditId(null) })}
                  className="flex items-center gap-1 px-3 py-1.5 bg-mf-rose text-white text-sm rounded-card"><Check className="w-4 h-4" /> Enregistrer</button>
                <button onClick={() => setEditId(null)} className="px-3 py-1.5 border border-mf-border text-sm rounded-card">Annuler</button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-4">
              {floor.image_url && <img src={floor.image_url} alt={floor.name} className="w-16 h-16 object-cover rounded-lg shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-mf-marron-glace">{floor.name}</p>
                {floor.description && <p className="text-sm text-mf-muted mt-0.5">{floor.description}</p>}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => { setEditId(floor.id); setEditData({ name: floor.name, description: floor.description ?? '', image_url: floor.image_url ?? '' }); }}
                  className="p-1.5 text-mf-muted hover:text-mf-marron-glace transition-colors"><Pencil className="w-4 h-4" /></button>
                <DeleteButton onConfirm={() => deleteFloor.mutate({ id: floor.id, eventId })} />
              </div>
            </div>
          )}
        </div>
      ))}
      <div className="border-2 border-dashed border-mf-border rounded-card p-4 space-y-3">
        <p className="text-sm font-medium text-mf-marron-glace">Ajouter une salle</p>
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nom *"
          className="w-full px-3 py-1.5 border border-mf-border rounded-card text-sm focus:outline-none focus:border-mf-rose" />
        <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} rows={2} placeholder="Description (optionnel)"
          className="w-full px-3 py-1.5 border border-mf-border rounded-card text-sm focus:outline-none focus:border-mf-rose resize-none" />
        <ImageUpload currentUrl={newImg}
          onUpload={(e) => { const f = e.target.files?.[0]; if (f) upload(f, setNewImg, setUploading); }}
          onRemove={() => setNewImg('')} uploading={uploading} inputRef={fileRef} />
        <button onClick={() => { if (!newName.trim()) return; createFloor.mutate({ event_id: eventId, name: newName.trim(), description: newDesc.trim() || null, image_url: newImg || null }, { onSuccess: () => { setNewName(''); setNewDesc(''); setNewImg(''); } }); }}
          disabled={!newName.trim() || createFloor.isPending}
          className="flex items-center gap-1 px-4 py-2 bg-mf-rose text-white text-sm rounded-card disabled:opacity-50 hover:bg-mf-vieux-rose transition-colors">
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>
    </div>
  );
}

// ============================================================
// TAB 2 — Tables (avec filtre salle + auto-refresh fixé)
// ============================================================
function TabTables({ eventId }) {
  const { data: floors = [] } = useFloors(eventId);
  const { data: allTables = [] } = useAllTablesForEvent(eventId);
  const createTable = useCreateTable();
  const updateTable = useUpdateTable();
  const deleteTable = useDeleteTable();
  const [filterFloorId, setFilterFloorId] = useState('');
  const [editId, setEditId] = useState(null); const [editData, setEditData] = useState({});
  const [newFloorId, setNewFloorId] = useState(''); const [newNumber, setNewNumber] = useState(''); const [newSeats, setNewSeats] = useState('');
  const [tableError, setTableError] = useState('');

  const sorted = [...allTables]
    .filter((t) => !filterFloorId || t.floor_id === filterFloorId)
    .sort((a, b) => (a.floor_name ?? '').localeCompare(b.floor_name ?? '') || a.number - b.number);

  return (
    <div className="space-y-4">
      {floors.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-mf-muted">Filtrer :</span>
          {[{ id: '', name: 'Toutes' }, ...floors].map((f) => (
            <button key={f.id} onClick={() => setFilterFloorId(f.id)}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${filterFloorId === f.id ? 'bg-mf-rose text-white border-mf-rose' : 'border-mf-border text-mf-muted hover:border-mf-rose/50'}`}>
              {f.name}
            </button>
          ))}
        </div>
      )}

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
                {editId === t.id
                  ? <input type="number" min={1} value={editData.number} onChange={(e) => setEditData((p) => ({ ...p, number: e.target.value }))} className="w-16 px-2 py-1 border border-mf-border rounded text-sm focus:outline-none focus:border-mf-rose" />
                  : <span className="font-medium text-mf-marron-glace">{tableCode(t.floor_name, t.number)}</span>}
              </td>
              <td className="px-4 py-2">
                {editId === t.id
                  ? <input type="number" min={1} value={editData.seats} onChange={(e) => setEditData((p) => ({ ...p, seats: e.target.value }))} className="w-16 px-2 py-1 border border-mf-border rounded text-sm focus:outline-none focus:border-mf-rose" />
                  : <span>{t.seats} pers.</span>}
              </td>
              <td className="px-4 py-2">
                <div className="flex items-center justify-end gap-1">
                  {editId === t.id ? (
                    <>
                      <button onClick={() => {
                        const found = allTables.find((x) => x.id === editId);
                        const num = parseInt(editData.number, 10);
                        const dup = allTables.find((x) => x.floor_id === found.floor_id && x.number === num && x.id !== editId);
                        if (dup) { alert(`Le code ${tableCode(found.floor_name, num)} existe déjà dans cette salle.`); return; }
                        updateTable.mutate({ id: editId, floorId: found.floor_id, number: num, seats: parseInt(editData.seats, 10) }, { onSuccess: () => setEditId(null) });
                      }} className="p-1.5 text-green-600"><Check className="w-4 h-4" /></button>
                      <button onClick={() => setEditId(null)} className="p-1.5 text-mf-muted"><X className="w-4 h-4" /></button>
                    </>
                  ) : (
                    <button onClick={() => { setEditId(t.id); setEditData({ number: t.number, seats: t.seats }); }} className="p-1.5 text-mf-muted hover:text-mf-marron-glace"><Pencil className="w-4 h-4" /></button>
                  )}
                  <DeleteButton onConfirm={() => deleteTable.mutate({ id: t.id, floorId: t.floor_id })} />
                </div>
              </td>
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr><td colSpan={4} className="px-4 py-6 text-center text-mf-muted text-sm">
              {allTables.length === 0 ? "Aucune table — créez d'abord une salle" : 'Aucune table pour cette salle'}
            </td></tr>
          )}
        </tbody>
      </table>

      {floors.length > 0 && (
        <div className="flex items-end gap-3 flex-wrap border border-mf-border rounded-card p-4">
          <div>
            <label className="block text-xs text-mf-muted mb-1">Salle</label>
            <select value={newFloorId} onChange={(e) => setNewFloorId(e.target.value)}
              className="px-3 py-1.5 border border-mf-border rounded-card text-sm focus:outline-none focus:border-mf-rose">
              <option value="">Choisir…</option>
              {floors.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-mf-muted mb-1">N° Table</label>
            <input type="number" min={1} value={newNumber} onChange={(e) => setNewNumber(e.target.value)} placeholder="1"
              className="w-20 px-3 py-1.5 border border-mf-border rounded-card text-sm focus:outline-none focus:border-mf-rose" />
          </div>
          <div>
            <label className="block text-xs text-mf-muted mb-1">Sièges</label>
            <input type="number" min={1} value={newSeats} onChange={(e) => setNewSeats(e.target.value)} placeholder="4"
              className="w-20 px-3 py-1.5 border border-mf-border rounded-card text-sm focus:outline-none focus:border-mf-rose" />
          </div>
          <div className="flex flex-col gap-1">
            <button onClick={() => {
              if (!newFloorId || !newNumber || !newSeats) return;
              const num = parseInt(newNumber, 10);
              const dup = allTables.find((t) => t.floor_id === newFloorId && t.number === num);
              if (dup) { setTableError(`Le code ${tableCode(floors.find((f) => f.id === newFloorId)?.name, num)} existe déjà dans cette salle.`); return; }
              setTableError('');
              createTable.mutate({ floor_id: newFloorId, number: num, seats: parseInt(newSeats, 10) }, { onSuccess: () => { setNewNumber(''); setNewSeats(''); } });
            }}
              disabled={!newFloorId || !newNumber || !newSeats || createTable.isPending}
              className="flex items-center gap-1 px-4 py-1.5 bg-mf-rose text-white text-sm rounded-card disabled:opacity-50 hover:bg-mf-vieux-rose transition-colors">
              <Plus className="w-4 h-4" /> Ajouter table
            </button>
            {tableError && <p className="text-xs text-red-500">{tableError}</p>}
          </div>
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
  const createShift = useCreateShift(); const updateShift = useUpdateShift(); const deleteShift = useDeleteShift();
  const [selectedShift, setSelectedShift] = useState(null);
  const { data: tours = [] } = useTours(selectedShift?.id);
  const createTour = useCreateTour(); const updateTour = useUpdateTour(); const deleteTour = useDeleteTour();
  const [editShiftId, setEditShiftId] = useState(null); const [editShift, setEditShift] = useState({});
  const [newShift, setNewShift] = useState({ name: '', start_time: '', end_time: '' });
  const [editTourId, setEditTourId] = useState(null); const [editTour, setEditTour] = useState({});
  const [newTour, setNewTour] = useState({ start_time: '', duration_minutes: '60' });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h2 className="text-base font-medium text-mf-marron-glace mb-3">Services (shifts)</h2>
        <div className="space-y-2">
          {shifts.map((s) => (
            <div key={s.id} onClick={() => setSelectedShift(s)}
              className={`border rounded-card p-3 cursor-pointer transition-colors ${selectedShift?.id === s.id ? 'border-mf-rose bg-mf-rose/5' : 'border-mf-border hover:border-mf-rose/50'}`}>
              {editShiftId === s.id ? (
                <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                  <input value={editShift.name} onChange={(e) => setEditShift((p) => ({ ...p, name: e.target.value }))} className="w-full px-2 py-1 border border-mf-border rounded text-sm" placeholder="Nom" />
                  <div className="flex gap-2">
                    <input type="time" value={editShift.start_time} onChange={(e) => setEditShift((p) => ({ ...p, start_time: e.target.value }))} className="flex-1 px-2 py-1 border border-mf-border rounded text-sm" />
                    <input type="time" value={editShift.end_time} onChange={(e) => setEditShift((p) => ({ ...p, end_time: e.target.value }))} className="flex-1 px-2 py-1 border border-mf-border rounded text-sm" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => updateShift.mutate({ id: editShiftId, eventId, ...editShift }, { onSuccess: () => setEditShiftId(null) })} className="px-3 py-1 bg-mf-rose text-white text-xs rounded-card"><Check className="w-3 h-3 inline" /> OK</button>
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
                    <button onClick={() => { setEditShiftId(s.id); setEditShift({ name: s.name, start_time: s.start_time.slice(0, 5), end_time: s.end_time.slice(0, 5) }); }} className="p-1 text-mf-muted hover:text-mf-marron-glace"><Pencil className="w-3.5 h-3.5" /></button>
                    <DeleteButton onConfirm={() => deleteShift.mutate({ id: s.id, eventId })} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 border border-dashed border-mf-border rounded-card p-3 space-y-2">
          <p className="text-xs text-mf-muted font-medium">Nouveau service</p>
          <input value={newShift.name} onChange={(e) => setNewShift((p) => ({ ...p, name: e.target.value }))} placeholder="Nom (ex. Midi)" className="w-full px-2 py-1 border border-mf-border rounded text-sm" />
          <div className="flex gap-2">
            <input type="time" value={newShift.start_time} onChange={(e) => setNewShift((p) => ({ ...p, start_time: e.target.value }))} className="flex-1 px-2 py-1 border border-mf-border rounded text-sm" />
            <input type="time" value={newShift.end_time} onChange={(e) => setNewShift((p) => ({ ...p, end_time: e.target.value }))} className="flex-1 px-2 py-1 border border-mf-border rounded text-sm" />
          </div>
          <button onClick={() => { if (!newShift.name || !newShift.start_time || !newShift.end_time) return; createShift.mutate({ event_id: eventId, ...newShift, slot_interval_minutes: 30 }, { onSuccess: () => setNewShift({ name: '', start_time: '', end_time: '' }) }); }}
            disabled={!newShift.name || !newShift.start_time} className="flex items-center gap-1 px-3 py-1 bg-mf-rose text-white text-xs rounded-card disabled:opacity-50">
            <Plus className="w-3.5 h-3.5" /> Ajouter
          </button>
        </div>
      </div>

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
                        <input type="time" value={editTour.start_time} onChange={(e) => setEditTour((p) => ({ ...p, start_time: e.target.value }))} className="flex-1 px-2 py-1 border border-mf-border rounded text-sm" />
                        <input type="number" min={1} value={editTour.duration_minutes} onChange={(e) => setEditTour((p) => ({ ...p, duration_minutes: e.target.value }))} className="w-20 px-2 py-1 border border-mf-border rounded text-sm" />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => updateTour.mutate({ id: editTourId, shiftId: selectedShift.id, start_time: editTour.start_time, duration_minutes: parseInt(editTour.duration_minutes, 10) }, { onSuccess: () => setEditTourId(null) })} className="px-3 py-1 bg-mf-rose text-white text-xs rounded-card"><Check className="w-3 h-3 inline" /> OK</button>
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
                        <button onClick={() => { setEditTourId(t.id); setEditTour({ start_time: t.start_time.slice(0, 5), duration_minutes: String(t.duration_minutes) }); }} className="p-1 text-mf-muted hover:text-mf-marron-glace"><Pencil className="w-3.5 h-3.5" /></button>
                        <DeleteButton onConfirm={() => deleteTour.mutate({ id: t.id, shiftId: selectedShift.id })} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {tours.length === 0 && <p className="text-sm text-mf-muted">Aucun créneau</p>}
            </div>
            <div className="mt-3 border border-dashed border-mf-border rounded-card p-3 space-y-2">
              <p className="text-xs text-mf-muted font-medium">Nouveau créneau</p>
              <div className="flex gap-2">
                <input type="time" value={newTour.start_time} onChange={(e) => setNewTour((p) => ({ ...p, start_time: e.target.value }))} className="flex-1 px-2 py-1 border border-mf-border rounded text-sm" />
                <input type="number" min={1} value={newTour.duration_minutes} onChange={(e) => setNewTour((p) => ({ ...p, duration_minutes: e.target.value }))} className="w-20 px-2 py-1 border border-mf-border rounded text-sm" />
              </div>
              <button onClick={() => { if (!selectedShift || !newTour.start_time) return; createTour.mutate({ shift_id: selectedShift.id, start_time: newTour.start_time, duration_minutes: parseInt(newTour.duration_minutes, 10) }, { onSuccess: () => setNewTour({ start_time: '', duration_minutes: '60' }) }); }}
                disabled={!newTour.start_time} className="flex items-center gap-1 px-3 py-1 bg-mf-rose text-white text-xs rounded-card disabled:opacity-50">
                <Plus className="w-3.5 h-3.5" /> Ajouter
              </button>
            </div>
          </>
        ) : <p className="text-sm text-mf-muted">Cliquez sur un service pour voir ses créneaux.</p>}
      </div>
    </div>
  );
}

// ============================================================
// TAB 4 — Réservations : allocation + email
// ============================================================
function proposeTable(reservation, allTables, confirmedReservations) {
  const usedTableIds = new Set(
    confirmedReservations
      .filter((r) => r.tour_id === reservation.tour_id && r.id !== reservation.id && r.table_id)
      .map((r) => r.table_id)
  );
  let candidates = allTables.filter((t) => t.seats >= reservation.seats && !usedTableIds.has(t.id));
  if (candidates.length === 0) return null;
  candidates = candidates.sort((a, b) => {
    const aPref = reservation.preferred_floor_id && a.floor_id === reservation.preferred_floor_id ? 0 : 1;
    const bPref = reservation.preferred_floor_id && b.floor_id === reservation.preferred_floor_id ? 0 : 1;
    if (aPref !== bPref) return aPref - bPref;
    return (a.seats - reservation.seats) - (b.seats - reservation.seats);
  });
  return candidates[0];
}

function TabReservations({ eventId }) {
  const { data: reservations = [], isLoading } = useAllReservationsForEvent(eventId);
  const { data: allTables = [] } = useAllTablesForEvent(eventId);
  const updateReservation = useUpdateReservation();
  const [overrides, setOverrides] = useState({});
  const [sendingEmail, setSendingEmail] = useState({});
  const [errors, setErrors] = useState({});

  const pending = reservations.filter((r) => !r.table_id);
  const confirmed = reservations.filter((r) => !!r.table_id);

  const handleValidate = (res) => {
    const tableId = overrides[res.id] !== undefined
      ? (overrides[res.id] || null)
      : proposeTable(res, allTables, confirmed)?.id ?? null;
    if (!tableId) return;
    setErrors((p) => ({ ...p, [res.id]: null }));
    updateReservation.mutate(
      { id: res.id, table_id: tableId },
      { onError: (err) => setErrors((p) => ({ ...p, [res.id]: err.message ?? 'Erreur inconnue' })) }
    );
  };

  const sendEmail = async (res) => {
    setSendingEmail((p) => ({ ...p, [res.id]: true }));
    try {
      const table = res.restaurant_tables;
      const tour = res.meal_tours;
      const shift = tour?.meal_shifts;
      await fetch('/api/send-reservation-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'confirmation',
          email: res.guest_email, guestName: res.guest_name,
          serviceName: shift?.name, tourStart: tour?.start_time?.slice(0, 5),
          tableCode: tableCode(table?.restaurant_floors?.name, table?.number),
          floorName: table?.restaurant_floors?.name,
          seats: res.seats,
          date: res.service_date
            ? new Date(res.service_date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
            : new Date(res.created_at).toLocaleDateString('fr-FR'),
        }),
      });
      alert(`Email envoyé à ${res.guest_email}`);
    } catch { alert("Erreur lors de l'envoi"); } finally { setSendingEmail((p) => ({ ...p, [res.id]: false })); }
  };

  if (isLoading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mf-rose" /></div>;
  if (reservations.length === 0) return <p className="text-mf-muted text-sm py-4">Aucune réservation pour cet événement.</p>;

  return (
    <div className="space-y-8">
      {/* En attente */}
      <div>
        <h2 className="text-base font-semibold text-mf-marron-glace mb-3 flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">{pending.length}</span>
          En attente d'attribution
        </h2>
        {pending.length === 0 && <p className="text-sm text-mf-muted">Toutes les réservations ont été attribuées.</p>}
        <div className="space-y-3">
          {pending.map((res) => {
            const tour = res.meal_tours;
            const shift = tour?.meal_shifts;
            const proposedTable = proposeTable(res, allTables, confirmed);
            const selectedTableId = overrides[res.id] !== undefined ? overrides[res.id] : proposedTable?.id ?? '';

            return (
              <div key={res.id} className="border border-mf-border rounded-card p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-mf-marron-glace">{res.guest_name}</p>
                    <p className="text-sm text-mf-muted">{res.guest_email}</p>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {res.service_date && (
                        <span className="px-2 py-0.5 bg-mf-poudre/30 text-mf-marron-glace text-xs rounded-full">{formatDay(res.service_date)}</span>
                      )}
                      {shift && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-mf-poudre/30 text-mf-marron-glace text-xs rounded-full">
                          <Clock className="w-3 h-3" />{shift.name} {tour?.start_time?.slice(0, 5)}
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-mf-poudre/30 text-mf-marron-glace text-xs rounded-full">
                        {res.seats} couvert{res.seats > 1 ? 's' : ''}
                      </span>
                      {res.preferred_floor && (
                        <span className="px-2 py-0.5 bg-mf-vert-olive/10 text-mf-vert-olive text-xs rounded-full border border-mf-vert-olive/30">
                          Préf. {res.preferred_floor.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-mf-muted shrink-0">{new Date(res.created_at).toLocaleDateString('fr-FR')}</span>
                </div>

                <div className="flex items-end gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs text-mf-muted mb-1">Table proposée</label>
                    <select value={selectedTableId} onChange={(e) => setOverrides((p) => ({ ...p, [res.id]: e.target.value }))}
                      className="w-full px-3 py-1.5 border border-mf-border rounded-card text-sm focus:outline-none focus:border-mf-rose">
                      <option value="">— Aucune disponible —</option>
                      {[...allTables].sort((a, b) => {
                        const aPref = res.preferred_floor_id && a.floor_id === res.preferred_floor_id ? 0 : 1;
                        const bPref = res.preferred_floor_id && b.floor_id === res.preferred_floor_id ? 0 : 1;
                        if (aPref !== bPref) return aPref - bPref;
                        return (a.floor_name ?? '').localeCompare(b.floor_name ?? '') || a.number - b.number;
                      }).map((t) => (
                        <option key={t.id} value={t.id}>
                          {tableCode(t.floor_name, t.number)} — {t.floor_name} ({t.seats} pl.){proposedTable?.id === t.id ? ' ✓ suggérée' : ''}
                        </option>
                      ))}
                    </select>
                    {errors[res.id] && <p className="text-xs text-red-500 mt-1">{errors[res.id]}</p>}
                  </div>
                  <button onClick={() => handleValidate(res)} disabled={!selectedTableId || updateReservation.isPending}
                    className="px-4 py-2 bg-mf-rose text-white text-sm font-medium rounded-card disabled:opacity-50 hover:bg-mf-vieux-rose transition-colors shrink-0">
                    Valider
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirmées */}
      {confirmed.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-mf-marron-glace mb-3 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 bg-green-100 text-green-700 rounded-full text-xs font-bold">{confirmed.length}</span>
            Confirmées
          </h2>
          <div className="space-y-2">
            {confirmed.map((res) => {
              const tour = res.meal_tours; const shift = tour?.meal_shifts; const table = res.restaurant_tables;
              return (
                <div key={res.id} className="border border-mf-border rounded-card p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-mf-marron-glace">{res.guest_name}</p>
                    <p className="text-sm text-mf-muted">{res.guest_email}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {res.service_date && <span className="text-xs text-mf-muted">{formatDay(res.service_date)}</span>}
                      {shift && <span className="text-xs text-mf-muted flex items-center gap-1"><Clock className="w-3 h-3" />{shift.name} {tour?.start_time?.slice(0, 5)}</span>}
                      {table && <span className="text-xs font-medium text-mf-rose">{tableCode(table.restaurant_floors?.name, table.number)} — {table.restaurant_floors?.name}</span>}
                      <span className="text-xs text-mf-muted">{res.seats} couvert{res.seats > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <button onClick={() => sendEmail(res)} disabled={sendingEmail[res.id]}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-mf-rose text-mf-rose text-sm rounded-card hover:bg-mf-rose/5 disabled:opacity-50 transition-colors shrink-0">
                    <Mail className="w-4 h-4" />{sendingEmail[res.id] ? 'Envoi…' : 'Email'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// TAB 5 — Gestion salle (vue opérationnelle par jour/shift/salle)
// ============================================================
function TabGestionSalle({ eventId }) {
  const { data: event } = useEventById(eventId);
  const { data: shifts = [] } = useShifts(eventId);
  const { data: floors = [] } = useFloors(eventId);
  const { data: allTables = [] } = useAllTablesForEvent(eventId);
  const { data: reservations = [] } = useAllReservationsForEvent(eventId);
  const createReservation = useCreateReservation();

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedShift, setSelectedShift] = useState(null);
  const [selectedFloorId, setSelectedFloorId] = useState(null);

  // Detail modal (reserved table → show reservation)
  const [detailRes, setDetailRes] = useState(null);
  // Walk-in modal (free table → quick assign)
  const [walkinTable, setWalkinTable] = useState(null);
  const [walkinForm, setWalkinForm] = useState({ name: '', email: '', seats: 1, tourId: '' });
  const [walkinLoading, setWalkinLoading] = useState(false);

  // Tours of selected shift (derived from reservation join data)
  const { data: toursForShift = [] } = useTours(selectedShift?.id);

  const eventDays = useMemo(() => {
    if (!event?.start_date || !event?.end_date) return [];
    return getEventDays(event.start_date, event.end_date);
  }, [event?.start_date, event?.end_date]);

  // Auto-select first day/shift/floor
  useMemo(() => {
    if (!selectedDate && eventDays.length) setSelectedDate(eventDays[0]);
  }, [eventDays]);
  useMemo(() => {
    if (!selectedShift && shifts.length) setSelectedShift(shifts[0]);
  }, [shifts]);
  useMemo(() => {
    if (!selectedFloorId && floors.length) setSelectedFloorId(floors[0].id);
  }, [floors]);

  // Tables for selected floor
  const floorTables = useMemo(() =>
    allTables.filter((t) => t.floor_id === selectedFloorId).sort((a, b) => a.number - b.number),
    [allTables, selectedFloorId]
  );

  // Reservations matching date + shift
  const filteredReservations = useMemo(() => {
    if (!selectedDate || !selectedShift) return [];
    return reservations.filter((r) => {
      if (r.service_date !== selectedDate) return false;
      const shiftId = r.meal_tours?.shift_id;
      return shiftId === selectedShift.id;
    });
  }, [reservations, selectedDate, selectedShift]);

  // Table → reservation map
  const tableResMap = useMemo(() => {
    const map = {};
    filteredReservations.forEach((r) => { if (r.table_id) map[r.table_id] = r; });
    return map;
  }, [filteredReservations]);

  // Stats
  const totalSeats = floorTables.reduce((s, t) => s + t.seats, 0);
  const reservedTables = floorTables.filter((t) => tableResMap[t.id]);
  const occupiedSeats = reservedTables.reduce((s, t) => s + (tableResMap[t.id]?.seats ?? 0), 0);

  const handleWalkinSubmit = async () => {
    if (!walkinForm.name || !walkinForm.tourId || !walkinTable) return;
    setWalkinLoading(true);
    try {
      await new Promise((resolve, reject) => {
        createReservation.mutate(
          {
            tour_id: walkinForm.tourId,
            table_id: walkinTable.id,
            service_date: selectedDate,
            guest_name: walkinForm.name,
            guest_email: walkinForm.email || null,
            seats: walkinForm.seats,
            preferred_floor_id: selectedFloorId,
          },
          { onSuccess: resolve, onError: reject }
        );
      });
      setWalkinTable(null);
      setWalkinForm({ name: '', email: '', seats: 1, tourId: '' });
    } catch (err) {
      alert('Erreur : ' + (err.message ?? 'inconnue'));
    } finally {
      setWalkinLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-start">
        {/* Jour */}
        {eventDays.length > 1 && (
          <div>
            <p className="text-xs text-mf-muted mb-1.5 font-medium uppercase tracking-wide">Jour</p>
            <div className="flex gap-1.5 flex-wrap">
              {eventDays.map((d) => (
                <button key={d} onClick={() => setSelectedDate(d)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${selectedDate === d ? 'bg-mf-rose text-white border-mf-rose' : 'border-mf-border text-mf-muted hover:border-mf-rose/50'}`}>
                  {formatDay(d)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Shift */}
        <div>
          <p className="text-xs text-mf-muted mb-1.5 font-medium uppercase tracking-wide">Service</p>
          <div className="flex gap-1.5">
            {shifts.map((s) => (
              <button key={s.id} onClick={() => setSelectedShift(s)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${selectedShift?.id === s.id ? 'bg-mf-rose text-white border-mf-rose' : 'border-mf-border text-mf-muted hover:border-mf-rose/50'}`}>
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Salle */}
        {floors.length > 1 && (
          <div>
            <p className="text-xs text-mf-muted mb-1.5 font-medium uppercase tracking-wide">Salle</p>
            <div className="flex gap-1.5">
              {floors.map((f) => (
                <button key={f.id} onClick={() => setSelectedFloorId(f.id)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${selectedFloorId === f.id ? 'bg-mf-rose text-white border-mf-rose' : 'border-mf-border text-mf-muted hover:border-mf-rose/50'}`}>
                  {f.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stats bar */}
      {selectedDate && selectedShift && (
        <div className="flex gap-4 p-3 bg-mf-poudre/20 rounded-card text-sm">
          <span className="text-mf-marron-glace font-medium">{reservedTables.length}/{floorTables.length} tables occupées</span>
          <span className="text-mf-muted">·</span>
          <span className="text-mf-muted">{occupiedSeats}/{totalSeats} couverts réservés</span>
          <span className="text-mf-muted">·</span>
          <span className="text-green-700 font-medium">{floorTables.length - reservedTables.length} libre{floorTables.length - reservedTables.length > 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Table grid */}
      {floorTables.length === 0 ? (
        <p className="text-sm text-mf-muted">Aucune table dans cette salle. Créez-en dans l'onglet Tables.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {floorTables.map((table) => {
            const res = tableResMap[table.id];
            const isReserved = !!res;
            return (
              <button
                key={table.id}
                onClick={() => {
                  if (isReserved) { setDetailRes(res); }
                  else { setWalkinTable(table); setWalkinForm({ name: '', email: '', seats: table.seats > 1 ? 2 : 1, tourId: toursForShift[0]?.id ?? '' }); }
                }}
                className={`relative p-4 rounded-card border-2 text-center transition-all hover:scale-[1.02] active:scale-[0.98] ${
                  isReserved
                    ? 'border-mf-rose bg-mf-rose/8 hover:bg-mf-rose/12'
                    : 'border-green-400 bg-green-50 hover:bg-green-100'
                }`}
              >
                {/* Status dot */}
                <div className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full ${isReserved ? 'bg-mf-rose' : 'bg-green-500'}`} />

                <div className="font-bold text-lg text-mf-marron-glace mb-0.5">{tableCode(table.floor_name, table.number)}</div>
                <div className="flex items-center justify-center gap-1 text-xs text-mf-muted mb-2">
                  <Users className="w-3 h-3" />{table.seats}
                </div>

                {isReserved ? (
                  <div className="space-y-0.5">
                    <div className="text-xs font-medium text-mf-rose leading-tight truncate">{res.guest_name}</div>
                    <div className="text-xs text-mf-muted">{res.seats} couv.</div>
                    {res.meal_tours?.start_time && (
                      <div className="text-xs text-mf-muted">{res.meal_tours.start_time.slice(0,5)}</div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-green-700 font-medium">Libre</div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Modal — detail réservation */}
      {detailRes && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setDetailRes(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-mf-marron-glace text-lg">Détail réservation</h3>
              <button onClick={() => setDetailRes(null)} className="p-1 text-mf-muted hover:text-mf-marron-glace"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-mf-muted">Table</span>
                <span className="font-medium text-mf-marron-glace">{tableCode(detailRes.restaurant_tables?.restaurant_floors?.name, detailRes.restaurant_tables?.number)} — {detailRes.restaurant_tables?.restaurant_floors?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-mf-muted">Nom</span>
                <span className="font-medium text-mf-marron-glace">{detailRes.guest_name}</span>
              </div>
              {detailRes.guest_email && (
                <div className="flex justify-between">
                  <span className="text-mf-muted">Email</span>
                  <span className="text-mf-marron-glace">{detailRes.guest_email}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-mf-muted">Couverts</span>
                <span className="font-medium text-mf-marron-glace">{detailRes.seats}</span>
              </div>
              {detailRes.service_date && (
                <div className="flex justify-between">
                  <span className="text-mf-muted">Jour</span>
                  <span className="text-mf-marron-glace">{formatDay(detailRes.service_date)}</span>
                </div>
              )}
              {detailRes.meal_tours && (
                <div className="flex justify-between">
                  <span className="text-mf-muted">Créneau</span>
                  <span className="text-mf-marron-glace">{detailRes.meal_tours.meal_shifts?.name} {detailRes.meal_tours.start_time?.slice(0, 5)}</span>
                </div>
              )}
              {detailRes.preferred_floor && (
                <div className="flex justify-between">
                  <span className="text-mf-muted">Salle préférée</span>
                  <span className="text-mf-vert-olive">{detailRes.preferred_floor.name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-mf-muted">Réservé le</span>
                <span className="text-mf-marron-glace">{new Date(detailRes.created_at).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
            <button onClick={() => setDetailRes(null)}
              className="mt-5 w-full px-4 py-2 bg-mf-rose text-white text-sm font-medium rounded-card hover:bg-mf-vieux-rose transition-colors">
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Modal — walk-in (table libre) */}
      {walkinTable && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setWalkinTable(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-mf-marron-glace text-lg">
                Assigner {tableCode(walkinTable.floor_name, walkinTable.number)} <span className="text-mf-muted font-normal text-base">({walkinTable.seats} pl.)</span>
              </h3>
              <button onClick={() => setWalkinTable(null)} className="p-1 text-mf-muted hover:text-mf-marron-glace"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-mf-muted mb-1">Nom du client *</label>
                <input type="text" value={walkinForm.name} onChange={(e) => setWalkinForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Prénom Nom" autoFocus
                  className="w-full px-3 py-2 border border-mf-border rounded-card text-sm focus:outline-none focus:border-mf-rose" />
              </div>
              <div>
                <label className="block text-xs text-mf-muted mb-1">Email (optionnel)</label>
                <input type="email" value={walkinForm.email} onChange={(e) => setWalkinForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="contact@example.com"
                  className="w-full px-3 py-2 border border-mf-border rounded-card text-sm focus:outline-none focus:border-mf-rose" />
              </div>
              <div>
                <label className="block text-xs text-mf-muted mb-1">Couverts</label>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setWalkinForm((p) => ({ ...p, seats: Math.max(1, p.seats - 1) }))}
                    className="px-3 py-1.5 border border-mf-border rounded-card hover:bg-mf-poudre/20">−</button>
                  <span className="w-8 text-center font-medium text-mf-marron-glace">{walkinForm.seats}</span>
                  <button type="button" onClick={() => setWalkinForm((p) => ({ ...p, seats: Math.min(walkinTable.seats, p.seats + 1) }))}
                    className="px-3 py-1.5 border border-mf-border rounded-card hover:bg-mf-poudre/20">+</button>
                </div>
              </div>
              {toursForShift.length > 0 && (
                <div>
                  <label className="block text-xs text-mf-muted mb-1">Créneau *</label>
                  <select value={walkinForm.tourId} onChange={(e) => setWalkinForm((p) => ({ ...p, tourId: e.target.value }))}
                    className="w-full px-3 py-2 border border-mf-border rounded-card text-sm focus:outline-none focus:border-mf-rose">
                    <option value="">Choisir…</option>
                    {toursForShift.map((t) => (
                      <option key={t.id} value={t.id}>{selectedShift?.name} {t.start_time.slice(0, 5)} ({t.duration_minutes} min)</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setWalkinTable(null)}
                className="flex-1 px-4 py-2 border border-mf-border text-mf-muted text-sm rounded-card hover:bg-mf-poudre/10">
                Annuler
              </button>
              <button onClick={handleWalkinSubmit}
                disabled={!walkinForm.name || !walkinForm.tourId || walkinLoading}
                className="flex-1 px-4 py-2 bg-mf-rose text-white text-sm font-medium rounded-card disabled:opacity-50 hover:bg-mf-vieux-rose transition-colors">
                {walkinLoading ? 'Assignation…' : 'Assigner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
