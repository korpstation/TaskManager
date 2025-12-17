// components/MenuModal.js
import React from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";
import { Edit, Trash2 } from "../components/Icons";

export default function MenuModal({
  visible,
  onClose,
  onRename,
  onDeleteList,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.content}>
          <TouchableOpacity style={styles.item} onPress={onRename}>
            <Edit size={20} color="#21808D" />
            <Text style={styles.itemTextPrimary}>Rename List</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.item} onPress={onDeleteList}>
            <Trash2 size={20} color="#EF4444" />
            <Text style={styles.itemTextDanger}>Delete List</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 100,
    paddingRight: 24,
  },
  content: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    minWidth: 180,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  itemTextPrimary: {
    fontSize: 16,
    color: "#21808D",
  },
  itemTextDanger: {
    fontSize: 16,
    color: "#EF4444",
  },
});
