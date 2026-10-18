import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, Alert, ActivityIndicator, StatusBar, Dimensions, Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ALL_PERSONAS } from '../constants/personas';
import { listCloudinaryVideos, deleteFromCloudinary, uploadUriToCloudinary, trackCloudinaryUpload } from '../services/api';
import { requestPhotoVideoPermissionsAsync } from '../services/media-permissions';
import { premiumTheme as PREMIUM_UI_THEME } from "../constants/premium-theme";


const { } = Dimensions.get('window');

const LOCAL_VIDEO_KEY = 'my_girls_cloud_videos';

interface VideoItem {
  url: string;
  public_id: string;
  format?: string;
  createdAt?: string;
  personaName?: string;
}

const femalePersonas = (ALL_PERSONAS as any[]).filter((p: any) => p.gender === 'female');

// ── Local storage helpers ────────────────────────────────────────
async function getLocalVideos(personaName: string): Promise<VideoItem[]> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_VIDEO_KEY);
    const all: VideoItem[] = raw ? JSON.parse(raw) : [];
    return all.filter(v => v.personaName === personaName);
  } catch { return []; }
}

async function saveLocalVideo(v: VideoItem): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_VIDEO_KEY);
    const all: VideoItem[] = raw ? JSON.parse(raw) : [];
    // Deduplicate by public_id
    const filtered = all.filter(x => x.public_id !== v.public_id);
    filtered.push(v);
    await AsyncStorage.setItem(LOCAL_VIDEO_KEY, JSON.stringify(filtered.slice(0, 200)));
  } catch {}
}

async function removeLocalVideo(public_id: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_VIDEO_KEY);
    const all: VideoItem[] = raw ? JSON.parse(raw) : [];
    await AsyncStorage.setItem(LOCAL_VIDEO_KEY, JSON.stringify(all.filter(v => v.public_id !== public_id)));
  } catch {}
}

