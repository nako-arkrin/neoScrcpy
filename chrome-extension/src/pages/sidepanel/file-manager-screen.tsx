import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, IconButton } from "../../ui/m3";
import {
  IconAppStore,
  IconChevronRight,
  IconClose,
  IconCode,
  IconDownload,
  IconFileArchive,
  IconFileAudio,
  IconFileImage,
  IconFileText,
  IconFileVideo,
  IconFolder,
  IconRefresh,
  IconUpload,
  IconWarning,
  IconDelete,
  IconEdit
} from "../../ui/icons";
import type { Locale } from "../../shared/storage";
import { t } from "../../shared/i18n";
import { WebADB } from "../../shared/webadb";

type FileManagerEntry = { name: string; size: bigint | number; type?: unknown; mode?: number };
type TransferKind = "upload" | "download";
type TransferStatus = "pending" | "active" | "done" | "cancelled" | "error";
type TransferTask = { id: string; kind: TransferKind; name: string; progress: number; status: TransferStatus };
type CancelHandle = { id: string; cancelled: boolean; cancel?: () => void | Promise<void> };
type DeleteTarget = { entry: FileManagerEntry; path: string; isDirectory: boolean };
type RenameTarget = { entry: FileManagerEntry; path: string };

const FILE_MANAGER_ROOT = "/sdcard";
const CANCELLED_TRANSFER = "__neoScrcpy_transfer_cancelled__";
const TRANSFER_BLUE = "#0b84ff";

function normalizeUserStoragePath(path: string) {
  const raw = path.trim().replace(/\\/g, "/");
  if (!raw) return FILE_MANAGER_ROOT;

  let next: string;
  if (raw.startsWith("/")) {
    next = raw;
  } else if (raw === "sdcard" || raw.startsWith("sdcard/")) {
    next = `/${raw}`;
  } else {
    next = `${FILE_MANAGER_ROOT}/${raw}`;
  }

  const parts = next.replace(/\/+/g, "/").split("/").filter(Boolean);
  const sourceParts = parts[0] === "sdcard" ? parts.slice(1) : parts;
  const safeParts = ["sdcard"];
  for (const part of sourceParts) {
    if (!part || part === ".") continue;
    if (part === "..") {
      if (safeParts.length > 1) safeParts.pop();
      continue;
    }
    safeParts.push(part);
  }
  return `/${safeParts.join("/")}`;
}

function joinDevicePath(base: string, name: string) {
  return normalizeUserStoragePath(`${base.replace(/\/$/, "")}/${name}`);
}

function isValidEntryName(name: string) {
  const next = name.trim();
  return Boolean(next) && !next.includes("/") && !next.includes("\\");
}

function isDirectoryEntry(entry: FileManagerEntry) {
  return entry.type === 4 || (typeof entry.mode === "number" && (entry.mode & 0o170000) === 0o040000);
}

function getPathSegments(path: string) {
  const normalized = normalizeUserStoragePath(path);
  const parts = normalized.split("/").filter(Boolean);
  return parts.map((part, index) => ({
    label: part,
    path: `/${parts.slice(0, index + 1).join("/")}`
  }));
}

