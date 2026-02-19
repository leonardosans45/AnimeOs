// src/services/tauriHttpClient.js
// Solo se importa dinámicamente desde hianimeService.js cuando se detecta Tauri


export async function tauriGet(url) {
  // Solo ejecutar en Tauri (no en navegador ni en Vite dev server)
  if (typeof window === 'undefined' || !('__TAURI__' in window)) {
    throw new Error('tauriGet solo puede usarse en entorno Tauri');
  }
  // Usar require para evitar que Vite analice el import
  // eslint-disable-next-line @typescript-eslint/no-var-requires, no-undef
  const http = window.__TAURI__ ? window.__TAURI__.http : require('@tauri-apps/api/http');
  // Si no existe window.__TAURI__.http, usar import dinámico (solo en Tauri)
  const httpApi = http || (await import('@tauri-apps/api/http'));
  const response = await httpApi.fetch(url, {
    method: 'GET',
    timeout: 30,
    responseType: httpApi.ResponseType.JSON
  });
  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }
  return response.data;
}
