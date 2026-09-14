import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Image as RNImage,
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { theme } from "../theme";
import { strings } from "../i18n";
import { Bob } from "../components/Animations";
import type { Screen } from "../../App";

type Props = {
  navigate: (s: Screen) => void;
  consistency: number;
  recordId?: string;
};

const POO_SHAPE_ASSETS: Record<number, number> = {
  1: require("../../../api/src/assets/log_form/poo_shape_1.png"),
  2: require("../../../api/src/assets/log_form/poo_shape_2.png"),
  3: require("../../../api/src/assets/log_form/poo_shape_3.png"),
  4: require("../../../api/src/assets/log_form/poo_shape_4.png"),
  5: require("../../../api/src/assets/log_form/poo_shape_5.png"),
  6: require("../../../api/src/assets/log_form/poo_shape_6.png"),
  7: require("../../../api/src/assets/log_form/poo_shape_7.png"),
};

const POO_COMPLETION_MESSAGES: Record<number, string[]> = {
  1: [
    "硬到可以當彈珠玩 💎",
    "好似發射導彈咁有力 🚀",
    "腸仔話：做得好，下次再嚟！",
    "便秘界嘅冠軍 🏆",
  ],
  2: [
    "形狀標準，腸仔滿意度 90% 📏",
    "像香腸咁完美，差啲想煮嚟食 🌭",
    "屙完覺得輕身咗好多 ✨",
    "腸道健康嘅好榜樣 👍",
  ],
  3: [
    "有裂紋都係帥氣嘅裂紋 ⚡",
    "像巧克力卷咁誘人 🍫",
    "屙完陣陣舒暢感 😌",
    "腸仔話：再接再厲！",
  ],
  4: [
    "滑捋捋，屙完好舒服 🌊",
    "教科書級別嘅完美形狀 📚",
    "黃金屎皇，恭喜恭喜 🥇",
    "腸道嘅傑作，值得分享！✨",
  ],
  5: [
    "軟熟適中，像冰淇淋咁順滑 🍦",
    "屙完覺得世界都美好咗 🌈",
    "腸仔給你個大大嘅讚 👍",
    "舒服到想拍大腳 📸",
  ],
  6: [
    "糊狀雖然亂咗啲，但係屙完好輕鬆 ☁️",
    "好似溶咗嘅朱古力醬 🍫",
    "腸仔話：下次多飲啲水啦 💧",
    "雖然形狀唔完美，但係好舒服 😌",
  ],
  7: [
    "水狀爆發，像消防喉咁激 💦",
    "腸仔話：我淨咗！清潔完成 ✨",
    "屙完覺得空蕩蕩，好輕盈 🎈",
    "記住要補充電解質吖 💧",
  ],
};

const POO_COMPLETION_TITLES: Record<number, string> = {
  1: "硬粒王者 💎",
  2: "腸狀達人 🌭",
  3: "裂紋帥哥 ⚡",
  4: "滑捋捋冠軍 🏆",
  5: "軟熟貴族 🍦",
  6: "糊狀藝術家 🎨",
  7: "水狀風暴 🌊",
};

const POO_CONSISTENCY_SHORT_LABELS: Record<number, string> = {
  1: "硬粒",
  2: "腸狀硬",
  3: "裂紋",
  4: "滑捋捋",
  5: "軟熟",
  6: "糊狀",
  7: "水狀",
};

