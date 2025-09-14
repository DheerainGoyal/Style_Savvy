import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';
import '../models/clothing_item.dart';
import 'dashboard_screen.dart';

class WardrobeScreen extends StatelessWidget {
  const WardrobeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Your Wardrobe'),
        actions: [
          IconButton(
            tooltip: 'Dashboard',
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const DashboardScreen()),
            ),
            icon: const Icon(Icons.dashboard_outlined),
          ),
        ],
      ),
      body: DefaultTabController(
        length: 2,
        child: Column(
          children: [
            const TabBar(tabs: [
              Tab(text: 'Have'),
              Tab(text: 'Want'),
            ]),
            Expanded(
              child: TabBarView(
                children: [
                  _WardrobeList(
                    title: 'Your Items',
                    items: app.wardrobe,
                    onRemove: (id) => app.removeFromWardrobe(id),
                  ),
                  _WardrobeList(
                    title: 'Wishlist',
                    items: app.wishlist,
                    onRemove: (id) => app.removeFromWishlist(id),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: ExpandableFab(
        onAddHave: () async {
          final item = await _showAddItemDialog(context, listName: 'Have');
          if (item != null) app.addItemToWardrobe(item);
        },
        onAddWant: () async {
          final item = await _showAddItemDialog(context, listName: 'Want');
          if (item != null) app.addToWishlist(item);
        },
      ),
    );
  }
}

class _WardrobeList extends StatelessWidget {
  final String title;
  final List<ClothingItem> items;
  final void Function(int id) onRemove;

  const _WardrobeList({
    required this.title,
    required this.items,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return Center(
        child: Text('No items in $title yet'),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: items.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (context, index) {
        final item = items[index];
        return Card(
          child: ListTile(
            title: Text(item.name),
            subtitle: Text('${item.category} • ${item.style}'),
            trailing: IconButton(
              icon: const Icon(Icons.delete_outline),
              onPressed: () => onRemove(item.id),
            ),
          ),
        );
      },
    );
  }
}

class ExpandableFab extends StatefulWidget {
  final VoidCallback onAddHave;
  final VoidCallback onAddWant;

  const ExpandableFab({
    super.key,
    required this.onAddHave,
    required this.onAddWant,
  });

  @override
  State<ExpandableFab> createState() => _ExpandableFabState();
}

class _ExpandableFabState extends State<ExpandableFab>
    with SingleTickerProviderStateMixin {
  bool open = false;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 180,
      height: 56,
      child: Stack(
        alignment: Alignment.bottomRight,
        children: [
          if (open)
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                FilledButton.tonal(
                  onPressed: widget.onAddHave,
                  child: const Text('Add Have'),
                ),
                const SizedBox(width: 8),
                FilledButton.tonal(
                  onPressed: widget.onAddWant,
                  child: const Text('Add Want'),
                ),
                const SizedBox(width: 8),
              ],
            ),
          FloatingActionButton.extended(
            label: Text(open ? 'Close' : 'Add'),
            icon: Icon(open ? Icons.close : Icons.add),
            onPressed: () => setState(() => open = !open),
          ),
        ],
      ),
    );
  }
}

Future<ClothingItem?> _showAddItemDialog(BuildContext context, {required String listName}) async {
  final formKey = GlobalKey<FormState>();
  final nameCtl = TextEditingController();
  String category = 'Top';
  String style = 'Casual';

  final id = DateTime.now().millisecondsSinceEpoch;

  return showDialog<ClothingItem>(
    context: context,
    builder: (context) => AlertDialog(
      title: Text('Add to $listName'),
      content: Form(
        key: formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextFormField(
              controller: nameCtl,
              decoration: const InputDecoration(labelText: 'Name'),
              validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: category,
              decoration: const InputDecoration(labelText: 'Category'),
              items: const [
                DropdownMenuItem(value: 'Top', child: Text('Top')),
                DropdownMenuItem(value: 'Bottom', child: Text('Bottom')),
                DropdownMenuItem(value: 'Shoes', child: Text('Shoes')),
                DropdownMenuItem(value: 'Accessory', child: Text('Accessory')),
              ],
              onChanged: (v) => category = v ?? 'Top',
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: style,
              decoration: const InputDecoration(labelText: 'Style'),
              items: const [
                DropdownMenuItem(value: 'Casual', child: Text('Casual')),
                DropdownMenuItem(value: 'Classic', child: Text('Classic')),
                DropdownMenuItem(value: 'Edgy', child: Text('Edgy')),
                DropdownMenuItem(value: 'Bohemian', child: Text('Bohemian')),
                DropdownMenuItem(value: 'Minimalist', child: Text('Minimalist')),
                DropdownMenuItem(value: 'Vibrant', child: Text('Vibrant')),
              ],
              onChanged: (v) => style = v ?? 'Casual',
            ),
          ],
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
        FilledButton(
          onPressed: () {
            if (formKey.currentState!.validate()) {
              Navigator.pop(
                context,
                ClothingItem(id: id, name: nameCtl.text, category: category, style: style),
              );
            }
          },
          child: const Text('Add'),
        ),
      ],
    ),
  );
}
