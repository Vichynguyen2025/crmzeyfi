import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(window.location.origin, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
    socket.on('connect', () => console.log('[WS] Connected'));
    socket.on('disconnect', () => console.log('[WS] Disconnected'));
  }
  return socket;
}

export function useRealtime(event: string, callback: (data: any) => void) {
  const sock = getSocket();
  sock.on(event, callback);
  return () => { sock.off(event, callback); };
}
