import 'package:flutter/material.dart';
import 'onboarding_screen.dart';

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 520),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Title + subtitle
                  Text(
                    'StyleSavvy',
                    textAlign: TextAlign.center,
                    style: theme.textTheme.displaySmall?.copyWith(
                      fontFamily: 'CormorantGaramond',
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Your personal AI stylist.',
                    textAlign: TextAlign.center,
                    style: theme.textTheme.bodyMedium?.copyWith(color: const Color(0xFF78716C)),
                  ),

                  const SizedBox(height: 32),

                  // Social buttons
                  _SocialButton(
                    label: 'Sign in with Google',
                    background: Colors.white,
                    foreground: const Color(0xFF292524),
                    border: const BorderSide(color: Color(0xFFD6D3D1)),
                    onTap: () => _goOnboarding(context),
                  ),
                  const SizedBox(height: 12),
                  _SocialButton(
                    label: 'Sign in with Facebook',
                    background: const Color(0xFF1877F2),
                    foreground: Colors.white,
                    onTap: () => _goOnboarding(context),
                  ),

                  // Divider
                  const SizedBox(height: 24),
                  const _DividerWithText(text: 'Or'),
                  const SizedBox(height: 24),

                  // Email buttons
                  ElevatedButton(
                    onPressed: () => _goOnboarding(context),
                    child: const Text('Login with Email'),
                  ),
                  const SizedBox(height: 12),
                  OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Color(0xFFD6D3D1)),
                      backgroundColor: Colors.white,
                      foregroundColor: const Color(0xFF292524),
                      minimumSize: const Size.fromHeight(50),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: () => _goOnboarding(context),
                    child: const Text('Create an Account'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _goOnboarding(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const OnboardingScreen()),
    );
  }
}

class _DividerWithText extends StatelessWidget {
  final String text;
  const _DividerWithText({required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Expanded(child: Divider(color: Color(0xFFD6D3D1))),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Text(text, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: const Color(0xFF78716C))),
        ),
        const Expanded(child: Divider(color: Color(0xFFD6D3D1))),
      ],
    );
  }
}

class _SocialButton extends StatelessWidget {
  final String label;
  final Color background;
  final Color foreground;
  final BorderSide? border;
  final VoidCallback onTap;

  const _SocialButton({
    required this.label,
    required this.background,
    required this.foreground,
    required this.onTap,
    this.border,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 50,
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: background,
          foregroundColor: foreground,
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: border ?? BorderSide.none),
        ),
        onPressed: onTap,
        child: Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
      ),
    );
  }
}
