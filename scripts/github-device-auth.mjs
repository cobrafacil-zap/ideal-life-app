#!/usr/bin/env node
/**
 * GitHub Device Flow para autenticar git push no macOS.
 *
 * Como usar:
 *   1. Gere um "OAuth App" no GitHub (https://github.com/settings/developers)
 *      - Homepage URL: http://localhost
 *      - Callback URL: http://localhost
 *      - Copie o "Client ID" do app
 *   2. Rode: GITHUB_CLIENT_ID=seu_client_id node scripts/github-device-auth.mjs
 *   3. O script vai mostrar um codigo (XXXX-XXXX) e abrir o navegador em
 *      https://github.com/login/device — autorize e o token sera gravado
 *      no Keychain do macOS via git-credential-osxkeychain.
 *
 * Se preferir nao expor o Client ID via env, edite a constante CLIENT_ID
 * abaixo (cuidado ao commitar).
 */

import { spawn } from 'node:child_process';
import { spawnSync } from 'node:child_process';
import { platform } from 'node:os';

const CLIENT_ID = process.env.GITHUB_CLIENT_ID || 'Iv23liYOUR_CLIENT_ID_HERE';
const SCOPE = 'repo';
const HOST = 'github.com';

if (!CLIENT_ID || CLIENT_ID.startsWith('Iv23liYOUR_CLIENT_ID')) {
  console.error('\n[ERRO] Defina o Client ID do seu OAuth App GitHub.');
  console.error('       Crie em https://github.com/settings/developers');
  console.error('       Em seguida rode:');
  console.error('       GITHUB_CLIENT_ID=seu_client_id node scripts/github-device-auth.mjs\n');
  process.exit(1);
}

async function requestDeviceCode() {
  const res = await fetch('https://github.com/login/device/code', {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: CLIENT_ID, scope: SCOPE }),
  });
  if (!res.ok) throw new Error(`Falha no /login/device/code: ${res.status} ${await res.text()}`);
  return res.json();
}

async function pollAccessToken(deviceCode, interval, expiresAt) {
  while (Date.now() < expiresAt) {
    await new Promise((r) => setTimeout(r, interval * 1000));
    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        device_code: deviceCode,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      }),
    });
    const data = await res.json();
    if (data.access_token) return data;
    if (data.error === 'authorization_pending') continue;
    if (data.error === 'slow_down') {
      interval += 5;
      continue;
    }
    if (data.error === 'expired_token') throw new Error('Codigo expirado. Rode de novo.');
    if (data.error === 'access_denied') throw new Error('Autorizacao negada pelo usuario.');
    throw new Error(`Erro: ${JSON.stringify(data)}`);
  }
  throw new Error('Tempo esgotado. Rode de novo.');
}

function storeInKeychain(user, token) {
  if (platform() !== 'darwin') {
    console.warn(`[AVISO] plataforma ${platform()} nao suporta Keychain via helper.`);
    console.warn('        Salvando em ~/.git-credentials manualmente.');
    import('node:fs').then((fs) => {
      const line = `https://${user}:${token}@${HOST}\n`;
      fs.appendFileSync(`${process.env.HOME}/.git-credentials`, line, { mode: 0o600 });
    });
    return;
  }
  // Configura o helper uma unica vez
  spawnSync('git', ['config', '--global', '--replace-all', 'credential.helper', 'osxkeychain'], { stdio: 'inherit' });

  // git credential-osxkeychain store < protocol=https\nhost=github.com\nusername=user\npassword=token
  const stdinPayload = `protocol=https\nhost=${HOST}\nusername=${user}\npassword=${token}\n`;
  const proc = spawn('git', ['credential-osxkeychain', 'store'], { stdio: ['pipe', 'inherit', 'inherit'] });
  proc.stdin.end(stdinPayload);
  return new Promise((resolve, reject) => {
    proc.on('error', reject);
    proc.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`credential-osxkeychain saiu com codigo ${code}`));
    });
  });
}

function openBrowser(url) {
  spawn('open', [url], { stdio: 'ignore' });
}

async function whoAmI(token) {
  const res = await fetch('https://api.github.com/user', {
    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json' },
  });
  if (!res.ok) throw new Error(`Falha ao validar token: ${res.status}`);
  return res.json();
}

(async () => {
  console.log('\nGitHub Device Flow — VITTA\n');
  const { device_code, user_code, verification_uri, interval, expires_in } = await requestDeviceCode();

  console.log('==============================================');
  console.log(` Codigo de verificacao:  ${user_code}`);
  console.log(` URL:                   ${verification_uri}`);
  console.log('==============================================');
  openBrowser(verification_uri);
  console.log('\nAbri o navegador. Autorize o app e o token sera salvo automaticamente.');
  console.log('(expira em', expires_in, 'segundos)\n');

  const expiresAt = Date.now() + expires_in * 1000;
  const { access_token } = await pollAccessToken(device_code, interval, expiresAt);

  const user = await whoAmI(access_token);
  console.log(`[OK] Autenticado como @${user.login}\n`);

  await storeInKeychain(user.login, access_token);
  console.log('[OK] Token salvo no Keychain do macOS para github.com.');
  console.log('     Agora "git push" funciona sem pedir senha.\n');
})().catch((err) => {
  console.error('\n[FALHOU]', err.message, '\n');
  process.exit(1);
});
