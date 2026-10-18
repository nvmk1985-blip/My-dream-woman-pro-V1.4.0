import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ALL_PERSONAS, Persona } from "../constants/personas";
import { ParamsStore } from "../context/params-store";
import {
  addCharacterUrl,
  CharacterUrl,
  deleteCharacterUrl,
  getCharacterUrls,
  setCharacterUrlActive,
  updateCharacterUrl,
} from "../services/api";
import { openExternalHttpUrl } from "../utils/external-url";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "../hooks/useColors";
import themeTokens from "../constants/colors";

const C = themeTokens.dark;

export default function CharacterUrlsScreen() {
  const colors = useColors();
  const router = useRouter();
  const characterId = ParamsStore.getUrlPersonaId() ?? "";
  const [persona, setPersona] = useState<Persona | null>(null);
  const [urls, setUrls] = useState<CharacterUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingUrlId, setEditingUrlId] = useState<number | null>(null);
  const [draftUrl, setDraftUrl] = useState("");

  const load = useCallback(async () => {
    if (!characterId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const builtIn = ALL_PERSONAS.find((item) => item.id === characterId);
      let selected = builtIn;
      if (!selected) {
        const raw = await AsyncStorage.getItem("custom_personas_v1");
        const custom = raw ? JSON.parse(raw) : [];
        selected = Array.isArray(custom)
          ? custom.find((item: Persona) => item.id === characterId)
          : undefined;
      }
      setPersona(selected ?? null);
      setUrls(await getCharacterUrls(characterId));
    } catch (error: any) {
      Alert.alert("URLs load ஆகவில்லை", error?.message || "மீண்டும் try பண்ணுங்க.");
    } finally {
      setLoading(false);
    }
  }, [characterId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const openEditor = (url?: CharacterUrl) => {
    setEditingUrlId(url?.id ?? null);
    setDraftUrl(url?.url ?? "");
    setEditorVisible(true);
  };

  const openSavedUrl = async (value: string) => {
    try {
      await openExternalHttpUrl(value);
    } catch (error: any) {
      Alert.alert("URL open ஆகவில்லை", error?.message || "Browser open ஆகவில்லை.");
    }
  };

  const saveUrl = async () => {
    const value = draftUrl.trim();
    try {
      const parsed = new URL(value);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error();
    } catch {
      Alert.alert("தவறான URL", "http:// அல்லது https:// URL enter பண்ணுங்க.");
      return;
    }

    setSaving(true);
    try {
      if (editingUrlId === null) {
        const created = await addCharacterUrl(characterId, value, urls.length);
        setUrls((current) => [...current, created]);
      } else {
        const updated = await updateCharacterUrl(characterId, editingUrlId, { url: value });
        setUrls((current) =>
          current.map((item) => (item.id === updated.id ? updated : item)),
        );
      }
      setEditorVisible(false);
      setDraftUrl("");
    } catch (error: any) {
      Alert.alert("Save ஆகவில்லை", error?.message || "மீண்டும் try பண்ணுங்க.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item: CharacterUrl) => {
    setUrls((current) =>
      current.map((url) =>
        url.id === item.id ? { ...url, isActive: !item.isActive } : url,
      ),
    );
    try {
      const updated = await setCharacterUrlActive(
        characterId,
        item.id,
        !item.isActive,
      );
      setUrls((current) =>
        current.map((url) => (url.id === updated.id ? updated : url)),
      );
    } catch (error: any) {
      setUrls((current) =>
        current.map((url) =>
          url.id === item.id ? { ...url, isActive: item.isActive } : url,
        ),
      );
      Alert.alert("Status மாற்ற முடியவில்லை", error?.message || "மீண்டும் try பண்ணுங்க.");
    }
  };

  const deleteUrl = (item: CharacterUrl) => {
    Alert.alert("URL delete பண்ணட்டுமா?", item.url, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteCharacterUrl(characterId, item.id);
            setUrls((current) => current.filter((url) => url.id !== item.id));
          } catch (error: any) {
            Alert.alert("Delete ஆகவில்லை", error?.message || "மீண்டும் try பண்ணுங்க.");
          }
        },
      },
    ]);
  };

  const moveUrl = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= urls.length) return;
    setUrls((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const saveOrder = async () => {
    setSaving(true);
    try {
      const updated = await Promise.all(
        urls.map((item, index) =>
          updateCharacterUrl(characterId, item.id, { sortOrder: index }),
        ),
      );
      setUrls(updated.sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id));
      Alert.alert("சேமிக்கப்பட்டது", "URL order save ஆகிவிட்டது.");
    } catch (error: any) {
      Alert.alert("Order save ஆகவில்லை", error?.message || "மீண்டும் try பண்ணுங்க.");
      await load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={colors.goldBright} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Saved URLs</Text>
          <Text style={styles.subtitle}>{persona?.name ?? "Character"}</Text>
        </View>
        <TouchableOpacity onPress={() => openEditor()} style={styles.addButton}>
          <View style={styles.addButtonContent}>
            <Ionicons name="add" size={18} color={colors.textOnGold} />
            <Text style={styles.addButtonText}>Add</Text>
          </View>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.cyanPrimary} size="large" />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.notice}>
              <View style={styles.noticeTitleRow}>
                <Ionicons name="link-outline" size={18} color={colors.cyanPrimary} />
                <Text style={styles.noticeTitle}>{persona?.name ?? "இந்த character"} URLs</Text>
              </View>
              <Text style={styles.noticeText}>
                Active URLs மட்டும் Chat TXT-ல் வரிசையாக வரும். Disabled URL skip ஆகும்.
              </Text>
            </View>

            {urls.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="link-outline" size={30} color={colors.goldBright} style={styles.emptyIcon} />
                <Text style={styles.emptyTitle}>URL இன்னும் save செய்யவில்லை</Text>
                <Text style={styles.emptyText}>இந்த character-க்கு மட்டும் பயன்படுத்தப்படும் URL-ஐ add பண்ணுங்க.</Text>
                <TouchableOpacity style={styles.emptyButton} onPress={() => openEditor()}>
                  <Text style={styles.emptyButtonText}>＋ Add URL</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {urls.map((item, index) => (
                  <View key={item.id} style={[styles.urlCard, !item.isActive && styles.urlCardDisabled]}>
                    <View style={styles.orderColumn}>
                      <Text style={styles.orderText}>{index + 1}</Text>
                      <TouchableOpacity
                        onPress={() => moveUrl(index, -1)}
                        disabled={index === 0}
                        style={styles.arrowButton}
                      >
                        <Text style={[styles.arrowText, index === 0 && styles.muted]}>▲</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => moveUrl(index, 1)}
                        disabled={index === urls.length - 1}
                        style={styles.arrowButton}
                      >
                        <Text style={[styles.arrowText, index === urls.length - 1 && styles.muted]}>▼</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.urlCopy}>
                      <TouchableOpacity
                        onPress={() => openSavedUrl(item.url)}
                        accessibilityRole="link"
                        testID={`character-url-${item.id}`}
                      >
                        <Text style={[styles.urlText, !item.isActive && styles.disabledText]} numberOfLines={3}>
                          {item.url}
                        </Text>
                      </TouchableOpacity>
                      <Text style={[styles.statusText, item.isActive ? styles.activeText : styles.disabledText]}>
                        {item.isActive ? "● Active" : "○ Disabled"}
                      </Text>
                    </View>
                    <View style={styles.actions}>
                      <TouchableOpacity onPress={() => toggleActive(item)} style={styles.actionButton}>
                        <Text style={styles.actionText}>{item.isActive ? "Disable" : "Enable"}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => openEditor(item)} style={styles.actionButton}>
                        <Text style={styles.actionText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => deleteUrl(item)} style={[styles.actionButton, styles.deleteButton]}>
                        <Text style={styles.deleteText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                <TouchableOpacity style={styles.saveOrderButton} onPress={saveOrder} disabled={saving}>
                  {saving ? <ActivityIndicator color={colors.textOnGold} /> : (
                    <View style={styles.addButtonContent}>
                      <Ionicons name="save-outline" size={17} color={colors.textOnGold} />
                      <Text style={styles.saveOrderText}>Save URL Order</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      {editorVisible && (
        <View style={styles.editorOverlay}>
          <View style={styles.editor}>
            <Text style={styles.editorTitle}>{editingUrlId === null ? "Add URL" : "Edit URL"}</Text>
            <TextInput
              value={draftUrl}
              onChangeText={setDraftUrl}
              placeholder="https://example.com/..."
              placeholderTextColor={colors.inputPlaceholder}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              style={styles.input}
              autoFocus
            />
            <View style={styles.editorActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setEditorVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={saveUrl} disabled={saving}>
                {saving ? <ActivityIndicator color={colors.textOnGold} /> : <Text style={styles.confirmText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bgPrimary },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.bgSecondary,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.glassGoldBorder,
  },
  backButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  backText: { color: C.textPrimary, fontSize: 34, lineHeight: 34 },
  headerCopy: { flex: 1, marginLeft: 6 },
  title: { color: C.goldBright, fontSize: 20, fontWeight: "800" },
  subtitle: { color: C.textTertiary, fontSize: 13, marginTop: 2 },
  addButton: { backgroundColor: C.buttonGold, borderRadius: 13, paddingHorizontal: 13, paddingVertical: 9, minHeight: 44, justifyContent: "center" },
  addButtonContent: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },
  addButtonText: { color: C.textOnGold, fontSize: 13, fontWeight: "800" },
  body: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: C.bgPrimary },
  notice: { backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: C.glassCyanBorder },
  noticeTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  noticeTitle: { color: C.textCyan, fontSize: 15, fontWeight: "800" },
  noticeText: { color: C.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 7 },
  empty: { backgroundColor: C.card, borderWidth: 1, borderColor: C.borderSubtle, borderRadius: 18, padding: 28, alignItems: "center", marginTop: 12 },
  emptyIcon: { marginBottom: 10 },
  emptyTitle: { color: C.textPrimary, fontSize: 16, fontWeight: "800", textAlign: "center" },
  emptyText: { color: C.textTertiary, fontSize: 13, textAlign: "center", lineHeight: 19, marginTop: 6 },
  emptyButton: { backgroundColor: C.buttonGold, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12, minHeight: 44, justifyContent: "center", marginTop: 16 },
  emptyButtonText: { color: C.textOnGold, fontWeight: "800" },
  urlCard: { backgroundColor: C.card, borderWidth: 1, borderColor: C.borderSubtle, borderRadius: 16, padding: 12, marginBottom: 10, flexDirection: "row", alignItems: "center" },
  urlCardDisabled: { opacity: 0.65 },
  orderColumn: { width: 34, alignItems: "center" },
  orderText: { color: C.goldBright, fontSize: 18, fontWeight: "800" },
  arrowButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  arrowText: { color: C.cyanPrimary, fontSize: 12 },
  muted: { color: C.textMuted },
  urlCopy: { flex: 1, paddingHorizontal: 8 },
  urlText: { color: C.textPrimary, fontSize: 13, lineHeight: 18 },
  disabledText: { color: C.textMuted },
  statusText: { fontSize: 11, marginTop: 5, fontWeight: "700" },
  activeText: { color: C.success },
  actions: { alignItems: "flex-end", gap: 5 },
  actionButton: { minHeight: 44, minWidth: 76, paddingHorizontal: 9, paddingVertical: 7, borderRadius: 9, backgroundColor: C.cardSecondary, borderWidth: 1, borderColor: C.border },
  actionText: { color: C.textCyan, fontSize: 11, fontWeight: "700" },
  deleteButton: { backgroundColor: C.error, borderColor: C.error },
  deleteText: { color: C.textPrimary, fontSize: 11, fontWeight: "700" },
  saveOrderButton: { backgroundColor: C.buttonGold, borderRadius: 13, minHeight: 48, paddingVertical: 14, alignItems: "center", justifyContent: "center", marginTop: 6 },
  saveOrderText: { color: C.textOnGold, fontWeight: "800", fontSize: 15 },
  editorOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: C.overlay, justifyContent: "center", padding: 20 },
  editor: { backgroundColor: C.leatherBlack, borderWidth: 1, borderColor: C.glassGoldBorder, borderRadius: 18, padding: 20 },
  editorTitle: { color: C.goldBright, fontSize: 19, fontWeight: "800", marginBottom: 14 },
  input: { borderWidth: 1, borderColor: C.inputBorder, backgroundColor: C.inputBackground, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, color: C.inputText, fontSize: 15, minHeight: 48 },
  editorActions: { flexDirection: "row", gap: 10, marginTop: 16 },
  cancelButton: { flex: 1, minHeight: 46, borderWidth: 1, borderColor: C.border, backgroundColor: C.buttonSecondary, borderRadius: 11, paddingVertical: 12, alignItems: "center", justifyContent: "center" },
  cancelText: { color: C.textSecondary, fontWeight: "700" },
  confirmButton: { flex: 1, minHeight: 46, backgroundColor: C.buttonGold, borderRadius: 11, paddingVertical: 12, alignItems: "center", justifyContent: "center" },
  confirmText: { color: C.textOnGold, fontWeight: "800" },
});