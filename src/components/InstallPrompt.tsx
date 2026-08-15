import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { useLang } from '../context/LanguageContext';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'oryam-install-dismissed-at';
const DISMISS_DAYS = 14;

export default function InstallPrompt() {
  const { t } = useLang();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    const daysSince = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
    if (dismissedAt && daysSince < DISMISS_DAYS) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setVisible(false);
  };

  if (!visible || !deferred) return null;

  return (
    <div className="fixed inset-x-4 bottom-24 z-40 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-black/8 bg-white p-3.5 shadow-xl sm:bottom-6">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blush-soft text-blush">
        <Download size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-bold text-ink">{t('install.title')}</p>
        <p className="text-[11.5px] text-neutral-500">{t('install.sub')}</p>
      </div>
      <button
        onClick={install}
        className="shrink-0 rounded-full bg-ink px-3.5 py-2 text-[11.5px] font-bold text-white transition hover:bg-black"
      >
        {t('install.cta')}
      </button>
      <button
        onClick={dismiss}
        aria-label={t('common.fermer')}
        className="shrink-0 p-1 text-neutral-300 transition hover:text-ink"
      >
        <X size={16} />
      </button>
    </div>
  );
}
