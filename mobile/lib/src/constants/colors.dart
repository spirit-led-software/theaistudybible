import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';

final class RAIColors {
  static final Color primary = HexColor("#334155");
  static final Color secondary = HexColor("#93c5fd");

  static final Color darkBackground = HexColor("#020617");
  static final Color darkCard = HexColor("#0f172a");
}

enum RAIColorScheme {
  dark,
  light,
}
