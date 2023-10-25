import 'package:revelationsai/src/models/chat/data.dart';

enum Role {
  user,
  assistant,
  system,
  function;
}

class ChatMessage {
  final String id;
  String? uuid;
  final DateTime? createdAt;
  String content;
  final Role role;
  String? name;

  ChatMessage({
    required this.id,
    this.uuid,
    this.createdAt,
    required this.content,
    required this.role,
    this.name,
  });

  ChatMessage.fromJson(Map<String, dynamic> json)
      : id = json['id'],
        uuid = json['uuid'],
        createdAt = DateTime(json['createdAt']),
        content = json['content'],
        role = json['role'],
        name = json['name'];

  Map<String, dynamic> toJson() => {
        'id': id,
        'uuid': uuid,
        'createdAt': createdAt.toString(),
        'content': content,
        'role': role.name,
        'name': name,
      };

  @override
  bool operator ==(other) {
    return other is ChatMessage &&
        other.runtimeType == runtimeType &&
        other.id == id &&
        other.uuid == uuid &&
        other.createdAt == createdAt &&
        other.content == content &&
        other.role == role &&
        other.name == name;
  }

  @override
  int get hashCode => uuid.hashCode;

  EmbeddedChatMessage toEmbedded() {
    return EmbeddedChatMessage(
      id: id,
      uuid: uuid,
      createdAt: createdAt,
      content: content,
      role: role,
      name: name,
    );
  }
}
