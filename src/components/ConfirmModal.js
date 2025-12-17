// components/ConfirmModal.js
import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.row}>
            <TouchableOpacity onPress={onCancel} style={styles.btnLeft}>
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
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  box: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 24,
    width: 300,
    alignItems: "center",
  },
  title: {
    fontWeight: "700",
    fontSize: 18,
    marginBottom: 10,
  },
  message: {
    color: "#666",
    marginBottom: 24,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
  },
  btnLeft: {
    marginRight: 20,
  },
  cancelText: {
    color: "#21808D",
    fontWeight: "bold",
    fontSize: 16,
  },
  confirmText: {
    color: "#EF4444",
    fontWeight: "bold",
    fontSize: 16,
  },
});
