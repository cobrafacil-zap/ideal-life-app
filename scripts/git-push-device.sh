#!/usr/bin/env bash
# Inicializa o repo (se necessario), configura o remote do GitHub
# e faz o push usando o token armazenado no Keychain pelo Device Flow.
#
# Uso:
#   GITHUB_CLIENT_ID=xxx npm run push:device
#
# Fluxo:
#   1. Se nao existir .git, roda git init + cria branch main.
#   2. Adiciona o remote origin -> https://github.com/cobrafacil-zap/ideal-life-app.git
#   3. Se nao houver credencial salva no Keychain, executa o Device Flow.
#   4. git add . && git commit (se houver algo) && git push -u origin main.

set -euo pipefail

cd "$(dirname "$0")/.."

REMOTE_URL="https://github.com/cobrafacil-zap/ideal-life-app.git"
BRANCH="main"

# 1. Inicializa o repositorio local se ainda nao existir
if [ ! -d .git ]; then
  echo "[setup] git init"
  git init -b "$BRANCH" >/dev/null
fi

# 2. Garante que branch atual seja main
current_branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '')"
if [ "$current_branch" != "$BRANCH" ]; then
  echo "[setup] criando branch $BRANCH"
  git checkout -B "$BRANCH"
fi

# 3. Configura o remote origin (cria ou substitui)
if git remote get-url origin >/dev/null 2>&1; then
  current_url="$(git remote get-url origin)"
  if [ "$current_url" != "$REMOTE_URL" ]; then
    echo "[setup] atualizando remote origin: $current_url -> $REMOTE_URL"
    git remote set-url origin "$REMOTE_URL"
  fi
else
  echo "[setup] adicionando remote origin -> $REMOTE_URL"
  git remote add origin "$REMOTE_URL"
fi

# 4. Verifica se ja existe credencial salva no Keychain para github.com
has_cred() {
  local probe="protocol=https
host=github.com
"
  echo "$probe" | git credential-osxkeychain get >/dev/null 2>&1
}

if ! has_cred; then
  echo "[auth] nenhuma credencial encontrada para github.com no Keychain."
  echo "[auth] rodando Device Flow..."
  GITHUB_CLIENT_ID="${GITHUB_CLIENT_ID:-}" node scripts/github-device-auth.mjs
fi

# 5. Configura user.name / user.email local se nao existir
if [ -z "$(git config user.name 2>/dev/null || true)" ]; then
  git config user.name "VITTA Dev"
fi
if [ -z "$(git config user.email 2>/dev/null || true)" ]; then
  git config user.email "dev@vitta.local"
fi

# 6. Stage + commit (se houver algo novo)
if [ -n "$(git status --porcelain)" ]; then
  echo "[commit] criando commit inicial"
  git add -A
  git commit -m "chore: initial commit" >/dev/null
fi

# 7. Push
echo "[push] git push -u origin $BRANCH"
git push -u origin "$BRANCH"
