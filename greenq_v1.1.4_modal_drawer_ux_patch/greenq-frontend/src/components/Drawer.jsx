import { X } from "lucide-react";

export default function Drawer({ open, title, description, onClose, children, footer }) {
  if (!open) return null;

  return (
    <div className="drawer-backdrop" role="presentation">
      <aside className="drawer-panel" role="dialog" aria-modal="true" aria-label={title}>
        <div className="drawer-head">
          <div>
            <h3>{title}</h3>
            {description && <p>{description}</p>}
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="닫기">
            <X size={18} />
          </button>
        </div>
        <div className="drawer-body">{children}</div>
        {footer && <div className="drawer-footer">{footer}</div>}
      </aside>
    </div>
  );
}
