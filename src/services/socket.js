// services/socket.js - SON HALİ
import io from 'socket.io-client';
import { SOCKET_URL } from '../config';

class SocketService {
  constructor() {
    this.socket = null;
    this.driverId = null;
  }

  connect() {
    if (this.socket?.connected) return this.socket;

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000
    });

    this.socket.on('connect', () => {
      console.log('✅ SOCKET BAĞLANDI');
      if (this.driverId) this.registerDriver(this.driverId);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket bağlantısı koptu:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.log('❌ Socket bağlantı hatası:', error?.message);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.driverId = null;
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected() {
    return this.socket?.connected || false;
  }

  setDriverId(id) {
    this.driverId = id;
  }

  registerDriver(driverId) {
    this.driverId = driverId;
    if (this.socket?.connected) {
      this.socket.emit('driver:register', driverId);
      console.log('✅ driver:register ->', driverId);
    }
  }

  updateLocation(driverId, lat, lng) {
    if (this.socket?.connected) {
      this.socket.emit('driver:update-location', { driverId, lat, lng });
    }
  }

  acceptTrip(tripId, driverId) {
    if (this.socket?.connected) {
      this.socket.emit('driver:accept-trip', { tripId, driverId });
      console.log('✅ driver:accept-trip ->', tripId);
    }
  }

  rejectTrip(tripId, driverId) {
    if (this.socket?.connected) {
      this.socket.emit('driver:reject-trip', { tripId, driverId });
      console.log('❌ driver:reject-trip ->', tripId);
    }
  }

  requestVerificationCode(tripId, driverId) {
    if (this.socket?.connected) {
      this.socket.emit('driver:request-verification-code', { tripId, driverId });
      console.log('🔑 request-verification-code ->', tripId);
    }
  }

  startTrip(tripId, driverId) {
    if (this.socket?.connected) {
      this.socket.emit('driver:start-trip', { tripId, driverId });
      console.log('🚗 driver:start-trip ->', tripId);
    }
  }

  cancelTrip(tripId, driverId) {
    if (this.socket?.connected) {
      this.socket.emit('driver:cancel-trip', { tripId, driverId });
      console.log('❌ driver:cancel-trip ->', tripId);
    }
  }


  // completeTrip metodu (cancelTrip'ten sonra ekleyin)
  completeTrip(tripId, driverId, actual_distance, actual_duration, total_fare) {
    if (this.socket?.connected) {
      this.socket.emit('driver:complete-trip', {
        tripId,
        driverId,
        actual_distance,
        actual_duration,
        total_fare
      });
      console.log('🏁 driver:complete-trip ->', tripId);
    }
  }

  // ========== LİSTENER'LAR ==========
  onNewTripRequest(callback) {
    this.socket?.on('driver:new-trip-request', callback);
  }

  onTripAssigned(callback) {
    this.socket?.on('driver:trip-assigned', callback);
  }

  onTripCancelled(callback) {
    this.socket?.on('driver:trip-cancelled', callback);
  }

  onTripCompleted(callback) {
    this.socket?.on('driver:trip-completed', callback);
  }

  onTripRejected(callback) {
    this.socket?.on('driver:trip-rejected', callback);
  }

  onAcceptFailed(callback) {
    this.socket?.on('accept-failed', callback);
  }

  onNewMessage(callback) {
    this.socket?.on('chat:new-message', callback);
  }

  removeListeners() {
    if (!this.socket) return;
    const events = [
      'driver:new-trip-request', 'driver:trip-assigned', 'driver:trip-cancelled',
      'driver:trip-completed', 'accept-failed', 'chat:new-message'
    ];
    events.forEach(event => this.socket?.off(event));
  }

  // ========== CHAT METODLARI ==========
  sendMessage(tripId, message, senderId, senderType) {
    if (this.socket?.connected) {
      this.socket.emit('chat:send-message', {
        tripId,
        message,
        senderId,
        senderType
      });
      console.log('💬 chat:send-message ->', tripId);
    }
  }

  onNewMessage(callback) {
    this.socket?.on('chat:new-message', callback);
  }

  onMessageSent(callback) {
    this.socket?.on('chat:message-sent', callback);
  }

  // removeListeners'a ekleyin
  removeListeners() {
    if (!this.socket) return;
    const events = [
      'driver:new-trip-request', 'driver:trip-assigned', 'driver:trip-cancelled',
      'driver:trip-completed', 'accept-failed', 'chat:new-message', 'chat:message-sent'
    ];
    events.forEach(event => this.socket?.off(event));
  }

}

const socketService = new SocketService();
export default socketService;