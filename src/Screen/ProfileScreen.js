import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { useAuth } from '../Context/AuthContext';
import ConfirmModal from '../components/ConfirmModal';
import { Download, Trash2, UserX, LogOut } from '../components/Icons';
import { DELETE_USER, DELETE_TODO_LIST } from '../Graphql/mutations';
import { useMutation } from '@apollo/client/react';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import jsPDF from 'jspdf';

const stripTypenameAndBelongsTo = (value) => {
  if (Array.isArray(value)) {
    return value.map(stripTypenameAndBelongsTo);
  }
  if (value && typeof value === 'object') {
    const result = {};
    Object.keys(value).forEach((key) => {
      if (key === '__typename' || key === 'belongsTo') return;
      result[key] = stripTypenameAndBelongsTo(value[key]);
    });
    return result;
  }
  return value;
};

const formatDateForFilename = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_` +
    `${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`
  );
};

export default function ProfileScreen({ showToast, allLists = [] }) {
  const { username, userId, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = React.useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = React.useState(false);

  const [deleteUser] = useMutation(DELETE_USER);
  const [deleteTodoList] = useMutation(DELETE_TODO_LIST);

  // dossier choisi (Android uniquement)
  const [exportDirUri, setExportDirUri] = React.useState(null);

  const handlePickDirectory = async () => {
    if (Platform.OS !== 'android') {
      showToast && showToast('Folder selection is only available on Android');
      return null;
    }

    if (
      !FileSystem.StorageAccessFramework ||
      typeof FileSystem.StorageAccessFramework
        .requestDirectoryPermissionsAsync !== 'function'
    ) {
      showToast &&
        showToast(
          'Folder selection is not supported in this environment',
          'error',
        );
      return null;
    }

    try {
      const perms =
        await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (!perms.granted) return null;
      setExportDirUri(perms.directoryUri);
      showToast && showToast('Export folder selected (Android)');
      return perms.directoryUri;
    } catch (e) {
      showToast && showToast(e?.message || 'Error selecting folder', 'error');
      return null;
    }
  };

  const handleExportAsJSON = async () => {
    try {

      const cleaned = stripTypenameAndBelongsTo(allLists);

      const normalized = cleaned.map((list) => ({
        ...list,
        todos: (list.todos || []).map((t) => {
          let content = t.content;
          if (typeof content === 'string') {
            try {
              const obj = JSON.parse(content);
              if (obj && typeof obj === 'object' && obj.title) {
                content = obj.title;
              }
            } catch {
              // pas du JSON
            }
          } else if (content && typeof content === 'object' && content.title) {
            content = content.title;
          }
          return { ...t, content };
        }),
      }));

      const json = JSON.stringify(normalized, null, 2);
      const fileBaseName =
        username + `-lists-${formatDateForFilename()}.json`;

      // Web
      if (Platform.OS === 'web') {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileBaseName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        showToast && showToast('Lists exported as JSON (downloaded)');
        return;
      }

      // Android: demande auto du dossier si pas défini
      if (Platform.OS === 'android') {
        let dirUri = exportDirUri;
        if (!dirUri) {
          dirUri = await handlePickDirectory();
          if (!dirUri) return; // annulé ou erreur
        }

        if (
          !FileSystem.StorageAccessFramework ||
          typeof FileSystem.StorageAccessFramework.createFileAsync !==
          'function'
        ) {
          showToast &&
            showToast(
              'Saving JSON to a custom folder is not supported here',
              'error',
            );
          return;
        }

        try {
          const destUri =
            await FileSystem.StorageAccessFramework.createFileAsync(
              dirUri,
              fileBaseName,
              'application/json',
            );
          await FileSystem.writeAsStringAsync(destUri, json, {
            encoding: FileSystem.EncodingType.UTF8,
          });
          showToast && showToast('Lists exported as JSON');
          return;
        } catch (e) {
          showToast &&
            showToast(e?.message || 'Error saving JSON to folder', 'error');
          return;
        }
      }

      // iOS: Documents + partage
      if (Platform.OS === 'ios') {
        const destPath = FileSystem.documentDirectory + fileBaseName;
        await FileSystem.writeAsStringAsync(destPath, json, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        const canShare = await Sharing.isAvailableAsync();
        console.log('iOS JSON canShare:', canShare, 'path:', destPath);
        if (!canShare) {
          showToast &&
            showToast('Sharing not available on this iOS device', 'error');
          return;
        }

        const uriToShare = destPath.startsWith('file://')
          ? destPath
          : `file://${destPath}`;

        try {
          await Sharing.shareAsync(uriToShare, {
            mimeType: 'application/json',
            dialogTitle: 'Export Lists (JSON)',
          });
          console.log('iOS JSON shareAsync finished');
        } catch (err) {
          console.log('iOS JSON shareAsync error:', err);
          showToast && showToast(err?.message || 'Share failed', 'error');
          return;
        }

        showToast && showToast('Lists exported as JSON');
        return;
      }
    } catch (e) {
      showToast &&
        showToast(e?.message || 'Error exporting JSON', 'error');
    }
  };

  const handleExportAsPDF = async () => {
    try {

      const cleanedLists = stripTypenameAndBelongsTo(allLists);
      const fileBaseName =
        username + `-lists-${formatDateForFilename()}.pdf`;

      // WEB : jsPDF
      if (Platform.OS === 'web') {
        const doc = new jsPDF();
        let x = 10;
        let y = 10;
        const lineHeight = 7;
        const pageHeight = doc.internal.pageSize.getHeight() - 20;
        const maxWidth = 180;

        const addLine = (text, fontSize = 12, bold = false) => {
          doc.setFontSize(fontSize);
          doc.setFont('helvetica', bold ? 'bold' : 'normal');
          const lines = doc.splitTextToSize(text, maxWidth);
          lines.forEach((line) => {
            if (y > pageHeight) {
              doc.addPage();
              y = 10;
            }
            doc.text(line, x, y);
            y += lineHeight;
          });
        };

        addLine('My Lists', 18, true);
        y += 2;

        for (const list of cleanedLists) {
          addLine(list.title, 14, true);
          y += 2;

          if (!list.todos || list.todos.length === 0) {
            addLine('- No tasks', 11, false);
            y += lineHeight;
            continue;
          }

          for (const t of list.todos) {
            let label = t.content;
            let imageUrl = null;

            if (typeof t.content === 'string') {
              try {
                const obj = JSON.parse(t.content);
                if (obj && obj.title) label = obj.title;
                if (obj && obj.image) imageUrl = obj.image;
              } catch { }
            }

            const checkbox = t.done ? '[x]' : '[ ]';
            const lineText = `${checkbox} ${label || ''}`;

            addLine(lineText, 11, false);

            if (
              imageUrl &&
              (imageUrl.startsWith('http') || imageUrl.startsWith('data:image'))
            ) {
              try {
                if (y + 40 > pageHeight) {
                  doc.addPage();
                  y = 10;
                }
                doc.addImage(imageUrl, 'JPEG', x + 5, y, 60, 40);
                y += 40 + 4;
              } catch (err) {
                console.log('Error adding image to PDF (web):', err);
              }
            } else {
              y += 2;
            }
          }

          y += lineHeight;
        }

        doc.save(fileBaseName);
        showToast && showToast('PDF downloaded');
        return;
      }

      // MOBILE : HTML + expo-print
      if (!Print || typeof Print.printToFileAsync !== 'function') {
        showToast &&
          showToast('PDF export not supported on this platform', 'error');
        return;
      }

      let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
          }
          h1 {
            color: #21808D;
            margin-bottom: 20px;
          }
          h2 {
            color: #21808D;
            margin-top: 20px;
            margin-bottom: 10px;
            border-bottom: 2px solid #21808D;
            padding-bottom: 5px;
          }
          .task-item {
            margin: 8px 0;
            padding: 8px;
            background-color: #f9f9f9;
            border-radius: 4px;
          }
          .task-row {
            display: flex;
            align-items: center;
          }
          .checkbox {
            width: 20px;
            height: 20px;
            margin-right: 12px;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid #21808D;
            border-radius: 3px;
            font-size: 14px;
          }
          .checkbox.done {
            background-color: #21808D;
            color: white;
          }
          .task-label {
            flex: 1;
          }
          .task-label.done {
            text-decoration: line-through;
            color: #999;
          }
          .task-image {
            margin-top: 8px;
          }
          .task-image img {
            max-width: 100%;
            height: auto;
            border-radius: 4px;
          }
          .no-tasks {
            font-style: italic;
            color: #999;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <h1>My Lists</h1>
    `;

      cleanedLists.forEach((list) => {
        html += `<h2>${list.title}</h2>`;
        if (list.todos && list.todos.length > 0) {
          list.todos.forEach((t) => {
            let label = t.content;
            let imageUrl = null;

            if (typeof t.content === 'string') {
              try {
                const obj = JSON.parse(t.content);
                if (obj && obj.title) label = obj.title;
                if (obj && obj.image) imageUrl = obj.image;
              } catch { }
            }

            const checkboxClass = t.done ? 'checkbox done' : 'checkbox';
            const checkmark = t.done ? '✓' : '';
            const labelClass = t.done ? 'task-label done' : 'task-label';

            html += `
            <div class="task-item">
              <div class="task-row">
                <div class="${checkboxClass}">${checkmark}</div>
                <div class="${labelClass}">${label || 'No title'}</div>
              </div>
          `;

            if (imageUrl) {
              html += `
              <div class="task-image">
                <img src="${imageUrl}" alt="Task image" />
              </div>
            `;
            }

            html += `</div>`;
          });
        } else {
          html += '<div class="no-tasks">- No tasks</div>';
        }
      });

      html += `
      </body>
      </html>
    `;

      const result = await Print.printToFileAsync({ html });
      const tempUri = result?.uri;
      if (!tempUri) {
        showToast && showToast('PDF generation failed', 'error');
        return;
      }

      // Android: demande auto du dossier si pas défini
      if (Platform.OS === 'android') {
        let dirUri = exportDirUri;
        if (!dirUri) {
          dirUri = await handlePickDirectory();
          if (!dirUri) return;
        }

        if (
          !FileSystem.StorageAccessFramework ||
          typeof FileSystem.StorageAccessFramework.createFileAsync !==
          'function'
        ) {
          showToast &&
            showToast(
              'Saving PDF to a custom folder is not supported here',
              'error',
            );
          return;
        }

        try {
          const destUri =
            await FileSystem.StorageAccessFramework.createFileAsync(
              dirUri,
              fileBaseName,
              'application/pdf',
            );

          const b64 = await FileSystem.readAsStringAsync(tempUri, {
            encoding: FileSystem.EncodingType.Base64,
          });

          await FileSystem.writeAsStringAsync(destUri, b64, {
            encoding: FileSystem.EncodingType.Base64,
          });

          showToast && showToast('PDF saved to selected folder (Android)');
          return;
        } catch (e) {
          console.log('Android folder export error', e);
          showToast &&
            showToast(e?.message || 'Error saving PDF to folder', 'error');
          return;
        }
      }

      // iOS: Documents + partage
      if (Platform.OS === 'ios') {
        const destPath = FileSystem.documentDirectory + fileBaseName;
        await FileSystem.moveAsync({ from: tempUri, to: destPath });

        const canShare = await Sharing.isAvailableAsync();
        console.log('iOS PDF canShare:', canShare, 'path:', destPath);
        if (!canShare) {
          showToast &&
            showToast('Sharing not available on this iOS device', 'error');
          return;
        }

        const uriToShare = destPath.startsWith('file://')
          ? destPath
          : `file://${destPath}`;

        try {
          await Sharing.shareAsync(uriToShare, {
            mimeType: 'application/pdf',
            dialogTitle: 'Export Lists (PDF)',
          });
          console.log('iOS PDF shareAsync finished');
        } catch (err) {
          console.log('iOS PDF shareAsync error:', err);
          showToast && showToast(err?.message || 'Share failed', 'error');
          return;
        }

        showToast && showToast('PDF ready to save in Files (iOS)');
        return;
      }
    } catch (e) {
      console.log('PDF export error', e);
      showToast && showToast(e?.message || 'Error exporting PDF', 'error');
    }
  };

  const handleConfirmDeleteAllLists = async () => {
    try {
      setShowDeleteAllModal(false);

      if (!allLists || allLists.length === 0) {
        showToast && showToast('No lists to delete');
        return;
      }

      await Promise.all(
        allLists
          .filter((list) => list?.id)
          .map((list) =>
            deleteTodoList({
              variables: { id: list.id },
            }),
          ),
      );

      showToast && showToast('All lists deleted');
    } catch (e) {
      console.log('Delete all lists error', e);
      showToast && showToast(e?.message || 'Error deleting all lists', 'error');
    }
  };

  const handleShowLogout = () => setShowLogoutModal(true);
  const handleConfirmLogout = async () => {
    setShowLogoutModal(false);
    await logout();
  };

  const onDeleteAccount = async () => {
    try {
      await deleteUser({
        variables: {
          where: { id: userId },
        },
      });
      showToast && showToast('Account deleted');
      logout();
    } catch (e) {
      showToast && showToast(e?.message || 'Error deleting account', 'error');
    }
  };

  const handleShowDeleteAccount = () => setShowDeleteAccountModal(true);
  const handleConfirmDeleteAccount = async () => {
    setShowDeleteAccountModal(false);
    await onDeleteAccount();
  };

  const handleDeleteAllListsClick = () => {
    setShowDeleteAllModal(true);
  };

  const avatarInitials = username
    ? username
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
    : 'U';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatarInitials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{username || 'User'}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Download size={20} color="#999" />
                <TouchableOpacity
                  style={styles.settingText}
                  onPress={handleExportAsJSON}
                >
                  <Text style={styles.settingLabel}>Export lists to JSON</Text>
                  <Text style={styles.settingDescription}>
                    Download all your lists
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Download size={20} color="#999" />
                <TouchableOpacity
                  style={styles.settingText}
                  onPress={handleExportAsPDF}
                >
                  <Text style={styles.settingLabel}>Export lists to PDF</Text>
                  <Text style={styles.settingDescription}>
                    Download all your lists
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.separator} />
            <TouchableOpacity
              style={styles.settingRow}
              onPress={handleDeleteAllListsClick}
            >
              <View style={styles.settingLeft}>
                <Trash2 size={20} color="#999" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Delete All Lists</Text>
                  <Text style={styles.settingDescription}>
                    Remove all task lists
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={handleShowDeleteAccount}
            >
              <View style={styles.settingLeft}>
                <UserX size={20} color="#EF4444" />
                <View style={styles.settingText}>
                  <Text style={[styles.settingLabel, styles.dangerText]}>
                    Delete Account
                  </Text>
                  <Text style={styles.settingDescription}>
                    Permanently delete your account
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
            <View style={styles.separator} />
            <TouchableOpacity
              style={styles.settingRow}
              onPress={handleShowLogout}
            >
              <View style={styles.settingLeft}>
                <LogOut size={20} color="#999" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Logout</Text>
                  <Text style={styles.settingDescription}>
                    Sign out of your account
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <ConfirmModal
        visible={showLogoutModal}
        title="Logout?"
        message="Are you sure you want to log out?"
        confirmLabel="Logout"
        cancelLabel="Cancel"
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
      />

      <ConfirmModal
        visible={showDeleteAccountModal}
        title="Delete Account?"
        message="This will permanently delete your account and all associated data. This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onCancel={() => setShowDeleteAccountModal(false)}
        onConfirm={handleConfirmDeleteAccount}
      />

      <ConfirmModal
        visible={showDeleteAllModal}
        title="Delete All Lists?"
        message="This will permanently delete all your task lists and tasks. This action cannot be undone."
        confirmLabel="Delete All"
        cancelLabel="Cancel"
        onCancel={() => setShowDeleteAllModal(false)}
        onConfirm={handleConfirmDeleteAllLists}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  header: {
    backgroundColor: '#21808D',
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 18,
  },
  profileCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#21808D',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    marginBottom: 40,
  },
  section: {
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    marginLeft: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  settingDescription: {
    fontSize: 13,
    color: '#777',
    marginTop: 2,
  },
  separator: {
    width: '100%',
    height: 1,
    backgroundColor: '#EEE',
    marginVertical: 4,
  },
  dangerText: {
    color: '#EF4444',
  },
});
