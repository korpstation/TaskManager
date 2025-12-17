import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { useAuth } from "../../Context/AuthContext";
import * as ImagePicker from "expo-image-picker";
import {
  ArrowLeft,
  MoreVertical,
  Plus,
  Trash2,
  Edit,
  CheckSquare,
} from "../../components/Icons";
import TextInputModal from "../../components/TextInputModal";
import MenuModal from "../../components/MenuModal";
import TaskDetailModal from "../../components/TaskDetailModal";
import TaskFormModal from "../../components/TaskFormModal";
import ConfirmModal from "../../components/ConfirmModal";
import {
  isDemoUser,
  getListDetailMock,
  getTodosByListMock,
  createTodoMock,
  updateTodoMock,
  deleteTodoMock,
  updateListMock,
  deleteListMock,
} from "../../dataMock";

// Helper: convertit un uri en base64
const fileToBase64 = (uri) =>
  new Promise((resolve, reject) => {
    fetch(uri)
      .then((res) => res.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result); // data:image/...
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      })
      .catch(reject);
  });

export default function DemoListDetailScreen({ navigation, route, showToast }) {
  const { listId } = route.params;
  const { username } = useAuth();

  // Ajout et édition tâche
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [addTaskTitle, setAddTaskTitle] = useState("");
  const [addTaskImage, setAddTaskImage] = useState("");

  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [editTaskTitle, setEditTaskTitle] = useState("");
  const [editTaskImage, setEditTaskImage] = useState("");
  const [editingTask, setEditingTask] = useState(null);

  // Système, lists
  const [filter, setFilter] = useState("all");
  const [showMenu, setShowMenu] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleteTaskModalOpen, setIsDeleteTaskModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isTaskDetailModalOpen, setIsTaskDetailModalOpen] = useState(false);
  const [detailTask, setDetailTask] = useState(null);

  const [list, setList] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sécurité: ce screen ne doit être utilisé que par un user demo
  useEffect(() => {
    if (!isDemoUser(username)) {
      showToast && showToast("Not a demo user", "error");
    }
  }, [username, showToast]);

  const loadData = async () => {
    try {
      setLoading(true);
      const l = await getListDetailMock(listId);
      const t = await getTodosByListMock(listId);
      setList(l || {});
      setTasks(t || []);
    } catch (e) {
      showToast && showToast(e?.message || "Error loading demo list", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [listId]);

  // Helpers
  async function pickImage(setImage) {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setImage(result.assets[0].uri);
    }
  }

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.done).length;
  const progressPercentage =
    totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const filteredTasks =
    filter === "active"
      ? tasks.filter((t) => !t.done)
      : filter === "completed"
      ? tasks.filter((t) => t.done)
      : tasks;

  const handleToggleTask = async (task) => {
    try {
      const updated = await updateTodoMock({ id: task.id, done: !task.done });
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, done: updated.done } : t))
      );
    } catch (e) {
      showToast && showToast(e?.message || "Error updating demo task", "error");
    }
  };

  const handleRenameOpen = () => {
    setNewListTitle(list?.title || "");
    setShowMenu(false);
    setIsRenameModalOpen(true);
  };

  const handleRenameSave = async () => {
    if (!newListTitle || newListTitle === list?.title) {
      setIsRenameModalOpen(false);
      return;
    }
    try {
      const updated = await updateListMock(listId, newListTitle);
      setList((prev) => ({ ...prev, title: updated.title }));
    } catch (e) {
      showToast && showToast(e?.message || "Error renaming demo list", "error");
    }
    setIsRenameModalOpen(false);
  };

  const handleDeleteList = async () => {
    setIsDeleteModalOpen(false);
    try {
      await deleteListMock(listId);
      navigation.goBack();
    } catch (e) {
      showToast && showToast(e?.message || "Error deleting demo list", "error");
    }
  };

  // Ajout
  const handleSaveTaskAdd = async () => {
    if (!addTaskTitle.trim()) return;

    let imageValue = addTaskImage || null;
    if (imageValue) {
      try {
        imageValue = await fileToBase64(imageValue);
      } catch (e) {
        console.log("Error converting image to base64 (add demo)", e);
        imageValue = null;
      }
    }

    try {
      await createTodoMock({
        content: JSON.stringify({ title: addTaskTitle, image: imageValue }),
        done: false,
        listId,
      });

      // recharger depuis le mock pour éviter les doublons
      await loadData();

      setIsAddTaskModalOpen(false);
      setAddTaskTitle("");
      setAddTaskImage("");
    } catch (e) {
      showToast && showToast(e?.message || "Error adding demo task", "error");
    }
  };

  // Edition
  const handleSaveTaskEdit = async () => {
    if (!editTaskTitle.trim()) return;

    let imageValue = editTaskImage || null;
    if (imageValue) {
      try {
        imageValue = await fileToBase64(imageValue);
      } catch (e) {
        console.log("Error converting image to base64 (edit demo)", e);
        imageValue = null;
      }
    }

    try {
      const updated = await updateTodoMock({
        id: editingTask.id,
        content: JSON.stringify({ title: editTaskTitle, image: imageValue }),
      });
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingTask.id ? { ...t, content: updated.content } : t
        )
      );
      setIsEditTaskModalOpen(false);
      setEditingTask(null);
      setEditTaskTitle("");
      setEditTaskImage("");
    } catch (e) {
      showToast && showToast(e?.message || "Error updating demo task", "error");
    }
  };

  const openTaskDetail = (task) => {
    setDetailTask(task);
    setIsTaskDetailModalOpen(true);
  };

  const getTaskLabel = (task) => {
    if (!task?.content) return "";
    if (typeof task.content === "string") {
      try {
        const obj = JSON.parse(task.content);
        if (obj && typeof obj === "object" && obj.title) {
          return obj.title;
        }
        return task.content;
      } catch {
        return task.content;
      }
    }
    if (typeof task.content === "object" && task.content.title) {
      return task.content.title;
    }
    return String(task.content);
  };

  if (loading || !list) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#21808D" />
        <Text style={{ marginTop: 20 }}>Loading demo list...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header agrandi */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setShowMenu(true)}
          >
            <MoreVertical size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>{list.title}</Text>
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Overall Progress</Text>
            <Text style={styles.progressPercentage}>
              {Math.round(progressPercentage)}%
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${progressPercentage}%` }]}
            />
          </View>
          <Text style={styles.progressText}>
            {completedTasks} of {totalTasks} tasks completed
          </Text>
        </View>
      </View>

      {/* Filtre */}
      <View style={styles.filterContainer}>
        {["all", "active", "completed"].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[
                styles.filterChipText,
                filter === f && styles.filterChipTextActive,
              ]}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Liste tâches */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <CheckSquare size={48} color="#999" />
            </View>
            <Text style={styles.emptyTitle}>
              {filter === "all"
                ? "No tasks yet"
                : filter === "active"
                ? "No active tasks"
                : "No completed tasks"}
            </Text>
            <Text style={styles.emptyDescription}>
              {filter === "all"
                ? "Add your first task to get started"
                : filter === "active"
                ? "All tasks are completed!"
                : "Complete some tasks to see them here"}
            </Text>
          </View>
        ) : (
          filteredTasks.map((task, index) => {
            let contentObj;
            if (typeof task.content === "string") {
              try {
                contentObj = JSON.parse(task.content);
              } catch {
                contentObj = { title: task.content };
              }
            } else {
              contentObj = task.content;
            }

            return (
              <View key={`${task.id}-${index}`} style={styles.taskCard}>
                <View style={styles.taskContent}>
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => handleToggleTask(task)}
                  >
                    <View
                      style={[
                        styles.checkboxInner,
                        task.done && styles.checkboxChecked,
                      ]}
                    >
                      {task.done && <CheckSquare size={16} color="#FFF" />}
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ flex: 1 }}
                    onPress={() => openTaskDetail(task)}
                    activeOpacity={0.8}
                  >
                    <Text
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      style={[
                        styles.taskText,
                        task.done && styles.taskTextCompleted,
                      ]}
                    >
                      {contentObj?.title}
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.taskActions}>
                    {contentObj?.image ? (
                      <TouchableOpacity onPress={() => openTaskDetail(task)}>
                        <Image
                          source={{ uri: contentObj.image }}
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 6,
                            marginRight: 8,
                          }}
                        />
                      </TouchableOpacity>
                    ) : (
                      <View />
                    )}
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => {
                        setEditingTask(task);
                        setEditTaskTitle(contentObj?.title || "");
                        setEditTaskImage(contentObj?.image || "");
                        setIsEditTaskModalOpen(true);
                      }}
                    >
                      <Edit size={18} color="#999" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => {
                        setTaskToDelete(task);
                        setIsDeleteTaskModalOpen(true);
                      }}
                    >
                      <Trash2 size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* FAB Ajout */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setAddTaskTitle("");
          setAddTaskImage("");
          setIsAddTaskModalOpen(true);
        }}
        activeOpacity={0.8}
      >
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Modale Ajout tâche */}
      <TaskFormModal
        visible={isAddTaskModalOpen}
        headerTitle="Add Demo Task"
        submitLabel="Add"
        titleValue={addTaskTitle}
        onChangeTitle={setAddTaskTitle}
        imageValue={addTaskImage}
        onPickImage={() => pickImage(setAddTaskImage)}
        onCancel={() => setIsAddTaskModalOpen(false)}
        onSubmit={handleSaveTaskAdd}
        styles={styles}
      />

      {/* Modale Edition tâche */}
      <TaskFormModal
        visible={isEditTaskModalOpen}
        headerTitle="Edit Demo Task"
        submitLabel="Save"
        titleValue={editTaskTitle}
        onChangeTitle={setEditTaskTitle}
        imageValue={editTaskImage}
        onPickImage={() => pickImage(setEditTaskImage)}
        onCancel={() => setIsEditTaskModalOpen(false)}
        onSubmit={handleSaveTaskEdit}
      />

      {/* Menu */}
      <MenuModal
        visible={showMenu}
        onClose={() => setShowMenu(false)}
        onRename={handleRenameOpen}
        onDeleteList={() => {
          setShowMenu(false);
          setIsDeleteModalOpen(true);
        }}
      />

      {/* Modale renommer liste */}
      <TextInputModal
        visible={isRenameModalOpen}
        title="Rename Demo List"
        placeholder="New list title"
        value={newListTitle}
        onChangeText={setNewListTitle}
        confirmLabel="Save"
        onCancel={() => setIsRenameModalOpen(false)}
        onConfirm={handleRenameSave}
      />

      {/* Modale suppression liste */}
      <ConfirmModal
        visible={isDeleteModalOpen}
        title="Delete Demo List?"
        message={`This will delete "${list.title}" and all its demo tasks.`}
        confirmLabel="Delete"
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteList}
      />

      {/* Suppression de tâche */}
      <ConfirmModal
        visible={isDeleteTaskModalOpen}
        title="Delete Demo Task?"
        message={`Do you really want to delete the task "${getTaskLabel(
          taskToDelete
        )}" ?`}
        confirmLabel="Delete"
        onCancel={() => setIsDeleteTaskModalOpen(false)}
        onConfirm={async () => {
          setIsDeleteTaskModalOpen(false);
          if (taskToDelete) {
            await deleteTodoMock(taskToDelete.id);
            setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id));
            setTaskToDelete(null);
          }
        }}
      />

      {/* Modal Task details */}
      <TaskDetailModal
        visible={isTaskDetailModalOpen}
        onClose={() => setIsTaskDetailModalOpen(false)}
        task={detailTask}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9F9F9" },
  header: {
    backgroundColor: "#21808D",
    paddingTop: 50,      // comme ProfileScreen
    paddingBottom: 24,   // comme ProfileScreen
    paddingHorizontal: 24,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  title: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 9,
  },
  progressCard: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 12,
    padding: 8,
    marginBottom: 0,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  progressLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
  },
  progressBar: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#FFFFFF",
  },
  filterChipActive: {
    backgroundColor: "#21808D",
    borderColor: "#21808D",
  },
  filterChipText: {
    fontSize: 14,
    color: "#333",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  content: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 100 },
  taskCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  taskContent: { flexDirection: "row", alignItems: "center" },
  checkbox: { marginRight: 12, marginTop: 2 },
  checkboxInner: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#21808D",
    borderColor: "#21808D",
  },
  taskText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  taskTextCompleted: {
    textDecorationLine: "line-through",
    color: "#999",
  },
  taskActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginLeft: 8,
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
  },
  emptyState: { alignItems: "center", paddingVertical: 48 },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    maxWidth: 300,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#21808D",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
});
