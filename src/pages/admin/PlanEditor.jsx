import { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import Draggable from 'react-draggable';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useActiveEvent } from '@/hooks/useEvents';
import {
  useFloors,
  useAllTablesForEvent,
  useUpdateTable,
  useCreateTable,
  useDeleteTable,
} from '@/hooks/useReservation';

// ─── helpers ────────────────────────────────────────────────────────────────

function tableCode(floorName, number) {
  return `${(floorName ?? 'T').charAt(0).toUpperCase()}${number}`;
}

function getTableDims(shape, seats) {
  const h = seats <= 2 ? 52 : seats <= 4 ? 68 : 84;
  const w = shape === 'rectangle' ? Math.round(h * 1.75) : h;
  const r = shape === 'round' ? '50%' : '10px';
  return { width: w, height: h, borderRadius: r };
}

const SHAPES = [
  { value: 'square', label: 'Carré' },
  { value: 'round', label: 'Rond' },
  { value: 'rectangle', label: 'Rectangle' },
];

const SHAPE_LABEL = { square: 'Carré', round: 'Rond', rectangle: 'Rectangle' };

// CSS-only shape preview — no icon imports needed
function ShapePreview({ shape, size = 24 }) {
  const w = shape === 'rectangle' ? Math.round(size * 1.75) : size;
  const r = shape === 'round' ? '50%' : '5px';
  return (
    <div
      style={{ width: w, height: size, borderRadius: r, flexShrink: 0 }}
      className="border-2 border-mf-rose bg-mf-poudre/40"
    />
  );
}

// ─── main component ──────────────────────────────────────────────────────────

