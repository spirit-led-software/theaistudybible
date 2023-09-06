enum AlertType {
  success,
  error,
  warning,
  info;
}

class Alert {
  final String message;
  final AlertType type;

  Alert({
    required this.message,
    required this.type,
  });
}
