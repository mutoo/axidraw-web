import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { trackCategoryEvent } from '@/analystic';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { getPageBusyReasons } from '@/hooks/page-busy';

const trackEvent = trackCategoryEvent('page switcher');

const pages = [
  { path: '/', label: 'Plotter' },
  { path: '/composer', label: 'Composer' },
  { path: '/debugger', label: 'Debugger' },
];

type PendingSwitch = { path: string; reasons: string[] };

const PageSwitcher = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [pending, setPending] = useState<PendingSwitch | null>(null);

  const switchTo = (path: string) => {
    trackEvent('switch to', path);
    void navigate(path);
  };

  return (
    <nav className="flex items-center justify-between gap-4">
      <h2>AxiDraw Web</h2>
      <select
        aria-label="Switch page"
        className="rounded-md py-1.5 text-sm"
        value={pathname}
        onChange={(e) => {
          const path = e.target.value;
          const reasons = getPageBusyReasons();
          if (reasons.length) {
            setPending({ path, reasons });
          } else {
            switchTo(path);
          }
        }}
      >
        {pages.map(({ path, label }) => (
          <option key={path} value={path}>
            {label}
          </option>
        ))}
      </select>
      <ConfirmDialog
        open={pending !== null}
        title="Leave this page?"
        confirmLabel="Leave"
        cancelLabel="Stay"
        destructive
        onConfirm={() => {
          if (pending) switchTo(pending.path);
          setPending(null);
        }}
        onCancel={() => {
          setPending(null);
        }}
      >
        {pending?.reasons.map((reason) => (
          <p key={reason}>{reason}</p>
        ))}
        <p className="mt-2">Leaving now stops it and disconnects the device.</p>
      </ConfirmDialog>
    </nav>
  );
};

export default PageSwitcher;
