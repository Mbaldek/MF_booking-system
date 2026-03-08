import { useState, useMemo, useEffect, Component } from 'react';
import { Send, ChevronDown, ChevronLeft, ChevronRight, Search, Copy, Clock, Mail, ExternalLink } from 'lucide-react';
import { useNotificationSettings, useUpdateNotificationSetting } from '@/hooks/useNotificationSettings';
import { useEmailLogs } from '@/hooks/useEmailLogs';
import { supabase } from '@/api/supabase';
import MfCard from '@/components/ui/MfCard';
import MfBadge from '@/components/ui/MfBadge';
import MfButton from '@/components/ui/MfButton';
import MfInput from '@/components/ui/MfInput';

/* ═══════════════════════════════════════════════════
   Error Boundary
   ═══════════════════════════════════════════════════ */

class NotifErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div className="p-6 text-center space-y-2">
          <p className="font-body text-status-red font-medium">Erreur dans AdminNotifications</p>
          <pre className="font-body text-xs text-mf-muted bg-mf-blanc-casse p-3 rounded-xl text-left overflow-auto">
            {this.state.error.message}{'\n'}{this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ═══════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════ */

const TABS = [
  { key: 'auto', label: 'Emails automatiques', icon: '📧' },
  { key: 'history', label: 'Historique', icon: '📬' },
  { key: 'manual', label: 'Envoi manuel', icon: '📣' },
];

const RECIPIENT_BADGE = {
  client: { variant: 'poudre', label: 'Client' },
  admin: { variant: 'olive', label: 'Admin' },
  staff: { variant: 'orange', label: 'Staff' },
};

const PLACEHOLDERS = {
  order_confirmation: ['{order_number}', '{event_name}'],
  admin_notification: ['{order_number}', '{amount}'],
  daily_admin_recap: ['{slot_count}', '{order_count}'],
  daily_client_reminder: ['{event_name}', '{slot_label}', '{date}'],
  delivery_confirmation: ['{stand}', '{order_number}', '{event_name}'],
};

const EDGE_FUNCTION_MAP = {
  order_confirmation: 'send-order-confirmation',
  admin_notification: 'send-admin-notification',
  daily_admin_recap: 'send-daily-reminders',
  daily_client_reminder: 'send-daily-reminders',
  delivery_confirmation: 'send-delivery-confirmation',
};

const NOTIF_LABELS = {
  order_confirmation: 'Confirmation commande',
  admin_notification: 'Notification admin',
  daily_admin_recap: 'Récap admin quotidien',
  daily_client_reminder: 'Rappel client quotidien',
  delivery_confirmation: 'Confirmation livraison',
};

/* ═══════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════ */

function AdminNotificationsInner() {
  const [activeTab, setActiveTab] = useState('auto');

  return (
    <div className="min-h-screen p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-[28px] italic text-mf-rose">Notifications</h1>
        <p className="font-body text-[13px] text-mf-muted mt-0.5">
          Emails automatiques, historique et envoi manuel
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 rounded-pill font-body text-[12px] border transition-all duration-200 cursor-pointer ${
              activeTab === tab.key
                ? 'bg-mf-rose border-mf-rose text-white'
                : 'bg-white border-mf-border text-mf-marron-glace hover:border-mf-rose/40'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'auto' && <AutoEmailsTab />}
      {activeTab === 'history' && <HistoryTab />}
      {activeTab === 'manual' && <ManualTab />}
    </div>
  );
}

export default function AdminNotifications() {
  return (
    <NotifErrorBoundary>
      <AdminNotificationsInner />
    </NotifErrorBoundary>
  );
}

/* ═══════════════════════════════════════════════════
   TAB 1 — Emails automatiques
   ═══════════════════════════════════════════════════ */

function AutoEmailsTab() {
  const { data: settings = [], isLoading, error: queryError } = useNotificationSettings();
  const updateSetting = useUpdateNotificationSetting();
  const [expandedId, setExpandedId] = useState(null);

  const handleToggle = (setting) => {
    updateSetting.mutate({ id: setting.id, enabled: !setting.enabled });
  };

  if (queryError) {
    return (
      <div className="p-6 text-center space-y-2">
        <p className="font-body text-status-red font-medium">Erreur de chargement</p>
        <p className="font-body text-xs text-mf-muted">{queryError.message}</p>
      </div>
    );
  }

  if (isLoading) return <Spinner />;

  return (
    <div className="flex flex-col gap-3">
      {settings.map((setting) => {
        const badge = RECIPIENT_BADGE[setting.recipient_type] || RECIPIENT_BADGE.client;
        const isExpanded = expandedId === setting.id;

        return (
          <MfCard key={setting.id} className="p-0 overflow-hidden">
            {/* Header row */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : setting.id)}
              className="w-full flex items-center gap-4 p-5 bg-transparent border-none cursor-pointer text-left"
            >
              {/* Toggle */}
              <div
                onClick={(e) => { e.stopPropagation(); handleToggle(setting); }}
                className="shrink-0 cursor-pointer"
              >
                <div
                  className={`w-12 h-7 rounded-full p-1 flex items-center transition-colors duration-200 ${
                    setting.enabled ? 'bg-status-green' : 'bg-mf-border'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                      setting.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-body text-[14px] font-medium text-mf-marron-glace">
                    {setting.label}
                  </span>
                  <MfBadge variant={badge.variant}>{badge.label}</MfBadge>
                  {!setting.enabled && <MfBadge variant="red">Désactivé</MfBadge>}
                </div>
                <p className="font-body text-[12px] text-mf-muted mt-0.5 line-clamp-1">
                  {setting.description}
                </p>
              </div>

              {/* Chevron */}
              <ChevronDown
                className={`w-4 h-4 text-mf-muted transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Expanded edit panel */}
            {isExpanded && (
              <EditPanel
                setting={setting}
                onClose={() => setExpandedId(null)}
                updateSetting={updateSetting}
              />
            )}
          </MfCard>
        );
      })}

      {settings.length === 0 && (
        <div className="text-center py-12">
          <div className="text-[28px] opacity-30 mb-2">🔔</div>
          <p className="font-body text-[13px] text-mf-muted">Aucune notification configurée</p>
        </div>
      )}
    </div>
  );
}

