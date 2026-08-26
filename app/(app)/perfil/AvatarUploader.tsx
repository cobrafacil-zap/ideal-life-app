"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { uploadAvatarAction } from "./actions";

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];

/**
 * UI de upload de avatar. O arquivo é enviado via Server Action
 * (`uploadAvatarAction`), que faz o upload para o bucket privado `avatars`
 * e grava o `storage_path` em `profiles.avatar_url`.
 */
export function AvatarUploader({
  currentSignedUrl,
}: {
  currentSignedUrl: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED.includes(file.type)) {
      setError("Use PNG, JPG ou WebP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Arquivo maior que 2 MB.");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setError("Selecione uma imagem primeiro.");
      return;
    }
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.append("avatar", file);
        await uploadAvatarAction(fd);
        if (preview) URL.revokeObjectURL(preview);
        setPreview(null);
        if (inputRef.current) inputRef.current.value = "";
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao enviar.");
      }
    });
  }

  const shownUrl = preview ?? currentSignedUrl;

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-ember-gradient text-white shadow-floating">
          {shownUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shownUrl}
              alt="Sua foto de perfil"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-xl font-semibold opacity-80">+</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <label className="block">
            <span className="sr-only">Selecionar imagem</span>
            <input
              ref={inputRef}
              type="file"
              name="avatar"
              accept={ACCEPTED.join(",")}
              onChange={onFileChange}
              className="block w-full text-[12px] text-ink-soft file:mr-3 file:rounded-xl file:border-0 file:bg-moss-soft file:px-3 file:py-1.5 file:text-[12px] file:font-semibold file:text-moss-dark hover:file:bg-moss-soft/80"
            />
          </label>
          <p className="mt-1 text-[11px] text-ink-faint">
            PNG, JPG ou WebP até 2 MB.
          </p>
        </div>
      </div>
      {error && (
        <p className="text-[12px] text-ember-dark" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" loading={isPending} variant="secondary" size="sm">
        Salvar foto
      </Button>
    </form>
  );
}
