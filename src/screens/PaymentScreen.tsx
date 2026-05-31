import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  CreditCard,
  Lock,
  CheckCircle,
  Sparkles,
  Shield,
  Zap,
  Star,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

export const PLANS = [
  {
    id: "free",
    label: "Free",
    price: "Free",
    amount: 0,
    period: "",
    sub: "Basic glucose tracking · Limited history",
    features: ["Basic glucose tracking", "7-day history", "Manual entry only"],
    highlight: false,
  },
  {
    id: "premium",
    label: "Premium",
    price: "$4.99",
    amount: 4.99,
    period: "/month",
    sub: "Full AI insights · Unlimited history · Doctor sharing",
    features: ["Full AI insights", "Unlimited history", "Doctor sharing", "Smart scan"],
    highlight: true,
  },
  {
    id: "annual",
    label: "Annual Premium",
    price: "$41.99",
    amount: 41.99,
    period: "/year",
    sub: "Everything in Premium · Save 30%",
    features: ["All Premium features", "30% savings", "Priority support"],
    highlight: false,
  },
];

type CardNetwork = "visa" | "mastercard" | "amex" | "discover" | "unknown";

function detectNetwork(num: string): CardNetwork {
  const raw = num.replace(/\s/g, "");
  if (/^4/.test(raw)) return "visa";
  if (/^5[1-5]/.test(raw) || /^2[2-7]/.test(raw)) return "mastercard";
  if (/^3[47]/.test(raw)) return "amex";
  if (/^6/.test(raw)) return "discover";
  return "unknown";
}

// Subcomponent to render card network badges using simple Text styled tags.
const NetworkBadge: React.FC<{ network: CardNetwork }> = ({ network }) => {
  if (network === "visa") {
    return <Text style={styles.networkVisa}>VISA</Text>;
  }
  if (network === "mastercard") {
    return (
      <View style={styles.mastercardDots}>
        <View style={[styles.mCircle, { backgroundColor: '#EB001B' }]} />
        <View style={[styles.mCircle, { backgroundColor: '#F79E1B', marginLeft: -8 }]} />
      </View>
    );
  }
  if (network === "amex") {
    return <Text style={styles.networkAmex}>AMEX</Text>;
  }
  if (network === "discover") {
    return <Text style={styles.networkDiscover}>DISCOVER</Text>;
  }
  return <CreditCard size={20} color="rgba(255,255,255,0.5)" strokeWidth={1.5} />;
};

/* ─── Credit Card Visual Component with Native Animation ─── */
const CardVisual: React.FC<{
  number: string;
  name: string;
  expiry: string;
  cvv: string;
  flipped: boolean;
  network: CardNetwork;
}> = ({ number, name, expiry, cvv, flipped, network }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: flipped ? 180 : 0,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
  }, [flipped]);

  const frontInterpolate = animatedValue.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = animatedValue.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontOpacity = animatedValue.interpolate({
    inputRange: [89, 90],
    outputRange: [1, 0],
  });

  const backOpacity = animatedValue.interpolate({
    inputRange: [89, 90],
    outputRange: [0, 1],
  });

  const displayNumber = number.replace(/\s/g, "").padEnd(16, "·").replace(/(.{4})/g, "$1 ").trim();
  const groups = displayNumber.split(" ");

  return (
    <View style={styles.cardVisualContainer}>
      {/* Front of Card */}
      <Animated.View style={[
        styles.cardSide,
        styles.cardFront,
        {
          transform: [{ rotateY: frontInterpolate }],
          opacity: frontOpacity,
        }
      ]}>
        {/* EMV Chip */}
        <View style={styles.chipRow}>
          <View style={styles.emvChip}>
            <View style={styles.chipGrid}>
              {Array.from({ length: 9 }).map((_, i) => (
                <View key={i} style={[styles.chipLine, i === 4 && { backgroundColor: 'transparent' }]} />
              ))}
            </View>
          </View>
          <NetworkBadge network={network} />
        </View>

        {/* Card Number */}
        <View style={styles.cardNumberContainer}>
          {groups.map((g, i) => (
            <Text key={i} style={styles.cardNumberGroup}>{g}</Text>
          ))}
        </View>

        {/* Cardholder & Expiry */}
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.cardLabel}>CARD HOLDER</Text>
            <Text style={styles.cardVal}>{name.trim() || "FULL NAME"}</Text>
          </View>
          <View style={styles.alignRight}>
            <Text style={styles.cardLabel}>EXPIRES</Text>
            <Text style={styles.cardVal}>{expiry || "MM/YY"}</Text>
          </View>
        </View>
      </Animated.View>

      {/* Back of Card */}
      <Animated.View style={[
        styles.cardSide,
        styles.cardBack,
        {
          transform: [{ rotateY: backInterpolate }],
          opacity: backOpacity,
        }
      ]}>
        {/* Magnetic stripe */}
        <View style={styles.magneticStripe} />

        {/* CVV strip */}
        <View style={styles.cvvStrip}>
          <View style={styles.signatureStrip} />
          <View style={styles.cvvBox}>
            <Text style={styles.cvvLabel}>CVV</Text>
            <Text style={styles.cvvVal}>{cvv || "···"}</Text>
          </View>
        </View>

        <Text style={styles.backNote}>
          This card is the property of Gluco-Vision Financial Services. If found, please return to nearest branch.
        </Text>
      </Animated.View>
    </View>
  );
};