/* ─── Edit Panel ─── */

function EditPanel({ setting, onClose, updateSetting }) {
  const [form, setForm] = useState({
    subject_template: setting.subject_template || '',
    body_intro: setting.body_intro || '',
    recipient_override: setting.recipient_override || '',
    send_hour: setting.send_hour ?? 17,
  });
  const [saving, setSaving] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [copied, setCopied] = useState(null);

  const isScheduled = setting.key === 'daily_admin_recap' || setting.key === 'daily_client_reminder';
  const placeholders = PLACEHOLDERS[setting.key] || [];

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSetting.mutateAsync({ id: setting.id, ...form });
      onClose();
    } catch (err) {
      alert(`Erreur: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTestSending(true);
    try {
      const fnName = EDGE_FUNCTION_MAP[setting.key];
      if (!fnName) throw new Error('Fonction non trouvée');
      const { error } = await supabase.functions.invoke(fnName, {
        body: { orderId: 'test', test: true },
      });
      if (error) throw error;
      alert('Email de test envoyé !');
    } catch (err) {
      alert(`Erreur test: ${err.message}`);
    } finally {
      setTestSending(false);
    }
  };

  const copyPlaceholder = (ph) => {
    navigator.clipboard.writeText(ph);
    setCopied(ph);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="border-t border-mf-border bg-mf-blanc-casse px-5 py-5 space-y-4">
      <MfInput
        label="Objet de l'email"
        value={form.subject_template}
        onChange={(e) => setForm({ ...form, subject_template: e.target.value })}
        placeholder="Objet du mail..."
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] uppercase tracking-[0.12em] text-mf-rose font-body pl-1">
          Introduction
        </label>
        <textarea
          value={form.body_intro}
          onChange={(e) => setForm({ ...form, body_intro: e.target.value })}
          placeholder="Texte d'introduction de l'email..."
          rows={3}
          className="rounded-2xl border border-mf-border px-5 py-3 font-body text-[15px] text-mf-marron-glace bg-mf-white placeholder:text-mf-muted-light outline-none focus:border-mf-rose transition-colors resize-none"
        />
      </div>

      <MfInput
        label="Destinataire override"
        value={form.recipient_override}
        onChange={(e) => setForm({ ...form, recipient_override: e.target.value })}
        placeholder="Laisser vide pour le défaut"
      />

      {isScheduled && (
        <div className="flex flex-col gap-1.5 max-w-[180px]">
          <label className="text-[10px] uppercase tracking-[0.12em] text-mf-rose font-body pl-1">
            Heure d'envoi (UTC)
          </label>
          <input
            type="number"
            min={0}
            max={23}
            value={form.send_hour}
            onChange={(e) => setForm({ ...form, send_hour: parseInt(e.target.value) || 0 })}
            className="rounded-pill border border-mf-border px-5 py-3 font-body text-[15px] text-mf-marron-glace bg-mf-white outline-none focus:border-mf-rose transition-colors w-full"
          />
          <p className="font-body text-[10px] text-mf-muted pl-1">
            <Clock className="w-3 h-3 inline -mt-0.5 mr-0.5" />
            {form.send_hour}h UTC = {form.send_hour + 1}h Paris (hiver) / {form.send_hour + 2}h (été)
          </p>
        </div>
      )}

      {/* Placeholders */}
      {placeholders.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase tracking-[0.12em] text-mf-rose font-body pl-1">
            Variables disponibles
          </label>
          <div className="flex flex-wrap gap-1.5">
            {placeholders.map((ph) => (
              <button
                key={ph}
                onClick={() => copyPlaceholder(ph)}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-pill font-body text-[12px] border transition-all duration-200 cursor-pointer ${
                  copied === ph
                    ? 'bg-status-green/10 border-status-green/30 text-status-green'
                    : 'bg-mf-poudre/20 border-mf-poudre/40 text-mf-rose hover:bg-mf-poudre/40'
                }`}
              >
                <Copy className="w-3 h-3" />
                {copied === ph ? 'Copié !' : ph}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2">
        <MfButton
          variant="outline"
          size="sm"
          onClick={handleTest}
          disabled={testSending}
        >
          <Send className="w-3.5 h-3.5" />
          {testSending ? 'Envoi...' : 'Envoyer un test'}
        </MfButton>
        <MfButton size="sm" onClick={handleSave} disabled={saving}>
          {saving ? 'Enregistrement...' : 'Sauvegarder'}
        </MfButton>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   TAB 2 — Historique
   ═══════════════════════════════════════════════════ */

function HistoryTab() {
  const [page, setPage] = useState(1);
  const [filterKey, setFilterKey] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  const { data, isLoading } = useEmailLogs({
    page,
    pageSize: 20,
    notificationKey: filterKey || undefined,
    status: filterStatus || undefined,
  });

  const logs = data?.logs || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  const STATUS_PILLS = [
    { key: '', label: 'Tous' },
    { key: 'sent', label: 'Envoyés' },
    { key: 'error', label: 'Erreurs' },
  ];

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Type dropdown */}
        <select
          value={filterKey}
          onChange={(e) => { setFilterKey(e.target.value); setPage(1); }}
          className="rounded-pill border border-mf-border px-4 py-2 font-body text-[13px] text-mf-marron-glace bg-white outline-none focus:border-mf-rose transition-colors cursor-pointer"
        >
          <option value="">Tous les types</option>
          {Object.entries(NOTIF_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        {/* Status pills */}
        <div className="flex gap-1.5">
          {STATUS_PILLS.map((pill) => (
            <button
              key={pill.key}
              onClick={() => { setFilterStatus(pill.key); setPage(1); }}
              className={`px-4 py-2 rounded-pill font-body text-[11px] uppercase tracking-wider border transition-all duration-200 cursor-pointer ${
                filterStatus === pill.key
                  ? 'bg-mf-rose border-mf-rose text-white'
                  : 'bg-white border-mf-border text-mf-marron-glace hover:border-mf-rose/40'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        <span className="font-body text-[12px] text-mf-muted ml-auto">
          {total} email{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <MfCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-mf-border">
                {['Date', 'Type', 'Destinataire', 'Objet', 'Statut'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-body text-[10px] uppercase tracking-wider text-mf-muted bg-mf-blanc-casse">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                  className="border-b border-mf-border/50 hover:bg-mf-blanc-casse/50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-body text-[13px] text-mf-marron-glace whitespace-nowrap">
                    {formatDateTime(log.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <MfBadge variant={log.notification_key?.includes('admin') ? 'olive' : 'poudre'}>
                      {NOTIF_LABELS[log.notification_key] || log.notification_key}
                    </MfBadge>
                  </td>
                  <td className="px-4 py-3 font-body text-[13px] text-mf-marron-glace">
                    {log.recipient}
                  </td>
                  <td className="px-4 py-3 font-body text-[13px] text-mf-muted max-w-[300px] truncate">
                    {log.subject}
                  </td>
                  <td className="px-4 py-3">
                    <MfBadge variant={log.status === 'sent' ? 'green' : 'red'}>
                      {log.status === 'sent' ? 'Envoyé' : 'Erreur'}
                    </MfBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {logs.length === 0 && (
            <div className="text-center py-12">
              <Mail className="w-8 h-8 text-mf-muted/30 mx-auto mb-2" />
              <p className="font-body text-[13px] text-mf-muted">Aucun email dans l'historique</p>
              <p className="font-body text-[11px] text-mf-muted/60 mt-1">
                Les emails seront enregistrés ici automatiquement
              </p>
            </div>
          )}
        </div>
      </MfCard>

      {/* Detail panel */}
      {selectedLog && (
        <MfCard className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-body text-[14px] font-medium text-mf-marron-glace">Détail de l'email</h3>
            <button
              onClick={() => setSelectedLog(null)}
              className="text-mf-muted hover:text-mf-rose transition-colors cursor-pointer bg-transparent border-none p-1"
            >
              ✕
            </button>
          </div>
          <div className="space-y-2">
            <DetailRow label="Date" value={formatDateTime(selectedLog.created_at)} />
            <DetailRow label="Type" value={NOTIF_LABELS[selectedLog.notification_key] || selectedLog.notification_key} />
            <DetailRow label="Destinataire" value={selectedLog.recipient} />
            <DetailRow label="Objet" value={selectedLog.subject} />
            <DetailRow
              label="Statut"
              value={
                <MfBadge variant={selectedLog.status === 'sent' ? 'green' : 'red'}>
                  {selectedLog.status === 'sent' ? 'Envoyé' : 'Erreur'}
                </MfBadge>
              }
            />
            {selectedLog.error_message && (
              <DetailRow
                label="Erreur"
                value={<span className="text-status-red">{selectedLog.error_message}</span>}
              />
            )}
            {selectedLog.order_id && (
              <DetailRow
                label="Commande"
                value={
                  <a
                    href="/admin/orders"
                    className="text-mf-rose hover:underline inline-flex items-center gap-1"
                  >
                    Voir la commande <ExternalLink className="w-3 h-3" />
                  </a>
                }
              />
            )}
          </div>
        </MfCard>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="p-2 rounded-pill border border-mf-border bg-white text-mf-marron-glace hover:border-mf-rose/40 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-body text-[13px] text-mf-muted">
            Page {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-pill border border-mf-border bg-white text-mf-marron-glace hover:border-mf-rose/40 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start gap-3">
      <span className="font-body text-[11px] uppercase tracking-wider text-mf-muted w-24 shrink-0 pt-0.5">{label}</span>
      <span className="font-body text-[13px] text-mf-marron-glace">{value}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   TAB 3 — Envoi manuel
   ═══════════════════════════════════════════════════ */

function ManualTab() {
  const [recipientMode, setRecipientMode] = useState('single');
  const [singleEmail, setSingleEmail] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(false);

  const [customers, setCustomers] = useState([]);
  const [customersLoaded, setCustomersLoaded] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventClientCount, setEventClientCount] = useState(0);

  // Load distinct customers + events on mount
  useEffect(() => {
    supabase
      .from('orders')
      .select('customer_email, customer_first_name, customer_last_name')
      .eq('payment_status', 'paid')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) {
          const seen = new Set();
          const unique = data.filter((d) => {
            if (seen.has(d.customer_email)) return false;
            seen.add(d.customer_email);
            return true;
          });
          setCustomers(unique);
        }
        setCustomersLoaded(true);
      });

    supabase
      .from('events')
      .select('id, name')
      .order('start_date', { ascending: false })
      .then(({ data }) => {
        if (data) setEvents(data);
      });
  }, []);

  const filteredCustomers = useMemo(() => {
    if (!search) return customers.slice(0, 8);
    const q = search.toLowerCase();
    return customers
      .filter((c) =>
        c.customer_email.toLowerCase().includes(q) ||
        `${c.customer_first_name} ${c.customer_last_name}`.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [customers, search]);

  const handleEventChange = async (eventId) => {
    setSelectedEventId(eventId);
    if (!eventId) { setEventClientCount(0); return; }
    const { data } = await supabase
      .from('orders')
      .select('customer_email')
      .eq('event_id', eventId)
      .eq('payment_status', 'paid');
    if (data) {
      const unique = new Set(data.map((d) => d.customer_email));
      setEventClientCount(unique.size);
    }
  };

  const getRecipientLabel = () => {
    if (recipientMode === 'single') return singleEmail || 'Aucun sélectionné';
    if (recipientMode === 'event') return `${eventClientCount} client${eventClientCount !== 1 ? 's' : ''} de l'événement`;
    return customEmail || 'Aucun email';
  };

  const handleSend = () => {
    if (!subject.trim() || !message.trim()) {
      alert('Veuillez remplir l\'objet et le message');
      return;
    }
    if (recipientMode === 'single' && !singleEmail) {
      alert('Veuillez sélectionner un client');
      return;
    }
    if (recipientMode === 'event' && !selectedEventId) {
      alert('Veuillez sélectionner un événement');
      return;
    }
    if (recipientMode === 'custom' && !customEmail) {
      alert('Veuillez entrer un email');
      return;
    }
    alert('Envoi simulé — l\'Edge Function sera connectée prochainement');
  };

  const MODES = [
    { key: 'single', label: 'Un client' },
    { key: 'event', label: 'Tous les clients' },
    { key: 'custom', label: 'Email personnalisé' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form */}
      <div className="space-y-5">
        {/* Recipient mode */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] uppercase tracking-[0.12em] text-mf-rose font-body pl-1">
            Destinataire
          </label>
          <div className="flex gap-1.5">
            {MODES.map((m) => (
              <button
                key={m.key}
                onClick={() => setRecipientMode(m.key)}
                className={`px-4 py-2 rounded-pill font-body text-[11px] uppercase tracking-wider border transition-all duration-200 cursor-pointer ${
                  recipientMode === m.key
                    ? 'bg-mf-rose border-mf-rose text-white'
                    : 'bg-white border-mf-border text-mf-marron-glace hover:border-mf-rose/40'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Single client search */}
        {recipientMode === 'single' && (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-mf-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par nom ou email..."
                className="w-full rounded-pill border border-mf-border pl-10 pr-5 py-3 font-body text-[14px] text-mf-marron-glace bg-white placeholder:text-mf-muted-light outline-none focus:border-mf-rose transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto">
              {filteredCustomers.map((c) => (
                <button
                  key={c.customer_email}
                  onClick={() => { setSingleEmail(c.customer_email); setSearch(''); }}
                  className={`text-left px-4 py-2.5 rounded-xl font-body text-[13px] transition-colors cursor-pointer border-none ${
                    singleEmail === c.customer_email
                      ? 'bg-mf-poudre/30 text-mf-rose'
                      : 'bg-white hover:bg-mf-blanc-casse text-mf-marron-glace'
                  }`}
                >
                  <span className="font-medium">{c.customer_first_name} {c.customer_last_name}</span>
                  <span className="text-mf-muted ml-2 text-[12px]">{c.customer_email}</span>
                </button>
              ))}
              {filteredCustomers.length === 0 && customersLoaded && (
                <p className="font-body text-[12px] text-mf-muted text-center py-4">Aucun client trouvé</p>
              )}
            </div>
            {singleEmail && (
              <div className="flex items-center gap-2 px-1">
                <MfBadge variant="poudre">{singleEmail}</MfBadge>
                <button
                  onClick={() => setSingleEmail('')}
                  className="text-mf-muted hover:text-mf-rose text-[11px] bg-transparent border-none cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        )}

        {/* Event selector */}
        {recipientMode === 'event' && (
          <div className="space-y-2">
            <select
              value={selectedEventId}
              onChange={(e) => handleEventChange(e.target.value)}
              className="w-full rounded-pill border border-mf-border px-5 py-3 font-body text-[14px] text-mf-marron-glace bg-white outline-none focus:border-mf-rose transition-colors cursor-pointer"
            >
              <option value="">Sélectionner un événement...</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.name}</option>
              ))}
            </select>
            {selectedEventId && (
              <p className="font-body text-[12px] text-mf-vert-olive pl-2">
                {eventClientCount} client{eventClientCount !== 1 ? 's' : ''} recevront l'email
              </p>
            )}
          </div>
        )}

        {/* Custom email */}
        {recipientMode === 'custom' && (
          <MfInput
            type="email"
            value={customEmail}
            onChange={(e) => setCustomEmail(e.target.value)}
            placeholder="email@exemple.com"
          />
        )}

        {/* Subject */}
        <MfInput
          label="Objet"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Objet de l'email..."
        />

        {/* Message */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase tracking-[0.12em] text-mf-rose font-body pl-1">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Contenu de l'email..."
            rows={6}
            className="rounded-2xl border border-mf-border px-5 py-3 font-body text-[15px] text-mf-marron-glace bg-mf-white placeholder:text-mf-muted-light outline-none focus:border-mf-rose transition-colors resize-none"
          />
        </div>

        {/* Send button */}
        <MfButton onClick={handleSend} disabled={sending} fullWidth>
          <Send className="w-4 h-4" />
          {sending ? 'Envoi en cours...' : 'Envoyer'}
        </MfButton>
      </div>

      {/* Preview */}
      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-[0.12em] text-mf-rose font-body pl-1">
          Aperçu
        </label>
        <MfCard className="p-0 overflow-hidden">
          {/* MF Header */}
          <div className="bg-mf-rose px-6 py-5 text-center" style={{ borderRadius: '20px 20px 0 0' }}>
            <h2 className="text-white font-display text-[20px] italic m-0">Maison Félicien</h2>
            <p className="text-mf-poudre font-body text-[12px] mt-1 m-0">
              {subject || 'Objet de l\'email'}
            </p>
          </div>
          {/* Body */}
          <div className="p-6 space-y-4">
            <p className="font-body text-[14px] text-mf-muted">
              Destinataire : <span className="text-mf-marron-glace font-medium">{getRecipientLabel()}</span>
            </p>
            <div className="border-t border-mf-border pt-4">
              {message ? (
                <p className="font-body text-[14px] text-mf-marron-glace whitespace-pre-wrap leading-relaxed">
                  {message}
                </p>
              ) : (
                <p className="font-body text-[13px] text-mf-muted italic">
                  Le contenu de votre message apparaîtra ici...
                </p>
              )}
            </div>
            <hr className="border-mf-border" />
            <p className="font-body text-[11px] text-mf-muted text-center">
              Maison Félicien — Traiteur événementiel
            </p>
          </div>
        </MfCard>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Shared
   ═══════════════════════════════════════════════════ */

function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="text-center space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mf-rose mx-auto" />
        <p className="font-body text-[13px] text-mf-muted">Chargement...</p>
      </div>
    </div>
  );
}

function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
