# Real-Time Cart Count Synchronization

## Overview
This document describes the implementation of real-time cart count synchronization across the React Native e-commerce app using Context API.

---

## Architecture

### 1. **Global Cart Context** (`src/modules/ecommerce/context/CartContext.tsx`)

The `CartContext` provides centralized cart state management with the following features:

#### State Variables:
- `count`: Number of unique cart items
- `totalQuantity`: Sum of all item quantities across cart
- `items`: Array of cart items with full details

#### Methods:
- **`refresh()`**: Fetches cart data from API and synchronizes state
- **`addItem(productId, variantId, quantity)`**: Adds/updates item in cart
- **`removeItem(itemId)`**: Removes item from cart by ID  
- **`updateQuantity(itemId, quantity)`**: Updates item quantity (removes if quantity ≤ 0)
- **`clearCart()`**: Clears all items

#### Usage:
```typescript
import { useCart } from "../context/CartContext";

function MyComponent() {
  const { totalQuantity, count, items, addItem, removeItem } = useCart();
  
  return (
    <Text>Cart Total: {totalQuantity} items</Text>
  );
}
```

---

## Implementation Details

### 2. **Provider Integration**

The `CartProvider` wraps the entire app in `App.tsx`:

```tsx
<SafeAreaProvider>
  <AlertProvider>
    <AuthProvider>
      <CartProvider>  {/* ← Global cart context */}
        <NavigationContainer>
          <AlertContainer />
          <RootNavigator />
        </NavigationContainer>
      </CartProvider>
    </AuthProvider>
  </AlertProvider>
</SafeAreaProvider>
```

**Key Features:**
- Initializes on authentication change
- Automatically updates when `isAuthenticated` changes
- Clears cart when user logs out

### 3. **Bottom Tab Bar Integration**

The cart badge in `BottomTabs.tsx` receives dynamic count from `MainTabs.tsx`:

```tsx
// MainTabs.tsx
export default function MainTabs() {
  const { isAuthenticated } = useAuth();
  const { totalQuantity } = useCart();  // ← Get real-time count
  
  const renderTabBar = React.useCallback(
    (props: any) => (
      <CustomTabBar
        {...props}
        cartCount={totalQuantity}  // ← Pass to bottom tabs
        isAuthenticated={isAuthenticated}
      />
    ),
    [totalQuantity, isAuthenticated]
  );
  
  // ... rest of component
}
```

**Result:** Cart badge updates instantly when items are added/removed on any screen.

### 4. **Product Description Screen Integration**

The product page uses the cart context for adding items:

```tsx
// product_description_screen.tsx
export default function ProductDescriptionScreen() {
  const { addItem, totalQuantity } = useCart();
  // ...
  
  const handleAddToCart = async () => {
    try {
      setAdding(true);
      
      // Call context method instead of direct API
      await addItem(product.product_id, selectedVariant.variant_id, qty);
      
      // Show success & cart badge updates automatically
      alert.success("Added to Cart", `${product.product_name} added!`, 2500);
      
    } catch (err) {
      alert.error("Add to Cart Failed", err.message, 3500);
    } finally {
      setAdding(false);
    }
  };
  
  return (
    <View>
      <ProductHead cartCount={totalQuantity} />  {/* ← Real-time count */}
      {/* ... */}
    </View>
  );
}
```

### 5. **Profile Screen Integration** 

The user profile also shows current cart count:

```tsx
// Register.tsx (Profile)
function Register() {
  const { totalQuantity } = useCart();
  
  return (
    <View>
      <ProductHead cartCount={totalQuantity} />  {/* ← Always updated */}
      {/* ... */}
    </View>
  );
}
```

---

## Data Flow

### Add to Cart Flow
```
User clicks "Add to Cart" (ProductDescription)
    ↓
handleAddToCart() calls useCart().addItem()
    ↓
CartContext.addItem() → API call (addToCart)
    ↓
CartContext.refresh() → fetches updated cart from API
    ↓
setItems() + setTotalQuantity() → state updates
    ↓
All components with useCart hook re-render automatically
    ↓
BottomTabs badge updates
ProductHead badge updates
```

