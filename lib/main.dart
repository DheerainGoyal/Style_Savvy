import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/app_state.dart';
import 'screens/login_screen.dart';

void main() {
  runApp(
    ChangeNotifierProvider(
      create: (_) => AppState(),
      child: const StyleSavvyApp(),
    ),
  );
}

class StyleSavvyApp extends StatelessWidget {
  const StyleSavvyApp({super.key});

  @override
  Widget build(BuildContext context) {
    // Beige/white rich palette inspired by the website
    const beige = Color(0xFFF7F5F2); // background
    const stone900 = Color(0xFF1C1917);
    const stone800 = Color(0xFF292524);

    final lightScheme = ColorScheme.fromSeed(
      seedColor: const Color(0xFF8D7B68), // warm beige-brown seed
      brightness: Brightness.light,
    );

    final darkScheme = ColorScheme.fromSeed(
      seedColor: const Color(0xFF8D7B68),
      brightness: Brightness.dark,
    );

    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'StyleSavvy',
      themeMode: ThemeMode.system,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: lightScheme,
        scaffoldBackgroundColor: beige,
        fontFamily: 'Inter',
        textTheme: ThemeData.light().textTheme.apply(
              bodyColor: stone800,
              displayColor: stone800,
            ),
        appBarTheme: const AppBarTheme(
          centerTitle: true,
          backgroundColor: Colors.transparent,
          elevation: 0,
          surfaceTintColor: Colors.transparent,
        ),
        cardTheme: CardThemeData(
          color: Colors.white,
          surfaceTintColor: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: Colors.white,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            foregroundColor: Colors.white,
            backgroundColor: stone900,
            padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 20),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
        filledButtonTheme: FilledButtonThemeData(
          style: FilledButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 20),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
        tabBarTheme: TabBarThemeData(
          labelColor: stone800,
          indicatorColor: stone800,
        ),
      ),
      darkTheme: ThemeData(
        useMaterial3: true,
        colorScheme: darkScheme,
        fontFamily: 'Inter',
        appBarTheme: const AppBarTheme(centerTitle: true),
      ),
      home: const LoginScreen(),
    );
  }
}
