import { Feather } from "@expo/vector-icons";
import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import * as Speech from "expo-speech";
import WebView from "react-native-webview";

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

export default function Index() {
  const webRef = useRef<WebView>(null);
  const [inputValue, setInputValue] = useState(HOME_URL);
  const [currentUrl, setCurrentUrl] = useState(HOME_URL);
  const [pageTitle, setPageTitle] = useState("New tab");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [readerOpen, setReaderOpen] = useState(false);
  const [readerText, setReaderText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const insets = useSafeAreaInsets();

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

  const handleGo = () => {
    const nextUrl = normalizeInput(inputValue);
    setCurrentUrl(nextUrl);
    setInputValue(nextUrl);
  };

  const handleExtract = () => {
    webRef.current?.injectJavaScript(extractionScript);
  };

  const handleSpeak = () => {
    if (!readerText.trim()) return;
    setIsSpeaking(true);
    Speech.stop();
    Speech.speak(readerText, {
      language: "en-US",
      rate: 0.95,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const handleStop = () => {
    Speech.stop();
    setIsSpeaking(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-sand">
      <View className="absolute -top-24 left-6 h-48 w-48 rounded-full bg-sea/10" />
      <View className="absolute top-40 -right-24 h-56 w-56 rounded-full bg-copper/15" />
      <View className="absolute bottom-24 left-10 h-36 w-36 rounded-full bg-ink/5" />

      <View className="px-5 pt-2" style={{ paddingTop: Math.max(insets.top, 8) }}>
        <View className="flex-row items-end justify-between">
          <View>
            <Text className="font-display text-3xl text-ink">Spoken</Text>
            <Text className="mt-1 font-body text-sm text-ink/70">
              Pull clean text from any page.
            </Text>
          </View>
          <View className="rounded-full border border-sea/30 bg-sea/10 px-3 py-1">
            <Text className="font-body text-xs text-sea">Reader mode</Text>
          </View>
        </View>
      </View>

      <View className="mt-4 px-5">
        <View className="rounded-3xl border border-clay bg-fog/95 p-4">
          <Text className="font-body text-xs uppercase tracking-[2px] text-ink/50">
            Address or search
          </Text>
          <TextInput
            value={inputValue}
            onChangeText={setInputValue}
            onSubmitEditing={handleGo}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="go"
            placeholder="Type a URL or search"
            placeholderTextColor="rgba(30, 32, 40, 0.4)"
            className="mt-3 rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 font-body text-sm text-ink"
          />
          <View className="mt-3 flex-row gap-2">
            <Pressable
              onPress={handleGo}
              className="flex-1 rounded-2xl bg-ink py-3"
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
            >
              <Text className="text-center font-body text-sm text-fog">Open</Text>
            </Pressable>
            <Pressable
              onPress={handleExtract}
              className="flex-1 rounded-2xl bg-copper py-3"
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
            >
              <Text className="text-center font-body text-sm text-white">
                Pull text
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View
        className="flex-1 px-5 pb-3 pt-4"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      >
        <View className="flex-1 overflow-hidden rounded-3xl border border-ink/10 bg-white/80">
          <View className="h-1 w-full bg-ink/5">
            <View
              className="h-1 bg-copper"
              style={{ width: `${Math.max(progress * 100, 5)}%` }}
            />
          </View>
          <WebView
            ref={webRef}
            source={{ uri: currentUrl }}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
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
                  setReaderText(payload.text || "");
                  setPageTitle(payload.title || pageTitle);
                  setReaderOpen(true);
                  return;
                }
              } catch {
                setReaderText(event.nativeEvent.data);
                setReaderOpen(true);
              }
            }}
            setSupportMultipleWindows={false}
            originWhitelist={["*"]}
          />
          {loading ? (
            <View className="absolute inset-0 items-center justify-center bg-white/60">
              <ActivityIndicator size="large" color="#1E2028" />
              <Text className="mt-3 font-body text-xs text-ink/70">
                Loading {hostname || "page"}…
              </Text>
            </View>
          ) : null}
        </View>

        <View className="mt-3 flex-row items-center justify-between">
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => webRef.current?.goBack()}
              disabled={!canGoBack}
              className={`h-11 w-11 items-center justify-center rounded-2xl border border-ink/10 bg-fog ${
                canGoBack ? "opacity-100" : "opacity-40"
              }`}
            >
              <Feather name="arrow-left" size={18} color="#1E2028" />
            </Pressable>
            <Pressable
              onPress={() => webRef.current?.goForward()}
              disabled={!canGoForward}
              className={`h-11 w-11 items-center justify-center rounded-2xl border border-ink/10 bg-fog ${
                canGoForward ? "opacity-100" : "opacity-40"
              }`}
            >
              <Feather name="arrow-right" size={18} color="#1E2028" />
            </Pressable>
            <Pressable
              onPress={() => webRef.current?.reload()}
              className="h-11 w-11 items-center justify-center rounded-2xl border border-ink/10 bg-fog"
            >
              <Feather name="rotate-cw" size={18} color="#1E2028" />
            </Pressable>
          </View>

          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setReaderOpen(true)}
              className="flex-row items-center gap-2 rounded-2xl bg-ink px-4 py-2"
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
            >
              <Feather name="file-text" size={16} color="#FCF9F3" />
              <Text className="font-body text-xs text-fog">
                {wordCount ? `${wordCount} words` : "Reader"}
              </Text>
            </Pressable>
            <Pressable
              onPress={isSpeaking ? handleStop : handleSpeak}
              className="flex-row items-center gap-2 rounded-2xl bg-copper px-4 py-2"
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
            >
              <Feather
                name={isSpeaking ? "square" : "volume-2"}
                size={16}
                color="#FFFFFF"
              />
              <Text className="font-body text-xs text-white">
                {isSpeaking ? "Stop" : "Listen"}
              </Text>
            </Pressable>
          </View>
        </View>

        <Text className="mt-2 font-body text-xs text-ink/60">
          Now viewing: {hostname || "new tab"} · {pageTitle || "Untitled"}
        </Text>
      </View>

      <Modal
        visible={readerOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setReaderOpen(false)}
      >
        <View className="flex-1 bg-ink/40">
          <View
            className="mt-auto max-h-[78%] rounded-t-3xl bg-fog px-5 pb-6 pt-5"
            style={{ paddingBottom: Math.max(insets.bottom, 24) }}
          >
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="font-display text-2xl text-ink">Reader</Text>
                <Text className="mt-1 font-body text-xs text-ink/60">
                  {pageTitle} {hostname ? `· ${hostname}` : ""}
                </Text>
              </View>
              <Pressable
                onPress={() => setReaderOpen(false)}
                className="h-10 w-10 items-center justify-center rounded-full bg-ink/10"
              >
                <Feather name="x" size={18} color="#1E2028" />
              </Pressable>
            </View>

            <ScrollView className="mt-4" contentContainerClassName="pb-6">
              <Text className="font-body text-sm leading-6 text-ink">
                {readerText
                  ? readerText
                  : "Pull text from the page to see a clean reading view here."}
              </Text>
            </ScrollView>
            <View className="mt-2 flex-row gap-3">
              <Pressable
                onPress={isSpeaking ? handleStop : handleSpeak}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-ink py-3"
                style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
              >
                <Feather
                  name={isSpeaking ? "square" : "volume-2"}
                  size={16}
                  color="#FCF9F3"
                />
                <Text className="font-body text-sm text-fog">
                  {isSpeaking ? "Stop" : "Read aloud"}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  handleExtract();
                  setReaderOpen(true);
                }}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-copper py-3"
                style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
              >
                <Feather name="refresh-ccw" size={16} color="#FFFFFF" />
                <Text className="font-body text-sm text-white">Refresh text</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
