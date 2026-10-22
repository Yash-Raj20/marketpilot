import 'package:flutter/material.dart';
import '../main.dart';
import '../services/api_service.dart';
import 'dashboard_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override State<LoginScreen> createState() => _LoginScreenState();
}
class _LoginScreenState extends State<LoginScreen> {
  final email = TextEditingController(); final password = TextEditingController();
  bool busy = false; String? error;
  Future<void> signIn() async {
    setState(() { busy = true; error = null; });
    try { final result = await ApiService.post('/auth/login', {'email': email.text.trim(), 'password': password.text}); await ApiService.saveToken(result['token'] as String); if (!mounted) return; Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const DashboardScreen())); }
    catch (e) { setState(() => error = e.toString().replaceFirst('Exception: ', '')); }
    finally { if (mounted) setState(() => busy = false); }
  }
  @override void dispose() { email.dispose(); password.dispose(); super.dispose(); }
  @override Widget build(BuildContext context) => Scaffold(body: SafeArea(child: Center(child: SingleChildScrollView(padding: const EdgeInsets.all(24), child: ConstrainedBox(constraints: const BoxConstraints(maxWidth: 420), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    Container(width: 54, height: 54, decoration: BoxDecoration(gradient: const LinearGradient(colors: [blue, green]), borderRadius: BorderRadius.circular(16)), child: const Icon(Icons.multiline_chart_rounded, color: ink, size: 29)),
    const SizedBox(height: 24), const Text('marketpilot', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800, letterSpacing: -1)), const Text('AI  ·  MARKET INTELLIGENCE', style: TextStyle(color: green, fontSize: 10, letterSpacing: 2, fontWeight: FontWeight.bold)),
    const SizedBox(height: 36), const Text('Welcome back', style: TextStyle(fontSize: 25, fontWeight: FontWeight.bold)), const SizedBox(height: 8), const Text('Sign in to access your watchlist and trading journal.', style: TextStyle(color: Colors.white60, height: 1.5)), const SizedBox(height: 24),
    TextField(controller: email, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Email address', prefixIcon: Icon(Icons.email_outlined))), const SizedBox(height: 14), TextField(controller: password, obscureText: true, decoration: const InputDecoration(labelText: 'Password', prefixIcon: Icon(Icons.lock_outline))),
    if (error != null) Padding(padding: const EdgeInsets.only(top: 12), child: Text(error!, style: const TextStyle(color: Color(0xFFFF8F9B)))), const SizedBox(height: 20), SizedBox(width: double.infinity, height: 49, child: FilledButton(onPressed: busy ? null : signIn, child: Text(busy ? 'Signing in…' : 'Sign in'))), const SizedBox(height: 18), const Text('Market data in this starter is simulated. Not investment advice.', style: TextStyle(color: Colors.white38, fontSize: 11, height: 1.5))
  ]))))));
}
