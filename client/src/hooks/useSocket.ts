import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL, getAccessToken } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

export function useSocket(onNotification?: (payload: unknown) => void) {
  const user = useAuthStore((s) => s.user);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user) return;
    const token = getAccessToken();
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    if (onNotification) socket.on('notification:new', onNotification);

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, onNotification]);

  return socketRef;
}
