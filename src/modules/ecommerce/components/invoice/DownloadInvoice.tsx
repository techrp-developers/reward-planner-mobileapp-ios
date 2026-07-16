import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView, 
  TouchableOpacity, 
  Alert,
  Platform,
} from 'react-native';
import * as HtmlToPdf from 'react-native-html-to-pdf';
import Share from 'react-native-share';

// Icons
import CenterIcon from "../../../assets/menu/Menu_Home.svg"; 

const InvoiceScreen = () => {
  // In a real app, this would come from: const { orderId } = route.params; 
  // followed by a useEffect fetch call.
  const invoiceData = {
    invoiceNumber: 'ORD-88291',
    invoiceDate: 'March 05, 2026',
    customerName: 'John Smith',
    customerEmail: 'john@example.com',
    customerAddress: '123 Main St, Anytown USA 12345',
    items: [
      { id: 1, name: 'Premium Wireless Headphones', quantity: 1, price: 129.99, total: 129.99 },
      { id: 2, name: 'USB-C Fast Charger', quantity: 2, price: 19.99, total: 39.98 },
    ],
    shipping: 5.00,
    tax: 12.50,
    total: 187.47,
    rewardPointsEarned: 150,
  };

  const handleGeneratePDF = async () => {
    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #1e293b; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; }
            .rewards { background: #4f46e5; color: white; padding: 15px; border-radius: 10px; text-align: center; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th { text-align: left; color: #64748b; border-bottom: 1px solid #e2e8f0; padding: 10px; }
            td { padding: 10px; border-bottom: 1px solid #f1f5f9; }
            .total-box { margin-top: 20px; text-align: right; }
            .grand-total { font-size: 20px; font-weight: bold; color: #4f46e5; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>INVOICE</h1>
            <p>Order #${invoiceData.invoiceNumber} | ${invoiceData.invoiceDate}</p>
          </div>
          <div class="rewards">
            <small>REWARDS EARNED</small>
            <h2>+${invoiceData.rewardPointsEarned} Points</h2>
          </div>
          <p><strong>Billed To:</strong><br/>${invoiceData.customerName}<br/>${invoiceData.customerAddress}</p>
          <table>
            <thead>
              <tr><th>Item</th><th>Qty</th><th>Total</th></tr>
            </thead>
            <tbody>
              ${invoiceData.items.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>$${item.total.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total-box">
            <p>Shipping: $${invoiceData.shipping.toFixed(2)}</p>
            <p class="grand-total">Total: $${invoiceData.total.toFixed(2)}</p>
          </div>
        </body>
      </html>
    `;

    try {
      const options = {
        html: htmlContent,
        fileName: `Invoice_${invoiceData.invoiceNumber}`,
        directory: 'Documents',
      };
      const file = await HtmlToPdf.generatePDF(options);
      await Share.open({
        url: `file://${file.filePath}`,
        type: 'application/pdf',
        saveToFiles: Platform.OS === 'ios',
        failOnCancel: false,
        ...(Platform.OS === 'android' ? ({ useInternalStorage: true } as Record<string, unknown>) : {}),
      });
    } catch {
      Alert.alert('Error', 'Could not generate PDF');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* Top UI View */}
        <View style={styles.headerUI}>
          <View style={styles.iconCircle}>
             <CenterIcon width={30} height={30} fill="#4F46E5" />
          </View>
          <Text style={styles.successTitle}>Order Confirmed!</Text>
        </View>

        <View style={styles.rewardsCard}>
            <Text style={styles.rewardsTitle}>Rewards Planner</Text>
            <Text style={styles.rewardsPoints}>+{invoiceData.rewardPointsEarned} Points</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Order Summary</Text>
          {invoiceData.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.name} (x{item.quantity})</Text>
              <Text style={styles.itemPrice}>${item.total.toFixed(2)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Paid</Text>
            <Text style={styles.totalValue}>${invoiceData.total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity style={styles.downloadBtn} onPress={handleGeneratePDF}>
          <Text style={styles.downloadText}>Download PDF Receipt</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { padding: 20 },
  headerUI: { alignItems: 'center', marginVertical: 20 },
  iconCircle: { 
    width: 60, height: 60, borderRadius: 30, 
    backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginBottom: 10 
  },
  successTitle: { fontSize: 24, fontWeight: '800', color: '#1E293B' },
  rewardsCard: { 
    backgroundColor: '#4F46E5', borderRadius: 16, padding: 20, 
    alignItems: 'center', marginBottom: 20 
  },
  rewardsTitle: { color: '#E0E7FF', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  rewardsPoints: { color: '#FFF', fontSize: 28, fontWeight: '800' },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, elevation: 3 },
  sectionHeader: { fontSize: 16, fontWeight: '700', marginBottom: 15 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  itemName: { color: '#64748B' },
  itemPrice: { fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 15 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 16, fontWeight: '700' },
  totalValue: { fontSize: 20, fontWeight: '800', color: '#4F46E5' },
  downloadBtn: { 
    backgroundColor: '#1E293B', padding: 18, borderRadius: 12, 
    alignItems: 'center', marginTop: 25 
  },
  downloadText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
});

export default InvoiceScreen;