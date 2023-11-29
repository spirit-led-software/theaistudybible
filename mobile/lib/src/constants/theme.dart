import 'package:flutter/material.dart';
import 'package:revelationsai/src/constants/colors.dart';

class RAITheme {
  static final ThemeData light = ThemeData(
    fontFamily: "Catamaran",
    colorScheme: ColorScheme(
      brightness: Brightness.light,
      primary: RAIColors.primary,
      onPrimary: Colors.white,
      secondary: RAIColors.secondary,
      onSecondary: Colors.white,
      error: Colors.red,
      onError: Colors.white,
      background: Colors.white,
      onBackground: RAIColors.primary,
      surface: Colors.white,
      onSurface: RAIColors.primary,
      shadow: Colors.black.withOpacity(0.2),
    ),
    scaffoldBackgroundColor: Colors.white,
    appBarTheme: AppBarTheme(
      color: RAIColors.primary,
      foregroundColor: Colors.white,
    ),
    bottomNavigationBarTheme: BottomNavigationBarThemeData(
      backgroundColor: RAIColors.primary,
      selectedItemColor: RAIColors.secondary,
      unselectedItemColor: Colors.white,
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: RAIColors.primary,
    ),
    buttonTheme: ButtonThemeData(
      buttonColor: RAIColors.primary,
      textTheme: ButtonTextTheme.primary,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: RAIColors.primary,
        foregroundColor: Colors.white,
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        backgroundColor: RAIColors.primary,
        foregroundColor: Colors.white,
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      fillColor: Colors.white,
      filled: true,
      border: OutlineInputBorder(
        borderSide: BorderSide(
          color: RAIColors.primary.withOpacity(0.4),
        ),
        borderRadius: BorderRadius.circular(8),
      ),
      focusedBorder: OutlineInputBorder(
        borderSide: BorderSide(
          color: RAIColors.primary.withOpacity(0.4),
        ),
        borderRadius: BorderRadius.circular(8),
      ),
      enabledBorder: OutlineInputBorder(
        borderSide: BorderSide(
          color: RAIColors.primary.withOpacity(0.4),
        ),
        borderRadius: BorderRadius.circular(8),
      ),
    ),
    bottomSheetTheme: const BottomSheetThemeData(
      backgroundColor: Colors.white,
    ),
    useMaterial3: true,
  );

  static final ThemeData dark = ThemeData(
    fontFamily: "Catamaran",
    colorScheme: ColorScheme(
      brightness: Brightness.dark,
      primary: RAIColors.darkPrimary,
      onPrimary: Colors.white,
      secondary: RAIColors.secondary,
      onSecondary: Colors.white,
      error: Colors.red,
      onError: Colors.white,
      background: RAIColors.darkBackground,
      onBackground: Colors.white,
      surface: RAIColors.darkCard,
      onSurface: Colors.white,
      shadow: Colors.black.withOpacity(0.3),
    ),
    scaffoldBackgroundColor: RAIColors.darkBackground,
    appBarTheme: AppBarTheme(
      color: RAIColors.darkPrimary,
      foregroundColor: Colors.white,
    ),
    bottomNavigationBarTheme: BottomNavigationBarThemeData(
      backgroundColor: RAIColors.darkPrimary,
      selectedItemColor: RAIColors.secondary,
      unselectedItemColor: Colors.white,
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: RAIColors.darkPrimary,
    ),
    buttonTheme: ButtonThemeData(
      buttonColor: RAIColors.darkPrimary,
      textTheme: ButtonTextTheme.primary,
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        backgroundColor: RAIColors.darkPrimary,
        foregroundColor: Colors.white,
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: RAIColors.darkPrimary,
        foregroundColor: Colors.white,
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      fillColor: RAIColors.darkBackground,
      filled: true,
      border: OutlineInputBorder(
        borderSide: BorderSide.none,
        borderRadius: BorderRadius.circular(8),
      ),
      focusedBorder: OutlineInputBorder(
        borderSide: BorderSide.none,
        borderRadius: BorderRadius.circular(8),
      ),
      enabledBorder: OutlineInputBorder(
        borderSide: BorderSide.none,
        borderRadius: BorderRadius.circular(8),
      ),
    ),
    bottomSheetTheme: BottomSheetThemeData(
      backgroundColor: RAIColors.darkBackground,
    ),
    textSelectionTheme: TextSelectionThemeData(
      cursorColor: RAIColors.secondary,
      selectionColor: RAIColors.secondary.withOpacity(0.4),
      selectionHandleColor: RAIColors.secondary,
    ),
    useMaterial3: true,
  );
}