### Real-Time Synchronization
```
Screen A (Product Page)    Screen B (Cart)    Screen C (Profile)
        ↓                        ↓                    ↓
   useCart()          →    CartContext    ←      useCart()
        ↓                        ↓                    ↓
   All share same state - single source of truth
```

---

## Key Features

### ✅ Benefits

1. **Single Source of Truth**
   - All screens read cart state from same context
   - No prop drilling required
   - Eliminates state doubling

2. **Real-Time Updates**
   - Changes instantly reflected everywhere
   - No manual refresh/navigation needed
   - Smooth user experience

3. **Automatic Sync**
   - Fetches from API after each operation
   - Handles duplicates via backend
   - Persists across navigation

4. **Authentication Aware**
   - Clears cart on logout
   - Initializes on login
   - Handles session changes

5. **Error Handling**
   - Try-catch in all API calls
   - Graceful fallbacks
   - User-friendly error messages

### 📊 Cart Calculation

**Total Quantity = Sum of all item quantities**

```typescript
totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
```

Example:
- Item 1: 2 qty
- Item 2: 3 qty  
- Item 3: 1 qty
- **Total: 6 items** (shown in badge)

---

## API Integration

The context uses these CartApi functions:

```typescript
// Add/update item
addToCart(payload: AddToCartPayload)

// Fetch all items
fetchCartItems(): Promise<{ items: CartItem[] }>

// Update quantity
updateCartQty(cart_item_id: number, quantity: number)

// Remove item
deleteCartItem(cart_item_id: number)

// Clear all
deleteAllCartItems()
```

---

## Usage Examples

### Adding to Cart
```typescript
const { addItem } = useCart();

// In component
try {
  await addItem(productId, variantId, 1);
  // Cart badge updates automatically
} catch (error) {
  console.error("Failed to add:", error);
}
```

### Removing from Cart
```typescript
const { removeItem } = useCart();

await removeItem(cartItemId);
// Cart updates instantly
```

### Decreasing Quantity
```typescript
const { updateQuantity } = useCart();

await updateQuantity(cartItemId, newQuantity);
// If quantity ≤ 0, item is removed automatically
```

### Checking Cart State
```typescript
const { totalQuantity, items, count } = useCart();

// totalQuantity: total quantity of all items (6 in example above)
// count: number of unique items (3 in example above)
// items: full cart item details array
```

---

## Files Modified

| File | Changes |
|------|---------|
| `App.tsx` | Added `CartProvider` wrapper |
| `CartContext.tsx` | Implemented full context with hooks |
| `MainTabs.tsx` | Uses `useCart()` for badge count |
| `product_description_screen.tsx` | Uses `addItem()` from context |
| `Register.tsx` | Uses `totalQuantity` from context |

---

## Testing Checklist

- [ ] Add product to cart from ProductDescription screen
- [ ] Verify badge updates on BottomTabs
- [ ] Navigate to Profile screen - badge shows same count
- [ ] Navigate to Cart screen - items remain
- [ ] Logout and login - cart persists
- [ ] Remove item from cart - badge decreases
- [ ] Increase/decrease quantity - badge updates correctly
- [ ] Add same product twice - quantity increases (no duplicate)
- [ ] Refresh app - cart state preserved from API

---

## Performance Optimization

The context uses:
- `useCallback` for memoized functions (prevents unnecessary re-renders)
- `useMemo` for expensive calculations
- Conditional rendering based on `isAuthenticated`
- Dependency arrays to avoid infinite loops

---

## Future Enhancements

- [ ] Persist cart locally (AsyncStorage) for offline support
- [ ] Add cart count animation on badge
- [ ] Implement wishlist context similarly
- [ ] Add cart sync on app focus (refocus)
- [ ] Batch update operations for batch add
