import { useState, Component } from 'react';
import { X, Send } from 'lucide-react';
import { useNotificationSettings, useUpdateNotificationSetting } from '@/hooks/useNotificationSettings';
import MfCard from '@/components/ui/MfCard';
import MfBadge from '@/components/ui/MfBadge';
import MfButton from '@/components/ui/MfButton';
import MfInput from '@/components/ui/MfInput';

class NotifErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div className="p-6 text-center space-y-2">
          <p className="font-body text-status-red font-medium">Erreur dans AdminNotifications</p>
          <pre className="font-body text-xs text-mf-muted bg-mf-blanc-casse p-3 rounded-xl text-left overflow-auto">{this.state.error.message}{'\n'}{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const RECIPIENT_BADGE = {
  client: { variant: 'poudre', label: 'Client' },
  admin: { variant: 'olive', label: 'Admin' },
  staff: { variant: 'orange', label: 'Staff' },
};

function AdminNotificationsInner() {
  const { data: settings = [], isLoading, error: queryError } = useNotificationSettings();
  const updateSetting = useUpdateNotificationSetting();
  const [editingId, setEditingId] = useState(null);

  const handleToggle = (setting) => {
    updateSetting.mutate({ id: setting.id, enabled: !setting.enabled });
  };

  console.log('AdminNotifications render — isLoading:', isLoading, 'settings:', settings.length, 'error:', queryError);

  if (queryError) {
    return (
      <div className="p-6 text-center space-y-2">
        <p className="font-body text-status-red font-medium">Erreur de chargement</p>
        <p className="font-body text-xs text-mf-muted">{queryError.message}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mf-rose mx-auto" />
          <p className="font-body text-[13px] text-mf-muted">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[900px]">
      {/* Header */}
      <div>
        <h1 className="font-display text-[28px] italic text-mf-rose">Notifications</h1>
        <p className="font-body text-[13px] text-mf-muted mt-0.5">
          Gérez les emails automatiques · {settings.length} notification{settings.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* List */}
      <div className="flex flex-col gap-3">
        {settings.map((setting) => {
          const badge = RECIPIENT_BADGE[setting.recipient_type] || RECIPIENT_BADGE.client;
          return (
            <MfCard key={setting.id} className="p-0 overflow-hidden">
              <div className="flex items-center gap-4 p-5">
                {/* Toggle */}
                <button
                  onClick={() => handleToggle(setting)}
                  className="shrink-0 bg-transparent border-none cursor-pointer"
                  disabled={updateSetting.isPending}
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
                </button>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-body text-[14px] font-medium text-mf-marron-glace">
                      {setting.label}
                    </span>
                    <MfBadge variant={badge.variant}>{badge.label}</MfBadge>
                    {!setting.enabled && (
                      <MfBadge variant="red">Désactivé</MfBadge>
                    )}
                  </div>
                  <p className="font-body text-[12px] text-mf-muted mt-0.5 line-clamp-1">
                    {setting.description}
                  </p>
                </div>

                {/* Edit button */}
                <MfButton
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingId(editingId === setting.id ? null : setting.id)}
                >
                  {editingId === setting.id ? 'Fermer' : 'Modifier'}
                </MfButton>
              </div>

              {/* Edit panel */}
              {editingId === setting.id && (
                <EditPanel
                  setting={setting}
                  onClose={() => setEditingId(null)}
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

/* ─────────────────────────────────────────
   Edit Panel (inline, below the card)
   ───────────────────────────────────────── */
function EditPanel({ setting, onClose, updateSetting }) {
  const [form, setForm] = useState({
    subject_template: setting.subject_template || '',
    body_intro: setting.body_intro || '',
    recipient_override: setting.recipient_override || '',
    send_hour: setting.send_hour ?? 17,
  });
  const [saving, setSaving] = useState(false);

  const isScheduled = setting.key === 'daily_admin_recap' || setting.key === 'daily_client_reminder';

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
        placeholder="Vide = destinataire par défaut"
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
            {form.send_hour}h UTC = {form.send_hour + 1}h Paris (hiver)
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2">
        <MfButton
          variant="outline"
          size="sm"
          onClick={() => alert('Test email — fonctionnalité à venir')}
        >
          <Send className="w-3.5 h-3.5 mr-1" />
          Envoyer un test
        </MfButton>
        <MfButton size="sm" onClick={handleSave} disabled={saving}>
          {saving ? 'Enregistrement...' : 'Sauvegarder'}
        </MfButton>
        <button
          onClick={onClose}
          className="ml-auto p-2 text-mf-muted hover:text-mf-rose transition-colors cursor-pointer bg-transparent border-none"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
