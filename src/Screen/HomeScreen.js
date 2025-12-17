import React, { useState } from "react";
import { useQuery, useMutation  } from '@apollo/client/react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useAuth } from "../Context/AuthContext";
import { GET_TODO_LISTS, GET_ALL_TODOS } from "../Graphql/queries";
import { CREATE_TODO_LIST } from "../Graphql/mutations";
import {
  CheckSquare,
  Search,
  Plus,
  Logout,
  UnCheckSquare,
  List,
  Grid,
} from "../components/Icons";
import { useIsFocused } from "@react-navigation/native";
import { ActivityIndicator } from "react-native";
import ConfirmModal from "../components/ConfirmModal";
import TextInputModal from "../components/TextInputModal";

export default function HomeScreen({ navigation, showToast, setAllLists }) {
  const { username, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [listDisplay, setListDisplay] = useState(false);
  const isFocused = useIsFocused();

  const { data, loading, error, refetch } = useQuery(GET_TODO_LISTS, {
    variables: { where: { owner: { username } } },
    skip: !username,
  });

  const {
    data: todosData,
    loading: loadingTodos,
    error: errorTodos,
  } = useQuery(GET_ALL_TODOS, {
    variables: {
      where: {
        belongsTo: {
          owner: {
            username: username,
          },
        },
      },
    },
    skip: !username,
  });

  React.useEffect(() => {
    if (isFocused) {
      refetch();
    }
  }, [isFocused, refetch]);

  const [createTodoList, { loading: createLoading }] = useMutation(
    CREATE_TODO_LIST,
    {
      onCompleted: () => {
        showToast("List created successfully!");
        setNewListTitle("");
        setIsAddModalOpen(false);
        refetch();
      },
      onError: (error) => {
        showToast(error?.message || "Error adding list", "error");
      },
    }
  );

  const lists = data?.todoLists || [];
  const todos = todosData?.todos || [];

  // Remontrer les listes complètes (avec todos) vers App pour l’export
  React.useEffect(() => {
    if (setAllLists) {
      const merged = lists.map((list) => ({
        ...list,
        todos: todos.filter((t) => t.belongsTo?.id === list.id),
      }));
      setAllLists(merged);
    }
  }, [lists, todos, setAllLists]);

  const filteredLists = lists.filter((list) =>
    list.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddList = () => {
    if (!newListTitle.trim()) {
      showToast("Please enter a list name", "error");
      return;
    }
    createTodoList({
      variables: {
        input: [
          {
            owner: {
              connect: {
                where: {
                  username: username,
                },
              },
            },
            title: newListTitle,
          },
        ],
      },
    });
  };

  const handleShowLogout = () => setShowLogoutModal(true);
  const handleConfirmLogout = async () => {
    setShowLogoutModal(false);
    await logout();
  };

  if (loading || loadingTodos) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#21808D" />
        <Text style={{ marginTop: 20 }}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={{ color: "red", textAlign: "center", marginTop: 50 }}>
          Error loading lists!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.logoSection}>
            <View style={styles.logoBox}>
              <CheckSquare size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.headerTitle}>Hello, {username || "User"}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleShowLogout}
            >
              <Logout size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search lists..."
            placeholderTextColor="#999"
          />
        </View>
      </View>

      {/* Todo lists */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>My Lists</Text>
          <View style={{ flexDirection: "row" }}>
            <TouchableOpacity
              style={
                listDisplay ? styles.displayActive : styles.displayNotActive
              }
              onPress={() => setListDisplay(true)}
              disabled={listDisplay}
            >
              <List size={20} color="#21808D" />
            </TouchableOpacity>
            <TouchableOpacity
              style={
                !listDisplay ? styles.displayActive : styles.displayNotActive
              }
              onPress={() => setListDisplay(false)}
              disabled={!listDisplay}
            >
              <Grid size={20} color="#21808D" />
            </TouchableOpacity>
            <Text style={styles.listCount}>{lists.length} total</Text>
          </View>
        </View>
        {filteredLists.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <CheckSquare size={48} color="#999" />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery ? "No lists found" : "No lists yet"}
            </Text>
            <Text style={styles.emptyDescription}>
              {searchQuery
                ? "Try searching for something else"
                : "Create your first task list to get started"}
            </Text>
          </View>
        ) : listDisplay === false ? (
          // Grid
          <View style={styles.grid}>
            {filteredLists.map((list) => {
              const tasks = todos.filter(
                (todo) => todo.belongsTo?.id === list.id
              );
              const totalTasks = tasks.length;
              const completedTasks = tasks.filter((t) => t.done).length;
              const progress =
                totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
              return (
                <View style={styles.card} key={list.id}>
                  <TouchableOpacity
                    style={styles.cardInner}
                    onPress={() =>
                      navigation.navigate("ListDetail", { listId: list.id })
                    }
                    activeOpacity={0.7}
                  >
                    <View style={styles.cardIcon}>
                      {totalTasks === 0 || totalTasks !== completedTasks ? (
                        <UnCheckSquare size={24} color="#21808D" />
                      ) : (
                        <CheckSquare size={24} color="#21808D" />
                      )}
                    </View>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {list.title}
                    </Text>
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${progress}%`,
                              backgroundColor: "#21808D",
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.cardSubtitle}>
                        {completedTasks}/{totalTasks} completed
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        ) : (
          // List
          <View style={{ marginBottom: 16 }}>
            {filteredLists.map((list) => {
              const tasks = todos.filter(
                (todo) => todo.belongsTo?.id === list.id
              );
              const totalTasks = tasks.length;
              const completedTasks = tasks.filter((t) => t.done).length;
              const progress =
                totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
              return (
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#FFF",
                    borderRadius: 12,
                    marginVertical: 6,
                    padding: 12,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.06,
                    shadowRadius: 2,
                  }}
                  key={list.id}
                  onPress={() =>
                    navigation.navigate("ListDetail", { listId: list.id })
                  }
                  activeOpacity={0.7}
                >
                  <View style={[styles.cardIcon, { marginRight: 16 }]}>
                    {totalTasks === 0 || totalTasks !== completedTasks ? (
                      <UnCheckSquare size={24} color="#21808D" />
                    ) : (
                      <CheckSquare size={24} color="#21808D" />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontWeight: "bold",
                        fontSize: 16,
                        color: "#21808D",
                      }}
                      numberOfLines={2}
                    >
                      {list.title}
                    </Text>
                    <View
                      style={{
                        height: 6,
                        backgroundColor: "#E0E0E0",
                        borderRadius: 3,
                        marginVertical: 6,
                        overflow: "hidden",
                      }}
                    >
                      <View
                        style={{
                          height: "100%",
                          width: `${progress}%`,
                          backgroundColor: "#21808D",
                          borderRadius: 3,
                        }}
                      />
                    </View>
                    <Text style={{ fontSize: 12, color: "#999" }}>
                      {completedTasks}/{totalTasks} completed
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsAddModalOpen(true)}
        activeOpacity={0.8}
      >
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        visible={showLogoutModal}
        title="Logout?"
        message="Are you sure you want to log out?"
        confirmLabel="Logout"
        cancelLabel="Cancel"
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
      />

      {/* Add List Modal */}
      <TextInputModal
        visible={isAddModalOpen}
        title="Create New List"
        placeholder="Enter list name"
        value={newListTitle}
        onChangeText={setNewListTitle}
        confirmLabel={createLoading ? "Adding..." : "Create"}
        cancelLabel="Cancel"
        onCancel={() => {
          setIsAddModalOpen(false);
          setNewListTitle("");
        }}
        onConfirm={handleAddList}
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
    marginBottom: 16,
  },
  logoSection: { flexDirection: "row", alignItems: "center" },
  logoBox: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerTitle: { fontSize: 24, fontWeight: "600", color: "#FFF" },

  headerActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  logoutButton: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 40,
    marginTop: 12, // petit espace sous le header
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#333",
  },

  content: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 100 },

  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  listTitle: { fontSize: 20, fontWeight: "600", color: "#333" },
  displayActive: {
    marginLeft: 8,
    padding: 5,
    backgroundColor: "#21808d13",
    borderWidth: 2,
    borderRadius: 5,
    borderColor: "#21808D20",
  },
  displayNotActive: {
    marginLeft: 8,
    padding: 5,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderRadius: 5,
    borderColor: "#fff",
  },
  listCount: {
    fontSize: 14,
    color: "#999",
    marginLeft: 8,
    paddingVertical: 8,
  },

  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6 },
  card: { width: "50%", padding: 6 },
  cardInner: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 210,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    marginTop: 12,
    backgroundColor: "#21808D20",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#21808D",
    marginVertical: 8,
  },
  progressContainer: { marginBottom: 8 },
  progressBar: {
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    overflow: "hidden",
    marginVertical: 8,
  },
  progressFill: { height: "100%", borderRadius: 4 },
  cardSubtitle: { fontSize: 12, color: "#999" },

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
