"use client";

import { ArrowDown2, ArrowUp2 } from "iconsax-reactjs";
import { useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { getInitials } from "./navigation";
import { SidebarProfileMenu } from "./SidebarProfileMenu";
import { useDashboardSidebar } from "./sidebar-context";

export function SidebarProfileFooter() {
  const { config, collapsed, isMobile, closeMobile } = useDashboardSidebar();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  const iconOnly = collapsed && !isMobile;

  function closeMenu({ restoreFocus = true }: { restoreFocus?: boolean } = {}) {
    setOpen(false);
    if (restoreFocus) {
      triggerRef.current?.focus();
    }
  }

  // Dismiss on outside pointer and on Escape, wherever focus currently is.
  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  // The rail collapsing out from under an open menu would leave it orphaned.
  const [trackedCollapsed, setTrackedCollapsed] = useState(collapsed);

  if (collapsed !== trackedCollapsed) {
    setTrackedCollapsed(collapsed);
    if (open) {
      setOpen(false);
    }
  }

  const initials = getInitials(config.profile.name);

  return (
    <div
      ref={containerRef}
      className="relative shrink-0 border-t border-rail-hairline p-2"
    >
      {open && (
        <SidebarProfileMenu
          id={menuId}
          iconOnly={iconOnly}
          onClose={() => closeMenu()}
          onNavigate={isMobile ? closeMobile : () => {}}
        />
      )}

      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-haspopup="menu"
        aria-label={
          iconOnly ? `Account: ${config.profile.name}` : "Open account menu"
        }
        className={cn(
          "group/profile relative flex min-h-12 w-full items-center rounded-xl transition-colors outline-none",
          "hover:bg-rail-hover focus-visible:ring-2 focus-visible:ring-ring",
          open && "bg-rail-hover",
          iconOnly ? "justify-center px-0" : "gap-3 px-2",
        )}
      >
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-rail-active text-xs font-medium text-rail-fg"
        >
          {initials}
        </span>

        {!iconOnly && (
          <>
            <span className="min-w-0 flex-1 text-left">
              <span className="block truncate text-sm font-medium text-rail-fg">
                {config.profile.name}
              </span>
              <span className="block truncate text-xs text-rail-label">
                {config.profile.email}
              </span>
            </span>

            {open ? (
              <ArrowDown2
                size={16}
                aria-hidden="true"
                className="shrink-0 text-rail-icon"
              />
            ) : (
              <ArrowUp2
                size={16}
                aria-hidden="true"
                className="shrink-0 text-rail-icon"
              />
            )}
          </>
        )}
      </button>
    </div>
  );
}
