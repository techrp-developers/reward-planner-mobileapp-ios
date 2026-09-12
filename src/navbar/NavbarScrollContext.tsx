import React from "react";
import { Animated } from "react-native";

// Navbar sits as a SIBLING of ModuleStack.Navigator in MainLayout, not a
// parent of the scrollable module screens — so there's no prop path from a
// module's Home screen up to Navbar. This context is the shared channel:
// each Home screen forwards its scroll offset into the same Animated.Value,
// and Navbar reads it to drive its collapse animation, independent of where
// either sits in the tree.
type NavbarScrollContextValue = {
  scrollY: Animated.Value;
  onScroll: (event: any) => void;
  resetScroll: () => void;
};

const NavbarScrollContext = React.createContext<NavbarScrollContextValue | null>(null);

// ServicesModule's and BBPS's Home screens are reachable two ways: nested
// under MainLayout's ModuleStack (inside the provider, drives the collapse
// animation) AND as top-level AppStack routes ("ServiceStack",
// "BBPSHomeStack" in RootNavigator.tsx — no MainLayout/Navbar in that tree
// at all). A fallback no-op keeps useNavbarScroll safe to call
// unconditionally from either path instead of throwing outside the provider.
const noopFallback: NavbarScrollContextValue = {
  scrollY: new Animated.Value(0),
  onScroll: () => {},
  resetScroll: () => {},
};

export const NavbarScrollProvider = ({ children }: { children: React.ReactNode }) => {
  const scrollY = React.useRef(new Animated.Value(0)).current;

  // useNativeDriver: false — the collapse animation drives a `height` style
  // on Navbar/Navbar_Background, which the native driver can't animate.
  // Fine for a header; this isn't a heavy list.
  const onScroll = React.useMemo(
    () =>
      Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: false },
      ),
    [scrollY],
  );

  const resetScroll = React.useCallback(() => {
    scrollY.setValue(0);
  }, [scrollY]);

  const value = React.useMemo(
    () => ({ scrollY, onScroll, resetScroll }),
    [scrollY, onScroll, resetScroll],
  );

  return (
    <NavbarScrollContext.Provider value={value}>
      {children}
    </NavbarScrollContext.Provider>
  );
};

export const useNavbarScroll = (): NavbarScrollContextValue =>
  React.useContext(NavbarScrollContext) ?? noopFallback;
