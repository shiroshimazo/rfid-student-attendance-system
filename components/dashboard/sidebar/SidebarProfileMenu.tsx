"use client";

import { LogoutCurve } from "iconsax-reactjs";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

import { getInitials } from "./navigation";
import { useDashboardSidebar } from "./sidebar-context";

type SidebarProfileMenuProps = {
  id: string;
  /** Widens and anchors the panel beside the rail when it is icon-only. */
  iconOnly: boolean;
  onClose: () => void;
  onNavigate: () => void;
};

const menuItemClass =
  "flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-sm text-rail-muted transition-colors outline-none hover:bg-rail-hover hover:text-rail-fg focus-visible:bg-rail-hover focus-visible:text-rail-fg focus-visible:ring-2 focus-visible:ring-brand-3";

export function SidebarProfileMenu({
  id,
  iconOnly,
  onClose,
  onNavigate,
}: SidebarProfileMenuProps) {
  const { config } = useDashboardSidebar();
  const panelRef = useRef<HTMLDivElement>(null);

  // Roving focus across the menu. Focus lands on the first item so the menu is
  // usable from the keyboard the moment it opens.
  useEffect(() => {
    const items = panelRef.current?.querySelectorAll<HTMLElement>(
      "[role='menuitem']:not([aria-disabled='true'])",
    );
    items?.[0]?.focus();
  }, []);

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const items = Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>(
        "[role='menuitem']:not([aria-disabled='true'])",
      ) ?? [],
    );

    if (items.length === 0) {
      return;
    }

    const currentIndex = items.indexOf(document.activeElement as HTMLElement);

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        items[(currentIndex + 1) % items.length].focus();
        break;
      case "ArrowUp":
        event.preventDefault();
        items[(currentIndex - 1 + items.length) % items.length].focus();
        break;
      case "Home":
        event.preventDefault();
        items[0].focus();
        break;
      case "End":
        event.preventDefault();
        items[items.length - 1].focus();
        break;
      case "Tab":
        // The menu is a transient overlay; leaving it dismisses it.
        onClose();
        break;
      default:
        break;
    }
  }

  return (
    <div
      ref={panelRef}
      id={id}
      role="menu"
      aria-label={`${config.fallbackTitle} account`}
      onKeyDown={handleKeyDown}
      className={cn(
        // Opens upward: the footer sits at the bottom of the viewport.
        "absolute bottom-full z-50 mb-2 rounded-xl border border-rail-hairline bg-rail-surface p-1.5 shadow-[0_18px_50px_-12px_rgb(0_0_0/0.7)]",
        iconOnly ? "left-2 w-60" : "inset-x-2",
      )}
    >
      <div className="flex items-center gap-3 px-2 py-2">
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-rail-active text-xs font-medium text-rail-fg"
        >
          {getInitials(config.profile.name)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-rail-fg">
            {config.profile.name}
          </span>
          <span className="block truncate text-xs text-rail-label">
            {config.profile.email}
          </span>
        </span>
      </div>

      <hr className="my-1.5 border-t border-rail-hairline" />

      {config.menuLinks.map((link) => {
        const LinkIcon = link.icon;

        // A link is only marked disabled when its route does not exist yet. It
        // stays visible so the menu shape is stable, but it never navigates and
        // no page is created on its behalf.
        if (link.disabled) {
          return (
            <span
              key={link.label}
              role="menuitem"
              aria-disabled="true"
              className={cn(
                menuItemClass,
                "cursor-not-allowed text-rail-label opacity-60 hover:bg-transparent hover:text-rail-label",
              )}
            >
              <LinkIcon
                size={18}
                aria-hidden="true"
                className="shrink-0 text-rail-label"
              />
              <span className="truncate">{link.label}</span>
              <span className="ml-auto shrink-0 text-[10px] uppercase tracking-wide">
                Soon
              </span>
            </span>
          );
        }

        return (
          <Link
            key={link.label}
            href={link.href}
            role="menuitem"
            onClick={() => {
              onNavigate();
              onClose();
            }}
            className={menuItemClass}
          >
            <LinkIcon
              size={18}
              aria-hidden="true"
              className="shrink-0 text-rail-icon"
            />
            <span className="truncate">{link.label}</span>
          </Link>
        );
      })}

      <hr className="my-1.5 border-t border-rail-hairline" />

      <button
        type="button"
        role="menuitem"
        onClick={() => {
          // TODO(supabase): connect the existing Supabase sign-out flow here
          // (sign out + redirect). Intentionally frontend-only for now — this
          // handler must not touch auth state.
          onClose();
        }}
        className={cn(
          menuItemClass,
          "text-rail-danger hover:bg-rail-danger-surface hover:text-rail-danger focus-visible:bg-rail-danger-surface focus-visible:text-rail-danger",
        )}
      >
        <LogoutCurve size={18} aria-hidden="true" className="shrink-0" />
        <span className="truncate">Log Out</span>
      </button>
    </div>
  );
}