/* ─── Success Screen Component ─── */
const SuccessScreen: React.FC<{ plan: typeof PLANS[0]; onDone: () => void }> = ({ plan, onDone }) => {
  const { C } = useTheme();

  return (
    <View style={[styles.successContainer, { backgroundColor: C.bg }]}>
      <View style={styles.successIconWrapper}>
        <View style={[styles.successGlow, { backgroundColor: C.redBg }]}>
          <CheckCircle size={48} color={C.red} strokeWidth={2.5} />
        </View>
      </View>

      <Text style={[styles.successTitle, { color: C.text }]}>Payment Successful!</Text>
      <Text style={[styles.successSubtitle, { color: C.textMd }]}>
        Your <Text style={{ fontWeight: 'bold' }}>{plan.label}</Text> plan is now active.
      </Text>
      <Text style={[styles.successExtra, { color: C.textSm }]}>
        {plan.amount > 0 ? `${plan.price}${plan.period} billed to your Visa **** 4242` : "You're on the Free plan."}
      </Text>

      {/* Features List */}
      <View style={[styles.successCard, { backgroundColor: C.white, borderColor: C.divider }]}>
        <Text style={[styles.cardListTitle, { color: C.red }]}>PLAN INCLUDES</Text>
        {plan.features.map((f, i) => (
          <View key={i} style={styles.successFeatureRow}>
            <CheckCircle size={16} color={C.red} strokeWidth={2.5} />
            <Text style={[styles.successFeatureText, { color: C.text }]}>{f}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        onPress={onDone}
        activeOpacity={0.85}
        style={[styles.doneButton, { backgroundColor: C.red }]}
      >
        <Text style={styles.doneButtonText}>Back to Settings</Text>
      </TouchableOpacity>
    </View>
  );
};

/* ─── Main PaymentScreen Component ─── */
export interface PaymentScreenProps {
  plan: typeof PLANS[0];
  onBack: () => void;
  onSuccess?: () => void;
}

const PaymentScreen: React.FC<PaymentScreenProps> = ({ plan, onBack, onSuccess }) => {
  const { C } = useTheme();
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [saveCard, setSaveCard] = useState(true);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paid, setPaid] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const network = detectNetwork(cardNumber);
  const isFlipped = focusedField === "cvv";
  const cvvLength = network === "amex" ? 4 : 3;

  /* Form formatters */
  const handleCardNumber = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 16);
    const formatted = digits.replace(/(.{4})/g, "$1 ").trim();
    setCardNumber(formatted);
    if (errors.cardNumber) setErrors((e) => ({ ...e, cardNumber: "" }));
  };

  const handleExpiry = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    let formatted = digits;
    if (digits.length >= 3) {
      formatted = digits.slice(0, 2) + "/" + digits.slice(2);
    } else if (digits.length === 2 && expiry.length === 1) {
      formatted = digits + "/";
    }
    setExpiry(formatted);
    if (errors.expiry) setErrors((e) => ({ ...e, expiry: "" }));
  };

  const handleCvv = (v: string) => {
    setCvv(v.replace(/\D/g, "").slice(0, cvvLength));
    if (errors.cvv) setErrors((e) => ({ ...e, cvv: "" }));
  };

  const handleName = (v: string) => {
    setCardName(v.toUpperCase());
    if (errors.cardName) setErrors((e) => ({ ...e, cardName: "" }));
  };

  /* Validation */
  const validate = () => {
    const errs: Record<string, string> = {};
    const rawNum = cardNumber.replace(/\s/g, "");
    if (rawNum.length < 16) errs.cardNumber = "Enter a valid 16-digit card number";
    if (!cardName.trim()) errs.cardName = "Enter the cardholder name";
    
    const [mm, yy] = expiry.split("/");
    const nowYear = 26;
    const nowMonth = 4;
    if (!mm || !yy || parseInt(mm) < 1 || parseInt(mm) > 12 || parseInt(yy) < nowYear || (parseInt(yy) === nowYear && parseInt(mm) < nowMonth)) {
      errs.expiry = "Enter a valid expiry date";
    }
    if (cvv.length < cvvLength) errs.cvv = `Enter ${cvvLength}-digit CVV`;
    return errs;
  };

  const handlePay = () => {
    if (plan.amount === 0) {
      setIsProcessing(true);
      setTimeout(() => { setIsProcessing(false); setPaid(true); }, 900);
      return;
    }
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setIsProcessing(true);
    setTimeout(() => { setIsProcessing(false); setPaid(true); }, 2200);
  };

  const handleDone = () => {
    onSuccess?.();
    onBack();
  };

  if (paid) {
    return <SuccessScreen plan={plan} onDone={handleDone} />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: C.white, borderBottomColor: C.redBorder }]}>
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.8}
          style={[styles.backBtn, { backgroundColor: C.redBg, borderColor: C.redBorder }]}
        >
          <ChevronLeft size={20} color={C.red} strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: C.text }]}>Checkout</Text>
          <Text style={[styles.headerSubtitle, { color: C.textSm }]}>Secure payment</Text>
        </View>
        <View style={styles.sslBadge}>
          <Lock size={12} color="#16A34A" strokeWidth={2.5} />
          <Text style={styles.sslText}>SSL</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Plan Summary Banner */}
        <View style={[styles.planBanner, { backgroundColor: C.red }]}>
          <View style={styles.planBannerLeft}>
            <View style={styles.planIconWrapper}>
              {plan.id === "premium" ? (
                <Sparkles size={18} color="white" />
              ) : plan.id === "annual" ? (
                <Zap size={18} color="white" />
              ) : (
                <Shield size={18} color="white" />
              )}
            </View>
            <View>
              <Text style={styles.planBannerTitle}>{plan.label} Plan</Text>
              <Text style={styles.planBannerSubtitle}>{plan.sub.split("·")[0].trim()}</Text>
            </View>
          </View>
          <View style={styles.planBannerRight}>
            <Text style={styles.planBannerPrice}>{plan.price}</Text>
            {plan.period !== "" && <Text style={styles.planBannerPeriod}>{plan.period}</Text>}
          </View>
        </View>

        {plan.amount > 0 ? (
          <View style={styles.billingSection}>
            {/* Visual Credit Card */}
            <CardVisual
              number={cardNumber}
              name={cardName}
              expiry={expiry}
              cvv={cvv}
              flipped={isFlipped}
              network={network}
            />

            {/* Inputs Form */}
            <View style={styles.formContainer}>
              {/* Card Number */}
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: C.text }]}>Card Number</Text>
                <TextInput
                  style={[
                    styles.inputField,
                    { 
                      borderColor: focusedField === 'number' ? C.red : (C.redBorder || '#F2D0D0'),
                      backgroundColor: focusedField === 'number' ? '#FFFAFA' : '#FDF9F9'
                    }
                  ]}
                  value={cardNumber}
                  onChangeText={handleCardNumber}
                  placeholder="1234 5678 9012 3456"
                  placeholderTextColor="#C88686"
                  keyboardType="numeric"
                  maxLength={19}
                  onFocus={() => setFocusedField("number")}
                  onBlur={() => setFocusedField(null)}
                />
                {errors.cardNumber && <Text style={styles.errorText}>{errors.cardNumber}</Text>}
              </View>

              {/* Cardholder Name */}
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: C.text }]}>Cardholder Name</Text>
                <TextInput
                  style={[
                    styles.inputField,
                    { 
                      borderColor: focusedField === 'name' ? C.red : (C.redBorder || '#F2D0D0'),
                      backgroundColor: focusedField === 'name' ? '#FFFAFA' : '#FDF9F9'
                    }
                  ]}
                  value={cardName}
                  onChangeText={handleName}
                  placeholder="SARAH JOHNSON"
                  placeholderTextColor="#C88686"
                  autoCapitalize="characters"
                  maxLength={26}
                  onFocus={() => setFocusedField("name")}
                  onBlur={() => setFocusedField(null)}
                />
                {errors.cardName && <Text style={styles.errorText}>{errors.cardName}</Text>}
              </View>

              {/* Expiry / CVV Row */}
              <View style={styles.rowInputs}>
                <View style={[styles.inputContainer, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, { color: C.text }]}>Expiry Date</Text>
                  <TextInput
                    style={[
                      styles.inputField,
                      { 
                        borderColor: focusedField === 'expiry' ? C.red : (C.redBorder || '#F2D0D0'),
                        backgroundColor: focusedField === 'expiry' ? '#FFFAFA' : '#FDF9F9'
                      }
                    ]}
                    value={expiry}
                    onChangeText={handleExpiry}
                    placeholder="MM/YY"
                    placeholderTextColor="#C88686"
                    keyboardType="numeric"
                    maxLength={5}
                    onFocus={() => setFocusedField("expiry")}
                    onBlur={() => setFocusedField(null)}
                  />
                  {errors.expiry && <Text style={styles.errorText}>{errors.expiry}</Text>}
                </View>

                <View style={[styles.inputContainer, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, { color: C.text }]}>CVV</Text>
                  <TextInput
                    style={[
                      styles.inputField,
                      { 
                        borderColor: focusedField === 'cvv' ? C.red : (C.redBorder || '#F2D0D0'),
                        backgroundColor: focusedField === 'cvv' ? '#FFFAFA' : '#FDF9F9'
                      }
                    ]}
                    value={cvv}
                    onChangeText={handleCvv}
                    placeholder={network === "amex" ? "····" : "···"}
                    placeholderTextColor="#C88686"
                    keyboardType="numeric"
                    maxLength={cvvLength}
                    onFocus={() => setFocusedField("cvv")}
                    onBlur={() => setFocusedField(null)}
                  />
                  {errors.cvv && <Text style={styles.errorText}>{errors.cvv}</Text>}
                </View>
              </View>

              {/* Save Card Toggle */}
              <TouchableOpacity
                style={[styles.toggleContainer, { borderColor: C.redBorder }]}
                activeOpacity={0.9}
                onPress={() => setSaveCard(!saveCard)}
              >
                <View>
                  <Text style={[styles.toggleTitle, { color: C.text }]}>Save this card</Text>
                  <Text style={[styles.toggleSub, { color: C.textSm }]}>For faster future payments</Text>
                </View>
                <Switch
                  value={saveCard}
                  onValueChange={setSaveCard}
                  trackColor={{ false: '#D1D5DB', true: C.red }}
                  thumbColor="#FFF"
                />
              </TouchableOpacity>

              {/* SSL Note */}
              <View style={styles.sslBanner}>
                <Lock size={14} color="#16A34A" />
                <Text style={styles.sslBannerText}>
                  Your payment info is encrypted with 256-bit SSL. We never store your full card details.
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={[styles.freeSection, { backgroundColor: '#FFF', borderColor: C.redBorder }]}>
            <Text style={[styles.freeTitle, { color: C.text }]}>What's included in Free Plan:</Text>
            {plan.features.map((f, i) => (
              <View key={i} style={styles.freeFeatureRow}>
                <CheckCircle size={16} color={C.red} strokeWidth={2.5} />
                <Text style={[styles.freeFeatureText, { color: C.text }]}>{f}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Pay CTA Button */}
      <View style={[styles.footer, { backgroundColor: C.white, borderTopColor: C.redBorder }]}>
        <TouchableOpacity
          onPress={handlePay}
          disabled={isProcessing}
          activeOpacity={0.85}
          style={[
            styles.payBtn,
            { backgroundColor: isProcessing ? '#A05050' : C.red }
          ]}
        >
          {isProcessing ? (
            <View style={styles.processingRow}>
              <ActivityIndicator size="small" color="#FFF" />
              <Text style={styles.payBtnText}>Processing…</Text>
            </View>
          ) : (
            <View style={styles.processingRow}>
              <Lock size={16} color="white" strokeWidth={2.5} />
              <Text style={styles.payBtnText}>
                {plan.amount === 0 ? "Activate Free Plan" : `Pay ${plan.price}${plan.period}`}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={[styles.footerNote, { color: C.textSm }]}>
          {plan.amount > 0
            ? `You will be charged ${plan.price}${plan.period}. Cancel anytime.`
            : "No credit card required for the Free plan."}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  sslBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sslText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16A34A',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  planBanner: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    shadowColor: '#C41E26',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  planBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  planIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planBannerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  planBannerSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 1,
  },
  planBannerRight: {
    alignItems: 'flex-end',
  },
  planBannerPrice: {
    fontSize: 20,
    fontWeight: '900',
    color: 'white',
  },
  planBannerPeriod: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  billingSection: {
    width: '100%',
  },
  cardVisualContainer: {
    width: '100%',
    height: 190,
    marginBottom: 20,
    position: 'relative',
  },
  cardSide: {
    position: 'absolute',
    inset: 0,
    borderRadius: 20,
    padding: 20,
    justifyContent: 'space-between',
    backfaceVisibility: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 4,
  },
  cardFront: {
    backgroundColor: '#8B1A1A',
  },
  cardBack: {
    backgroundColor: '#5C0E0E',
  },
  chipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  emvChip: {
    width: 42,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#E8C97D',
    padding: 4,
  },
  chipGrid: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.15)',
    borderRadius: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 1.5,
  },
  chipLine: {
    width: '28%',
    height: '28%',
    backgroundColor: 'rgba(0,0,0,0.12)',
    borderRadius: 1,
  },
  cardNumberContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginVertical: 10,
  },
  cardNumberGroup: {
    fontFamily: 'monospace',
    fontSize: 18,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.95)',
    letterSpacing: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardLabel: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 2,
  },
  cardVal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.92)',
  },
  alignRight: {
    alignItems: 'flex-end',
  },
  magneticStripe: {
    height: 40,
    backgroundColor: '#111',
    width: '120%',
    marginLeft: -20,
    marginTop: 10,
  },
  cvvStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 10,
  },
  signatureStrip: {
    flex: 1,
    height: 32,
    backgroundColor: '#f0e8e8',
    borderRadius: 4,
  },
  cvvBox: {
    width: 50,
    height: 32,
    borderRadius: 4,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cvvLabel: {
    fontSize: 7,
    color: '#9CA3AF',
  },
  cvvVal: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  backNote: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    lineHeight: 12,
  },
  networkVisa: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'sans-serif-condensed',
  },
  mastercardDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    opacity: 0.9,
  },
  networkAmex: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  networkDiscover: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  formContainer: {
    gap: 16,
  },
  inputContainer: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  inputField: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#111827',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  errorText: {
    fontSize: 11,
    color: '#D7181D',
    marginTop: 4,
    paddingLeft: 4,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'white',
    borderWidth: 1,
    marginTop: 8,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  toggleSub: {
    fontSize: 11,
    marginTop: 2,
  },
  sslBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginTop: 8,
  },
  sslBannerText: {
    flex: 1,
    fontSize: 11,
    color: '#166534',
    lineHeight: 14,
  },
  freeSection: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  freeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  freeFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  freeFeatureText: {
    fontSize: 13,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
  },
  payBtn: {
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C41E26',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 3,
  },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  payBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerNote: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 10,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  successIconWrapper: {
    marginBottom: 28,
  },
  successGlow: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 14,
    marginBottom: 4,
    textAlign: 'center',
  },
  successExtra: {
    fontSize: 13,
    marginBottom: 32,
    textAlign: 'center',
  },
  successCard: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    marginBottom: 28,
  },
  cardListTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
  },
  successFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  successFeatureText: {
    fontSize: 13,
  },
  doneButton: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  doneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PaymentScreen;
