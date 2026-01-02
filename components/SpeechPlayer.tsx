import { Feather } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import { Pressable, Text, View, ScrollView, ActivityIndicator } from "react-native";
import { glassStyles } from "./styles";

interface SpeechPlayerProps {
  title: string;
  subtitle?: string;
  text: string;
  wordCount: number;
  isSpeaking: boolean;
  isLoading?: boolean;
  onPlay: () => void;
  onStop: () => void;
  bottomInset: number;
}

export function SpeechPlayer({
  title,
  subtitle,
  text,
  wordCount,
  isSpeaking,
  isLoading,
  onPlay,
  onStop,
  bottomInset,
}: SpeechPlayerProps) {
  const hasContent = text.trim().length > 0;

  return (
    <View
      className="absolute left-3 right-3"
      style={[glassStyles.floatShadow, { bottom: bottomInset }]}
    >
      <GlassView glassEffectStyle="regular" style={glassStyles.fullDrawer}>
        <View style={{ paddingBottom: Math.max(bottomInset, 16) }}>
          {/* Header */}
          <View className="flex-row items-start justify-between px-5 py-4">
            <View className="flex-1 pr-4">
              <Text
                className="font-display text-xl text-ink"
                style={{ letterSpacing: -0.5 }}
                numberOfLines={2}
              >
                {title}
              </Text>
              <View className="mt-1 flex-row items-center gap-2">
                {subtitle && (
                  <Text className="font-body text-xs text-ink/40">
                    {subtitle}
                  </Text>
                )}
                {wordCount > 0 && (
                  <>
                    {subtitle && <View className="h-1 w-1 rounded-full bg-ink/20" />}
                    <Text className="font-body text-xs text-ink/40">
                      {wordCount.toLocaleString()} words
                    </Text>
                    <View className="h-1 w-1 rounded-full bg-ink/20" />
                    <Text className="font-body text-xs text-ink/40">
                      {Math.ceil(wordCount / 200)} min
                    </Text>
                  </>
                )}
              </View>
            </View>
          </View>

          {/* Content preview */}
          <ScrollView
            className="mx-5 mb-4"
            style={{ maxHeight: 200 }}
            showsVerticalScrollIndicator={false}
          >
            {isLoading ? (
              <View className="items-center py-8">
                <ActivityIndicator size="large" color="rgba(30, 32, 40, 0.4)" />
                <Text className="mt-3 font-body text-sm text-ink/40">
                  Loading content...
                </Text>
              </View>
            ) : (
              <Text
                className="text-ink/80"
                style={{
                  fontFamily: "Georgia",
                  fontSize: 16,
                  lineHeight: 26,
                  letterSpacing: 0.2,
                }}
                numberOfLines={8}
              >
                {text || "No content to read."}
              </Text>
            )}
          </ScrollView>

          {/* Play button */}
          <View className="mx-5">
            <Pressable
              onPress={isSpeaking ? onStop : onPlay}
              disabled={!hasContent || isLoading}
              className="flex-row items-center justify-center gap-2 rounded-2xl bg-ink py-4"
              style={({ pressed }) => ({
                opacity: !hasContent || isLoading ? 0.35 : pressed ? 0.8 : 1,
              })}
            >
              <Feather
                name={isSpeaking ? "pause" : "play"}
                size={20}
                color="#FCF9F3"
              />
              <Text className="font-body text-base font-medium text-fog">
                {isSpeaking ? "Pause" : "Play"}
              </Text>
            </Pressable>
          </View>
        </View>
      </GlassView>
    </View>
  );
}
