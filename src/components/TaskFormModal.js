// components/TaskFormModal.js
import React from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";

export default function TaskFormModal({
  visible,
  headerTitle,
  submitLabel,
  titleValue,
  onChangeTitle,
  imageValue,
  onPickImage,
  onCancel,
  onSubmit,
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.header}>{headerTitle}</Text>
          <TextInput
            placeholder="Title…"
            value={titleValue}
            onChangeText={onChangeTitle}
            style={styles.input}
            autoFocus
          />
          <TouchableOpacity onPress={onPickImage} style={styles.imageWrapper}>
            {imageValue ? (
              <Image source={{ uri: imageValue }} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text>Pick Image</Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.row}>
            <TouchableOpacity onPress={onCancel}>
              <Text>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onSubmit}>
              <Text style={styles.submitText}>{submitLabel}</Text>
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
  content: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 12,
    width: 300,
    alignItems: "stretch",
    elevation: 8,
  },
  header: {
    marginBottom: 12,
    fontWeight: "700",
    fontSize: 18,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#999",
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: "#FAFAFA",
  },
  imageWrapper: {
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  image: {
    width: 84,
    height: 84,
    borderRadius: 8,
  },
  imagePlaceholder: {
    width: 84,
    height: 84,
    backgroundColor: "#F0F0F0",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
    gap: 16,
  },
  submitText: {
    color: "#21808D",
    fontWeight: "bold",
  },
});
