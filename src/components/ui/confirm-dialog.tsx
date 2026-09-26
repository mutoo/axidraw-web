import { useEffect, useId, useRef } from 'react';
import { Button } from './button';

/**
 * A modal dialog asking the user to confirm an action. It opens with
 * showModal(), so it sits in the top layer above the page, which becomes
 * inert. Escape, a click on the backdrop and the cancel button all cancel.
 */
const ConfirmDialog = ({
  open,
  title,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className="m-auto w-full max-w-md rounded-lg border bg-background text-foreground shadow-lg backdrop:bg-black/50 open:animate-in open:fade-in-0 open:zoom-in-95"
      onClose={() => {
        // closed by the browser (escape) or the backdrop, not by `open`
        if (open) onCancel();
      }}
      onClick={(e) => {
        // the content fills the dialog, so only the backdrop hits it
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
    >
      <div className="grid gap-4 p-6">
        <h3 id={titleId}>{title}</h3>
        <div id={descriptionId} className="text-sm text-muted-foreground">
          {children}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" autoFocus onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? 'destructive' : 'default'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
};

export default ConfirmDialog;
