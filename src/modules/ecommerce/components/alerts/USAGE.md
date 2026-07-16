# Custom Alert System - Usage Guide

## Overview
The custom alert system provides a modern, professional way to display notifications throughout your app. It replaces the standard React Native `Alert.alert()` with styled, animated alerts.

## Setup (Already Done)
- `AlertProvider` is wrapped around your app in `App.tsx`
- `AlertContainer` is displayed at the top of your screen
- Ready to use in any component!

## Usage Examples

### Basic Usage in a Component

```typescript
import { useAlert } from "../components/alerts";

export function MyComponent() {
  const alert = useAlert();

  const handleSuccess = () => {
    alert.success("Success", "Operation completed successfully");
  };

  const handleError = () => {
    alert.error("Error", "Something went wrong");
  };

  const handleWarning = () => {
    alert.warning("Warning", "Please proceed with caution");
  };

  const handleInfo = () => {
    alert.info("Info", "Here's some information");
  };

  return (
    <View>
      {/* Your component content */}
    </View>
  );
}
```

### Alert Types & Default Durations

1. **Success** - Green, 3 seconds
```typescript
alert.success("Success", "Your changes have been saved");
```

2. **Error** - Red, 4 seconds
```typescript
alert.error("Login Failed", "Invalid email or password");
```

3. **Warning** - Orange, 3.5 seconds
```typescript
alert.warning("Warning", "This action cannot be undone");
```

4. **Info** - Blue, 3 seconds
```typescript
alert.info("Information", "New updates are available");
```

### Custom Configuration

Use the `show()` method for advanced configuration:

```typescript
const alert = useAlert();

alert.show({
  type: "success",
  title: "Password Updated",
  message: "Your password has been changed successfully",
  duration: 5000, // 5 seconds
  actionText: "View Details", // Optional action button
  onAction: () => {
    // Handle action button press
    console.log("User clicked action");
  },
});
```

### Manual Dismiss

```typescript
const alert = useAlert();

// Get the alert ID
const alertId = alert.success("Processing", "Please wait...");

// Manually dismiss after some action
setTimeout(() => {
  alert.dismiss(alertId);
}, 10000);

// Dismiss all alerts
alert.dismissAll();
```

### Real-World Example - Login Screen

```typescript
import { useAlert } from "../components/alerts";

export function LoginScreen() {
  const alert = useAlert();
  const { login } = useAuth();

  const handleLogin = async () => {
    try {
      await login({ email, password });
      alert.success("Welcome", "You've logged in successfully");
      // Navigation happens automatically
    } catch (error: any) {
      const message = error?.response?.data?.message || "Login failed";
      alert.error("Login Error", message);
    }
  };

  return (
    // Your login form
  );
}
```

### Real-World Example - Account Activation

```typescript
import { useAlert } from "../components/alerts";

export function AccountActivateScreen() {
  const alert = useAlert();

  const handleActivate = async () => {
    if (!email) {
      alert.error("Validation", "Please enter your email address");
      return;
    }

    try {
      await activateAccount({ email });
      alert.success("OTP Sent", "Check your email for the verification code");
      navigation.navigate("OTPScreen", { email });
    } catch (error: any) {
      alert.error(
        "Activation Failed",
        error?.response?.data?.message || "Could not send OTP"
      );
    }
  };

  return (
    // Your activation form
  );
}
```

### Real-World Example - OTP Verification

```typescript
import { useAlert } from "../components/alerts";

export function OTPScreen() {
  const alert = useAlert();

  const handleVerify = async () => {
    try {
      await verifyActivationOtp({ email, otp });
      alert.success("Verified", "OTP verified successfully");
      navigation.navigate("SetNewPassword", { email });
    } catch (error: any) {
      alert.error("Verification Failed", "Invalid or expired OTP", 4000);
    }
  };

  const handleResend = async () => {
    try {
      await activateAccount({ email });
      alert.info("Resent", "New OTP sent to your email");
      // Reset timer
    } catch (error: any) {
      alert.error("Resend Failed", error?.response?.data?.message);
    }
  };

  return (
    // Your OTP form
  );
}
```

### Real-World Example - Password Setup

```typescript
import { useAlert } from "../components/alerts";

export function SetNewPasswordScreen() {
  const alert = useAlert();

  const handleSetPassword = async () => {
    if (!password || !confirmPassword) {
      alert.warning("Required", "Please enter both passwords");
      return;
    }

    if (password.length < 6) {
      alert.warning("Weak", "Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      alert.error("Mismatch", "Passwords do not match");
      return;
    }

    try {
      await setPassword({ email, password });
      alert.success("Success", "Password set successfully");
      navigation.navigate("AccountActivationSuccess");
    } catch (error: any) {
      alert.error(
        "Failed",
        error?.response?.data?.message || "Could not set password"
      );
    }
  };

  return (
    // Your password form
  );
}
```

## Alert Styling

The alert system automatically applies the correct styling based on type:

- **Success**: Green (#4CAF50)
- **Error**: Red (#F44336)
- **Warning**: Orange (#FF9800)
- **Info**: Blue (#2196F3)

Each alert includes:
- Colored icon (from Material Community Icons)
- Colored left border
- Subtle background color
- Drop shadow for depth
- Smooth slide-in/slide-out animations
- Dismiss button
- Optional action button

## Features

✅ **Animations** - Smooth slide and fade effects
✅ **Auto-dismiss** - Alerts disappear after default duration
✅ **Manual Control** - Dismiss specific alerts or all
✅ **Action Button** - Optional interactive button within alert
✅ **Responsive** - Works on all screen sizes
✅ **Type-Safe** - Full TypeScript support
✅ **Professional Design** - Matches your app's UI system
✅ **Accessible** - Clear icons and high contrast colors 

## Integration Checklist

- [x] AlertProvider configured in App.tsx
- [x] AlertContainer rendering at top of screen
- [x] useAlert hook ready to use
- [ ] Update LoginScreen to use new alerts
- [ ] Update OTPScreen to use new alerts
- [ ] Update AccountActivate to use new alerts
- [ ] Update SetNewPassword to use new alerts
- [ ] Update other screens as needed
