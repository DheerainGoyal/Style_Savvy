import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';
import '../models/clothing_item.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  String? occasion; // e.g., Casual, Classic, Edgy (reuses "style" words)
  List<ClothingItem> outfit = <ClothingItem>[];

  void _suggest() {
    final app = context.read<AppState>();
    final suggestion = app.suggestOutfit(occasion: occasion);
    setState(() => outfit = suggestion);

    if (suggestion.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Add more items to your wardrobe for suggestions.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();

    return Scaffold(
      appBar: AppBar(title: const Text('Dashboard')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Profile summary
            if (app.profile != null) ...[
              Text('Welcome back!', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 4),
              Text(
                'Preferred style: ${app.profile!.preferredStyle ?? '—'}',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 16),
            ],

            // Occasion picker
            Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<String>(
                    initialValue: occasion,
                    decoration: const InputDecoration(
                      labelText: 'Occasion / Vibe',
                      hintText: 'Optional filter',
                    ),
                    items: const [
                      DropdownMenuItem(value: 'Casual', child: Text('Casual')),
                      DropdownMenuItem(value: 'Classic', child: Text('Classic')),
                      DropdownMenuItem(value: 'Edgy', child: Text('Edgy')),
                      DropdownMenuItem(value: 'Bohemian', child: Text('Bohemian')),
                      DropdownMenuItem(value: 'Minimalist', child: Text('Minimalist')),
                      DropdownMenuItem(value: 'Vibrant', child: Text('Vibrant')),
                    ],
                    onChanged: (v) => setState(() => occasion = v),
                  ),
                ),
                const SizedBox(width: 12),
                FilledButton.icon(
                  onPressed: _suggest,
                  icon: const Icon(Icons.auto_awesome_outlined),
                  label: const Text('Style me today'),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Outfit of the day
            Text('Outfit of the day', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            if (outfit.isEmpty)
              const Text('No suggestion yet. Tap "Style me today".')
            else
              Expanded(
                child: ListView.separated(
                  itemCount: outfit.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (context, index) {
                    final item = outfit[index];
                    return Card(
                      child: ListTile(
                        leading: Icon(_iconForCategory(item.category)),
                        title: Text(item.name),
                        subtitle: Text('${item.category} • ${item.style}'),
                      ),
                    );
                  },
                ),
              ),
          ],
        ),
      ),
    );
  }
}

IconData _iconForCategory(String category) {
  switch (category) {
    case 'Top':
      return Icons.checkroom_outlined;
    case 'Bottom':
      return Icons.layers_outlined;
    case 'Shoes':
      return Icons.directions_walk_outlined;
    case 'Accessory':
      return Icons.watch_outlined;
    default:
      return Icons.style_outlined;
  }
}
