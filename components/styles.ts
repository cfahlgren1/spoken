import { StyleSheet } from "react-native";

// Liquid Glass Design System - iOS Safari inspired
export const glassStyles = StyleSheet.create({
  // Bottom toolbar glass - capsule shape
  toolbarGlass: {
    borderRadius: 22,
    overflow: "hidden",
  },
  // URL pill in collapsed state - nested concentric shape
  urlPill: {
    borderRadius: 14,
    overflow: "hidden",
  },
  // Speaker button - larger circular glass button
  speakerButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.7)",
  },
  // Cancel X button - small circular glass
  cancelButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
  // Navigation buttons - floating circles
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  // Navigation pill - capsule containing back/forward
  navPill: {
    borderRadius: 24,
    overflow: "hidden",
  },
  // Refresh pill - circular
  refreshPill: {
    borderRadius: 24,
    overflow: "hidden",
  },
  // URL pill - flex to fill space
  urlPillWrapper: {
    flex: 1,
    borderRadius: 22,
    overflow: "hidden",
  },
  // Mini drawer - compact player bar
  miniDrawer: {
    borderRadius: 20,
    overflow: "hidden",
  },
  // Full drawer - expanded reader
  fullDrawer: {
    borderRadius: 24,
    overflow: "hidden",
  },
  // Play button - circular dark
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1E2028",
  },
  // Icon button - small circular
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
  },
  // Float shadow for glass elements
  floatShadow: {
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
});
