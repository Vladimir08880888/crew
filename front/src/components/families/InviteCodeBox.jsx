import { useState } from 'react';
import { Copy, RefreshCw, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function InviteCodeBox({ code, onRegenerate, canRegenerate }) {
  const [copied, setCopied] = useState(false);
  const { t } = useTranslation();

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard unavailable */ }
  }

  return (
    <div className="card invite-code-box">
      <span className="muted">{t('inviteCode.shareLabel')}</span>
      <code>{code}</code>
      <div className="row">
        <button className="secondary" onClick={copy}>
          {copied ? <><Check size={14} /> {t('inviteCode.copied')}</> : <><Copy size={14} /> {t('inviteCode.copy')}</>}
        </button>
        {canRegenerate && (
          <button className="ghost" onClick={onRegenerate}>
            <RefreshCw size={14} /> {t('inviteCode.regenerate')}
          </button>
        )}
      </div>
    </div>
  );
}
