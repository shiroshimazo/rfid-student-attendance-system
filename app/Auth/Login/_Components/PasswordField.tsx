"use client";

import { useState } from "react";
import { Eye, EyeSlash, Lock } from "iconsax-reactjs";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
          className="h-11 rounded-lg border-auth-hairline bg-auth-field pr-11 pl-10 text-sm text-auth-fg placeholder:text-auth-placeholder dark:bg-auth-field"
        />

        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute top-1/2 right-3 -translate-y-1/2 rounded-sm text-auth-icon transition-colors outline-none hover:text-auth-fg focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {visible ? (
            <EyeSlash size={18} aria-hidden="true" />
          ) : (
            <Eye size={18} aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}
