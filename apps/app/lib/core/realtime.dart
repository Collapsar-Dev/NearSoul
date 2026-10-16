import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'config.dart';

/// CHAT-002 realtime events. Screens listen to [events] and refresh what they show.
class Realtime {
  io.Socket? _socket;
  final _events = StreamController<RealtimeEvent>.broadcast();
  Stream<RealtimeEvent> get events => _events.stream;
  bool get connected => _socket?.connected ?? false;

  void connect(String token) {
    _socket?.dispose();
    final s = io.io(
      AppConfig.apiUrl,
      io.OptionBuilder().setPath('/ws').setTransports(['websocket', 'polling']).setAuth({'token': token}).disableAutoConnect().enableReconnection().build(),
    );
    for (final name in ['message.new', 'message.read', 'match.new', 'match.ended', 'notification.new']) {
      s.on(name, (data) => _events.add(RealtimeEvent(name, data is Map ? data.cast<String, dynamic>() : const {})));
    }
    s.connect();
    _socket = s;
  }

  void disconnect() {
    _socket?.dispose();
    _socket = null;
  }
}

class RealtimeEvent {
  RealtimeEvent(this.name, this.data);
  final String name;
  final Map<String, dynamic> data;
}

final realtimeProvider = Provider<Realtime>((ref) => Realtime());
