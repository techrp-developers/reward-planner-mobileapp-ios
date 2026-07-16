import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ListRenderItem,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import OptimizedImage from "../common/OptimizedImage";

const { width } = Dimensions.get("window");
const IMAGE_SIZE = width * 1.0;

type Props = {
  images: string[];
  activeDot: number;
  onDotPress: (i: number) => void;
  loadImages?: boolean;
};

export default function ProductHero({ images, activeDot, onDotPress, loadImages = true }: Props) {
  const listRef = useRef<FlatList>(null);
  const isInternalJump = useRef(false);

  const hasLoop = images.length > 1;
  const loopedImages = useMemo(() => {
    if (!hasLoop) return images;
    return [images[images.length - 1], ...images, images[0]];
  }, [images, hasLoop]);

  const logicalToLoopedIndex = useCallback(
    (logicalIndex: number) => (hasLoop ? logicalIndex + 1 : logicalIndex),
    [hasLoop]
  );

  useEffect(() => {
    if (!hasLoop) return;
    listRef.current?.scrollToIndex({ index: 1, animated: false });
  }, [hasLoop, loopedImages.length]);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const rawIndex = Math.round(e.nativeEvent.contentOffset.x / width);

    if (!hasLoop) {
      onDotPress(rawIndex);
      return;
    }

    const loopLastIndex = loopedImages.length - 1;

    if (rawIndex === 0) {
      isInternalJump.current = true;
      listRef.current?.scrollToIndex({ index: images.length, animated: false });
      onDotPress(images.length - 1);
      requestAnimationFrame(() => {
        isInternalJump.current = false;
      });
      return;
    }

    if (rawIndex === loopLastIndex) {
      isInternalJump.current = true;
      listRef.current?.scrollToIndex({ index: 1, animated: false });
      onDotPress(0);
      requestAnimationFrame(() => {
        isInternalJump.current = false;
      });
      return;
    }

    if (!isInternalJump.current) {
      onDotPress(rawIndex - 1);
    }
  };

  const handleDotPress = useCallback(
    (index: number) => {
      listRef.current?.scrollToIndex({ index: logicalToLoopedIndex(index), animated: true });
      onDotPress(index);
    },
    [logicalToLoopedIndex, onDotPress]
  );

  const getItemLayout = useCallback(
    (_: ArrayLike<string> | null | undefined, index: number) => ({
      length: width,
      offset: width * index,
      index,
    }),
    []
  );

  const renderImage: ListRenderItem<string> = useCallback(
    ({ item }) => {
      return (
        <View style={styles.slide}>
          <OptimizedImage
            path={item}
            width={IMAGE_SIZE}
            height={IMAGE_SIZE}
            resizeMode="contain"
            sizePreset="full"
            quality={80}
            priority="high"
            fallbackLabel="Image unavailable"
            loadEnabled={loadImages}
          />
        </View>
      );
    },
    [loadImages]
  );

  return (
    <View>
      <View style={styles.heroCard}>
        <FlatList
          ref={listRef}
          data={loopedImages}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, i) => i.toString()}
          onMomentumScrollEnd={onScrollEnd}
          renderItem={renderImage}
          getItemLayout={getItemLayout}
          initialScrollIndex={hasLoop ? 1 : 0}
        />

        <View style={styles.dotsRow}>
          {images.map((_, i) => (
            <DotButton
              key={i}
              index={i}
              active={i === activeDot}
              onPress={handleDotPress}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.shareBtn} activeOpacity={0.85}>
          <MaterialCommunityIcons name="share-variant" size={18} color="#222" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const DotButton = memo(
  ({
    index,
    active,
    onPress,
  }: {
    index: number;
    active: boolean;
    onPress: (index: number) => void;
  }) => {
    const handlePress = useCallback(() => {
      onPress(index);
    }, [index, onPress]);

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handlePress}
        style={[styles.dot, active && styles.dotActive]}
      />
    );
  }
);

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: "#fff",
    paddingVertical: 8,
  },

  slide: {
    width,

    
    alignItems: "center",
    justifyContent: "center",
  },

  mainImage: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
  },

  dotsRow: {
    marginTop: 6,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  dotActive: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#E84D9B",
  },

  shareBtn: {
    position: "absolute",
    right: 14,
    bottom: 10,
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
});
