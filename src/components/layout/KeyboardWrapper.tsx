import React from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  ViewStyle,
} from 'react-native';

interface KeyboardWrapperProps {
  children: React.ReactNode;
  /** Tap outside an input to dismiss the keyboard. Defaults to true. */
  dismissOnTap?: boolean;
  style?: ViewStyle;
}

/** Wraps form content so the keyboard pushes it up instead of covering inputs. */
export const KeyboardWrapper: React.FC<KeyboardWrapperProps> = ({
  children,
  dismissOnTap = true,
  style,
}) => {
  const content = (
    <KeyboardAvoidingView
      style={[styles.flex, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {children}
    </KeyboardAvoidingView>
  );

  if (!dismissOnTap) return content;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      {content}
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
