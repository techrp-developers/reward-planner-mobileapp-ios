import React from "react";
import { View, FlatList, StyleSheet, Dimensions } from "react-native";
import OrderProductCart from "../../../common/order/OrderProductCart";

const { width } = Dimensions.get("window");

// Adjust CARD_WIDTH so the next card is partially visible (hinting scroll)
const CARD_WIDTH = width * 0.30; 
const HORIZONTAL_PADDING = 16;

type Props = {
    products: any[];
};

function ItemSeparator() {
    return <View style={styles.itemSeparator} />;
}

export default function ProductCarousel({ products }: Props) {
    return (
        <View style={styles.container}>
            <FlatList
                data={products ?? []}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item, index) => `${item?.id ?? index}`}
                contentContainerStyle={styles.listContent}
                ItemSeparatorComponent={ItemSeparator}
                renderItem={({ item }) => (
                    <OrderProductCart item={item} cardWidth={CARD_WIDTH} />
                    
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 12,
        marginBottom: 100,
    },
    listContent: {
        paddingHorizontal: HORIZONTAL_PADDING,
    },
    itemSeparator: {
        width: 12,
    },
});