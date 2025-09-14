import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:styles_savvy/screens/wardrobe_screen.dart';
import 'package:styles_savvy/providers/app_state.dart';
import 'package:styles_savvy/models/user_profile.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  int step = 0;
  String? palette;
  String? vibe;
  String? bodyShape;
  String? height;
  String? weight;

  // Quiz data
  final List<Map<String, String>> paletteOptions = [
    {
      'value': 'Minimalist',
      'label': 'Monochrome & Neutrals',
    },
    {
      'value': 'Bohemian',
      'label': 'Earthy & Warm',
    },
    {
      'value': 'Vibrant',
      'label': 'Bold & Vibrant',
    },
  ];

  final List<Map<String, String>> vibeOptions = [
    {
      'value': 'Classic',
      'label': 'Art Gallery Visit',
    },
    {
      'value': 'Casual',
      'label': 'Brunch & Market',
    },
    {
      'value': 'Edgy',
      'label': 'Live Music Show',
    },
  ];

  // Local gradient palettes to avoid network image issues
  List<Color> _paletteGradient(String? value) {
    switch (value) {
      case 'Minimalist':
        return const [Color(0xFFE7E5E4), Color(0xFFFAFAF9)];
      case 'Bohemian':
        return const [Color(0xFFD4A373), Color(0xFFEDE0D4)];
      case 'Vibrant':
        return const [Color(0xFFFF006E), Color(0xFF3A86FF)];
      default:
        return const [Color(0xFFE7E5E4), Color(0xFFFAFAF9)];
    }
  }

  List<Color> _vibeGradient(String? value) {
    switch (value) {
      case 'Classic':
        return const [Color(0xFF111827), Color(0xFF374151)];
      case 'Casual':
        return const [Color(0xFF81B29A), Color(0xFFF2CC8F)];
      case 'Edgy':
        return const [Color(0xFF1C1917), Color(0xFF44403C)];
      default:
        return const [Color(0xFFE7E5E4), Color(0xFFFAFAF9)];
    }
  }

  final List<Map<String, String>> bodyShapeOptions = [
    {'name': 'Hourglass', 'icon': '⏳'},
    {'name': 'Pear', 'icon': '🍐'},
    {'name': 'Apple', 'icon': '🍎'},
    {'name': 'Rectangle', 'icon': '📏'},
    {'name': 'Inverted Triangle', 'icon': '🔻'},
  ];

  void nextStep() {
    if (step < 3) {
      setState(() => step++);
    } else {
      // Validate required fields
      if (height == null || weight == null || height!.isEmpty || weight!.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please fill in all fields')),
        );
        return;
      }

      // Save profile into app state
      final profile = UserProfile(
        palette: palette,
        vibe: vibe,
        bodyShape: bodyShape,
        height: height,
        weight: weight,
        preferredStyle: vibe ?? 'Casual',
      );
      context.read<AppState>().setProfile(profile);

      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const WardrobeScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7F5F2),
      body: SafeArea(
        child: Stack(
          children: [
            // Custom back button
            Positioned(
              top: 24,
              left: 24,
              child: GestureDetector(
                onTap: () {
                  if (step > 0) {
                    setState(() => step--);
                  } else {
                    Navigator.pop(context);
                  }
                },
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.transparent,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Icon(
                    Icons.chevron_left,
                    color: Color(0xFF78716C),
                    size: 24,
                  ),
                ),
              ),
            ),
            
            // Main content
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 80, 16, 24),
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 720),
                  child: Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE7E5E4)),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x1A000000), // 10% black
                          blurRadius: 16,
                          offset: Offset(0, 8),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        // Header
                        const Text(
                          'Create Your Style Profile',
                          style: TextStyle(
                            fontSize: 26,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF1C1917),
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Tell us a bit about your preferences so we can style smarter.',
                          style: TextStyle(
                            fontSize: 14,
                            color: Color(0xFF78716C),
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 12),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: LinearProgressIndicator(
                            value: (step + 1) / 4,
                            minHeight: 6,
                            backgroundColor: Color(0xFFE7E5E4),
                            valueColor: AlwaysStoppedAnimation<Color>(Theme.of(context).colorScheme.primary),
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Content
                        Expanded(
                          child: IndexedStack(
                            index: step,
                            children: [
                              _buildPaletteStep(),
                              _buildVibeStep(),
                              _buildBodyShapeStep(),
                              _buildDetailsStep(),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPaletteStep() => SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              "Which color palette speaks to you?",
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w600,
                color: Color(0xFF1C1917),
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 16,
              runSpacing: 16,
              children: paletteOptions.map((option) {
                final selected = palette == option['value'];
                return SizedBox(
                  width: 320,
                  child: GestureDetector(
                    onTap: () {
                      setState(() => palette = option['value']);
                      Future.delayed(const Duration(milliseconds: 400), () {
                        if (mounted) nextStep();
                      });
                    },
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 250),
                      padding: const EdgeInsets.all(2),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: selected ? const Color(0xFF1C1917) : const Color(0xFFE7E5E4),
                          width: selected ? 2 : 1,
                        ),
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: Stack(
                          children: [
                            AspectRatio(
                              aspectRatio: 16 / 9,
                              child: DecoratedBox(
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    begin: Alignment.bottomLeft,
                                    end: Alignment.topRight,
                                    colors: _paletteGradient(option['value']),
                                  ),
                                ),
                              ),
                            ),
                            Positioned.fill(
                              child: DecoratedBox(
                                decoration: const BoxDecoration(
                                  gradient: LinearGradient(
                                    begin: Alignment.bottomCenter,
                                    end: Alignment.topCenter,
                                    colors: [
                                      Color(0x80000000),
                                      Color(0x00000000),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                            Positioned(
                              left: 12,
                              bottom: 10,
                              right: 12,
                              child: Text(
                                option['label']!,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ],
        ),
      );

  Widget _buildVibeStep() => SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              "Pick a weekend vibe:",
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w600,
                color: Color(0xFF1C1917),
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 16,
              runSpacing: 16,
              children: vibeOptions.map((option) {
                final selected = vibe == option['value'];
                return SizedBox(
                  width: 320,
                  child: GestureDetector(
                    onTap: () {
                      setState(() => vibe = option['value']);
                      Future.delayed(const Duration(milliseconds: 400), () {
                        if (mounted) nextStep();
                      });
                    },
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 250),
                      padding: const EdgeInsets.all(2),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: selected ? const Color(0xFF1C1917) : const Color(0xFFE7E5E4),
                          width: selected ? 2 : 1,
                        ),
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: Stack(
                          children: [
                            AspectRatio(
                              aspectRatio: 16 / 9,
                              child: DecoratedBox(
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    begin: Alignment.bottomLeft,
                                    end: Alignment.topRight,
                                    colors: _vibeGradient(option['value']),
                                  ),
                                ),
                              ),
                            ),
                            Positioned.fill(
                              child: DecoratedBox(
                                decoration: const BoxDecoration(
                                  gradient: LinearGradient(
                                    begin: Alignment.bottomCenter,
                                    end: Alignment.topCenter,
                                    colors: [
                                      Color(0x80000000),
                                      Color(0x00000000),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                            Positioned(
                              left: 12,
                              bottom: 10,
                              right: 12,
                              child: Text(
                                option['label']!,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ],
        ),
      );

  Widget _buildBodyShapeStep() => SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              "What's your body shape?",
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w600,
                color: Color(0xFF1C1917),
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
                childAspectRatio: 1.15,
              ),
              itemCount: bodyShapeOptions.length,
              itemBuilder: (context, index) {
                final shape = bodyShapeOptions[index];
                final isSelected = bodyShape == shape['name'];
                
                return GestureDetector(
                  onTap: () => setState(() => bodyShape = shape['name']),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isSelected 
                            ? const Color(0xFF1C1917) 
                            : const Color(0xFFE7E5E4),
                        width: isSelected ? 2 : 1,
                      ),
                      boxShadow: isSelected
                          ? const [
                              BoxShadow(
                                color: Color(0x1A000000),
                                blurRadius: 10,
                                offset: Offset(0, 6),
                              ),
                            ]
                          : null,
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          shape['icon']!,
                          style: const TextStyle(fontSize: 34),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          shape['name']!,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: Color(0xFF1C1917),
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
            if (bodyShape != null) ...[
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: nextStep,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1C1917),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(25),
                  ),
                ),
                child: const Text(
                  'Next',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ),
            ],
          ],
        ),
      );

  Widget _buildDetailsStep() => SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              "A few more details...",
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w600,
                color: Color(0xFF1C1917),
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE7E5E4)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Height (cm)',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF57534E),
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    keyboardType: TextInputType.number,
                    onChanged: (v) => height = v,
                    decoration: InputDecoration(
                      hintText: 'e.g., 170',
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Weight (kg)',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF57534E),
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    keyboardType: TextInputType.number,
                    onChanged: (v) => weight = v,
                    decoration: InputDecoration(
                      hintText: 'e.g., 65',
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: nextStep,
                child: const Text('Finish & Build My Wardrobe'),
              ),
            ),
          ],
        ),
      );
}