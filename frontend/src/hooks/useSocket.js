import { useEffect, useCallback } from 'react';
import { getSocket, connectSocket } from '../services/socket';

export const useSocket = (room) => {
  const socket = getSocket();

  useEffect(() => {
    connectSocket();

    if (room) {
      socket.emit('join_order', room);
    }

    return () => {
      // We don't necessarily want to disconnect globally on every unmount, 
      // but we could leave the room if the backend supported it.
    };
  }, [room]);

  const emit = useCallback((event, data) => {
    socket.emit(event, data);
  }, [socket]);

  const on = useCallback((event, callback) => {
    socket.on(event, callback);
    return () => socket.off(event, callback);
  }, [socket]);

  return { socket, emit, on };
};
