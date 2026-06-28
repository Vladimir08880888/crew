import { useState } from 'react';
import { Copy, Check, AlertTriangle, X } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';

export function TempPasswordModal({ member, password, onClose }) {
  const [copied, setCopied] = useState(false);
  const { t } = useTranslation();

  async function copy() {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard unavailable */ }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{t('tempPassword.title')}</h3>
        <p className="muted">
          <Trans
            i18nKey="tempPassword.description"
            values={{ first: member.first_name, last: member.last_name }}
            components={{ strong: <strong /> }}
          />
        </p>

        <code
          style={{
            display: 'block',
            fontSize: '1.4rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textAlign: 'center',
            padding: '0.9rem',
            margin: '1rem 0',
            background: 'var(--glass-strong)',
            border: '1px dashed var(--primary)',
            color: 'var(--primary)',
          }}
        >
          {password}
        </code>

        <p className="muted" style={{ fontSize: '0.85rem' }}>
          <AlertTriangle size={14} style={{ verticalAlign: '-2px', color: 'var(--warning)' }} />
          {' '}{t('tempPassword.changeHint')}
        </p>

        <div className="modal-actions">
          <button className="secondary" onClick={copy}>
            {copied ? <><Check size={14} /> {t('tempPassword.copied')}</> : <><Copy size={14} /> {t('tempPassword.copy')}</>}
          </button>
          <button onClick={onClose}><X size={14} /> {t('tempPassword.close')}</button>
        </div>
      </div>
    </div>
  );
}
