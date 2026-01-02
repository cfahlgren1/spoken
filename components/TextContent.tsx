import { Feather } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { glassStyles } from "./styles";
import { useSpeech } from "./useSpeech";

interface TextContentProps {
  topInset: number;
  bottomInset: number;
}

export function TextContent({ topInset, bottomInset }: TextContentProps) {
  const [text, setText] = useState("");
  const { isSpeaking, toggle, stop } = useSpeech();

  const wordCount = useMemo(() => {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }, [text]);

  const hasContent = text.trim().length > 0;

  const handleClear = () => {
    stop();
    setText("");
  };

  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: hasContent ? 140 : 40,
          paddingHorizontal: 16,
        }}
        keyboardDismissMode="on-drag"
      >
        {/* Text input area */}
        <View style={glassStyles.floatShadow}>
          <GlassView glassEffectStyle="regular" style={{ borderRadius: 20, overflow: "hidden" }}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Paste or type your text here..."
              placeholderTextColor="rgba(30, 32, 40, 0.3)"
              multiline
              textAlignVertical="top"
              className="font-body text-base text-ink"
              style={{
                minHeight: 200,
                padding: 20,
                lineHeight: 26,
              }}
            />
          </GlassView>
        </View>

        {/* Stats */}
        {hasContent && (
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
              onPress={() => toggle(text)}
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
