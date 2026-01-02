import { Feather } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Keyboard,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  UIManager,
  View,
} from "react-native";
import WebView from "react-native-webview";
import { glassStyles } from "./styles";
import { useSpeech } from "./useSpeech";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const HOME_URL = "https://duckduckgo.com";
const MAX_TEXT = 20000;

const extractionScript = `
(() => {
  const max = ${MAX_TEXT};
  const ensureReadability = () => new Promise((resolve) => {
    if (window.Readability) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://unpkg.com/@mozilla/readability@0.5.0/Readability.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
  const extract = () => {
    let text = "";
    try {
      if (window.Readability) {
        const reader = new window.Readability(document.cloneNode(true));
        const article = reader.parse();
        if (article && article.textContent) text = article.textContent;
      }
    } catch {}
    const articleEl = document.querySelector("article");
    const main = document.querySelector("main");
    if (articleEl && articleEl.innerText && articleEl.innerText.length > text.length) {
      text = articleEl.innerText;
    }
    if (main && main.innerText && main.innerText.length > text.length) {
      text = main.innerText;
    }
    if ((!text || text.trim().length === 0) && document.body && document.body.innerText) {
      text = document.body.innerText;
    }
    text = (text || "").replace(/\\n{3,}/g, "\\n\\n").trim();
    if (text.length > max) text = text.slice(0, max) + "\\n\\n…";
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: "pageText",
      title: document.title || "Untitled",
      text
    }));
  };
  ensureReadability().finally(() => {
    extract();
  });
})();
true;
`;

const normalizeInput = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return HOME_URL;
  const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed);
  if (hasScheme) return trimmed;
  const looksLikeUrl = trimmed.includes(".") && !trimmed.includes(" ");
  if (looksLikeUrl) return `https://${trimmed}`;
  return `https://duckduckgo.com/?q=${encodeURIComponent(trimmed)}`;
};

interface BrowserContentProps {
  topInset: number;
  bottomInset: number;
}

