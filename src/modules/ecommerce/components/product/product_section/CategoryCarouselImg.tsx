import React, { useMemo } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image } from "react-native";

type Props = {
  images: any[];          // SVG components or image URLs
  titles?: string[];      // optional
  onPressItem?: (index: number) => void;
};

export default function CategoryCarouselImg({ images, titles = [], onPressItem }: Props) {
  const data = useMemo(
    () =>
      images.map((img, index) => ({
        id: String(index),
        img,
        title: titles[index] ?? `Category ${index + 1}`,
      })),
    [images, titles]
  );

  return (
    <View style={styles.wrap}>
      <FlatList
        data={data}
        horizontal
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.card}
            onPress={() => onPressItem?.(index)}
          >
            <View style={styles.imgBox}>
              {(() => {
                if (typeof item.img === "string") {
                  return <Image source={{ uri: item.img }} style={{ width: 78, height: 78, borderRadius: 10 }} resizeMode="cover" />;
                } else if (item.img) {
                  return React.createElement(item.img, { width: 78, height: 78 });
                } else {
                  return null;
                }
              })()}
            </View>
            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: "#fff" },

  list: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
  },

  card: {
    width: 95,
    alignItems: "center",
    marginRight: 14,
  },

  imgBox: {
    width: 82,
    height: 82,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  title: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
  },
});
