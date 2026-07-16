# Quick Reference: Real-Time Cart Synchronization

## 🎯 What Was Implemented

A global cart state management system using React Context API that automatically synchronizes cart count across all screens.

---

## 📱 How It Works

### Before (Broken)
```
ProductDescription (local state)  →  BottomTabs (hardcoded 0)  →  Profile (local state)
        ↓                                    ↓                         ↓
    Separate states            Cart count never updated        Same product different counts
```

### After (Fixed) ✅
```
ProductDescription  →  CartContext (global state)  ←  Profile  ← BottomTabs
        ↓                        ↓                         ↓
   useCart()          ONE source of truth           useCart()
        ↓                        ↓                         ↓
   All components get same real-time count
```

---

## 🚀 Using the Cart System

### In Any Component

```typescript
import { useCart } from '../context/CartContext';

function MyComponent() {
  const { totalQuantity, count, items, addItem, removeItem, updateQuantity } = useCart();
  
  return (
    <View>
      {/* Show cart count */}
      <Text>Total Items: {totalQuantity}</Text>
      
      {/* Add to cart */}
      <Button onPress={() => addItem(123, 456, 2)} title="Add" />
      
      {/* Remove from cart */}
      <Button onPress={() => removeItem(cartItemId)} title="Remove" />
      
      {/* Update quantity */}
      <Button onPress={() => updateQuantity(cartItemId, newQty)} title="Update" />
    </View>
  );
}
```

---

## 📊 Available Properties

| Property | Type | Description |
|----------|------|-------------|
| `totalQuantity` | number | Sum of all item quantities in cart |
| `count` | number | Number of unique items in cart |
| `items` | CartItem[] | Array of all cart items with details |

### CartItem Structure
```typescript
{
  id: string;                    // Unique cart item ID
  product_id: string | number;   // Product ID
  variant_id: string | number;   // Variant ID
  name: string;                  // Product name
  price: number;                 // Sale price
  quantity: number;              // Item quantity
  image?: string;                // Product image URL
}
```

---

## 🔧 Available Methods

### `addItem(productId, variantId, quantity)`
Adds item to cart or increases quantity if exists.

```typescript
const { addItem } = useCart();

try {
  await addItem(123, 456, 1);
  // Cart badge updates automatically ✅
} catch (error) {
  console.error("Failed to add:", error);
}
```

### `removeItem(itemId)`
Removes item completely from cart.

```typescript
const { removeItem } = useCart();

await removeItem(cartItemId);
// Cart badge updates automatically ✅
```

### `updateQuantity(itemId, quantity)`
Updates item quantity. If quantity ≤ 0, removes item.

```typescript
const { updateQuantity } = useCart();

await updateQuantity(cartItemId, 3);
// Cart badge updates automatically ✅

// Decrease quantity
await updateQuantity(cartItemId, 1);

// Remove item
await updateQuantity(cartItemId, 0);
```

### `refresh()`
Manually sync cart with server.

```typescript
const { refresh } = useCart();

await refresh(); // Re-fetches cart from API
```

### `clearCart()`
Empties the entire cart.

```typescript
const { clearCart } = useCart();

await clearCart();
```

---

## 📍 Integration Points

### 1. BottomTabs (Badge)
```tsx
// MainTabs.tsx automatically gets realquantity
const { totalQuantity } = useCart();
<CustomTabBar cartCount={totalQuantity} />
```
**Result:** Badge shows live quantity and updates instantly.

### 2. Add to Cart Button
```tsx
// product_description_screen.tsx
await addItem(product.product_id, selectedVariant.variant_id, qty);
alert.success("Added to Cart!");  // Success notification
```
**Result:** Cart updates globally + shows success message.

### 3. Cart Screen  
```tsx
// Get all items to display
const { items, totalQuantity, removeItem } = useCart();

<FlatList 
  data={items}
  renderItem={({ item }) => (
    <CartItemRow 
      item={item}
      onRemove={() => removeItem(item.id)}
    />
  )}
/>
```

