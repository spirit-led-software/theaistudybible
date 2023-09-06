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
        createdAt = json['createdAt'],
        content = json['content'],
        role = json['role'],
        name = json['name'];

  Map<String, dynamic> toJson() => {
        'id': id,
        'uuid': uuid,
        'createdAt': createdAt,
        'content': content,
        'role': role.name,
        'name': name,
      };
}