export function BrowserContent({ topInset, bottomInset }: BrowserContentProps) {
  const webRef = useRef<WebView>(null);
  const inputRef = useRef<TextInput>(null);
  const extractTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingExtractRef = useRef(false);
  const keyboardOffset = useRef(new Animated.Value(0)).current;
  const { isSpeaking, speak, stop } = useSpeech();

  const [inputValue, setInputValue] = useState(HOME_URL);
  const [currentUrl, setCurrentUrl] = useState(HOME_URL);
  const [pageTitle, setPageTitle] = useState("New tab");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [readerText, setReaderText] = useState("");
  const [readerLoading, setReaderLoading] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"closed" | "mini" | "full">("closed");

  const wordCount = useMemo(() => {
    const trimmed = readerText.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }, [readerText]);

  const hostname = useMemo(() => {
    try {
      const url = new URL(currentUrl);
      return url.hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
  }, [currentUrl]);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const handleShow = (event: any) => {
      const height = Math.max(0, event?.endCoordinates?.height ?? 0);
      const adjustedHeight = Math.max(0, height - bottomInset);
      Animated.timing(keyboardOffset, {
        toValue: adjustedHeight,
        duration: event?.duration ?? 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    };

    const handleHide = (event: any) => {
      Animated.timing(keyboardOffset, {
        toValue: 0,
        duration: event?.duration ?? 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    };

    const showSub = Keyboard.addListener(showEvent, handleShow);
    const hideSub = Keyboard.addListener(hideEvent, handleHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [bottomInset, keyboardOffset]);

  useEffect(() => {
    return () => {
      if (extractTimeoutRef.current) {
        clearTimeout(extractTimeoutRef.current);
      }
    };
  }, []);

  const clearExtractTimeout = () => {
    if (extractTimeoutRef.current) {
      clearTimeout(extractTimeoutRef.current);
      extractTimeoutRef.current = null;
    }
  };

  const runExtraction = () => {
    clearExtractTimeout();
    setReaderLoading(true);
    setReaderText("");
    webRef.current?.injectJavaScript(extractionScript);
    extractTimeoutRef.current = setTimeout(() => {
      setReaderLoading(false);
      setReaderText((prev) =>
        prev ? prev : "Couldn't pull text from this page. Try reloading or another site."
      );
    }, 2500);
  };

  const handleSearchFocus = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSearchFocused(true);
    setInputValue(currentUrl);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSearchCancel = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSearchFocused(false);
    setInputValue(currentUrl);
    Keyboard.dismiss();
  };

  const handleGo = () => {
    const nextUrl = normalizeInput(inputValue);
    setCurrentUrl(nextUrl);
    setInputValue(nextUrl);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSearchFocused(false);
    Keyboard.dismiss();
  };

  const handleExtract = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDrawerMode("mini");
    if (loading) {
      pendingExtractRef.current = true;
      setReaderLoading(true);
      setReaderText("");
      return;
    }
    runExtraction();
  };

  const handleCloseDrawer = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDrawerMode("closed");
    stop();
  };

  const handleToggleDrawer = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDrawerMode(drawerMode === "mini" ? "full" : "mini");
  };

  const toolbarHeight = 52;
  const contentBottomInset = bottomInset + toolbarHeight + 16;

  return (
    <View className="flex-1" style={{ backgroundColor: "#fff" }}>
      {/* Top safe area */}
      <View style={{ height: topInset, backgroundColor: "#fff" }} />

      {/* WebView */}
      <WebView
        ref={webRef}
        source={{ uri: currentUrl }}
        javaScriptEnabled
        automaticallyAdjustContentInsets={false}
        contentInset={{ bottom: contentBottomInset }}
        onLoadStart={() => {
          setLoading(true);
          setProgress(0);
        }}
        onLoadEnd={() => {
          setLoading(false);
          setProgress(1);
          if (pendingExtractRef.current) {
            pendingExtractRef.current = false;
            runExtraction();
          }
        }}
        onLoadProgress={({ nativeEvent }) => setProgress(nativeEvent.progress)}
        onNavigationStateChange={(navState) => {
          setCanGoBack(navState.canGoBack);
          setCanGoForward(navState.canGoForward);
          setCurrentUrl(navState.url);
          setInputValue(navState.url);
          setPageTitle(navState.title || "Untitled");
        }}
        onMessage={(event) => {
          try {
            const payload = JSON.parse(event.nativeEvent.data);
            if (payload?.type === "pageText") {
              clearExtractTimeout();
              setReaderLoading(false);
              setReaderText(payload.text || "");
              setPageTitle(payload.title || "Untitled");
              return;
            }
          } catch {
            clearExtractTimeout();
            setReaderLoading(false);
            setReaderText(event.nativeEvent.data || "");
          }
        }}
        setSupportMultipleWindows={false}
        originWhitelist={["*"]}
        style={{ flex: 1 }}
      />

      {/* Progress bar */}
      {loading && (
        <View
          className="absolute left-0 right-0 h-0.5 bg-ink/5"
          style={{ top: topInset }}
        >
          <View className="h-full bg-copper" style={{ width: `${progress * 100}%` }} />
        </View>
      )}

      {/* Read button - top right */}
      <Pressable
        onPress={handleExtract}
        style={[
          glassStyles.floatShadow,
          {
            position: "absolute",
            right: 16,
            top: topInset + 16,
          },
        ]}
      >
        {({ pressed }) => (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              borderRadius: 26,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderWidth: 0.5,
              borderColor: "rgba(255, 255, 255, 0.7)",
              opacity: pressed ? 0.7 : 1,
            }}
          >
            {readerLoading ? (
              <ActivityIndicator size="small" color="#1E2028" />
            ) : (
              <Feather name="headphones" size={20} color="#1E2028" />
            )}
            <Text className="font-body text-base font-medium text-ink">
              Read
            </Text>
          </View>
        )}
      </Pressable>

      {/* Bottom toolbar - minimal floating design */}
      <Animated.View
        style={{
          position: "absolute",
          left: 16,
          right: 16,
          bottom: bottomInset + 8,
          transform: [{ translateY: Animated.multiply(keyboardOffset, -1) }],
        }}
      >
        {searchFocused ? (
          /* Expanded search */
          <View style={glassStyles.floatShadow}>
            <GlassView glassEffectStyle="regular" style={{ borderRadius: 26, overflow: "hidden" }}>
              <View className="flex-row items-center gap-2 py-2 pl-4 pr-2">
                <TextInput
                  ref={inputRef}
                  value={inputValue}
                  onChangeText={setInputValue}
                  onSubmitEditing={handleGo}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="go"
                  selectTextOnFocus
                  placeholder="Search or enter address"
                  placeholderTextColor="rgba(30, 32, 40, 0.4)"
                  className="flex-1 font-body text-base text-ink"
                  style={{ paddingVertical: 8 }}
                />
                <Pressable
                  onPress={handleSearchCancel}
                  style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                >
                  <View style={glassStyles.iconButton}>
                    <Feather name="x" size={18} color="#1E2028" />
                  </View>
                </Pressable>
              </View>
            </GlassView>
          </View>
        ) : (
          /* Collapsed toolbar */
          <View className="flex-row items-center gap-2">
            {/* Back button - only when can go back */}
            {canGoBack && (
              <View style={glassStyles.floatShadow}>
                <GlassView glassEffectStyle="regular" style={{ borderRadius: 26, overflow: "hidden" }}>
                  <Pressable
                    onPress={() => webRef.current?.goBack()}
                    style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                  >
                    <View className="items-center justify-center" style={{ width: 48, height: 48 }}>
                      <Feather name="chevron-left" size={24} color="#1E2028" />
                    </View>
                  </Pressable>
                </GlassView>
              </View>
            )}

            {/* URL bar with refresh */}
            <View style={[glassStyles.floatShadow, { flex: 1 }]}>
              <GlassView glassEffectStyle="regular" style={{ borderRadius: 26, overflow: "hidden" }}>
                <View className="flex-row items-center">
                  {/* URL - tap to expand */}
                  <Pressable
                    onPress={handleSearchFocus}
                    className="flex-1"
                    style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                  >
                    <View className="flex-row items-center justify-center py-3 pl-4">
                      {loading ? (
                        <ActivityIndicator size="small" color="rgba(30, 32, 40, 0.5)" />
                      ) : (
                        <>
                          {currentUrl.startsWith("https") && (
                            <Feather
                              name="lock"
                              size={14}
                              color="rgba(30, 32, 40, 0.4)"
                              style={{ marginRight: 6 }}
                            />
                          )}
                          <Text
                            className="font-body text-base text-ink/70"
                            numberOfLines={1}
                          >
                            {hostname || "Search"}
                          </Text>
                        </>
                      )}
                    </View>
                  </Pressable>

                  {/* Refresh/Stop button inside URL bar */}
                  <Pressable
                    onPress={() => (loading ? webRef.current?.stopLoading() : webRef.current?.reload())}
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.6 : 1,
                      paddingRight: 8,
                      paddingLeft: 4,
                    })}
                  >
                    <View className="items-center justify-center" style={{ width: 36, height: 36 }}>
                      <Feather
                        name={loading ? "x" : "rotate-cw"}
                        size={18}
                        color="rgba(30, 32, 40, 0.5)"
                      />
                    </View>
                  </Pressable>
                </View>
              </GlassView>
            </View>

            {/* Forward button - only when can go forward */}
            {canGoForward && (
              <View style={glassStyles.floatShadow}>
                <GlassView glassEffectStyle="regular" style={{ borderRadius: 26, overflow: "hidden" }}>
                  <Pressable
                    onPress={() => webRef.current?.goForward()}
                    style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                  >
                    <View className="items-center justify-center" style={{ width: 48, height: 48 }}>
                      <Feather name="chevron-right" size={24} color="#1E2028" />
                    </View>
                  </Pressable>
                </GlassView>
              </View>
            )}
          </View>
        )}
      </Animated.View>

      {/* Reader Drawer */}
      {drawerMode !== "closed" && (
        <>
          {drawerMode === "full" && (
            <Pressable className="absolute inset-0 bg-ink/30" onPress={handleToggleDrawer} />
          )}
          <View
            className="absolute left-4 right-4"
            style={[
              glassStyles.floatShadow,
              {
                bottom:
                  drawerMode === "mini"
                    ? bottomInset + toolbarHeight + 24
                    : Math.max(bottomInset, 16),
              },
            ]}
          >
            <GlassView
              glassEffectStyle="regular"
              style={drawerMode === "mini" ? glassStyles.miniDrawer : glassStyles.fullDrawer}
            >
              {drawerMode === "mini" ? (
                <View className="flex-row items-center gap-3 px-4 py-3">
                  <Pressable
                    onPress={isSpeaking ? stop : () => speak(readerText)}
                    disabled={!readerText || readerLoading}
                    style={({ pressed }) => ({
                      opacity: !readerText || readerLoading ? 0.4 : pressed ? 0.7 : 1,
                    })}
                  >
                    <View style={glassStyles.playButton}>
                      {readerLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Feather name={isSpeaking ? "pause" : "play"} size={20} color="#fff" />
                      )}
                    </View>
                  </Pressable>
                  <Pressable
                    onPress={handleToggleDrawer}
                    className="flex-1"
                    style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                  >
                    <Text className="font-body text-sm font-medium text-ink" numberOfLines={1}>
                      {readerLoading ? "Extracting..." : pageTitle || "Reader"}
                    </Text>
                    <Text className="font-body text-xs text-ink/50" numberOfLines={1}>
                      {hostname}
                      {wordCount > 0 && ` · ${Math.ceil(wordCount / 200)} min`}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleToggleDrawer}
                    style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                  >
                    <View style={glassStyles.iconButton}>
                      <Feather name="chevron-up" size={20} color="#1E2028" />
                    </View>
                  </Pressable>
                  <Pressable
                    onPress={handleCloseDrawer}
                    style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                  >
                    <View style={glassStyles.iconButton}>
                      <Feather name="x" size={18} color="#1E2028" />
                    </View>
                  </Pressable>
                </View>
              ) : (
                <View style={{ paddingBottom: Math.max(bottomInset, 16) }}>
                  <Pressable onPress={handleToggleDrawer} className="items-center py-3">
                    <View className="h-1 w-9 rounded-full bg-ink/15" />
                  </Pressable>
                  <View className="flex-row items-start justify-between px-5 pb-3">
                    <View className="flex-1 pr-4">
                      <Text
                        className="font-display text-xl text-ink"
                        style={{ letterSpacing: -0.5 }}
                        numberOfLines={2}
                      >
                        {pageTitle || "Reader"}
                      </Text>
                      <View className="mt-1 flex-row items-center gap-2">
                        <Text className="font-body text-xs text-ink/40">{hostname}</Text>
                        {wordCount > 0 && (
                          <>
                            <View className="h-1 w-1 rounded-full bg-ink/20" />
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
                    <Pressable
                      onPress={handleCloseDrawer}
                      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                    >
                      <View style={glassStyles.iconButton}>
                        <Feather name="x" size={18} color="#1E2028" />
                      </View>
                    </Pressable>
                  </View>
                  <ScrollView
                    className="px-5"
                    style={{ maxHeight: 350 }}
                    showsVerticalScrollIndicator={false}
                  >
                    {readerLoading ? (
                      <View className="items-center py-12">
                        <ActivityIndicator size="large" color="rgba(30, 32, 40, 0.4)" />
                        <Text className="mt-4 font-body text-sm text-ink/40">
                          Extracting content...
                        </Text>
                      </View>
                    ) : (
                      <Text
                        className="text-ink/85"
                        style={{
                          fontFamily: "Georgia",
                          fontSize: 17,
                          lineHeight: 28,
                          letterSpacing: 0.2,
                        }}
                      >
                        {readerText || "Tap the speaker icon to extract article content."}
                      </Text>
                    )}
                  </ScrollView>
                  <View className="mx-5 mt-4 flex-row items-center gap-3">
                    <Pressable
                      onPress={isSpeaking ? stop : () => speak(readerText)}
                      disabled={!readerText || readerLoading}
                      className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-ink py-3.5"
                      style={({ pressed }) => ({
                        opacity: !readerText || readerLoading ? 0.35 : pressed ? 0.8 : 1,
                      })}
                    >
                      <Feather name={isSpeaking ? "pause" : "play"} size={18} color="#FCF9F3" />
                      <Text className="font-body text-sm font-medium text-fog">
                        {isSpeaking ? "Pause" : "Play"}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={handleExtract}
                      disabled={readerLoading}
                      style={({ pressed }) => ({
                        opacity: readerLoading ? 0.35 : pressed ? 0.7 : 1,
                      })}
                    >
                      <View style={glassStyles.iconButton}>
                        <Feather name="refresh-cw" size={18} color="#1E2028" />
                      </View>
                    </Pressable>
                    <Pressable
                      onPress={handleToggleDrawer}
                      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                    >
                      <View style={glassStyles.iconButton}>
                        <Feather name="chevron-down" size={20} color="#1E2028" />
                      </View>
                    </Pressable>
                  </View>
                </View>
              )}
            </GlassView>
          </View>
        </>
      )}
    </View>
  );
}