### 4. Profile Screen
```tsx
// Register.tsx
const { totalQuantity } = useCart();
<ProductHead cartCount={totalQuantity} />
```
**Result:** Profile header shows latest cart count.

---

## 🔄 Data Flow Example

### Scenario: User adds product from ProductDescription
```
1️⃣  User clicks "Add to Cart"
    ↓
2️⃣  handleAddToCart() called
    ↓
3️⃣  await addItem(productId, variantId, qty)  ← CartContext method
    ↓
4️⃣  CartContext API call: addToCart(payload)
    ↓
5️⃣  Backend: Item added/quantity increased
    ↓
6️⃣  CartContext.refresh() - fetches updated cart
    ↓
7️⃣  setTotalQuantity() triggered
    ↓
8️⃣  All components re-render:
    - ProductHead badge updates ✅
    - BottomTabs badge updates ✅
    - Profile screen (if showing) updates ✅
    ↓
9️⃣  User feedback: Success toast notification ✅
```

---

## ⚠️ Important Notes

1. **Authentication Required**
   - Cart operations check `isAuthenticated`
   - Cart clears on logout
   - Cart loads on login

2. **Single Source of Truth**
   - Don't manage cart in local component state
   - Always use `useCart()` hook
   - All data comes from CartContext

3. **Error Handling**
   - Wrap API calls in try-catch
   - Show error toasts to user
   - Check error messages from server

4. **Async Operations**
   - All methods are async
   - Use await before accessing results
   - Handle loading states with useState

5. **Real-Time Sync**
   - No manual refresh needed
   - Navigation auto-syncs
   - Focus events trigger refresh

---

## 🎨 UI Components Using Cart

| Component | File | Property | Usage |
|-----------|------|----------|-------|
| BottomTabs | `BottomTabs.tsx` | `cartCount` | Badge display |
| ProductHead | `Product_Head_Img.tsx` | `cartCount` | Header badge |
| BuySection | `buysections.tsx` | `isAdding` | Loading state |
| AddToCart Button | `product_description_screen.tsx` | `onAddToCart` | Click handler |

---

## 🧪 Testing Cart Features

```typescript
// Test 1: Add product
await addItem(1, 2, 1);
console.log(totalQuantity); // Should be 1

// Test 2: Add same product again (should increase qty)
await addItem(1, 2, 1);
console.log(totalQuantity); // Should be 2

// Test 3: Remove item
await removeItem(cartItemId);
console.log(totalQuantity); // Should be 1

// Test 4: Update quantity
await updateQuantity(cartItemId, 5);
console.log(totalQuantity); // Should be 5

// Test 5: Clear cart
await clearCart();
console.log(totalQuantity); // Should be 0
```

---

## 📚 Files Reference

| File | Purpose |
|------|---------|
| `CartContext.tsx` | Core cart state & logic |
| `App.tsx` | CartProvider wrapper |
| `MainTabs.tsx` | Bottom tab badge integration |
| `product_description_screen.tsx` | Add to cart integration |
| `Register.tsx` | Profile cart display |
| `CART_CONTEXT_SETUP.md` | Detailed documentation |

---

## ✅ Verification Checklist

- [ ] Cart badge appears on BottomTabs
- [ ] Adding product updates badge instantly
- [ ] Badge count persists on navigation
- [ ] Removing product decreases badge
- [ ] Cart clears on logout
- [ ] No duplicates when adding same product
- [ ] Error messages show on failures
- [ ] Loading indicator shows while adding
- [ ] Cart count matches actual items

---

## 🆘 Troubleshooting

### Badge not updating?
- Check if useCart() is called in component
- Verify CartProvider wraps entire app
- Check if isAuthenticated is true
- Run `refresh()` manually to sync

### Getting "useCart must be used within CartProvider" error?
- Make sure component is inside CartProvider
- Check App.tsx has CartProvider wrapper
- Don't call useCart() outside React components

### Cart items not persisting?
- Check authentication state
- Verify API connection
- Check backend response format
- Call refresh() after operations

