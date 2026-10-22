import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static const baseUrl = String.fromEnvironment('API_BASE_URL', defaultValue: 'http://10.0.2.2:4000/api');
  static Future<String?> _token() async => (await SharedPreferences.getInstance()).getString('mp_token');
  static Future<Map<String, String>> _headers() async {
    final token = await _token();
    return {'Content-Type': 'application/json', if (token != null) 'Authorization': 'Bearer $token'};
  }
  static Future<Map<String, dynamic>> get(String path) async {
    final r = await http.get(Uri.parse('$baseUrl$path'), headers: await _headers()).timeout(const Duration(seconds: 15));
    final body = r.body.isEmpty ? <String, dynamic>{} : jsonDecode(r.body) as Map<String, dynamic>;
    if (r.statusCode < 200 || r.statusCode >= 300) throw Exception(body['error'] ?? 'Request failed (${r.statusCode})');
    return body;
  }
  static Future<Map<String, dynamic>> post(String path, Map<String, dynamic> data) async {
    final r = await http.post(Uri.parse('$baseUrl$path'), headers: await _headers(), body: jsonEncode(data)).timeout(const Duration(seconds: 15));
    final body = r.body.isEmpty ? <String, dynamic>{} : jsonDecode(r.body) as Map<String, dynamic>;
    if (r.statusCode < 200 || r.statusCode >= 300) throw Exception(body['error'] ?? 'Request failed (${r.statusCode})');
    return body;
  }
  static Future<void> saveToken(String token) async => (await SharedPreferences.getInstance()).setString('mp_token', token);
  static Future<void> clearToken() async => (await SharedPreferences.getInstance()).remove('mp_token');
}
