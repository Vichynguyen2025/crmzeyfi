const BASE = '/api';
function token() { return localStorage.getItem('zeyfi_token'); }

export async function api(path: string, opts?: RequestInit) {
  const res = await fetch(BASE + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token(), ...opts?.headers },
  });
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('zeyfi_token');
      localStorage.removeItem('zeyfi_user');
      window.location.href = '/login';
      throw new Error('Phiên đăng nhập đã hết hạn');
    }
    const e = await res.json().catch(() => ({error:'Error'}));
    throw new Error(e.error || 'Error');
  }
  return res.json();
}