export default function PlanEditor() {
  const { floorId } = useParams();
  const { data: activeEvent } = useActiveEvent();
  const eventId = activeEvent?.id;

  const { data: floors = [] } = useFloors(eventId);
  const { data: allTables = [] } = useAllTablesForEvent(eventId);
  const updateTable = useUpdateTable();
  const createTable = useCreateTable();
  const deleteTable = useDeleteTable();

  const floor = floors.find((f) => f.id === floorId);
  const floorTables = allTables.filter((t) => t.floor_id === floorId);
  const placedTables = floorTables.filter((t) => t.x != null && t.y != null);
  const unplacedTables = floorTables.filter((t) => t.x == null || t.y == null);

  // canvas measurement
  const canvasRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });

  // controlled positions: { [tableId]: { x: px, y: px } }
  const [localPos, setLocalPos] = useState({});

  // which table is selected (highlighted + shows delete btn)
  const [selectedId, setSelectedId] = useState(null);

  // palette state
  const [paletteSeats, setPaletteSeats] = useState(4);

  // ── measure canvas with ResizeObserver
  useLayoutEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const update = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (w > 0 && h > 0) setCanvasSize({ w, h });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── sync positions from DB when canvas resizes
  useEffect(() => {
    if (!canvasSize.w || !canvasSize.h) return;
    const next = {};
    for (const t of placedTables) {
      const dims = getTableDims(t.shape ?? 'square', t.seats);
      next[t.id] = {
        x: (t.x / 100) * canvasSize.w - dims.width / 2,
        y: (t.y / 100) * canvasSize.h - dims.height / 2,
      };
    }
    setLocalPos(next);
    // intentionally only fires on canvas size change, not on every table update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasSize.w, canvasSize.h]);

  // ── compute position for a table (falls back to DB-derived if no localPos yet)
  const getPos = (table) => {
    if (localPos[table.id]) return localPos[table.id];
    if (!canvasSize.w) return { x: 0, y: 0 };
    const dims = getTableDims(table.shape ?? 'square', table.seats);
    return {
      x: ((table.x ?? 50) / 100) * canvasSize.w - dims.width / 2,
      y: ((table.y ?? 50) / 100) * canvasSize.h - dims.height / 2,
    };
  };

  const handleDrag = (e, data, tableId) => {
    setLocalPos((p) => ({ ...p, [tableId]: { x: data.x, y: data.y } }));
  };

  const handleDragStop = (e, data, table) => {
    const dims = getTableDims(table.shape ?? 'square', table.seats);
    const xPct = Math.max(0, Math.min(100, Math.round(((data.x + dims.width / 2) / canvasSize.w) * 100)));
    const yPct = Math.max(0, Math.min(100, Math.round(((data.y + dims.height / 2) / canvasSize.h) * 100)));
    setLocalPos((p) => ({ ...p, [table.id]: { x: data.x, y: data.y } }));
    updateTable.mutate({ id: table.id, floorId: table.floor_id, x: xPct, y: yPct });
  };

  const addTable = (shape) => {
    const nextNum = floorTables.length > 0 ? Math.max(...floorTables.map((t) => t.number)) + 1 : 1;
    createTable.mutate({ floor_id: floorId, number: nextNum, seats: paletteSeats, shape, x: 50, y: 50 });
  };

  const placeUnplaced = (table) => {
    updateTable.mutate({ id: table.id, floorId: table.floor_id, x: 50, y: 50 });
  };

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex overflow-hidden bg-mf-blanc-casse" style={{ height: '100dvh' }}>

      {/* ─── LEFT: Palette ──────────────────────────────────────────────── */}
      <aside className="w-52 shrink-0 border-r border-mf-border bg-white flex flex-col overflow-hidden">
        {/* header */}
        <div className="px-4 pt-5 pb-4 border-b border-mf-border">
          <Link
            to="/admin/restaurant"
            className="flex items-center gap-1.5 text-xs text-mf-muted hover:text-mf-marron-glace transition-colors mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Retour
          </Link>
          <p className="font-semibold text-mf-marron-glace text-sm">Éditeur de plan</p>
          {floor
            ? <p className="text-xs text-mf-muted mt-0.5">{floor.name}</p>
            : <p className="text-xs text-mf-muted mt-0.5 italic">Chargement…</p>}
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* ── new table palette */}
          <div className="p-4 border-b border-mf-border space-y-3">
            <p className="text-[10px] font-semibold text-mf-muted uppercase tracking-widest">Nouvelle table</p>

            <div>
              <label className="text-xs text-mf-muted mb-1 block">Sièges</label>
              <input
                type="number"
                min={1}
                max={20}
                value={paletteSeats}
                onChange={(e) => setPaletteSeats(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full px-2.5 py-1.5 border border-mf-border rounded-full text-sm focus:outline-none focus:border-mf-rose"
              />
            </div>

            {SHAPES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => addTable(value)}
                disabled={createTable.isPending}
                className="w-full flex items-center gap-3 px-3 py-2.5 border border-mf-border rounded-2xl hover:border-mf-rose hover:bg-mf-poudre/20 transition-all disabled:opacity-50 text-left"
              >
                <ShapePreview shape={value} size={22} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-mf-marron-glace">{label}</p>
                  <p className="text-[10px] text-mf-muted">{paletteSeats} pers.</p>
                </div>
                <Plus className="w-3.5 h-3.5 text-mf-muted shrink-0" />
              </button>
            ))}
          </div>

          {/* ── unplaced tables */}
          {unplacedTables.length > 0 && (
            <div className="p-4 space-y-2">
              <p className="text-[10px] font-semibold text-mf-muted uppercase tracking-widest">
                Non placées ({unplacedTables.length})
              </p>
              {unplacedTables.map((t) => (
                <button
                  key={t.id}
                  onClick={() => placeUnplaced(t)}
                  className="w-full flex items-center justify-between px-3 py-2 border border-dashed border-mf-border rounded-xl text-xs hover:border-mf-rose hover:bg-mf-poudre/10 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <ShapePreview shape={t.shape ?? 'square'} size={14} />
                    <span className="font-medium text-mf-marron-glace">{tableCode(t.floor_name, t.number)}</span>
                  </div>
                  <span className="text-mf-muted text-[10px]">+ placer</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* ─── CENTER: Canvas ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col p-5 gap-3 min-w-0 min-h-0">
        {/* top bar */}
        <div className="flex items-center justify-between shrink-0">
          <p className="text-xs text-mf-muted">
            {placedTables.length} table{placedTables.length !== 1 ? 's' : ''} placée{placedTables.length !== 1 ? 's' : ''}
            {unplacedTables.length > 0 && (
              <span className="text-orange-500"> · {unplacedTables.length} non placée{unplacedTables.length !== 1 ? 's' : ''}</span>
            )}
          </p>
          <p className="text-[10px] text-mf-muted hidden sm:block">
            Glisser pour repositionner · cliquer pour sélectionner
          </p>
        </div>

        {/* canvas */}
        <div className="flex-1 relative min-h-0">
          <div
            ref={canvasRef}
            className="absolute inset-0 rounded-2xl overflow-hidden border-2 border-mf-border"
            style={{
              backgroundColor: '#fafaf8',
              backgroundImage:
                'linear-gradient(rgba(0,0,0,0.032) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.032) 1px, transparent 1px)',
              backgroundSize: '5% 5%',
            }}
          >
            {canvasSize.w > 0 && placedTables.map((table) => {
              const dims = getTableDims(table.shape ?? 'square', table.seats);
              const pos = getPos(table);
              const isSelected = selectedId === table.id;

              return (
                <Draggable
                  key={table.id}
                  position={pos}
                  bounds="parent"
                  onStart={() => setSelectedId(table.id)}
                  onDrag={(e, data) => handleDrag(e, data, table.id)}
                  onStop={(e, data) => handleDragStop(e, data, table)}
                >
                  <div
                    style={{
                      width: dims.width,
                      height: dims.height,
                      borderRadius: dims.borderRadius,
                      position: 'absolute',
                    }}
                    className={`flex flex-col items-center justify-center border-2 cursor-move select-none transition-shadow
                      ${isSelected
                        ? 'border-mf-rose bg-mf-poudre/50 shadow-lg'
                        : 'border-mf-rose/40 bg-white hover:border-mf-rose/80 hover:bg-mf-poudre/15 hover:shadow-sm'}`}
                    onClick={() => setSelectedId(isSelected ? null : table.id)}
                  >
                    <span className="text-xs font-bold text-mf-marron-glace leading-none pointer-events-none">
                      {tableCode(table.floor_name, table.number)}
                    </span>
                    <span className="text-[9px] text-mf-muted leading-none mt-0.5 pointer-events-none">
                      {table.seats}p
                    </span>

                    {isSelected && (
                      <button
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTable.mutate({ id: table.id, floorId: table.floor_id });
                          setSelectedId(null);
                        }}
                        title="Supprimer cette table"
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </Draggable>
              );
            })}

            {/* empty state */}
            {canvasSize.w > 0 && placedTables.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-mf-muted font-medium">Plan vide</p>
                  <p className="text-xs text-mf-muted mt-1">Ajoutez des tables depuis la palette à gauche</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── RIGHT: List ────────────────────────────────────────────────── */}
      <aside className="w-52 shrink-0 border-l border-mf-border bg-white flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-mf-border shrink-0">
          <p className="text-[10px] font-semibold text-mf-muted uppercase tracking-widest">Tables</p>
          <p className="text-xs text-mf-muted mt-0.5">{floorTables.length} au total</p>
        </div>

        <ul className="flex-1 overflow-y-auto divide-y divide-mf-border/60">
          {[...floorTables]
            .sort((a, b) => a.number - b.number)
            .map((t) => {
              const placed = t.x != null && t.y != null;
              const isSelected = selectedId === t.id;
              return (
                <li
                  key={t.id}
                  onClick={() => setSelectedId(isSelected ? null : t.id)}
                  className={`px-4 py-3 cursor-pointer transition-colors ${isSelected ? 'bg-mf-poudre/30' : 'hover:bg-mf-blanc-casse'}`}
                >
                  <div className="flex items-center gap-2">
                    <ShapePreview shape={t.shape ?? 'square'} size={14} />
                    <span className="font-semibold text-sm text-mf-marron-glace flex-1">
                      {tableCode(t.floor_name, t.number)}
                    </span>
                    <span className="text-[10px] text-mf-muted">{t.seats}p</span>
                  </div>
                  <div className="mt-0.5 pl-[calc(14px*1.75+8px)]">
                    <span className={`text-[10px] ${placed ? 'text-green-600' : 'text-orange-500'}`}>
                      {placed ? `${t.x}%  ·  ${t.y}%` : 'non placée'}
                    </span>
                  </div>
                </li>
              );
            })}
          {floorTables.length === 0 && (
            <li className="px-4 py-8 text-center text-xs text-mf-muted leading-relaxed">
              Aucune table.<br />Ajoutez-en depuis la palette.
            </li>
          )}
        </ul>

        {selectedId && (() => {
          const t = floorTables.find((x) => x.id === selectedId);
          if (!t) return null;
          return (
            <div className="border-t border-mf-border p-4 shrink-0 bg-mf-poudre/10 space-y-2">
              <p className="text-[10px] font-semibold text-mf-muted uppercase tracking-widest">
                {tableCode(t.floor_name, t.number)} sélectionnée
              </p>
              <p className="text-xs text-mf-marron-glace">
                {SHAPE_LABEL[t.shape ?? 'square']} · {t.seats} pers.
              </p>
              <button
                onClick={() => {
                  deleteTable.mutate({ id: t.id, floorId: t.floor_id });
                  setSelectedId(null);
                }}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 border border-red-300 text-red-500 text-xs rounded-full hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3 h-3" /> Supprimer
              </button>
            </div>
          );
        })()}
      </aside>
    </div>
  );
}
