import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

export function useSocket(
  namespace: string,
  listeners: Record<string, (...args: any[]) => void>,
): Socket | null {
  const { token } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    const socket = io(namespace, {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('gateway:ping', () => {
      socket.emit('gateway:pong');
    });

    for (const [event, handler] of Object.entries(listeners)) {
      socket.on(event, handler);
    }

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, namespace]);

  return socketRef.current;
}
