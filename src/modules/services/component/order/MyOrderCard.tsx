import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import Reward from '../../../../assets/product/rewards.svg';

interface Props {
    image: React.ReactNode;
    status: 'progress' | 'confirmed';
    statusText: string;
    title: string;
    subtitle: string;
    rewardCount: number;
}


const OrderStatusCard: React.FC<Props> = ({
    // image,
    status,
    statusText,
    title,
    subtitle,
    rewardCount,
}) => {
    return (

        <View style={styles.card}>
            {/* LEFT IMAGE */}
            <LinearGradient
                colors={['#F3F3F3', '#E3E4FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientWrap}
            >                <View style={styles.image}>
                    {/* {image} */}
                </View>
            </LinearGradient>

            {/* CENTER CONTENT */}
            <View style={styles.content}>
                <View
                    style={[
                        styles.statusBadge,
                        status === 'progress' && styles.progressBadge,
                    ]}
                >
                    <Text style={styles.statusText}>{statusText}</Text>
                </View>

                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>{subtitle}</Text>
            </View>

            {/* RIGHT REWARD */}
            <View style={styles.rewardWrap}>
                <Reward width={16} height={16} />
                <Text style={styles.rewardText}>{rewardCount}</Text>
            </View>
        </View>
    );
};

export default OrderStatusCard;
const styles = StyleSheet.create({
    gradientWrap: {
        borderRadius: 14,
        padding: 10,
        marginHorizontal: 16,
        marginVertical: 8,

    },

    card: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E6E6E6',
        padding: 12,
        alignItems: 'center',
        marginBottom: 10,

    },

    image: {
        width: 42,
        height: 42,
        justifyContent: 'center',
        alignItems: 'center',
    },

    content: {
        flex: 1,
    },

    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        backgroundColor: '#E5E7EB',
        marginBottom: 6,
    },

    progressBadge: {
        backgroundColor: '#0D862E',
    },

    statusText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#FFFFFF',
    },

    title: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },

    subtitle: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },

    rewardWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 10,
    },

    rewardText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#10B981',
        marginLeft: 4,
    },


});
