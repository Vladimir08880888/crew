import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext.jsx';

export function QRCodeView({ value, size = 200 }) {
  const canvasRef = useRef(null);
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;
    QRCode.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 2,
      color: {
        dark: theme === 'dark' ? '#e6e6f0' : '#1e1b3a',
        light: theme === 'dark' ? '#1e1e37' : '#ffffff',
      },
      errorCorrectionLevel: 'M',
    }).catch((e) => setError(e.message));
  }, [value, size, theme]);

  if (error) return <p className="muted">{t('ui.qrUnavailable', { error })}</p>;
  return <canvas ref={canvasRef} style={{ borderRadius: 'var(--r-md)' }} />;
}
