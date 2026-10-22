import 'package:flutter/material.dart';
import 'screens/login_screen.dart';

const ink = Color(0xFF080D18);
const panel = Color(0xFF101A29);
const green = Color(0xFF45D6A2);
const blue = Color(0xFF6398FF);

void main() => runApp(const MarketPilotApp());

class MarketPilotApp extends StatelessWidget {
  const MarketPilotApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'MarketPilot AI', debugShowCheckedModeBanner: false,
    theme: ThemeData(useMaterial3: true, brightness: Brightness.dark, scaffoldBackgroundColor: ink,
      colorScheme: ColorScheme.fromSeed(seedColor: blue, brightness: Brightness.dark, surface: panel),
      appBarTheme: const AppBarTheme(backgroundColor: ink, foregroundColor: Colors.white),
      inputDecorationTheme: InputDecorationTheme(filled: true, fillColor: panel, border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF2A394E))), enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF2A394E)))),
    ), home: const LoginScreen());
}
