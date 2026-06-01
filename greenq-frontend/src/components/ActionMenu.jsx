import { Eye, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const iconMap = {
  detail: Eye,
  edit: Pencil,
  delete: Trash2,
};

const MENU_WIDTH = 180;
const MENU_GAP = 8;
const SCREEN_MARGIN = 12;

export default function ActionMenu({ items = [], label = "관리 메뉴" }) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const visibleItems = items.filter(Boolean);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event) => {
      const target = event.target;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };

    const handleEsc = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    const handleWindowChange = () => {
      setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEsc);
    window.addEventListener("scroll", handleWindowChange, true);
    window.addEventListener("resize", handleWindowChange);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEsc);
      window.removeEventListener("scroll", handleWindowChange, true);
      window.removeEventListener("resize", handleWindowChange);
    };
  }, [open]);

  if (visibleItems.length === 0) {
    return null;
  }

  const calculateMenuPosition = () => {
    if (!triggerRef.current) return {};

    const rect = triggerRef.current.getBoundingClientRect();
    const estimatedMenuHeight = visibleItems.length * 44 + 16;

    const top = rect.bottom + MENU_GAP;

    let left = rect.right - MENU_WIDTH;

    left = Math.max(SCREEN_MARGIN, Math.min(left, window.innerWidth - MENU_WIDTH - SCREEN_MARGIN));

    const availableBelow = Math.max(140, window.innerHeight - top - SCREEN_MARGIN);
    const maxHeight = Math.min(estimatedMenuHeight, availableBelow);

    return {
      position: "fixed",
      top: `${top}px`,
      left: `${left}px`,
      width: `${MENU_WIDTH}px`,
      maxHeight: `${maxHeight}px`,
      overflowY: estimatedMenuHeight > availableBelow ? "auto" : "visible",
    };
  };

  const toggleOpen = () => {
    if (!open) {
      setMenuStyle(calculateMenuPosition());
    }
    setOpen((prev) => !prev);
  };

  const handleClick = (item) => {
    setOpen(false);
    item.onClick?.();
  };

  const menu = open ? (
    <div ref={menuRef} className="action-menu-portal-panel" style={menuStyle}>
      {visibleItems.map((item) => {
        const Icon = item.icon || iconMap[item.kind] || MoreVertical;
        return (
          <button
            key={item.label}
            type="button"
            className={item.danger ? "danger" : ""}
            onClick={() => handleClick(item)}
          >
            <Icon size={18} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  ) : null;

  return (
    <div className="action-menu">
      <button
        ref={triggerRef}
        type="button"
        className={`action-menu-trigger ${open ? "open" : ""}`}
        onClick={toggleOpen}
        aria-label={label}
      >
        <MoreVertical size={20} />
      </button>

      {typeof document !== "undefined" && menu ? createPortal(menu, document.body) : null}
    </div>
  );
}
