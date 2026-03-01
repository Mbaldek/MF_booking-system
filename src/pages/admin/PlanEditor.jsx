import { useState, useRef, useLayoutEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import Draggable from 'react-draggable';
import { Users } from 'lucide-react';
import { useActiveEvent } from '@/hooks/useEvents';
import {
  useFloors,
  useAllTablesForEvent,
  useUpdateTable,
  useCreateTable,
} from '@/hooks/useReservation';

// helper from AdminRestaurant
function getTableDims(shape, seats) {
  const h = seats <= 2 ? 56 : seats <= 4 ? 70 : 86;
  const w = shape === 'rectangle' ? Math.round(h * 1.75) : h;
  const r = shape === 'round' ? '50%' : '10px';
  return { width: w, height: h, borderRadius: r };
}

export default function PlanEditor() {
  const { floorId } = useParams();
  const { data: activeEvent } = useActiveEvent();
  const eventId = activeEvent?.id;

  const { data: floors = [] } = useFloors(eventId);
  const { data: allTables = [] } = useAllTablesForEvent(eventId);
  const updateTable = useUpdateTable();
  const createTable = useCreateTable();

  const floor = floors.find((f) => f.id === floorId);
  const floorTables = allTables.filter((t) => t.floor_id === floorId);

  const containerRef = useRef(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setSize({ w: containerRef.current.offsetWidth, h: containerRef.current.offsetHeight });
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const handleDragStop = (e, data, table) => {
    if (!size.w || !size.h) return;
    const xPct = Math.round(((data.x + data.node.offsetWidth / 2) / size.w) * 100);
    const yPct = Math.round(((data.y + data.node.offsetHeight / 2) / size.h) * 100);
    updateTable.mutate({ id: table.id, x: xPct, y: yPct });
  };

  const addTable = (shape) => {
    // choose next number simple
    const nextNumber = (floorTables.length > 0 ? Math.max(...floorTables.map((t) => t.number)) : 0) + 1;
    createTable.mutate({ floor_id: floorId, number: nextNumber, seats: 2, shape, x: 50, y: 50 });
  };

  return (
    <div className="p-6 h-full flex">
      {/* palette */}
      <div className="w-44 pr-4">
        <h2 className="text-sm font-medium text-mf-marron-glace mb-2">Palette</h2>
        <div className="flex flex-col gap-2">
          {['square', 'round', 'rectangle'].map((s) => (
            <button
              key={s}
              onClick={() => addTable(s)}
              className="px-3 py-1 border border-mf-border rounded-full text-xs text-mf-marron-glace hover:bg-mf-poudre/30"
            >
              {s}
            </button>
          ))}
        </div>
        <Link
          to="/admin/restaurant"
          className="text-xs text-mf-rose mt-6 inline-block hover:underline"
        >
          ← Retour aux tables
        </Link>
      </div>

      {/* canvas */}
      <div
        ref={containerRef}
        className="relative flex-1 bg-stone-50 border border-mf-border rounded-2xl"
        style={{ paddingBottom: '58%' }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.04) 1px,transparent 1px)',
            backgroundSize: '10% 10%',
          }}
        />

        {size.w > 0 &&
          floorTables.map((table) => {
            const { width, height, borderRadius } = getTableDims(table.shape ?? 'square', table.seats);
            const xPx = ((table.x ?? 50) / 100) * size.w - width / 2;
            const yPx = ((table.y ?? 50) / 100) * size.h - height / 2;
            return (
              <Draggable
                key={table.id}
                bounds="parent"
                defaultPosition={{ x: xPx, y: yPx }}
                onStop={(e, data) => handleDragStop(e, data, table)}
              >
                <div
                  style={{ width, height, borderRadius }}
                  className="absolute flex items-center justify-center border-2 bg-white cursor-move"
                >
                  <span className="text-xs font-semibold text-mf-marron-glace">{table.number}</span>
                </div>
              </Draggable>
            );
          })}
      </div>

      {/* right list */}
      <div className="w-44 pl-4 overflow-y-auto">
        <h2 className="text-sm font-medium text-mf-marron-glace mb-2">Liste</h2>
        <ul className="space-y-2 text-xs">
          {floorTables.map((t) => (
            <li key={t.id} className="border border-mf-border rounded px-2 py-1">
              {t.number} – {t.seats} pl.
              <br />
              {t.x != null ? `${t.x}% / ${t.y}%` : 'non placé'}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
