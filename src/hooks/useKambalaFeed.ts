import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export interface TickData {
  token: string;
  lp: string; // Last price
  pc: string; // Price change
  c?: string;  // Close
  h?: string;  // High
  l?: string;  // Low
  o?: string;  // Open
  v?: string;  // Volume
  ts?: string; // Timestamp
}

export function useKambalaFeed(tokens: string[]) {
  const [ticks, setTicks] = useState<Record<string, TickData>>({});
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // 1. Initialize socket connection through local proxy
    // Namespace format: /<site_name>
    const socket = io('/crm.codenetic.online', {
      path: '/socket.io',
      withCredentials: true, // Automatically forwards the 'sid' session cookie from frappe-react-sdk login
      autoConnect: true,
      reconnection: true,
    });
    socketRef.current = socket;

    // 2. Setup lifecycle event listeners
    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to Kambala Feed Namespace');
      // Subscribe to requested tokens immediately upon connection
      if (tokens.length > 0) {
        socket.emit('price_subscribe', tokens);
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from Kambala Feed');
    });

    // 3. Listen to price tick updates
    socket.on('price_update', (tick: TickData) => {
      if (!tick || !tick.token) return;

      setTicks((prevTicks) => {
        const prev = prevTicks[tick.token];
        
        // Helper to verify if value is valid
        const isValid = (val: any) => {
          if (val === null || val === undefined || val === "") return false;
          const str = String(val).trim().toLowerCase();
          return str !== "null" && str !== "nan" && str !== "undefined";
        };

        if (prev) {
          const merged = { ...prev };
          (Object.keys(tick) as Array<keyof TickData>).forEach((key) => {
            const val = tick[key];
            if (isValid(val)) {
              merged[key] = val as any;
            }
          });
          return {
            ...prevTicks,
            [tick.token]: merged,
          };
        }

        return {
          ...prevTicks,
          [tick.token]: tick,
        };
      });
    });

    socket.on('subscribed', (msg) => {
      console.log('Successfully subscribed to tokens:', msg.subscribed);
    });

    socket.on('subscription_error', (err) => {
      console.error('Kambala Subscription Error:', err.error);
    });

    // 4. Handle dynamic token changes (subscribing / unsubscribing)
    return () => {
      if (socket.connected && tokens.length > 0) {
        socket.emit('price_unsubscribe', tokens);
      }
      socket.disconnect();
    };
  }, [JSON.stringify(tokens)]); // Re-run effect if tokens array changes

  return { ticks, isConnected };
}
