import React, { useCallback, useRef, useState } from "react";
import { PillButton } from "../ui/m3";
import type { Locale } from "./storage";
import { t } from "./i18n";

export function useDangerConfirm(locale: Locale) {
  const [command, setCommand] = useState<string | null>(null);
  const resolverRef = useRef<((confirmed: boolean) => void) | null>(null);

  const close = useCallback((confirmed: boolean) => {
    resolverRef.current?.(confirmed);
    resolverRef.current = null;
    setCommand(null);
  }, []);

  const confirmDanger = useCallback((nextCommand: string) => {
    setCommand(nextCommand);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const dialog = command ? (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        display: "grid",
        placeItems: "center",
        padding: 18,
        background: "rgba(0,0,0,0.38)"
      }}
      onClick={() => close(false)}
    >
      <div
        style={{
          width: "min(100%, 380px)",
          borderRadius: 18,
          background: "var(--color-surface)",
          color: "var(--color-on-surface)",
          border: "1px solid var(--color-outline-variant)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.28)",
          padding: 18
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ fontSize: 18, fontWeight: 900 }}>{t(locale, "danger.title")}</div>
        <div className="muted" style={{ marginTop: 8, fontSize: 13, lineHeight: 1.55 }}>
          {t(locale, "danger.confirm", { command })}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
          <PillButton variant="secondary" onClick={() => close(false)}>
            {t(locale, "common.cancel")}
          </PillButton>
          <PillButton onClick={() => close(true)}>{t(locale, "danger.confirmAction")}</PillButton>
        </div>
      </div>
    </div>
  ) : null;

  return { confirmDanger, dangerConfirmDialog: dialog };
}
