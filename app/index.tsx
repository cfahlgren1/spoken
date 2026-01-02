import { Feather } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BrowserContent } from "../components/BrowserContent";
import { ClipboardContent } from "../components/ClipboardContent";
import { SourceMenu, ContentSource } from "../components/SourceMenu";
import { glassStyles } from "../components/styles";
import { TextContent } from "../components/TextContent";

const sourceIcons: Record<ContentSource, keyof typeof Feather.glyphMap> = {
  text: "type",
  clipboard: "clipboard",
  browser: "globe",
};

export default function Index() {
  const insets = useSafeAreaInsets();
  const [currentSource, setCurrentSource] = useState<ContentSource>("text");
  const [menuVisible, setMenuVisible] = useState(false);

  const bottomInset = Math.max(insets.bottom, 8);
  const isBrowser = currentSource === "browser";

  return (
    <View className="flex-1 bg-fog">
      {/* Safe area header - only for non-browser views */}
      {!isBrowser && (
        <View
          className="absolute left-0 right-0 top-0 z-20 bg-fog"
          style={{ height: insets.top }}
        />
      )}

      {/* Content area */}
      <View style={{ flex: 1, marginTop: isBrowser ? 0 : insets.top + 56 }}>
        {currentSource === "text" && (
          <TextContent topInset={0} bottomInset={bottomInset} />
        )}
        {currentSource === "clipboard" && (
          <ClipboardContent
            topInset={0}
            bottomInset={bottomInset}
            isActive={currentSource === "clipboard"}
          />
        )}
        {currentSource === "browser" && (
          <BrowserContent topInset={insets.top} bottomInset={bottomInset} />
        )}
      </View>

      {/* Floating menu button - always visible */}
      <Pressable
        onPress={() => setMenuVisible(true)}
        style={[
          glassStyles.floatShadow,
          {
            position: "absolute",
            left: 16,
            top: insets.top + 16,
            zIndex: 30,
          },
        ]}
      >
        {({ pressed }) => (
          <View
            style={[
              glassStyles.speakerButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name={sourceIcons[currentSource]} size={22} color="#1E2028" />
          </View>
        )}
      </Pressable>

      {/* Header row for non-browser views */}
      {!isBrowser && (
        <View
          className="absolute left-0 right-0 z-10 flex-row items-center px-4"
          style={{ top: insets.top, height: 56 }}
        >
          {/* Spacer for menu button */}
          <View style={{ width: 68 }} />

          {/* Title */}
          <View className="flex-1">
            <Text
              className="font-display text-xl text-ink"
              style={{ letterSpacing: -0.5 }}
            >
              {currentSource === "text" ? "Text" : "Clipboard"}
            </Text>
          </View>
        </View>
      )}

      {/* Source menu modal */}
      <SourceMenu
        visible={menuVisible}
        currentSource={currentSource}
        onSelect={setCurrentSource}
        onClose={() => setMenuVisible(false)}
      />
    </View>
  );
}
