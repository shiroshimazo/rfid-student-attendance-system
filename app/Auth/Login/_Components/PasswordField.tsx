"use client";

import { useState } from "react";
import { Eye, EyeSlash, Lock } from "iconsax-reactjs";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/*
 * Both icons stay mounted and cross-fade, so the outgoing one animates out
 * instead of being torn from the DOM. The absolute pair sits inside a fixed
 * 18px box so neither one drives layout.
 */
const iconBase =
  "absolute inset-0 transition-[opacity,filter,scale] duration-300 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none";
const iconShown = "scale-100 opacity-100 blur-[0px]";
const iconHidden = "scale-[0.25] opacity-0 blur-[4px]";

export function PasswordField() {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-2">
      <Label
        htmlFor="password"
        className="text-[13px] font-normal text-auth-label"
      >
        Password
      </Label>

      <div className="relative">
        <Lock
          size={18}
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-auth-icon"
        />

        <Input
          id="password"
          name="password"
          type={visible ? "text" : "password"}
          autoComplete="current-password"
          required
          placeholder="••••••••"
          className="h-11 rounded-lg border-auth-hairline bg-auth-field pr-11 pl-10 text-sm text-auth-fg placeholder:text-auth-placeholder"
        />

        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute top-1/2 right-3 -translate-y-1/2 rounded-sm text-auth-icon transition-colors outline-none after:absolute after:top-1/2 after:left-1/2 after:h-11 after:w-10 after:-translate-1/2 hover:text-auth-fg focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className="relative block size-[18px]">
            <EyeSlash
              size={18}
              aria-hidden="true"
              className={cn(iconBase, visible ? iconShown : iconHidden)}
            />
            <Eye
              size={18}
              aria-hidden="true"
              className={cn(iconBase, visible ? iconHidden : iconShown)}
            />
          </span>
        </button>
      </div>
    </div>
  );
}
