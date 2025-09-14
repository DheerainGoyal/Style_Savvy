import 'package:flutter/material.dart';
import '../models/clothing_item.dart';
import '../models/user_profile.dart';

class AppState extends ChangeNotifier {
  UserProfile? profile;
  final List<ClothingItem> wardrobe = []; // items you have
  final List<ClothingItem> wishlist = []; // items you want

  void setProfile(UserProfile userProfile) {
    profile = userProfile;
    notifyListeners();
  }

  // Wardrobe management
  void addItemToWardrobe(ClothingItem item) {
    if (!_containsById(wardrobe, item.id)) {
      wardrobe.add(item);
      notifyListeners();
    }
  }

  void removeFromWardrobe(int id) {
    wardrobe.removeWhere((e) => e.id == id);
    notifyListeners();
  }

  // Wishlist management
  void addToWishlist(ClothingItem item) {
    if (!_containsById(wishlist, item.id)) {
      wishlist.add(item);
      notifyListeners();
    }
  }

  void removeFromWishlist(int id) {
    wishlist.removeWhere((e) => e.id == id);
    notifyListeners();
  }

  bool _containsById(List<ClothingItem> list, int id) => list.any((e) => e.id == id);

  // Simple "style me today" suggestion based on profile + wardrobe
  // Returns a list representing an outfit: top, bottom, shoes, accessory
  List<ClothingItem> suggestOutfit({String? occasion}) {
    if (wardrobe.isEmpty) return [];

    final String stylePref = profile?.preferredStyle ?? occasion ?? 'Casual';

    ClothingItem? pick(String category) {
      final options = wardrobe.where((e) => e.category == category).toList();
      if (options.isEmpty) return null;
      // Prefer items matching preferred style when available
      final preferred = options.where((e) => e.style == stylePref).toList();
      return (preferred.isNotEmpty ? preferred : options).first;
    }

    final top = pick('Top');
    final bottom = pick('Bottom');
    final shoes = pick('Shoes');
    final accessory = pick('Accessory');

    return [top, bottom, shoes, accessory].whereType<ClothingItem>().toList();
  }
}
