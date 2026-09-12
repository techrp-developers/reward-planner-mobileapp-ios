import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/type';
import { sendServiceEnquiry } from '../../api/ServiceAPI';
import { useAlert } from '../../../ecommerce/components/alerts/useAlert';

type NavProp = NativeStackNavigationProp<HomeStackParamList>;

const EnquireForm = () => {
    const navigation = useNavigation<NavProp>();
    const alert = useAlert();

    const [form, setForm] = useState({
        name: '',
        mobile: '',
        email: '',
        city: '',
        pincode: '',
        notes: '',
    });

    const [isLoading, setIsLoading] = useState(false);

    const onChange = (key: keyof typeof form, value: string) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const canSubmit =
        !isLoading &&
        form.name &&
        form.mobile.length === 10 &&
        form.email &&
        form.city &&
        form.pincode.length === 6;

    const handleSubmit = async () => {
        if (!canSubmit) return;

        setIsLoading(true);
        try {
            const payload = {
                name: form.name,
                email: form.email,
                contact: form.mobile,
                city: form.city,
                pincode: form.pincode,
                description: form.notes || 'No additional notes',
                subject: 'Service Enquiry',
            };

            await sendServiceEnquiry(payload);
            
            setIsLoading(false);
            alert.success('Success', 'Your enquiry has been submitted successfully!');
            
            // Reset form
            setForm({
                name: '',
                mobile: '',
                email: '',
                city: '',
                pincode: '',
                notes: '',
            });

            // Navigate to success screen
            setTimeout(() => {
                navigation.navigate('SubmittedSuccessful');
            }, 500);
        } catch (error: any) {
            setIsLoading(false);
            alert.error(
                'Error',
                error?.message || 'Failed to submit your enquiry. Please try again.'
            );
        }
    };

    return (
        <View style={styles.card}>
            <Text style={styles.heading}>Enquire Now</Text>
            <Text style={styles.desc}>
                Please fill out the form below and our team will get in touch with you shortly.
            </Text>

            {/* FULL NAME */}
            <Text style={styles.label}>
                Full Name <Text style={styles.star}>*</Text>
            </Text>
            <View style={styles.inputWrap}>
                <TextInput
                    placeholder="Enter your name here"
                    placeholderTextColor="#A3A3A3"
                    value={form.name}
                    onChangeText={(t) => onChange('name', t)}
                    style={[styles.input, { paddingRight: 42 }]}
                />
                <View style={styles.icon}>
                    <MaterialIcons name="person-outline" size={18} color="#8A8A8A" />
                </View>
            </View>

            {/* MOBILE */}
            <Text style={styles.label}>
                Mobile Number <Text style={styles.star}>*</Text>
            </Text>
            <View style={styles.inputWrap}>
                <TextInput
                    placeholder="Enter your mobile number here"
                    placeholderTextColor="#A3A3A3"
                    value={form.mobile}
                    onChangeText={(t) =>
                        onChange('mobile', t.replace(/[^0-9]/g, ''))
                    }
                    keyboardType="number-pad"
                    maxLength={10}
                    style={[styles.input, { paddingRight: 42 }]}
                />
                <View style={styles.icon}>
                    <MaterialIcons name="call" size={18} color="#8A8A8A" />
                </View>
            </View>

            {/* EMAIL */}
            <Text style={styles.label}>
                Email ID <Text style={styles.star}>*</Text>
            </Text>
            <View style={styles.inputWrap}>
                <TextInput
                    placeholder="Enter your email id here"
                    placeholderTextColor="#A3A3A3"
                    value={form.email}
                    onChangeText={(t) => onChange('email', t)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={[styles.input, { paddingRight: 42 }]}
                />
                <View style={styles.icon}>
                    <MaterialIcons name="mail-outline" size={18} color="#8A8A8A" />
                </View>
            </View>

            {/* CITY */}
            <Text style={styles.label}>
                City <Text style={styles.star}>*</Text>
            </Text>
            <View style={styles.inputWrap}>
                <TextInput
                    placeholder="Enter city here"
                    placeholderTextColor="#A3A3A3"
                    value={form.city}
                    onChangeText={(t) => onChange('city', t)}
                    style={styles.input}
                />
            </View>

            {/* PINCODE */}
            <Text style={styles.label}>
                Pincode <Text style={styles.star}>*</Text>
            </Text>
            <View style={styles.inputWrap}>
                <TextInput
                    placeholder="Enter pincode here"
                    placeholderTextColor="#A3A3A3"
                    value={form.pincode}
                    onChangeText={(t) =>
                        onChange('pincode', t.replace(/[^0-9]/g, ''))
                    }
                    keyboardType="number-pad"
                    maxLength={6}
                    style={styles.input}
                />
            </View>

            {/* NOTES */}
            <Text style={styles.optionalLabel}>Additional Notes (optional)</Text>
            <View style={[styles.inputWrap, styles.textAreaWrap]}>
                <TextInput
                    placeholder="Enter any specific questions or requirements you’d like to share"
                    placeholderTextColor="#A3A3A3"
                    value={form.notes}
                    onChangeText={(t) => onChange('notes', t)}
                    multiline
                    style={[styles.input, styles.textArea]}
                />
            </View>

            {/* SUBMIT */}
            <TouchableOpacity
                activeOpacity={0.9}
                disabled={!canSubmit}
                style={!canSubmit && styles.disabled}
                onPress={handleSubmit}
            >
                <LinearGradient
                    colors={['#8665FF', '#5B47A3']}
                    style={styles.submitBtn}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <Text style={styles.submitText}>Submit</Text>
                    )}
                </LinearGradient>
            </TouchableOpacity>

        </View>
    );
};

export default EnquireForm;
const styles = StyleSheet.create({
    card: {
        marginHorizontal: 16,
        marginTop: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EDEDED',
        padding: 14,
    },

    heading: {
        fontSize: 15,
        fontWeight: '600',
        color: '#202020',
    },

    desc: {
        fontSize: 11.5,
        color: '#6B6B6B',
        marginTop: 6,
        lineHeight: 16,
    },

    label: {
        marginTop: 14,
        fontSize: 13,
        color: '#111111',
    },

    star: {
        color: '#E11D48',
    },

    optionalLabel: {
        marginTop: 14,
        fontSize: 13,
        color: '#606060',
    },

    inputWrap: {
        marginTop: 6,
        borderWidth: 1,
        borderColor: '#EEEEEE',
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
        height: 44,
        justifyContent: 'center',
        paddingHorizontal: 12,
    },

    input: {
        fontSize: 13,
        color: '#222222',
        padding: 0,
    },

    icon: {
        position: 'absolute',
        right: 10,
        height: '100%',
        justifyContent: 'center',
    },

    textAreaWrap: {
        height: 92,
        paddingTop: 10,
    },

    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },

    submitBtn: {
        marginTop: 18,
        height: 46,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },

    submitText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },

    disabled: {
        opacity: 0.55,
    },
});
