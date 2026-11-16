import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import renderer, { act } from 'react-test-renderer';
import FitnessGradient from '../src/modules/step_counter/component/fitness/FitnessGradient';

jest.mock('react-native-linear-gradient', () => 'NativeGradient');

it('keeps padded content and footer measurement on the Yoga View', () => {
  const onLayout = jest.fn();
  let tree: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(
      <FitnessGradient colors={['blue', 'purple']} style={{ minHeight: 56, paddingVertical: 14 }} onLayout={onLayout}>
        <Text>Generate My Plan</Text>
      </FitnessGradient>,
    );
  });
  const container = tree!.root.findByType(View);
  expect(StyleSheet.flatten(container.props.style)).toMatchObject({ minHeight: 56, paddingVertical: 14 });
  expect(container.props.onLayout).toBe(onLayout);
  expect(container.findByType(Text).props.children).toBe('Generate My Plan');
  const paint = tree!.root.findByType('NativeGradient' as React.ElementType);
  expect(paint.props.children).toBeUndefined();
  expect(StyleSheet.flatten(paint.props.style).position).toBe('absolute');
  act(() => tree!.unmount());
});