export default function VideosScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Load: local first (instant), then sync from Cloudinary in background
  const loadVideos = useCallback(async (personaName: string) => {
    setLoading(true);
    try {
      // 1. Show local videos immediately
      const local = await getLocalVideos(personaName);
      if (local.length > 0) setVideos(local);

      // 2. Try Cloudinary sync in background (Tamil folder may fail — that's OK)
      try {
        const cloud = await listCloudinaryVideos(personaName);
        if (cloud && cloud.length > 0) {
          // Merge cloud results into local storage
          for (const v of cloud as VideoItem[]) {
            await saveLocalVideo({ ...v, personaName });
          }
          const merged = await getLocalVideos(personaName);
          setVideos(merged);
        } else if (local.length === 0) {
          setVideos([]);
        }
        // If cloud empty but local has videos, keep local
      } catch { /* keep local */ }
    } catch {
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const openFolder = (personaName: string) => {
    setSelectedPersona(personaName);
    loadVideos(personaName);
  };

  const goBack = () => {
    setSelectedPersona(null);
    setVideos([]);
  };

  const uploadVideo = async () => {
    if (!selectedPersona) return;
    try {
      const perm = await requestPhotoVideoPermissionsAsync();
      if (!perm.granted) { Alert.alert('Permission', 'Gallery access வேணும்'); return; }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: false,
        quality: 1,
        videoMaxDuration: 300,
      });
      if (res.canceled || !res.assets[0]) return;

      const asset = res.assets[0];
      const uri = asset.uri;
      const mimeType = asset.mimeType || 'video/mp4';

      if (!mimeType.startsWith('video/')) {
        Alert.alert('Format Error ❌', 'mp4, webm, mov format மட்டும் support ஆகும்');
        return;
      }
      if (asset.fileSize && asset.fileSize > 100 * 1024 * 1024) {
        Alert.alert('Size Error ❌', 'Video 100MB-க்கு குறைவா இருக்கணும்');
        return;
      }

      setUploading(true);
      const folder = `my-girls/videos/${selectedPersona.toLowerCase()}`;
      const uploaded = await uploadUriToCloudinary(uri, mimeType, folder);
      trackCloudinaryUpload(folder, uploaded.public_id, uploaded.url).catch(() => {});

      // ✅ Save to AsyncStorage immediately — survives app restarts & Cloudinary listing failures
      const newVid: VideoItem = {
        url: uploaded.url,
        public_id: uploaded.public_id,
        format: 'mp4',
        createdAt: new Date().toISOString(),
        personaName: selectedPersona,
      };
      await saveLocalVideo(newVid);

      // Update UI
      setVideos(prev => {
        // Avoid duplicate if already there
        if (prev.some(v => v.public_id === newVid.public_id)) return prev;
        return [...prev, newVid];
      });

      Alert.alert('✅ Upload Success!', `${selectedPersona} folder-ல் video சேர்க்கப்பட்டது!\n\nChat-ல் "video வேணும்" என்று type பண்ணுங்க!`);
    } catch (e: any) {
      Alert.alert('Upload பண்ண முடியல', e?.message || 'மீண்டும் try பண்ணுங்க');
    } finally {
      setUploading(false);
    }
  };

  const deleteVideo = (vid: VideoItem) => {
    Alert.alert(
      '🗑️ Video Delete?',
      'இந்த video Cloudinary-லிருந்து delete ஆகும். Undo முடியாது!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await deleteFromCloudinary(vid.public_id);
              await removeLocalVideo(vid.public_id);
              setVideos(prev => prev.filter(v => v.public_id !== vid.public_id));
            } catch {
              Alert.alert('Delete பண்ண முடியல', 'மீண்டும் try பண்ணுங்க');
            }
          },
        },
      ],
    );
  };

  const getFileName = (public_id: string) => {
    const parts = public_id.split('/');
    return parts[parts.length - 1] || public_id;
  };

  // ── Folder list view ─────────────────────────────────────────────
  if (!selectedPersona) {
    return (
      <SafeAreaView style={s.safe} edges={['left','right','bottom']}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <Stack.Screen options={{ headerShown: false }} />

        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Text style={s.backBtnTxt}>← Back</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>📹 Videos</Text>
          <View style={{ width: 72 }} />
        </View>

        <Text style={s.sectionLabel}>FOLDERS</Text>

        <FlatList
          data={femalePersonas}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }: any) => (
            <TouchableOpacity
              style={s.folderRow}
              onPress={() => openFolder(item.name)}
              activeOpacity={0.7}
            >
              <View style={[s.folderAvatar, { backgroundColor: item.avatarColor || '#6C63FF' }]}>
                <Text style={s.folderAvatarTxt}>
                  {(item.avatarLetter || item.name.charAt(0)).toUpperCase()}
                </Text>
              </View>
              <Text style={s.folderName}>{item.name}</Text>
              <Text style={s.folderArrow}>›</Text>
              <View style={s.folderTrashWrap}>
                <Text style={s.folderTrashIcon}>🗑️</Text>
              </View>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={s.separator} />}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      </SafeAreaView>
    );
  }

  // ── Subfolder video view ──────────────────────────────────────────
  const persona = femalePersonas.find((p: any) => p.name === selectedPersona) as any;

  return (
    <SafeAreaView style={s.safe} edges={['left','right','bottom']}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={s.backBtn} onPress={goBack}>
          <Text style={s.backBtnTxt}>← Back</Text>
        </TouchableOpacity>
        <View style={s.headerTitleWrap}>
          <Text style={s.headerTitle}>{persona?.emoji || '👩'} {selectedPersona}</Text>
          <Text style={s.headerSubtitle} numberOfLines={1}>
            📁 my-girls/videos/{selectedPersona.toLowerCase()}/
          </Text>
        </View>
        <View style={{ width: 72 }} />
      </View>

      <TouchableOpacity
        style={[s.uploadBtn, uploading && { opacity: 0.5 }]}
        onPress={uploadVideo}
        disabled={uploading}
      >
        {uploading
          ? <ActivityIndicator color={PREMIUM_UI_THEME.colors.text} size="small" />
          : <Text style={s.uploadBtnTxt}>📤 Video Upload பண்ணுங்கள்</Text>
        }
      </TouchableOpacity>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={PREMIUM_UI_THEME.colors.lavender} size="large" />
          <Text style={s.loadingTxt}>Videos load ஆகுது...</Text>
        </View>
      ) : videos.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>🎬</Text>
          <Text style={s.emptyTitle}>Video இல்லை</Text>
          <Text style={s.emptyHint}>
            {'மேலே Upload பண்ணுங்கள்\nChat-ல் "video வேணும்" என்று கேட்கவும்'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(item) => item.public_id}
          contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
          renderItem={({ item }) => (
            <View style={s.videoCard}>
              <TouchableOpacity
                style={s.playBtn}
                onPress={() => Linking.openURL(item.url)}
              >
                <Text style={s.playBtnTxt}>▶</Text>
              </TouchableOpacity>
              <View style={s.videoInfo}>
                <Text style={s.videoName} numberOfLines={1}>
                  {getFileName(item.public_id)}
                </Text>
                <Text style={s.videoMeta}>
                  {(item.format || 'mp4').toUpperCase()}
                  {item.createdAt ? ` · ${new Date(item.createdAt).toLocaleDateString('ta-IN')}` : ''}
                </Text>
              </View>
              <TouchableOpacity
                style={s.deleteBtn}
                onPress={() => deleteVideo(item)}
              >
                <Text style={s.deleteBtnTxt}>🗑️</Text>
              </TouchableOpacity>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PREMIUM_UI_THEME.colors.background },

  header: {
    backgroundColor: PREMIUM_UI_THEME.colors.backgroundRaised,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: {
    backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6, minWidth: 72, alignItems: 'center',
  },
  backBtnTxt: { color: PREMIUM_UI_THEME.colors.text, fontWeight: '700', fontSize: 13 },
  headerTitleWrap: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  headerTitle: { color: PREMIUM_UI_THEME.colors.text, fontSize: 17, fontWeight: 'bold', textAlign: 'center' },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.65)', fontSize: 9,
    fontFamily: 'monospace', marginTop: 2, textAlign: 'center',
  },

  sectionLabel: {
    fontSize: 12, fontWeight: '800', color: PREMIUM_UI_THEME.colors.textSecondary,
    letterSpacing: 1.5, paddingHorizontal: 20, paddingVertical: 12,
    backgroundColor: PREMIUM_UI_THEME.colors.surface, borderBottomWidth: 1, borderBottomColor: PREMIUM_UI_THEME.colors.border,
  },

  folderRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: PREMIUM_UI_THEME.colors.surface,
  },
  folderAvatar: {
    width: 46, height: 46, borderRadius: 23,
    justifyContent: 'center', alignItems: 'center', marginRight: 16,
  },
  folderAvatarTxt: { color: PREMIUM_UI_THEME.colors.text, fontSize: 18, fontWeight: 'bold' },
  folderName: { flex: 1, fontSize: 16, fontWeight: '600', color: PREMIUM_UI_THEME.colors.text },
  folderArrow: { color: PREMIUM_UI_THEME.colors.textMuted, fontSize: 24, marginRight: 16 },
  folderTrashWrap: { padding: 6 },
  folderTrashIcon: { fontSize: 20 },
  separator: { height: 1, backgroundColor: PREMIUM_UI_THEME.colors.surface, marginLeft: 82 },

  uploadBtn: {
    margin: 16, backgroundColor: PREMIUM_UI_THEME.colors.purpleDeep, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', elevation: 2,
  },
  uploadBtnTxt: { color: PREMIUM_UI_THEME.colors.text, fontWeight: '800', fontSize: 15 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingTxt: { color: PREMIUM_UI_THEME.colors.text, marginTop: 12, fontSize: 14 },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 60, marginBottom: 14 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: PREMIUM_UI_THEME.colors.text, marginBottom: 8 },
  emptyHint: { fontSize: 13, color: PREMIUM_UI_THEME.colors.textMuted, textAlign: 'center', lineHeight: 22 },

  videoCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: PREMIUM_UI_THEME.colors.surface, borderRadius: 14, padding: 14,
    borderWidth: 1.5, borderColor: PREMIUM_UI_THEME.colors.border, gap: 12,
  },
  playBtn: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: PREMIUM_UI_THEME.colors.purpleDeep, justifyContent: 'center', alignItems: 'center',
  },
  playBtnTxt: { color: PREMIUM_UI_THEME.colors.text, fontSize: 20, fontWeight: 'bold' },
  videoInfo: { flex: 1 },
  videoName: { fontSize: 13, fontWeight: '700', color: PREMIUM_UI_THEME.colors.text, marginBottom: 3 },
  videoMeta: { fontSize: 11, color: PREMIUM_UI_THEME.colors.textMuted },
  deleteBtn: {
    backgroundColor: PREMIUM_UI_THEME.colors.dangerSurface, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 8,
  },
  deleteBtnTxt: { fontSize: 18 },
});
