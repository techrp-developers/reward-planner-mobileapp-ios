import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { useStickyBottomCTA } from './hooks/useStickyBottomCTA';

type Props = {
  children: React.ReactNode;
  bottomOffset?: number;
  onLayout?: ReturnType<typeof useStickyBottomCTA>['onCtaLayout'];
  style?: StyleProp<ViewStyle>;
};

function StickyBottomCTA({ children, bottomOffset = 0, onLayout, style }: Props) {
  return (
    <View
      onLayout={onLayout}
      pointerEvents="box-none"
      style={[styles.container, { bottom: bottomOffset }, style]}
    >
      {children}
    </View>
  );
}

export default React.memo(StickyBottomCTA);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 20,
    elevation: 20,
  },
});
