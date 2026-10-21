"use client";

import { useMemo, useRef, useState } from "react";
import {
  Bell,
  Cloud,
  CloudOff,
  Database,
  Download,
  FolderCog,
  LogIn,
  LogOut,
  Monitor,
  Moon,
  Palette,
  RefreshCcw,
  Sun,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, Segmented, Select } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Icon, ICON_NAMES } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import { useStore } from "@/lib/data/store";
import { CATEGORY_PALETTE } from "@/lib/constants";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ConfiguracoesPage() {
  const {
    state,
    updateSettings,
    addCategory,
    updateCategory,
    deleteCategory,
    resetDemo,
    clearAll,
    exportJson,
    importJson,
    signInWithGoogle,
    signInWithPassword,
    signUp,
    signOut,
    user,
    mode,
  } = useStore();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [catModal, setCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catName, setCatName] = useState("");
  const [catColor, setCatColor] = useState(CATEGORY_PALETTE[0].color);
  const [catIcon, setCatIcon] = useState("target");
  const [catScope, setCatScope] = useState<Category["scope"]>("neutro");
  const [confirmClear, setConfirmClear] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const goalCount = state.goals.length;

  const openCategory = (cat?: Category) => {
    if (cat) {
      setEditingCat(cat);
      setCatName(cat.name);
      setCatColor(cat.color);
      setCatIcon(cat.icon);
      setCatScope(cat.scope);
    } else {
      setEditingCat(null);
      setCatName("");
      setCatColor(CATEGORY_PALETTE[state.categories.length % CATEGORY_PALETTE.length].color);
      setCatIcon("target");
      setCatScope("neutro");
    }
    setCatModal(true);
  };

  const saveCategory = () => {
    if (!catName.trim()) {
      toast("Dê um nome à categoria.", "error");
      return;
    }
    if (editingCat) {
      updateCategory(editingCat.id, {
        name: catName,
        color: catColor,
        icon: catIcon,
        scope: catScope,
      });
      toast("Categoria atualizada.");
    } else {
      addCategory({
        name: catName,
        color: catColor,
        icon: catIcon,
        scope: catScope,
        isCustom: true,
      });
      toast("Categoria criada.");
    }
    setCatModal(false);
  };

  const handleExport = () => {
    const blob = new Blob([exportJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `smkpi-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Backup exportado.");
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importJson(String(reader.result ?? ""));
      toast(ok ? "Dados importados." : "Arquivo inválido.", ok ? "success" : "error");
    };
    reader.readAsText(file);
  };

  const runAuth = async (fn: () => Promise<{ ok: boolean; message: string }>) => {
    setAuthBusy(true);
    const result = await fn();
    setAuthBusy(false);
    toast(result.message, result.ok ? "success" : "error");
  };

  return (
    <div className="space-y-5">
      {/* Perfil */}
      <Card>
        <CardHeader
          title="Perfil"
          description="Como o app fala com você e como os valores são exibidos"
          icon={<User className="h-4 w-4" />}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Seu nome" htmlFor="cfg-name">
            <Input
              id="cfg-name"
              value={state.settings.displayName}
              onChange={(e) => updateSettings({ displayName: e.target.value })}
              placeholder="Como você quer ser chamado?"
            />
          </Field>
          <Field label="Moeda" htmlFor="cfg-currency">
            <Select
              id="cfg-currency"
              value={state.settings.currency}
              onChange={(e) => updateSettings({ currency: e.target.value })}
            >
              <option value="BRL">Real brasileiro (BRL)</option>
              <option value="USD">Dólar americano (USD)</option>
              <option value="EUR">Euro (EUR)</option>
            </Select>
          </Field>
        </div>
      </Card>

      {/* Aparência */}
      <Card>
        <CardHeader
          title="Aparência"
          description="Escolha o tema do aplicativo"
          icon={<Palette className="h-4 w-4" />}
        />
        <Segmented
          value={state.settings.theme}
          onChange={(theme) => updateSettings({ theme })}
          options={[
            { value: "light", label: "Claro", icon: <Sun className="h-3.5 w-3.5" /> },
            { value: "dark", label: "Escuro", icon: <Moon className="h-3.5 w-3.5" /> },
            { value: "system", label: "Sistema", icon: <Monitor className="h-3.5 w-3.5" /> },
          ]}
        />
      </Card>

      {/* Notificações */}
      <Card>
        <CardHeader
          title="Lembretes"
          description="Quando o app deve chamar sua atenção"
          icon={<Bell className="h-4 w-4" />}
          action={
            <Segmented
              value={state.settings.notificationsEnabled ? "on" : "off"}
              onChange={(v) => updateSettings({ notificationsEnabled: v === "on" })}
              options={[
                { value: "on", label: "Ativos" },
                { value: "off", label: "Desligados" },
              ]}
            />
          }
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Sem atualizar há (dias)" htmlFor="cfg-stale">
            <Input
              id="cfg-stale"
              type="number"
              min={1}
              max={60}
              value={state.settings.notifyStaleDays}
              onChange={(e) =>
                updateSettings({ notifyStaleDays: Number(e.target.value) || 7 })
              }
            />
          </Field>
          <Field label="Prazo próximo (dias)" htmlFor="cfg-due">
            <Input
              id="cfg-due"
              type="number"
              min={1}
              max={90}
              value={state.settings.notifyDueDays}
              onChange={(e) =>
                updateSettings({ notifyDueDays: Number(e.target.value) || 10 })
              }
            />
          </Field>
          <Field label="Quase concluída (%)" htmlFor="cfg-near">
            <Input
              id="cfg-near"
              type="number"
              min={50}
              max={99}
              value={state.settings.notifyNearCompletion}
              onChange={(e) =>
                updateSettings({ notifyNearCompletion: Number(e.target.value) || 85 })
              }
            />
          </Field>
        </div>
      </Card>

      {/* Categorias */}
      <Card>
        <CardHeader
          title="Categorias"
          description="Separe suas metas por área e crie as suas"
          icon={<FolderCog className="h-4 w-4" />}
          action={
            <Button size="sm" variant="secondary" onClick={() => openCategory()}>
              Nova categoria
            </Button>
          }
        />
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {state.categories.map((c) => {
            const count = state.goals.filter((g) => g.categoryId === c.id).length;
            return (
              <div
                key={c.id}
                className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5 transition-colors hover:bg-ink/[0.02]"
              >
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white"
                  style={{ background: c.color }}
                >
                  <Icon name={c.icon} className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[13.5px] font-semibold text-ink">{c.name}</span>
                    {c.isCustom ? <Badge tone="accent">custom</Badge> : null}
                  </span>
                  <span className="block text-[11.5px] text-ink-faint">
                    {count} {count === 1 ? "meta" : "metas"} · {c.scope}
                  </span>
                </span>
                <button
                  onClick={() => openCategory(c)}
                  className="rounded-lg px-2 py-1 text-[11.5px] font-semibold text-iris hover:bg-iris-soft"
                >
                  Editar
                </button>
                {c.isCustom ? (
                  <button
                    onClick={() => {
                      deleteCategory(c.id);
                      toast("Categoria excluída.", "info");
                    }}
                    className="grid h-7 w-7 place-items-center rounded-lg text-ink-faint hover:bg-rose-soft hover:text-rose"
                    aria-label="Excluir categoria"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Conta / sincronização */}
      <Card>
        <CardHeader
          title="Conta e sincronização"
          description={
            mode === "cloud"
              ? `Conectado como ${user?.email ?? "usuário"} — os dados ficam na nuvem`
              : "Você está no modo demonstração (dados salvos neste navegador)"
          }
          icon={mode === "cloud" ? <Cloud className="h-4 w-4" /> : <CloudOff className="h-4 w-4" />}
        />

        {mode === "cloud" ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-jade/30 bg-jade-soft px-4 py-3">
            <div className="flex items-center gap-2.5">
              <Cloud className="h-4 w-4 text-jade-dark" />
              <span className="text-[13px] font-semibold text-jade-dark">
                Sincronização ativa · {user?.email}
              </span>
            </div>
            <Button variant="outline" size="sm" leadingIcon={<LogOut className="h-3.5 w-3.5" />} onClick={() => signOut()}>
              Sair
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="primary"
                leadingIcon={<LogIn className="h-4 w-4" />}
                loading={authBusy}
                onClick={() => runAuth(signInWithGoogle)}
              >
                Entrar com Google
              </Button>
            </div>

            <div className="grid gap-4 rounded-xl border border-line bg-ink/[0.02] p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <Field label="E-mail" htmlFor="cfg-email">
                <Input
                  id="cfg-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@email.com"
                />
              </Field>
              <Field label="Senha" htmlFor="cfg-password">
                <Input
                  id="cfg-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </Field>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  loading={authBusy}
                  onClick={() => runAuth(() => signInWithPassword(email, password))}
                >
                  Entrar
                </Button>
                <Button
                  variant="secondary"
                  loading={authBusy}
                  onClick={() => runAuth(() => signUp(email, password))}
                >
                  Criar conta
                </Button>
              </div>
            </div>
            <p className="text-[12px] leading-relaxed text-ink-faint">
              Ao entrar, seus dados passam a ser salvos no Supabase e ficam disponíveis em
              qualquer dispositivo. O login com Google precisa estar habilitado no painel do
              Supabase (Authentication → Providers → Google).
            </p>
          </div>
        )}
      </Card>

      {/* Dados */}
      <Card>
        <CardHeader
          title="Dados"
          description="Exporte, restaure ou limpe os seus dados"
          icon={<Database className="h-4 w-4" />}
        />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" leadingIcon={<Download className="h-4 w-4" />} onClick={handleExport}>
            Exportar backup
          </Button>
          <Button
            variant="outline"
            leadingIcon={<Upload className="h-4 w-4" />}
            onClick={() => fileRef.current?.click()}
          >
            Importar backup
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImport(file);
              e.target.value = "";
            }}
          />
          <Button
            variant="secondary"
            leadingIcon={<RefreshCcw className="h-4 w-4" />}
            onClick={() => {
              resetDemo();
              toast("Dados de demonstração restaurados.");
            }}
          >
            Restaurar demonstração
          </Button>
          <Button
            variant="danger"
            leadingIcon={<Trash2 className="h-4 w-4" />}
            onClick={() => setConfirmClear(true)}
          >
            Limpar tudo
          </Button>
        </div>
        <p className="mt-3 text-[12px] text-ink-faint">
          {goalCount} metas · {state.categories.length} categorias · {state.habits.length} hábitos ·{" "}
          {state.progress.length} atualizações · {state.dreams.length} sonhos
        </p>
      </Card>

      {/* Modal categoria */}
      <Modal
        open={catModal}
        onClose={() => setCatModal(false)}
        title={editingCat ? "Editar categoria" : "Nova categoria"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCatModal(false)}>
              Cancelar
            </Button>
            <Button onClick={saveCategory}>Salvar</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Nome" htmlFor="cat-name">
            <Input
              id="cat-name"
              autoFocus
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="Ex.: Marketing"
            />
          </Field>
          <Field label="Âmbito">
            <Segmented
              value={catScope}
              onChange={setCatScope}
              options={[
                { value: "pessoal", label: "Pessoal" },
                { value: "profissional", label: "Profissional" },
                { value: "neutro", label: "Neutra" },
              ]}
            />
          </Field>
          <Field label="Cor">
            <div className="flex flex-wrap gap-2">
              {CATEGORY_PALETTE.map((c) => (
                <button
                  key={c.color}
                  type="button"
                  onClick={() => setCatColor(c.color)}
                  className={cn(
                    "h-8 w-8 rounded-full border-2 transition-all",
                    catColor === c.color ? "border-ink scale-110" : "border-transparent hover:scale-110",
                  )}
                  style={{ background: c.color }}
                  aria-label={c.name}
                />
              ))}
            </div>
          </Field>
          <Field label="Ícone">
            <div className="flex flex-wrap gap-1.5 rounded-xl border border-line bg-ink/[0.02] p-2.5">
              {ICON_NAMES.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setCatIcon(name)}
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-lg transition-all",
                    catIcon === name ? "bg-iris text-white" : "text-ink-faint hover:bg-ink/5 hover:text-ink",
                  )}
                >
                  <Icon name={name} className="h-[17px] w-[17px]" />
                </button>
              ))}
            </div>
          </Field>
        </div>
      </Modal>

      {confirmClear ? (
        <div className="fixed inset-0 z-[55] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setConfirmClear(false)}
          />
          <div className="relative z-10 w-full max-w-sm animate-scale-in rounded-card border border-line bg-surface p-6 shadow-float">
            <h3 className="font-display text-lg font-semibold text-ink">Apagar todos os dados?</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-faint">
              Todas as metas, hábitos, sonhos e histórico serão removidos deste navegador. Você
              pode restaurar os dados de demonstração depois.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmClear(false)}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  clearAll();
                  setConfirmClear(false);
                  toast("Dados apagados.", "info");
                }}
              >
                Apagar tudo
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
