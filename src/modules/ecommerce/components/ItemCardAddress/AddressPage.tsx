
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { fetchAllAddress } from "../../api/AddressApi";
import { useAlert } from "../alerts";
import { useTranslation } from "react-i18next";
import i18n from "../../../../i18n";

type ApiAddress = {
  address_id: number;
  address_type: string;
  is_default: number;
  address1: string;
  city: string;
  zipcode: string;
};

type AddressItem = {
  id: number;
  name: string;
  isDefault: boolean;
  address: string;
};

export default function AddressPage() {
  const { t: tx } = useTranslation();
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const alert = useAlert();

  const load = useCallback(async () => {
    try {
      const res = await fetchAllAddress();

      const list = Array.isArray(res.data) ? res.data : [];

      const mapped = list.map((a: ApiAddress) => ({
        id: a.address_id,
        name: a.address_type.toUpperCase(),
        isDefault: a.is_default === 1,
        address: `${a.address1}, ${a.city} - ${a.zipcode}`,
      }));

      setAddresses(mapped);

      const def = mapped.find(x => x.isDefault);
      if (def) setSelectedId(def.id);
    } catch {
      alert.error(i18n.t("products:addressPage.error"), i18n.t("products:addressPage.failedToLoadAddresses"));
    }
  }, [alert]);

  useEffect(() => {
    load();
  }, [load]);


  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity
        style={styles.addNew}
        onPress={() => setShowForm(!showForm)}
      >
        <Text style={styles.plus}>＋</Text>
        <Text style={styles.addText}>{tx("products:addressPage.addNewAddress")}</Text>
      </TouchableOpacity>

      <Text style={styles.section}>{tx("products:addressPage.savedAddresses")}</Text>

      {addresses.map(item => (
        <TouchableOpacity
          key={item.id}
          style={[styles.card, selectedId === item.id && styles.active]}
          onPress={() => setSelectedId(item.id)}
        >
          <View style={styles.cardContent}>
            <Text style={styles.name}>{item.name}</Text>
            {item.isDefault && <Text style={styles.default}>{tx("products:addressPage.default")}</Text>}
            <Text style={styles.address}>{item.address}</Text>
          </View>

          <View style={styles.radioOuter}>
            {selectedId === item.id && <View style={styles.radioInner} />}
          </View>
        </TouchableOpacity>
      ))}

      {showForm && (
        <View style={styles.form}>
          {["Name", "Phone", "Address", "City", "State", "Pincode"].map(f => (
            <TextInput key={f} placeholder={f} style={styles.input} />
          ))}

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={() => alert.info(i18n.t("products:addressPage.info"), i18n.t("products:addressPage.formSubmissionComingSoon"))}
          >
            <Text style={styles.saveText}>{tx("products:addressPage.saveAddress")}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 14,
  },
  addNew: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  plus: {
    fontSize: 18,
    color: '#6D5FFD',
    marginRight: 8,
  },
  addText: {
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  active: {
    borderWidth: 1,
    borderColor: '#6D5FFD',
  },
  cardContent: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
  },
  default: {
    fontSize: 11,
    color: '#6D5FFD',
  },
  address: {
    fontSize: 12,
    color: '#555',
    marginTop: 4,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#6D5FFD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6D5FFD',
  },
  form: {
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 10,
    marginTop: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  saveBtn: {
    backgroundColor: '#6D5FFD',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveText: {
    color: '#FFF',
    fontWeight: '600',
  },
})
