// components/TextInputModal.js
import React from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

export default function TextInputModal({
  visible,
  title,
  placeholder,
  value,
  onChangeText,
  confirmLabel = "Save",
  cancelLabel = "Cancel",
  onCancel,
  onConfirm,
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.title}>{title}</Text>
          <TextInput
            placeholder={placeholder}
            value={value}
            onChangeText={onChangeText}
            style={styles.input}
          />
          <View style={styles.row}>
            <TouchableOpacity onPress={onCancel}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onConfirm}>
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  box: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 8,
    width: 300,
  },
  title: {
    marginBottom: 12,
    fontWeight: "600",
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#999",
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  cancelText: {
    marginRight: 16,
  },
  confirmText: {
    color: "#21808D",
    fontWeight: "bold",
  },
});
