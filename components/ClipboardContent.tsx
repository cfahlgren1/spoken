import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { GlassView } from "expo-glass-effect";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AppState,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { glassStyles } from "./styles";
import { useSpeech } from "./useSpeech";

interface ClipboardContentProps {
  topInset: number;
  bottomInset: number;
  isActive: boolean;
}

export function ClipboardContent({ topInset, bottomInset, isActive }: ClipboardContentProps) {
  const [clipboardText, setClipboardText] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const { isSpeaking, toggle, stop } = useSpeech();

  const wordCount = useMemo(() => {
    const trimmed = clipboardText.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }, [clipboardText]);

  const hasContent = clipboardText.trim().length > 0;

  const fetchClipboard = useCallback(async () => {
    try {
      const hasString = await Clipboard.hasStringAsync();
      if (hasString) {
        const text = await Clipboard.getStringAsync();
        setClipboardText(text);
        setHasPermission(true);
      } else {
        setClipboardText("");
        setHasPermission(true);
      }
    } catch {
      setClipboardText("");
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchClipboard();
    setIsRefreshing(false);
  }, [fetchClipboard]);

  // Only fetch clipboard when this tab becomes active
  useEffect(() => {
    if (isActive && !hasPermission) {
      fetchClipboard();
    }
  }, [isActive, hasPermission, fetchClipboard]);

  // Refresh when app becomes active (only if we already have permission)
  useEffect(() => {
    if (!isActive) return;

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active" && hasPermission) {
        fetchClipboard();
      }
    });

    return () => subscription.remove();
  }, [isActive, hasPermission, fetchClipboard]);

  const handleClear = () => {
    stop();
    setClipboardText("");
  };

  const handleRequestAccess = () => {
    fetchClipboard();
  };

  // Show request access button if we haven't checked clipboard yet
  if (!hasPermission) {
    return (
      <View className="flex-1 items-center justify-center px-8">
        <View style={glassStyles.floatShadow}>
          <GlassView glassEffectStyle="regular" style={{ borderRadius: 20, overflow: "hidden" }}>
            <View className="items-center py-12 px-8">
              <View
                className="mb-4 items-center justify-center rounded-full bg-ink/5"
                style={{ width: 64, height: 64 }}
              >
                <Feather name="clipboard" size={28} color="rgba(30, 32, 40, 0.3)" />
              </View>
              <Text className="font-body text-base text-ink/70 text-center mb-2">
                Read from Clipboard
              </Text>
              <Text className="font-body text-sm text-ink/40 text-center mb-6">
                Tap below to access your clipboard content
              </Text>
              <Pressable
                onPress={handleRequestAccess}
                className="rounded-xl bg-ink px-6 py-3"
                style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
              >
                <Text className="font-body text-sm font-medium text-fog">
                  Access Clipboard
                </Text>
              </Pressable>
            </View>
          </GlassView>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: hasContent ? 140 : 40,
          paddingHorizontal: 16,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="rgba(30, 32, 40, 0.4)"
          />
        }
      >
        {hasContent ? (
          <>
            {/* Content preview */}
            <View style={glassStyles.floatShadow}>
              <GlassView glassEffectStyle="regular" style={{ borderRadius: 20, overflow: "hidden" }}>
                <View style={{ padding: 20 }}>
                  <Text
                    className="text-ink/80"
                    style={{
                      fontFamily: "Georgia",
                      fontSize: 16,
                      lineHeight: 26,
                      letterSpacing: 0.2,
                    }}
                  >
                    {clipboardText}
                  </Text>
                </View>
              </GlassView>
            </View>

            {/* Stats */}
            <View className="mt-4 flex-row items-center justify-between px-1">
              <View className="flex-row items-center gap-3">
                <Text className="font-body text-sm text-ink/40">
                  {wordCount.toLocaleString()} words
                </Text>
                <View className="h-1 w-1 rounded-full bg-ink/20" />
                <Text className="font-body text-sm text-ink/40">
                  ~{Math.ceil(wordCount / 200)} min
                </Text>
              </View>
              <Pressable
                onPress={handleClear}
                className="flex-row items-center gap-1"
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
              >
                <Feather name="trash-2" size={14} color="rgba(30, 32, 40, 0.4)" />
                <Text className="font-body text-sm text-ink/40">Clear</Text>
              </Pressable>
            </View>
          </>
        ) : (
          /* Empty state */
          <View style={glassStyles.floatShadow}>
            <GlassView glassEffectStyle="regular" style={{ borderRadius: 20, overflow: "hidden" }}>
              <View className="items-center py-16 px-8">
                <View
                  className="mb-4 items-center justify-center rounded-full bg-ink/5"
                  style={{ width: 64, height: 64 }}
                >
                  <Feather name="clipboard" size={28} color="rgba(30, 32, 40, 0.3)" />
                </View>
                <Text className="font-body text-base text-ink/50 text-center">
                  No text in clipboard
                </Text>
                <Text className="mt-1 font-body text-sm text-ink/30 text-center">
                  Copy some text and pull to refresh
                </Text>
              </View>
            </GlassView>
          </View>
        )}
      </ScrollView>

      {/* Floating play button */}
      {hasContent && (
        <View
          className="absolute left-4 right-4"
          style={[glassStyles.floatShadow, { bottom: bottomInset + 16 }]}
        >
          <GlassView glassEffectStyle="regular" style={{ borderRadius: 20, overflow: "hidden" }}>
            <Pressable
              onPress={() => toggle(clipboardText)}
              className="flex-row items-center justify-center gap-3 py-4"
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
            >
              <View style={glassStyles.playButton}>
                <Feather
                  name={isSpeaking ? "pause" : "play"}
                  size={20}
                  color="#FCF9F3"
                />
              </View>
              <View>
                <Text className="font-body text-base font-medium text-ink">
                  {isSpeaking ? "Pause" : "Play"}
                </Text>
                <Text className="font-body text-xs text-ink/50">
                  {Math.ceil(wordCount / 200)} min read
                </Text>
              </View>
            </Pressable>
          </GlassView>
        </View>
      )}
    </View>
  );
}
