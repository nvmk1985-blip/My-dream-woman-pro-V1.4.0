import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, ScrollView, Alert, Dimensions,
  KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  generateImage,
  HF_IMAGE_MODEL,
  HF_NSFW_MODELS,
} from '../services/api';
import { requestPhotoVideoPermissionsAsync } from '../services/media-permissions';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../hooks/useColors';

const { width } = Dimensions.get('window');

const STYLE_PRESETS = [
  { label: 'Realistic', prompt: 'photorealistic, ultra detailed, 8k, RAW photo' },
  { label: 'Anime',     prompt: 'anime style, highly detailed, vibrant colors' },
  { label: 'Oil Paint', prompt: 'oil painting, classical art, renaissance style' },
  { label: 'Cinematic', prompt: 'cinematic lighting, film grain, dramatic shadows' },
  { label: 'Fantasy',   prompt: 'fantasy art, magical, ethereal glow, detailed' },
  { label: 'Portrait',  prompt: 'portrait photography, soft bokeh, studio lighting' },
];

// ── Gemini image→prompt via API server (uses GEMINI_API_KEY secret) ─────────
async function analyzeImageWithGemini(b64: string, mime: string): Promise<string> {
  const REPLIT_API = (process.env['EXPO_PUBLIC_API_URL'] ?? '').replace(/\/$/, '');
  const res = await fetch(`${REPLIT_API}/api/image-to-prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ b64, mime }),
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as any;
    throw new Error(err?.error || `Gemini API error: ${res.status}`);
  }
  const data = await res.json() as any;
  if (!data.prompt) throw new Error('Prompt generate ஆகல');
  return data.prompt as string;
}

// ── Progress Bar ────────────────────────────────────────────────────────────
function ProgressBar({ progress, msg }: { progress: number; msg: string }) {
  const colors = useColors();
  const pb = useMemo(() => createProgressStyles(colors), [
    colors.bgTertiary, colors.card, colors.borderCyan, colors.textSecondary,
    colors.goldBright, colors.textCyan, colors.textPrimary, colors.cyanPrimary,
  ]);
  const p = Math.min(100, Math.max(0, progress));
  return (
    <View style={pb.wrap}>
      <View style={pb.row}>
        <Text style={pb.msg} numberOfLines={2}>{msg}</Text>
        <Text style={pb.pct}>{Math.round(p)}%</Text>
      </View>
      <View style={pb.track}>
        <View style={[pb.fill, { width: `${p}%` as any }]} />
      </View>
    </View>
  );
}
const createProgressStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  wrap: { backgroundColor: colors.card, borderRadius: 12, padding: 12, marginVertical: 8, borderWidth: 1, borderColor: colors.borderCyan },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  msg: { color: colors.textSecondary, fontSize: 12, flex: 1, lineHeight: 18 },
  pct: { color: colors.goldBright, fontSize: 20, fontWeight: '900', minWidth: 46, textAlign: 'right' },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.bgTertiary, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4, backgroundColor: colors.cyanPrimary },
});

// ── Main screen ──────────────────────────────────────────────────────────────
type Mode = 'text' | 'image';

export default function PromptImageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const s = useMemo(() => createStyles(colors), [
    colors.bgPrimary, colors.bgSecondary, colors.bgTertiary, colors.bgDeep,
    colors.card, colors.cardSecondary, colors.border, colors.borderSubtle,
    colors.borderCyan, colors.borderGold, colors.cyanBorder, colors.goldPrimary, colors.goldBright, colors.cyanPrimary,
    colors.cyanSoft, colors.success, colors.warning, colors.error, colors.overlay,
    colors.buttonGold, colors.buttonCyan, colors.buttonSecondary, colors.buttonDisabled,
    colors.textPrimary, colors.textSecondary, colors.textTertiary, colors.textMuted,
    colors.textDisabled, colors.textOnGold, colors.textOnCyan, colors.textCyan,
    colors.inputBackground, colors.inputBorder, colors.inputText, colors.inputPlaceholder,
  ]);

  // Mode: text prompt OR image upload
  const [mode, setMode] = useState<Mode>('text');

  // Text mode
  const [prompt, setPrompt] = useState('');
  const [negPrompt, setNegPrompt] = useState('blurry, low quality, deformed, ugly, watermark');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  // Image mode
  const [uploadedUri, setUploadedUri] = useState<string | null>(null);
  const [uploadedB64, setUploadedB64] = useState<string | null>(null);
  const [uploadedMime, setUploadedMime] = useState('image/jpeg');
  const [analyzedPrompt, setAnalyzedPrompt] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Common
  const [hfToken, setHfToken] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState(HF_IMAGE_MODEL);
  const [loading, setLoading] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');

  useFocusEffect(
    useCallback(() => {
      const loadToken = async () => {
        try {
          const [raw, legacyToken] = await Promise.all([
            AsyncStorage.getItem('api_keys_store'),
            AsyncStorage.getItem('hf_api_key'),
          ]);
          let token: string | null = null;
          if (raw) {
            const parsed = JSON.parse(raw) as Record<string, string>;
            token = parsed['hf'] || parsed['huggingface'] || null;
          }
          if (!token && legacyToken) token = legacyToken;
          setHfToken(token?.trim() || null);
        } catch {}
      };
      loadToken();
    }, [])
  );

  const applyPreset = (preset: { label: string; prompt: string }) => {
    setSelectedPreset(preset.label);
    setPrompt(prev => {
      const base = prev.replace(/,?\s*(photorealistic.*?8k.*?photo|anime style.*?colors|oil painting.*?style|cinematic.*?shadows|fantasy art.*?detailed|portrait photography.*?lighting)/gi, '').trim();
      return base ? `${base}, ${preset.prompt}` : preset.prompt;
    });
  };

  // Pick image from gallery
  const pickImage = async () => {
    const perm = await requestPhotoVideoPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission', 'Gallery access வேணும்.'); return; }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any, quality: 0.85, base64: true,
    });
    if (!picked.canceled && picked.assets[0]) {
      const asset = picked.assets[0];
      const mime = asset.mimeType ?? 'image/jpeg';
      let b64: string;
      if (asset.base64) {
        b64 = asset.base64;
      } else {
        try {
          const tmp = FileSystem.cacheDirectory + `pi_${Date.now()}.jpg`;
          await FileSystem.copyAsync({ from: asset.uri, to: tmp });
          b64 = await FileSystem.readAsStringAsync(tmp, { encoding: FileSystem.EncodingType.Base64 });
          await FileSystem.deleteAsync(tmp, { idempotent: true });
        } catch { Alert.alert('பிழை', 'Photo read ஆகல.'); return; }
      }
      setUploadedUri(asset.uri);
      setUploadedB64(b64);
      setUploadedMime(mime);
      setAnalyzedPrompt(null);
      setImageUri(null);
      setError(null);
    }
  };

  // Analyze image → prompt using Gemini
  const analyzeImage = async () => {
    if (!uploadedB64) return;
    setAnalyzing(true);
    setAnalyzedPrompt(null);
    setError(null);
    try {
      const result = await analyzeImageWithGemini(uploadedB64, uploadedMime);
      setAnalyzedPrompt(result);
    } catch (e: any) {
      setError(e?.message || 'Image analyze ஆகல. மீண்டும் try பண்ணுங்க.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Generate image from prompt
  const handleGenerate = async () => {
    const activePrompt = mode === 'image' ? analyzedPrompt : prompt.trim();

    if (!activePrompt) {
      if (mode === 'image' && uploadedB64 && !analyzedPrompt) {
        Alert.alert('முதலில் Analyze', '"🔍 Analyze & Get Prompt" button press பண்ணுங்க!');
      } else if (mode === 'image' && !uploadedB64) {
        Alert.alert('Photo இல்லை', 'முதலில் ஒரு photo upload பண்ணுங்க!');
      } else {
        Alert.alert('Prompt வேண்டும்', 'என்ன image வேண்டும் என்று type பண்ணுங்க!');
      }
      return;
    }



    setLoading(true);
    setError(null);
    setImageUri(null);
    setProgress(5);
    setProgressMsg('Preparing AI...');

    try {
      const fullPrompt = negPrompt.trim()
        ? `${activePrompt} ### negative: ${negPrompt.trim()}`
        : activePrompt;

      setProgressMsg('Render AI image generate பண்றது...');
      setProgress(30);
      const result = await generateImage({ imagePrompt: fullPrompt });
      setProgress(90);
      setProgress(100);
      setProgressMsg('✅ Done!');
      await new Promise(r => setTimeout(r, 300));
      setImageUri(`data:${result.mimeType};base64,${result.b64_json}`);
    } catch (e: any) {
      setError(e?.message || 'Image generate பண்ண முடியலை. மீண்டும் try பண்ணுங்க.');
    } finally {
      setLoading(false);
      setProgress(0);
      setProgressMsg('');
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['left','right','bottom']}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={[s.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <View style={s.actionLabelRow}><Ionicons name="arrow-back-outline" size={18} color={colors.textCyan} /><Text style={s.backTxt}>Back</Text></View>
          </TouchableOpacity>
          <View style={s.headerTitleRow}><Ionicons name="sparkles-outline" size={19} color={colors.goldBright} /><Text style={s.headerTitle}>Image Studio</Text></View>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          {/* Mode Toggle */}
          <View style={s.modeToggle}>
            <TouchableOpacity
              style={[s.modeBtn, mode === 'text' && s.modeBtnActive]}
              onPress={() => { setMode('text'); setImageUri(null); setError(null); }}
            >
              <View style={s.modeButtonRow}><Ionicons name="create-outline" size={17} color={mode === 'text' ? colors.textOnCyan : colors.textTertiary} /><Text style={[s.modeTxt, mode === 'text' && s.modeTxtActive]}>Text Prompt</Text></View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.modeBtn, mode === 'image' && s.modeBtnActive]}
              onPress={() => { setMode('image'); setImageUri(null); setError(null); }}
            >
              <View style={s.modeButtonRow}><Ionicons name="image-outline" size={17} color={mode === 'image' ? colors.textOnCyan : colors.textTertiary} /><Text style={[s.modeTxt, mode === 'image' && s.modeTxtActive]}>Image Upload</Text></View>
            </TouchableOpacity>
          </View>

          {/* Model badge */}
          <View style={s.modelBadge}>
            <Ionicons name="sparkles-outline" size={17} color={colors.goldBright} />
            <Text style={s.modelBadgeTxt}>Render AI Image Studio</Text>
            <View style={[s.dot, { backgroundColor: colors.success }]} />
            <Text style={[s.tokenStatus, { color: colors.success }]}>Connected</Text>
          </View>

          {/* ── IMAGE UPLOAD MODE ── */}
          {mode === 'image' && (
            <View>
              <Text style={s.sectionLabel}>STEP 1 — PHOTO UPLOAD</Text>
              <TouchableOpacity style={s.uploadBox} onPress={pickImage}>
                {uploadedUri ? (
                  <View>
                    <Image source={{ uri: uploadedUri }} style={s.uploadedImg} resizeMode="cover" />
                    <View style={s.changeOverlay}>
                      <View style={s.actionLabelRow}><Ionicons name="camera-outline" size={15} color={colors.textPrimary} /><Text style={s.changeTxt}>Change Photo</Text></View>
                    </View>
                  </View>
                ) : (
                  <View style={s.uploadPlaceholder}>
                    <Ionicons name="image-outline" size={48} color={colors.cyanPrimary} />
                    <Text style={s.uploadHint}>Photo Upload பண்ணுங்க</Text>
                    <Text style={s.uploadSub}>Gallery-ல் இருந்து எந்த photo-வும் OK</Text>
                  </View>
                )}
              </TouchableOpacity>

              {uploadedB64 && !analyzedPrompt && (
                <TouchableOpacity
                  style={[s.analyzeBtn, analyzing && s.analyzeBtnOff]}
                  onPress={analyzeImage}
                  disabled={analyzing}
                >
                  {analyzing ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <ActivityIndicator color={colors.textOnCyan} size="small" />
                      <Text style={s.analyzeBtnTxt}>Gemini AI analyzing...</Text>
                    </View>
                  ) : (
                    <View style={s.actionLabelRow}><Ionicons name="scan-outline" size={18} color={colors.textOnCyan} /><Text style={s.analyzeBtnTxt}>Analyze & Get Prompt</Text></View>
                  )}
                </TouchableOpacity>
              )}

              {analyzedPrompt && (
                <View style={s.promptResult}>
                  <View style={s.promptResultHeader}>
                    <View style={s.actionLabelRow}><Ionicons name="checkmark-circle-outline" size={16} color={colors.success} /><Text style={s.promptResultTitle}>AI Generated Prompt</Text></View>
                    <TouchableOpacity onPress={pickImage}>
                      <View style={s.actionLabelRow}><Ionicons name="refresh-outline" size={15} color={colors.textCyan} /><Text style={s.reAnalyzeTxt}>New Photo</Text></View>
                    </TouchableOpacity>
                  </View>
                  <Text style={s.promptResultText}>{analyzedPrompt}</Text>
                  <TouchableOpacity
                    style={s.editPromptBtn}
                    onPress={() => {
                      setMode('text');
                      setPrompt(analyzedPrompt);
                    }}
                  >
                    <View style={s.actionLabelRow}><Ionicons name="create-outline" size={15} color={colors.textCyan} /><Text style={s.editPromptTxt}>Edit Prompt</Text></View>
                  </TouchableOpacity>
                </View>
              )}

              {analyzedPrompt && (
                <Text style={s.step2Label}>STEP 2 — IMAGE GENERATE</Text>
              )}
            </View>
          )}

          {/* ── TEXT PROMPT MODE ── */}
          {mode === 'text' && (
            <View>
              <Text style={s.sectionLabel}>STYLE PRESET</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.presetsRow}>
                {STYLE_PRESETS.map(p => (
                  <TouchableOpacity
                    key={p.label}
                    style={[s.presetChip, selectedPreset === p.label && s.presetChipActive]}
                    onPress={() => applyPreset(p)}
                  >
                    <Text style={[s.presetChipTxt, selectedPreset === p.label && s.presetChipTxtActive]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={s.sectionLabel}>PROMPT</Text>
              <TextInput
                style={s.promptInput}
                value={prompt}
                onChangeText={setPrompt}
                placeholder="Example: beautiful Tamil girl, saree, smiling, garden background..."
                placeholderTextColor={colors.inputPlaceholder}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          )}

          {/* Model selector — shown in both modes */}
          <Text style={s.sectionLabel}>MODEL</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingBottom: 4 }} style={{ marginBottom: 10 }}>
            {HF_NSFW_MODELS.map(m => (
              <TouchableOpacity key={m.id}
                style={[s.presetChip, selectedModel === m.id && s.presetChipActive]}
                onPress={() => setSelectedModel(m.id)}>
                <Text style={[s.presetChipTxt, selectedModel === m.id && s.presetChipTxtActive]}>
                  {m.label}
                </Text>
                  <Text style={{ fontSize: 9, color: selectedModel === m.id ? colors.textPrimary : colors.textMuted, marginTop: 1 }}>
                  {m.tag}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Negative prompt */}
          <Text style={s.sectionLabel}>NEGATIVE PROMPT (வேண்டாதது)</Text>
          <TextInput
            style={[s.promptInput, { height: 60 }]}
            value={negPrompt}
            onChangeText={setNegPrompt}
            placeholder="blurry, low quality, deformed..."
            placeholderTextColor={colors.inputPlaceholder}
            multiline
            textAlignVertical="top"
          />

          {/* Progress bar */}
          {loading && progress > 0 ? (
            <ProgressBar progress={progress} msg={progressMsg} />
          ) : null}

          {/* Generate button */}
          <TouchableOpacity
            style={[s.genBtn, (loading || analyzing) && s.genBtnDisabled]}
            onPress={handleGenerate}
            disabled={loading || analyzing}
            activeOpacity={0.8}
          >
            {loading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ActivityIndicator color={colors.textOnGold} />
                <Text style={s.genBtnTxt}>Generating... ({Math.round(progress)}%)</Text>
              </View>
            ) : (
              <View style={s.actionLabelRow}><Ionicons name="sparkles-outline" size={19} color={colors.textOnGold} /><Text style={s.genBtnTxt}>{mode === 'image' && analyzedPrompt ? 'இந்த Prompt-ல் Image Generate பண்ணு' : 'Image Generate பண்ணு'}</Text></View>
            )}
          </TouchableOpacity>



          {/* Error */}
          {error && (
            <View style={s.errorBox}>
              <View style={s.errorRow}><Ionicons name="alert-circle-outline" size={18} color={colors.error} /><Text style={s.errorTxt}>{error}</Text></View>
            </View>
          )}

          {/* Generated image */}
          {imageUri && (
            <View style={s.resultBox}>
              <View style={s.actionLabelRow}><Ionicons name="checkmark-circle-outline" size={17} color={colors.success} /><Text style={s.resultLabel}>Generated Image</Text></View>
              <Image source={{ uri: imageUri }} style={s.resultImg} resizeMode="contain" />
              <View style={s.resultBtns}>
                <TouchableOpacity style={s.regenBtn} onPress={handleGenerate}>
                  <View style={s.actionLabelRow}><Ionicons name="refresh-outline" size={16} color={colors.textCyan} /><Text style={s.regenBtnTxt}>மீண்டும் Generate</Text></View>
                </TouchableOpacity>
                {mode === 'image' && (
                  <TouchableOpacity
                    style={s.newPhotoBtn}
                    onPress={() => { setUploadedUri(null); setUploadedB64(null); setAnalyzedPrompt(null); setImageUri(null); }}
                  >
                    <View style={s.actionLabelRow}><Ionicons name="image-outline" size={16} color={colors.textCyan} /><Text style={s.newPhotoBtnTxt}>New Photo</Text></View>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgPrimary },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.bgSecondary, paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.borderSubtle,
  },
  backBtn: { width: 60 },
  backTxt: { color: colors.textCyan, fontSize: 14, fontWeight: '600' },
  headerTitle: { color: colors.goldBright, fontSize: 16, fontWeight: '700' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  errorRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  scroll: { padding: 16, paddingBottom: 40 },
  modeToggle: {
    flexDirection: 'row', backgroundColor: colors.bgTertiary, borderRadius: 12,
    padding: 4, marginBottom: 14, borderWidth: 1, borderColor: colors.border,
  },
  modeBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  modeBtnActive: { backgroundColor: colors.buttonCyan },
  modeButtonRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  modeTxt: { color: colors.textTertiary, fontSize: 13, fontWeight: '700' },
  modeTxtActive: { color: colors.textOnCyan },
  modelBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.card, borderRadius: 10, padding: 10, marginBottom: 16,
    borderWidth: 1, borderColor: colors.borderGold,
  },
  modelBadgeTxt: { color: colors.textSecondary, fontSize: 12, flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  tokenStatus: { fontSize: 12, fontWeight: '600' },
  sectionLabel: { color: colors.textTertiary, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8, marginTop: 4 },
  step2Label: { color: colors.goldBright, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  presetsRow: { marginBottom: 16 },
  presetChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: colors.card, marginRight: 8, borderWidth: 1, borderColor: colors.border,
  },
  presetChipActive: { backgroundColor: colors.cyanSoft, borderColor: colors.cyanBorder },
  presetChipTxt: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  presetChipTxtActive: { color: colors.textCyan },
  promptInput: {
    backgroundColor: colors.inputBackground, borderRadius: 12, borderWidth: 1, borderColor: colors.inputBorder,
    color: colors.inputText, fontSize: 14, padding: 12, height: 100, marginBottom: 16,
  },
  uploadBox: {
    height: 200, borderRadius: 14, overflow: 'hidden', marginBottom: 12,
    backgroundColor: colors.card, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.cyanBorder,
  },
  uploadedImg: { width: '100%', height: '100%' },
  changeOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.overlay, paddingVertical: 8, alignItems: 'center',
  },
  changeTxt: { color: colors.textPrimary, fontSize: 13, fontWeight: '700' },
  uploadPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  uploadIcon: { fontSize: 48 },
  uploadHint: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  uploadSub: { color: colors.textTertiary, fontSize: 12 },
  analyzeBtn: {
    backgroundColor: colors.buttonCyan, borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', marginBottom: 12,
  },
  analyzeBtnOff: { backgroundColor: colors.buttonDisabled, opacity: 0.7 },
  analyzeBtnTxt: { color: colors.textOnCyan, fontSize: 15, fontWeight: '700' },
  promptResult: {
    backgroundColor: colors.card, borderRadius: 12, padding: 14,
    marginBottom: 12, borderWidth: 1, borderColor: colors.borderCyan,
  },
  promptResultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  promptResultTitle: { color: colors.textPrimary, fontSize: 13, fontWeight: '800' },
  reAnalyzeTxt: { color: colors.textCyan, fontSize: 12, fontWeight: '600' },
  promptResultText: { color: colors.textSecondary, fontSize: 12, lineHeight: 20 },
  editPromptBtn: {
    marginTop: 10, backgroundColor: colors.cardSecondary, borderRadius: 8,
    paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  editPromptTxt: { color: colors.textCyan, fontSize: 12, fontWeight: '600' },
  genBtn: {
    backgroundColor: colors.buttonGold, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginVertical: 8,
  },
  genBtnDisabled: { backgroundColor: colors.buttonDisabled, opacity: 0.7 },
  genBtnTxt: { color: colors.textOnGold, fontSize: 16, fontWeight: '700' },
  tokenWarning: {
    backgroundColor: colors.bgTertiary, borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: colors.warning, marginTop: 8,
  },
  tokenWarningTxt: { color: colors.warning, fontSize: 13, textAlign: 'center' },
  errorBox: {
    backgroundColor: colors.bgTertiary, borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: colors.error, marginTop: 12,
  },
  errorTxt: { color: colors.error, fontSize: 13, flex: 1 },
  resultBox: { marginTop: 20, backgroundColor: colors.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.borderGold },
  resultLabel: { color: colors.success, fontSize: 14, fontWeight: '700', marginBottom: 10 },
  resultImg: { width: width - 60, height: width - 60, alignSelf: 'center', borderRadius: 14, backgroundColor: colors.bgDeep },
  resultBtns: { flexDirection: 'row', gap: 10, marginTop: 12 },
  regenBtn: {
    flex: 1, backgroundColor: colors.cardSecondary, borderRadius: 12,
    paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  regenBtnTxt: { color: colors.textCyan, fontSize: 14, fontWeight: '600' },
  newPhotoBtn: {
    flex: 1, backgroundColor: colors.card, borderRadius: 12,
    paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.borderCyan,
  },
  newPhotoBtnTxt: { color: colors.textCyan, fontSize: 14, fontWeight: '600' },
});
