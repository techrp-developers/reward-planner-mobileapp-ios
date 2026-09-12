import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Keyboard, LayoutChangeEvent, Platform } from 'react-native';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TAB_BAR_HEIGHT } from '../BottomTabs';

type Options = {
  extraSpacing?: number;
  tabBarAware?: boolean;
  keyboardAware?: boolean;
};

const DEFAULT_SPACING = 12;
const MIN_SAFE_BOTTOM = 8;
const ATTACHED_TAB_GAP = 0;

export function useStickyBottomCTA({
  extraSpacing = DEFAULT_SPACING,
  tabBarAware = true,
  keyboardAware = true,
}: Options = {}) {
  const insets = useSafeAreaInsets();
  const tabBarHeightFromContext = useContext(BottomTabBarHeightContext);
  const [ctaHeight, setCtaHeight] = useState(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const safeBottom = Math.max(insets.bottom, MIN_SAFE_BOTTOM);
  const fallbackTabHeight = TAB_BAR_HEIGHT + safeBottom;
  const tabBarHeight = tabBarAware
    ? Math.max(Number(tabBarHeightFromContext || 0), fallbackTabHeight)
    : 0;

  useEffect(() => {
    if (!keyboardAware) {
      setKeyboardHeight(0);
      return undefined;
    }

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, event => {
      setKeyboardHeight(event.endCoordinates?.height ?? 0);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardAware]);

  const keyboardOffset = Math.max(keyboardHeight - insets.bottom, 0);
  const bottomOffset = keyboardOffset > 0
    ? keyboardOffset + extraSpacing
    : Math.max(tabBarHeight, safeBottom) + ATTACHED_TAB_GAP;

  const scrollContentPaddingBottom = ctaHeight + bottomOffset + extraSpacing;

  const onCtaLayout = useCallback((event: LayoutChangeEvent) => {
    const nextHeight = Math.ceil(event.nativeEvent.layout.height);
    setCtaHeight(currentHeight => (currentHeight === nextHeight ? currentHeight : nextHeight));
  }, []);

  return useMemo(() => ({
    bottomOffset,
    ctaHeight,
    keyboardHeight,
    onCtaLayout,
    safeBottom,
    scrollContentPaddingBottom,
    tabBarHeight,
  }), [
    bottomOffset,
    ctaHeight,
    keyboardHeight,
    onCtaLayout,
    safeBottom,
    scrollContentPaddingBottom,
    tabBarHeight,
  ]);
}
