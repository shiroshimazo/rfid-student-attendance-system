"use client";

import { Drawer } from "@base-ui/react/drawer";
import { ClipboardText, CloseCircle } from "iconsax-reactjs";

import { Button } from "@/components/ui/button";
import type { CorrectionRequest } from "@/lib/mock-data/correction-requests";

import { RequestListCard } from "./RequestListCard";

type RequestListDrawerProps = {
  title: string;
  description: string;
  /** Wording of each card's button — "Review Request" or "View". */
  actionLabel: string;
  requests: CorrectionRequest[];
  emptyMessage: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (request: CorrectionRequest) => void;
};

/**
 * The list a Quick Action opens: every request of one status, as cards. Picking
 * a card hands the request to the board, which opens the detail drawer on top.
 */
export function RequestListDrawer({
  title,
  description,
  actionLabel,
  requests,
  emptyMessage,
  open,
  onOpenChange,
  onSelect,
}: RequestListDrawerProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} swipeDirection="right">
      <Drawer.Portal>
        <Drawer.Backdrop className="fixed inset-0 min-h-dvh bg-brand-base/70 transition-opacity duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] data-ending-style:opacity-0 data-starting-style:opacity-0 data-swiping:duration-0" />

        <Drawer.Viewport className="fixed inset-0 flex items-stretch justify-end">
          {/* Wider than the detail drawer: this one holds whole request cards. */}
          <Drawer.Popup className="flex h-full w-full flex-col overflow-y-auto overscroll-contain border-border bg-card text-card-foreground outline-none transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] [transform:translateX(var(--drawer-swipe-movement-x))] data-ending-style:[transform:translateX(100%)] data-starting-style:[transform:translateX(100%)] data-swiping:select-none sm:w-[28rem] sm:border-l lg:w-[32rem]">
            <Drawer.Content className="flex min-h-full flex-col gap-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Drawer.Title className="font-heading text-base font-medium tracking-tight text-card-foreground">
                    {title}
                  </Drawer.Title>
                  <Drawer.Description className="text-[0.6875rem] text-muted-foreground">
                    {description}
                  </Drawer.Description>
                </div>

                <Drawer.Close
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Close ${title.toLowerCase()}`}
                    >
                      <CloseCircle aria-hidden="true" />
                    </Button>
                  }
                />
              </div>

              {requests.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-10 text-center">
                  <ClipboardText
                    size={20}
                    aria-hidden="true"
                    className="text-muted-foreground"
                  />
                  <p className="text-sm text-muted-foreground">{emptyMessage}</p>
                </div>
              ) : (
                <ul className="flex flex-col gap-3">
                  {requests.map((request) => (
                    <RequestListCard
                      key={request.id}
                      request={request}
                      actionLabel={actionLabel}
                      onAction={onSelect}
                    />
                  ))}
                </ul>
              )}
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
