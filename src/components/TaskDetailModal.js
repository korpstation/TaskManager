import React from "react";
import { Modal, View, Text, Image, TouchableOpacity } from "react-native";

function getContent(task) {
  if (!task) return { title: "", image: null };
  if (typeof task.content === "string") {
    try {
      const obj = JSON.parse(task.content || "{}");
      return { title: obj.title || task.content, image: obj.image || null };
    } catch {
      return { title: task.content, image: null };
    }
  }
  return { title: task.content?.title || "", image: task.content?.image || null };
}

export default function TaskDetailModal({ visible, onClose, task }) {
  const { title, image } = getContent(task);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.25)",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View
          style={{
            backgroundColor: "#FFF",
            borderRadius: 16,
            padding: 24,
            width: 310,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontWeight: "700",
              fontSize: 22,
              marginBottom: 16,
              textAlign: "center",
            }}
          >
            {title}
          </Text>
          {image ? (
            <Image
              source={{ uri: image }}
              style={{
                width: 188,
                height: 188,
                borderRadius: 12,
                marginBottom: 18,
                backgroundColor: "#F4F4F4",
              }}
              resizeMode="contain"
            />
          ) : null}
          <Text
            style={{
              marginVertical: 8,
              fontSize: 16,
              color: task?.done ? "#21808D" : "#EF4444",
              fontWeight: "bold",
            }}
          >
            {task?.done ? "Finished" : "To do"}
          </Text>
          <TouchableOpacity
            style={{
              marginTop: 18,
              paddingVertical: 10,
              paddingHorizontal: 24,
              borderRadius: 8,
              backgroundColor: "#21808D",
            }}
            onPress={onClose}
          >
            <Text style={{ color: "#FFF", fontWeight: "bold" }}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
