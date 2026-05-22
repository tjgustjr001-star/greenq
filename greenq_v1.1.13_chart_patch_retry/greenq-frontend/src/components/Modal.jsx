import { X } from "lucide-react";

export default function Modal({ open, title, description, onClose, children, footer, size = "md" }) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation">
      <section className={`modal-card ${size}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <div>
            <h3>{title}</h3>
            {description && <p>{description}</p>}
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="닫기">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </section>
    </div>
  );
}