function formatFileSize(size: bigint | number) {
  const value = typeof size === "bigint" ? Number(size) : size;
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let next = value;
  let unit = 0;
  while (next >= 1024 && unit < units.length - 1) {
    next /= 1024;
    unit += 1;
  }
  return `${next.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

function getFileIcon(entry: FileManagerEntry) {
  if (isDirectoryEntry(entry)) return <IconFolder size={20} />;
  const ext = entry.name.split(".").pop()?.toLowerCase() ?? "";
  if (["apk", "apks", "xapk"].includes(ext)) return <IconAppStore size={20} />;
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "heic", "svg"].includes(ext)) return <IconFileImage size={20} />;
  if (["mp3", "wav", "flac", "aac", "ogg", "m4a", "opus"].includes(ext)) return <IconFileAudio size={20} />;
  if (["mp4", "mkv", "webm", "avi", "mov", "3gp"].includes(ext)) return <IconFileVideo size={20} />;
  if (["zip", "rar", "7z", "tar", "gz", "xz"].includes(ext)) return <IconFileArchive size={20} />;
  if (["js", "ts", "tsx", "jsx", "json", "xml", "html", "css", "sh", "kt", "java", "log"].includes(ext)) return <IconCode size={20} />;
  return <IconFileText size={20} />;
}

function isCancelledTransfer(error: unknown) {
  return error instanceof Error && error.message === CANCELLED_TRANSFER;
}

function taskProgress(tasks: TransferTask[], kind: TransferKind) {
  const scoped = tasks.filter((task) => task.kind === kind && (task.status === "pending" || task.status === "active"));
  if (!scoped.length) return 0;
  return Math.round(scoped.reduce((sum, task) => sum + task.progress, 0) / scoped.length);
}

export function FileManagerScreen({
  serial,
  locale,
  onNeedPermission,
  onUpdateHeaderActions
}: {
  serial?: string;
  locale: Locale;
  onNeedPermission: () => void;
  onUpdateHeaderActions: (actions: React.ReactNode) => void;
}) {
  const [path, setPath] = useState(FILE_MANAGER_ROOT);
  const [pathDraft, setPathDraft] = useState(FILE_MANAGER_ROOT);
  const [entries, setEntries] = useState<FileManagerEntry[]>([]);
  const [status, setStatus] = useState(() => t(locale, "fileManager.status.ready"));
  const [busy, setBusy] = useState(false);
  const [pathExpanded, setPathExpanded] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [transfers, setTransfers] = useState<TransferTask[]>([]);
  const [panelKind, setPanelKind] = useState<TransferKind | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [renameTarget, setRenameTarget] = useState<RenameTarget | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [renameError, setRenameError] = useState("");
  const cancelRef = useRef<CancelHandle | null>(null);
  const activeTransfer = transfers.find((task) => task.status === "active") ?? null;

  const updateTask = useCallback((id: string, patch: Partial<TransferTask>) => {
    setTransfers((tasks) => tasks.map((task) => (task.id === id ? { ...task, ...patch } : task)));
  }, []);

  const cancelActiveTransfer = useCallback(() => {
    const handle = cancelRef.current;
    if (!handle || handle.cancelled) return;
    handle.cancelled = true;
    updateTask(handle.id, { status: "cancelled" });
    setStatus(t(locale, "fileManager.status.cancelled"));
    void handle.cancel?.();
  }, [locale, updateTask]);

  const load = useCallback(async (targetPath = path) => {
    if (busy) return;
    const nextPath = normalizeUserStoragePath(targetPath);
    setPath(nextPath);
    setPathDraft(nextPath);
    setBusy(true);
    setStatus(t(locale, "fileManager.status.reading"));
    const connection = serial ? await WebADB.getInstance().connectGranted(serial) : await WebADB.getInstance().requestDevice();
    if (!connection) {
      setBusy(false);
      setStatus(t(locale, "deviceTips.status.permissionRequired"));
      onNeedPermission();
      return;
    }
    let sync: Awaited<ReturnType<typeof connection.adb.sync>> | undefined;
    try {
      sync = await connection.adb.sync();
      const list = await sync.readdir(nextPath);
      setEntries(
        list.sort((a, b) => {
          const aDir = isDirectoryEntry(a);
          const bDir = isDirectoryEntry(b);
          if (aDir !== bDir) return aDir ? -1 : 1;
          return a.name.localeCompare(b.name);
        })
      );
      setStatus(t(locale, "fileManager.status.readCount", { count: list.length }));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      await sync?.dispose();
      await connection.dispose();
      setBusy(false);
    }
  }, [busy, locale, onNeedPermission, path, serial]);

  useEffect(() => {
    void load(FILE_MANAGER_ROOT);
  }, []);

  const breadcrumbs = getPathSegments(path);
  const hasUploadHistory = transfers.some((task) => task.kind === "upload");
  const hasDownloadHistory = transfers.some((task) => task.kind === "download");
  const isTransferring = Boolean(activeTransfer);

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    if (activeTransfer) return;
    const uploadList = Array.from(files).filter((file) => file.size >= 0);
    if (!uploadList.length) return;

    const tasks = uploadList.map((file, index) => ({
      id: `upload-${Date.now()}-${index}`,
      kind: "upload" as const,
      name: file.name,
      progress: 0,
      status: "pending" as const
    }));
    setTransfers((current) => [...current, ...tasks]);
    setPanelKind("upload");
    setStatus(t(locale, "fileManager.status.uploadPreparing", { count: uploadList.length }));

    const connection = serial ? await WebADB.getInstance().connectGranted(serial) : await WebADB.getInstance().requestDevice();
    if (!connection) {
      setTransfers((current) => current.filter((task) => !tasks.some((next) => next.id === task.id)));
      setStatus(t(locale, "deviceTips.status.permissionRequired"));
      onNeedPermission();
      return;
    }

    let sync: Awaited<ReturnType<typeof connection.adb.sync>> | undefined;
    let reloadAfterCleanup = false;
    let completedUploads = 0;
    let activeUploadTaskId: string | null = null;
    try {
      sync = await connection.adb.sync();
      for (let index = 0; index < uploadList.length; index += 1) {
        const file = uploadList[index];
        const task = tasks[index];
        let uploaded = 0;
        const reader = file.stream().getReader();
        const handle: CancelHandle = { id: task.id, cancelled: false, cancel: () => reader.cancel() };
        cancelRef.current = handle;
        activeUploadTaskId = task.id;
        updateTask(task.id, { status: "active", progress: 0 });
        setStatus(t(locale, "fileManager.status.uploading", { name: file.name }));

        const stream = new ReadableStream<Uint8Array>({
          async pull(controller) {
            if (handle.cancelled) throw new Error(CANCELLED_TRANSFER);
            const { done, value } = await reader.read();
            if (done) {
              controller.close();
              return;
            }
            uploaded += value.byteLength;
            updateTask(task.id, { progress: file.size ? Math.min(100, Math.round((uploaded / file.size) * 100)) : 100 });
            controller.enqueue(value);
          },
          cancel() {
            return reader.cancel();
          }
        });

        await sync.write({
          filename: joinDevicePath(path, file.name),
          file: stream as any,
          permission: 0o644,
          mtime: Math.floor(file.lastModified / 1000)
        });
        updateTask(task.id, { status: "done", progress: 100 });
        completedUploads += 1;
        activeUploadTaskId = null;
      }
      setStatus(t(locale, "fileManager.status.uploaded", { count: uploadList.length }));
      reloadAfterCleanup = true;
    } catch (error) {
      if (isCancelledTransfer(error) || cancelRef.current?.cancelled) {
        setStatus(t(locale, "fileManager.status.cancelled"));
      } else {
        if (completedUploads === uploadList.length) {
          setStatus(t(locale, "fileManager.status.uploaded", { count: uploadList.length }));
          reloadAfterCleanup = true;
        } else {
          if (activeUploadTaskId) updateTask(activeUploadTaskId, { status: "error" });
          setStatus(error instanceof Error ? error.message : String(error));
        }
      }
    } finally {
      cancelRef.current = null;
      setIsDraggingFile(false);
      try {
        await sync?.dispose();
      } catch (error) {
        console.warn("[neoScrcpy:fileManager] failed to dispose sync after upload", error);
      }
      try {
        await connection.dispose();
      } catch (error) {
        console.warn("[neoScrcpy:fileManager] failed to dispose connection after upload", error);
      }
      if (reloadAfterCleanup) await load(path);
    }
  }, [activeTransfer, load, locale, onNeedPermission, path, serial, updateTask]);

  const downloadEntry = useCallback(async (entry: FileManagerEntry) => {
    if (activeTransfer || isDirectoryEntry(entry)) return;
    const task: TransferTask = {
      id: `download-${Date.now()}`,
      kind: "download",
      name: entry.name,
      progress: 0,
      status: "active"
    };
    setTransfers((current) => [...current, task]);
    setPanelKind("download");
    setStatus(t(locale, "fileManager.status.downloading", { name: entry.name }));

    const connection = serial ? await WebADB.getInstance().connectGranted(serial) : await WebADB.getInstance().requestDevice();
    if (!connection) {
      setTransfers((current) => current.filter((item) => item.id !== task.id));
      setStatus(t(locale, "deviceTips.status.permissionRequired"));
      onNeedPermission();
      return;
    }

    let sync: Awaited<ReturnType<typeof connection.adb.sync>> | undefined;
    try {
      sync = await connection.adb.sync();
      const total = Math.max(0, Number(entry.size));
      const chunks: BlobPart[] = [];
      let downloaded = 0;
      const reader = sync.read(joinDevicePath(path, entry.name)).getReader();
      const handle: CancelHandle = { id: task.id, cancelled: false, cancel: () => reader.cancel() };
      cancelRef.current = handle;

      try {
        while (true) {
          if (handle.cancelled) throw new Error(CANCELLED_TRANSFER);
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = new Uint8Array(value.byteLength);
          chunk.set(value);
          chunks.push(chunk.buffer);
          downloaded += value.byteLength;
          updateTask(task.id, { progress: total ? Math.min(100, Math.round((downloaded / total) * 100)) : 0 });
        }
      } finally {
        reader.releaseLock();
      }

      const blob = new Blob(chunks, { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = entry.name;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      updateTask(task.id, { status: "done", progress: 100 });
      setStatus(t(locale, "fileManager.status.downloaded", { name: entry.name }));
    } catch (error) {
      if (isCancelledTransfer(error) || cancelRef.current?.cancelled) {
        updateTask(task.id, { status: "cancelled" });
        setStatus(t(locale, "fileManager.status.cancelled"));
      } else {
        updateTask(task.id, { status: "error" });
        setStatus(error instanceof Error ? error.message : String(error));
      }
    } finally {
      cancelRef.current = null;
      await sync?.dispose();
      await connection.dispose();
    }
  }, [activeTransfer, locale, onNeedPermission, path, serial, updateTask]);

  const confirmDeleteEntry = useCallback((entry: FileManagerEntry) => {
    if (busy || activeTransfer) return;
    setDeleteTarget({
      entry,
      path: joinDevicePath(path, entry.name),
      isDirectory: isDirectoryEntry(entry)
    });
  }, [activeTransfer, busy, path]);

  const confirmRenameEntry = useCallback((entry: FileManagerEntry) => {
    if (busy || activeTransfer) return;
    setRenameTarget({ entry, path: joinDevicePath(path, entry.name) });
    setRenameDraft(entry.name);
    setRenameError("");
  }, [activeTransfer, busy, path]);

  const deleteEntry = useCallback(async () => {
    const target = deleteTarget;
    if (!target || busy || activeTransfer) return;
    setDeleteTarget(null);
    setBusy(true);
    setStatus(t(locale, "fileManager.status.deleting", { name: target.entry.name }));

    const connection = serial ? await WebADB.getInstance().connectGranted(serial) : await WebADB.getInstance().requestDevice();
    if (!connection) {
      setBusy(false);
      setStatus(t(locale, "deviceTips.status.permissionRequired"));
      onNeedPermission();
      return;
    }

    let reloadAfterCleanup = false;
    try {
      await connection.adb.subprocess.noneProtocol.spawnWaitText(["rm", "-rf", target.path]);
      setStatus(t(locale, "fileManager.status.deleted", { name: target.entry.name }));
      reloadAfterCleanup = true;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      await connection.dispose();
      setBusy(false);
      if (reloadAfterCleanup) await load(path);
    }
  }, [activeTransfer, busy, deleteTarget, load, locale, onNeedPermission, path, serial]);

  const renameEntry = useCallback(async () => {
    const target = renameTarget;
    const nextName = renameDraft.trim();
    if (!target || busy || activeTransfer) return;
    if (!isValidEntryName(nextName)) {
      setRenameError(t(locale, "fileManager.rename.invalid"));
      return;
    }
    if (nextName === target.entry.name) {
      setRenameTarget(null);
      return;
    }

    setRenameTarget(null);
    setBusy(true);
    setStatus(t(locale, "fileManager.status.renaming", { name: target.entry.name }));

    const connection = serial ? await WebADB.getInstance().connectGranted(serial) : await WebADB.getInstance().requestDevice();
    if (!connection) {
      setBusy(false);
      setStatus(t(locale, "deviceTips.status.permissionRequired"));
      onNeedPermission();
      return;
    }

    let reloadAfterCleanup = false;
    try {
      await connection.adb.subprocess.noneProtocol.spawnWaitText(["mv", target.path, joinDevicePath(path, nextName)]);
      setStatus(t(locale, "fileManager.status.renamed", { name: nextName }));
      reloadAfterCleanup = true;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      await connection.dispose();
      setBusy(false);
      if (reloadAfterCleanup) await load(path);
    }
  }, [activeTransfer, busy, load, locale, onNeedPermission, path, renameDraft, renameTarget, serial]);

  useEffect(() => {
    onUpdateHeaderActions(
      <>
        {hasUploadHistory && (
          <TransferButton
            kind="upload"
            locale={locale}
            open={panelKind === "upload"}
            progress={taskProgress(transfers, "upload")}
            tasks={transfers.filter((task) => task.kind === "upload")}
            onToggle={() => setPanelKind((value) => (value === "upload" ? null : "upload"))}
            onCancel={cancelActiveTransfer}
          />
        )}
        {hasDownloadHistory && (
          <TransferButton
            kind="download"
            locale={locale}
            open={panelKind === "download"}
            progress={taskProgress(transfers, "download")}
            tasks={transfers.filter((task) => task.kind === "download")}
            onToggle={() => setPanelKind((value) => (value === "download" ? null : "download"))}
            onCancel={cancelActiveTransfer}
          />
        )}
        <IconButton
          onClick={() => setPathExpanded((value) => !value)}
          title={pathExpanded ? t(locale, "fileManager.path.collapse") : t(locale, "fileManager.path.expand")}
          style={pathExpanded ? { background: "var(--color-surface-container-highest)" } : undefined}
        >
          <IconFolder size={20} />
        </IconButton>
        <IconButton onClick={() => void load(path)} title={t(locale, "common.refresh")} disabled={busy || isTransferring}>
          <IconRefresh size={20} />
        </IconButton>
      </>
    );
    return () => onUpdateHeaderActions(null);
  }, [
    busy,
    cancelActiveTransfer,
    hasDownloadHistory,
    hasUploadHistory,
    isTransferring,
    load,
    locale,
    onUpdateHeaderActions,
    panelKind,
    path,
    pathExpanded,
    transfers
  ]);

  return (
    <div className="container" style={{ paddingTop: 12, height: "100%", minHeight: 0, overflow: "hidden", gap: 12 }}>
      <div
        className="customScrollbar"
        style={{ flex: "0 0 auto", display: "flex", gap: 6, alignItems: "center", overflowX: "auto", padding: "0 4px 2px", whiteSpace: "nowrap" }}
      >
        {breadcrumbs.map((item, index) => (
          <React.Fragment key={item.path}>
            {index > 0 && <span className="muted" style={{ fontSize: 12 }}>/</span>}
            <button
              type="button"
              onClick={() => void load(item.path)}
              disabled={busy || isTransferring || item.path === path}
              style={{
                border: 0,
                background: item.path === path ? "var(--color-surface-container-high)" : "transparent",
                color: "var(--color-on-surface)",
                borderRadius: 999,
                padding: "4px 8px",
                fontSize: 12,
                fontWeight: 700,
                cursor: busy || isTransferring || item.path === path ? "default" : "pointer",
                flex: "0 0 auto"
              }}
            >
              {item.label}
            </button>
          </React.Fragment>
        ))}
      </div>

      {pathExpanded && (
        <Card style={{ flex: "0 0 auto" }}>
          <div style={{ padding: 14 }}>
            <input
              className="pathInput"
              value={pathDraft}
              spellCheck={false}
              onChange={(event) => setPathDraft(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void load(pathDraft);
              }}
            />
          </div>
        </Card>
      )}

      <div className="muted" style={{ flex: "0 0 auto", fontSize: 12, lineHeight: 1.5, padding: "0 4px" }}>
        {status}
      </div>

      <div
        className="card customScrollbar"
        onDragOver={(event) => {
          if (!event.dataTransfer.types.includes("Files")) return;
          event.preventDefault();
          setIsDraggingFile(true);
        }}
        onDragLeave={(event) => {
          const related = event.relatedTarget;
          if (related instanceof Node && event.currentTarget.contains(related)) return;
          setIsDraggingFile(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDraggingFile(false);
          void uploadFiles(event.dataTransfer.files);
        }}
        style={{
          flex: "1 1 auto",
          minHeight: 0,
          overflow: "auto",
          position: "relative",
          outline: isDraggingFile ? `2px solid ${TRANSFER_BLUE}` : "none",
          outlineOffset: -2
        }}
      >
        {entries.length ? (
          entries.map((entry) => (
            <FileEntryRow
              key={entry.name}
              locale={locale}
              entry={entry}
              disabled={isTransferring}
              onOpen={() => void load(joinDevicePath(path, entry.name))}
              onDownload={() => void downloadEntry(entry)}
              onRename={() => confirmRenameEntry(entry)}
              onDelete={() => confirmDeleteEntry(entry)}
            />
          ))
        ) : (
          <div className="centerEmpty">{t(locale, "fileManager.empty")}</div>
        )}
        {isDraggingFile && (
          <div
            style={{
              position: "sticky",
              left: 0,
              right: 0,
              bottom: 0,
              padding: 14,
              background: "color-mix(in srgb, var(--color-surface-container-high) 92%, transparent)",
              color: "var(--color-on-surface)",
              fontSize: 13,
              fontWeight: 800,
              textAlign: "center",
              backdropFilter: "blur(10px)"
            }}
          >
            {t(locale, "fileManager.dropToUpload", { path })}
          </div>
        )}
      </div>
      {deleteTarget && (
        <DeleteConfirmDialog
          locale={locale}
          target={deleteTarget}
          disabled={busy || isTransferring}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void deleteEntry()}
        />
      )}
      {renameTarget && (
        <RenameDialog
          locale={locale}
          name={renameDraft}
          error={renameError}
          disabled={busy || isTransferring}
          onName={(name) => {
            setRenameDraft(name);
            setRenameError("");
          }}
          onCancel={() => setRenameTarget(null)}
          onConfirm={() => void renameEntry()}
        />
      )}
    </div>
  );
}

function DeleteConfirmDialog({
  locale,
  target,
  disabled,
  onCancel,
  onConfirm
}: {
  locale: Locale;
  target: DeleteTarget;
  disabled: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="file-delete-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "grid",
        placeItems: "center",
        padding: 18,
        background: "rgba(0,0,0,0.42)"
      }}
      onClick={onCancel}
    >
      <div
        className="card"
        style={{
          width: 340,
          maxWidth: "100%",
          padding: 18,
          background: "var(--color-surface-container-high)",
          color: "var(--color-on-surface)"
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 999,
              display: "grid",
              placeItems: "center",
              flex: "0 0 auto",
              color: "#b45309",
              background: "rgba(251,191,36,0.18)"
            }}
          >
            <IconWarning size={24} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div id="file-delete-title" style={{ fontSize: 17, fontWeight: 850 }}>
              {t(locale, "fileManager.delete.title")}
            </div>
            <div className="muted" style={{ marginTop: 8, fontSize: 13, lineHeight: 1.55, overflowWrap: "anywhere" }}>
              {t(locale, "fileManager.delete.body", { name: target.entry.name })}
              {target.isDirectory ? (
                <div style={{ marginTop: 6 }}>{t(locale, "fileManager.delete.directoryHint")}</div>
              ) : null}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
          <button className="pillBtn secondary" type="button" onClick={onCancel} disabled={disabled}>
            {t(locale, "common.cancel")}
          </button>
          <button className="pillBtn" type="button" onClick={onConfirm} disabled={disabled}>
            {t(locale, "fileManager.delete.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}

function RenameDialog({
  locale,
  name,
  error,
  disabled,
  onName,
  onCancel,
  onConfirm
}: {
  locale: Locale;
  name: string;
  error: string;
  disabled: boolean;
  onName: (name: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="file-rename-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "grid",
        placeItems: "center",
        padding: 18,
        background: "rgba(0,0,0,0.42)"
      }}
      onClick={onCancel}
    >
      <div
        className="card"
        style={{ width: 340, maxWidth: "100%", padding: 18, background: "var(--color-surface-container-high)" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div id="file-rename-title" style={{ fontSize: 17, fontWeight: 850, marginBottom: 12 }}>
          {t(locale, "fileManager.rename.title")}
        </div>
        <label className="muted" style={{ display: "block", fontSize: 12, fontWeight: 750, marginBottom: 6 }}>
          {t(locale, "fileManager.rename.name")}
        </label>
        <input
          className="pathInput"
          value={name}
          autoFocus
          spellCheck={false}
          disabled={disabled}
          onChange={(event) => onName(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onConfirm();
            if (event.key === "Escape") onCancel();
          }}
        />
        {error ? <div className="muted" style={{ marginTop: 8, fontSize: 12, color: "#b42318" }}>{error}</div> : null}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
          <button className="pillBtn secondary" type="button" onClick={onCancel} disabled={disabled}>
            {t(locale, "common.cancel")}
          </button>
          <button className="pillBtn" type="button" onClick={onConfirm} disabled={disabled}>
            {t(locale, "fileManager.rename.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}

function TransferButton({
  kind,
  locale,
  open,
  progress,
  tasks,
  onToggle,
  onCancel
}: {
  kind: TransferKind;
  locale: Locale;
  open: boolean;
  progress: number;
  tasks: TransferTask[];
  onToggle: () => void;
  onCancel: () => void;
}) {
  const title = kind === "upload" ? t(locale, "fileManager.transfer.uploads") : t(locale, "fileManager.transfer.downloads");
  const isRunning = tasks.some((task) => task.status === "pending" || task.status === "active");
  const [showCompleteRing, setShowCompleteRing] = useState(false);
  const wasRunningRef = useRef(false);

  useEffect(() => {
    if (isRunning) {
      wasRunningRef.current = true;
      setShowCompleteRing(false);
      return;
    }
    if (wasRunningRef.current) {
      wasRunningRef.current = false;
      setShowCompleteRing(tasks.some((task) => task.status === "done"));
    }
  }, [isRunning, tasks]);

  return (
    <div style={{ position: "relative" }}>
      <button className="iconBtn" type="button" title={title} onClick={onToggle} style={{ color: TRANSFER_BLUE, position: "relative" }}>
        {(isRunning || showCompleteRing) && (
          <ProgressRing
            completePulse={!isRunning}
            progress={isRunning ? progress : 100}
            onPulseEnd={() => setShowCompleteRing(false)}
          />
        )}
        {kind === "upload" ? <IconUpload size={20} /> : <IconDownload size={20} />}
      </button>
      {open && (
        <div
          className="card"
          style={{
            position: "fixed",
            top: 58,
            right: 12,
            zIndex: 30,
            width: 300,
            maxWidth: "calc(100vw - 24px)",
            padding: 10,
            boxShadow: "0 16px 40px rgba(0,0,0,0.22)"
          }}
        >
          <div style={{ padding: "4px 6px 8px", fontSize: 13, fontWeight: 850, color: "var(--color-on-surface)" }}>{title}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {tasks.map((task) => (
              <TransferTaskRow key={task.id} locale={locale} task={task} onCancel={onCancel} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProgressRing({
  completePulse,
  progress,
  onPulseEnd
}: {
  completePulse?: boolean;
  progress: number;
  onPulseEnd?: () => void;
}) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, progress)) / 100) * circumference;
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      onAnimationEnd={completePulse ? onPulseEnd : undefined}
      style={{
        position: "absolute",
        inset: 0,
        transform: "rotate(-90deg)",
        animation: completePulse ? "transferRingComplete 720ms ease-out forwards" : undefined
      }}
      aria-hidden
    >
      <circle cx="20" cy="20" r={radius} fill="none" stroke="rgba(11,132,255,0.18)" strokeWidth="2.5" />
      <circle
        cx="20"
        cy="20"
        r={radius}
        fill="none"
        stroke={TRANSFER_BLUE}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        strokeWidth="2.5"
        style={{ transition: "stroke-dashoffset 120ms ease" }}
      />
    </svg>
  );
}

function TransferTaskRow({ locale, task, onCancel }: { locale: Locale; task: TransferTask; onCancel: () => void }) {
  const [hovered, setHovered] = useState(false);
  const canCancel = task.status === "active";
  const statusText = useMemo(() => {
    if (task.status === "cancelled") return t(locale, "common.cancelled");
    if (task.status === "error") return t(locale, "fileManager.transfer.error");
    if (task.status === "pending") return t(locale, "fileManager.transfer.pending");
    return `${task.progress}%`;
  }, [locale, task.progress, task.status]);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ padding: 8, borderRadius: 12, background: "var(--color-surface)", display: "flex", flexDirection: "column", gap: 7 }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 750, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.name}</div>
          <div className="muted" style={{ marginTop: 2, fontSize: 11 }}>{statusText}</div>
        </div>
        {hovered && canCancel && (
          <button className="iconBtn fileActionButton" type="button" title={t(locale, "common.cancel")} onClick={onCancel}>
            <IconClose size={17} />
          </button>
        )}
      </div>
      <div style={{ height: 5, borderRadius: 999, overflow: "hidden", background: "var(--color-surface-container-highest)" }}>
        <div
          style={{
            width: `${Math.max(0, Math.min(100, task.progress))}%`,
            height: "100%",
            borderRadius: 999,
            background: TRANSFER_BLUE,
            transition: "width 120ms ease"
          }}
        />
      </div>
    </div>
  );
}

function FileEntryRow({
  locale,
  entry,
  disabled,
  onOpen,
  onDownload,
  onRename,
  onDelete
}: {
  locale: Locale;
  entry: FileManagerEntry;
  disabled: boolean;
  onOpen: () => void;
  onDownload: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const isDirectory = isDirectoryEntry(entry);

  return (
    <div
      className={["listItem", isDirectory && !disabled ? "clickable" : ""].filter(Boolean).join(" ")}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={isDirectory && !disabled ? onOpen : undefined}
    >
      <div className="listLead">
        <div className="listIcon">{getFileIcon(entry)}</div>
        <div className="listTexts">
          <div className="listTitle">{entry.name}</div>
          <div className="listSubtitle">{isDirectory ? t(locale, "common.folder") : formatFileSize(entry.size)}</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {hovered && (
          <button
            className="iconBtn fileActionButton"
            title={t(locale, "fileManager.rename.action")}
            type="button"
            disabled={disabled}
            onClick={(event) => {
              event.stopPropagation();
              onRename();
            }}
          >
            <IconEdit size={18} />
          </button>
        )}
        {hovered && (
          <button
            className="iconBtn fileActionButton"
            title={t(locale, "fileManager.delete.action")}
            type="button"
            disabled={disabled}
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
          >
            <IconDelete size={18} />
          </button>
        )}
        {!isDirectory && hovered && (
          <button
            className="iconBtn fileActionButton"
            title={t(locale, "common.downloadFile")}
            type="button"
            disabled={disabled}
            onClick={(event) => {
              event.stopPropagation();
              onDownload();
            }}
          >
            <IconDownload size={18} />
          </button>
        )}
        {isDirectory ? <IconChevronRight size={18} /> : null}
      </div>
    </div>
  );
}