export default function PooCompletionScreen({ navigate, consistency, recordId }: Props) {
  const [message, setMessage] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    const messages = POO_COMPLETION_MESSAGES[consistency] || POO_COMPLETION_MESSAGES[4];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    setMessage(randomMessage);
    setShowConfetti(true);
    setTimeout(() => {
      if (mountedRef.current) setShowConfetti(false);
    }, 3000);
  }, [consistency]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleShare = (platform: "threads" | "instagram" | "facebook") => {
    const title = POO_COMPLETION_TITLES[consistency];
    const label = POO_CONSISTENCY_SHORT_LABELS[consistency];
    const shareText = `${title}\n${message}\n\n#屙thebest #屙屎日記 #Bristol${consistency} #腸道健康`;

    try {
      if (platform === "threads") {
        const url = `https://www.threads.net/intent/post?text=${encodeURIComponent(shareText)}`;
        Linking.openURL(url).catch(() => {
          Alert.alert(strings.error, "無法打開 Threads，請確認已安裝應用");
        });
      } else if (platform === "instagram") {
        Share.share({
          message: shareText,
          title: "分享到 Instagram",
        }).catch(() => {
          Alert.alert(strings.error, "分享失敗，請再試一次");
        });
      } else if (platform === "facebook") {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent("https://pee-poo-tracker.app")}&quote=${encodeURIComponent(shareText)}`;
        Linking.openURL(url).catch(() => {
          Alert.alert(strings.error, "無法打開 Facebook，請確認已安裝應用");
        });
      }
    } catch (err) {
      Alert.alert(strings.error, "分享失敗，請再試一次");
    }
  };

  const handleDone = () => {
    navigate({ name: "home" });
  };

  const shapeAsset = POO_SHAPE_ASSETS[consistency] || POO_SHAPE_ASSETS[4];
  const title = POO_COMPLETION_TITLES[consistency];
  const label = POO_CONSISTENCY_SHORT_LABELS[consistency];

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleDone}>
          <Ionicons name="arrow-undo" size={30} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <View style={styles.card}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{title}</Text>
            </View>

            <Bob dist={8} duration={1000} delay={200}>
              <View style={styles.poopWrapper}>
                <RNImage source={shapeAsset} resizeMode="contain" style={styles.poopImage} />
                {showConfetti && (
                  <View style={styles.confetti}>
                    <Text style={styles.confettiEmoji}>✨</Text>
                    <Text style={styles.confettiEmoji}>🎉</Text>
                    <Text style={styles.confettiEmoji}>✨</Text>
                  </View>
                )}
              </View>
            </Bob>

            <Text style={styles.typeLabel}>布列斯登 {consistency} · {label}</Text>

            <View style={styles.messageBox}>
              <Text style={styles.messageText}>{message}</Text>
            </View>

            <Text style={styles.footerText}>屙完覺得輕盈盈，心情都好過咗 😌</Text>
          </View>

          <View style={styles.shareSection}>
            <Text style={styles.shareTitle}>分享你嘅勝利 📣</Text>
            <View style={styles.shareButtons}>
              <TouchableOpacity
                style={styles.shareButton}
                onPress={() => handleShare("threads")}
                activeOpacity={0.8}>
                <FontAwesome5 name="comment-dots" size={22} color={theme.colors.primary} style={styles.shareButtonIcon} />
                <Text style={styles.shareButtonText}>Threads</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareButton}
                onPress={() => handleShare("instagram")}
                activeOpacity={0.8}>
                <Ionicons name="logo-instagram" size={24} color={theme.colors.primary} style={styles.shareButtonIcon} />
                <Text style={styles.shareButtonText}>Instagram</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareButton}
                onPress={() => handleShare("facebook")}
                activeOpacity={0.8}>
                <FontAwesome5 name="facebook-f" size={22} color={theme.colors.primary} style={styles.shareButtonIcon} />
                <Text style={styles.shareButtonText}>Facebook</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.doneButton} onPress={handleDone} activeOpacity={0.82}>
            <Text style={styles.doneButtonText}>{strings.confirm}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    width: "100%",
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
    alignItems: "center",
  },
  container: {
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    gap: theme.spacing.xl,
  },
  card: {
    width: "100%",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    alignItems: "center",
    borderWidth: 2,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  badge: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginBottom: theme.spacing.md,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
  },
  poopWrapper: {
    position: "relative",
    width: 180,
    height: 180,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: theme.spacing.md,
  },
  poopImage: {
    width: 140,
    height: 140,
  },
  confetti: {
    position: "absolute",
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-start",
    paddingTop: 20,
    pointerEvents: "none",
  },
  confettiEmoji: {
    fontSize: 28,
  },
  typeLabel: {
    marginTop: theme.spacing.sm,
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.muted,
  },
  messageBox: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.lg,
    backgroundColor: "#FFF8F2",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: "#F0E3D8",
    width: "100%",
  },
  messageText: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text,
    textAlign: "center",
    lineHeight: 28,
  },
  footerText: {
    marginTop: theme.spacing.md,
    fontSize: 14,
    color: theme.colors.muted,
    textAlign: "center",
  },
  shareSection: {
    width: "100%",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  shareTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.text,
  },
  shareButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: theme.spacing.md,
    flexWrap: "wrap",
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.pill,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minWidth: 100,
  },
  shareButtonIcon: {
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.text,
  },
  doneButton: {
    marginTop: theme.spacing.lg,
    width: "100%",
    backgroundColor: theme.colors.primary,
    borderBottomColor: "#C85A27",
    borderBottomWidth: 6,
    borderRadius: theme.radius.pill,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  doneButtonText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
  },
});