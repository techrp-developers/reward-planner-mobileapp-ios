import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Enable LayoutAnimation for smooth expansion
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface FAQItemData {
    question: string;
    answer: string;
}

interface FAQSectionProps {
    title: string;
    data: FAQItemData[];
    gradientColors?: string[];
    gradientAngle?: number;
}

const FAQItem = ({ item }: { item: FAQItemData }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const toggle = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsExpanded(!isExpanded);
    };

    return (
        <View style={styles.itemWrapper}>
            <TouchableOpacity style={styles.itemHeader} onPress={toggle} activeOpacity={0.7}>
                <Text style={styles.questionText}>{item.question}</Text>
                <View style={[styles.toggleIconWrap, isExpanded && styles.toggleIconWrapActive]}>
                    <MaterialIcons
                        name={isExpanded ? 'remove' : 'add'}
                        size={16}
                        color={isExpanded ? '#FFFFFF' : '#5B47A3'}
                    />
                </View>
            </TouchableOpacity>
            {isExpanded && (
                <View style={styles.answerBox}>
                    <Text style={styles.answerText}>{item.answer}</Text>
                </View>
            )}
        </View>
    );
};

const FAQSection: React.FC<FAQSectionProps> = ({
    title,
    data,
    gradientColors = ['#FFF2B2', '#FFFEFF', '#FEFDFF']
}) => {
    return (
        <View style={styles.container}>
            <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.headerGradient}
            >
                <Text style={styles.headerTitle}>{title}</Text>
                <View style={styles.blueBubble}>
                    <MaterialIcons name="help-outline" size={20} color="#FFFFFF" />
                </View>
            </LinearGradient>

            <View style={styles.listContainer}>
                {data.map((item, index) => (
                    <FAQItem key={index} item={item} />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        margin: 16,
        borderRadius: 22,
        backgroundColor: '#FFF',
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#1F2937',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
    },
    headerGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',

        gap: 12,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#1F2937',
        flex: 1,
        letterSpacing: -0.2,
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    listContainer: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 4,
    },

    blueBubble: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#5B47A3',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#5B47A3',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 3,
    },
    itemWrapper: {
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        marginHorizontal: 12,
    },
    itemHeader: {
        flexDirection: 'row',
        paddingVertical: 16,
        alignItems: 'center',
        gap: 12,
    },
    toggleIconWrap: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#F3EFFF',
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    toggleIconWrapActive: {
        backgroundColor: '#5B47A3',
    },
    questionText: {
        fontSize: 14,
        color: '#1F2937',
        fontWeight: '600',
        flex: 1,
    },
    answerBox: {
        paddingLeft: 4,
        paddingRight: 40,
        paddingBottom: 16,
    },
    answerText: {
        fontSize: 13,
        color: '#6B7280',
        lineHeight: 19,
    },
});

export default FAQSection;