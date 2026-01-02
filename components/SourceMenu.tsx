import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useEffect, useRef } from "react";
import { Animated, Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { glassStyles } from "./styles";

export type ContentSource = "text" | "clipboard" | "browser";

interface SourceMenuProps {
  visible: boolean;
  currentSource: ContentSource;
  onSelect: (source: ContentSource) => void;
  onClose: () => void;
}

const sources: { id: ContentSource; label: string; icon: keyof typeof Feather.glyphMap; description: string }[] = [
  { id: "text", label: "Text", icon: "type", description: "Type or paste text" },
  { id: "clipboard", label: "Clipboard", icon: "clipboard", description: "Read from clipboard" },
  { id: "browser", label: "Browse", icon: "globe", description: "Search the web" },
];

export function SourceMenu({ visible, currentSource, onSelect, onClose }: SourceMenuProps) {
  const insets = useSafeAreaInsets();
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 20,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scaleAnim, opacityAnim, backdropAnim]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      {/* Animated blur backdrop */}
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: backdropAnim,
        }}
      >
        <BlurView
          intensity={20}
          tint="light"
          style={{ flex: 1 }}
        />
      </Animated.View>

      {/* Tap to close */}
      <Pressable
        style={{ flex: 1 }}
        onPress={onClose}
      >
        {/* Menu popover */}
        <Animated.View
          style={[
            glassStyles.floatShadow,
            {
              position: "absolute",
              left: 16,
              top: insets.top + 76,
              width: 260,
              opacity: opacityAnim,
              transform: [
                { scale: scaleAnim },
                { translateY: Animated.multiply(Animated.subtract(1, scaleAnim), -10) },
              ],
            },
          ]}
        >
          {/* Card container */}
          <View
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.85)",
              borderRadius: 24,
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.6)",
              overflow: "hidden",
            }}
          >
            {/* Inner blur for glass depth */}
            <BlurView intensity={40} tint="light" style={{ overflow: "hidden" }}>
              <View className="p-3">
                {/* Header */}
                <Text className="font-body text-xs text-ink/40 uppercase tracking-wide px-2 mb-2">
                  Content Source
                </Text>

                {sources.map((source) => (
                  <Pressable
                    key={source.id}
                    onPress={() => {
                      onSelect(source.id);
                      onClose();
                    }}
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <View
                      className="flex-row items-center gap-3 px-3 py-3 rounded-2xl"
                      style={{
                        backgroundColor: currentSource === source.id
                          ? "rgba(30, 32, 40, 0.1)"
                          : "transparent",
                      }}
                    >
                      <View
                        className="items-center justify-center"
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 22,
                          backgroundColor: currentSource === source.id
                            ? "#1E2028"
                            : "rgba(255, 255, 255, 0.9)",
                          borderWidth: currentSource === source.id ? 0 : 1,
                          borderColor: "rgba(255, 255, 255, 0.5)",
                          shadowColor: "#000",
                          shadowOpacity: 0.08,
                          shadowRadius: 8,
                          shadowOffset: { width: 0, height: 2 },
                        }}
                      >
                        <Feather
                          name={source.icon}
                          size={20}
                          color={currentSource === source.id ? "#FCF9F3" : "#1E2028"}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="font-body text-base font-medium text-ink">
                          {source.label}
                        </Text>
                        <Text className="font-body text-xs text-ink/50">
                          {source.description}
                        </Text>
                      </View>
                      {currentSource === source.id && (
                        <Feather name="check" size={18} color="#1E2028" />
                      )}
                    </View>
                  </Pressable>
                ))}
              </View>
            </BlurView>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
