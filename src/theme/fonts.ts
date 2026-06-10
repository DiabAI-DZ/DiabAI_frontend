// Satoshi font wiring. The whole UI is written with `fontWeight` (400/600/700…) and no
// `fontFamily`, so we (1) load the Satoshi static weights as named families and (2) patch
// <Text>/<TextInput> so every text node picks the Satoshi file that matches its weight.
//
// Why patch render instead of Text.defaultProps: defaultProps.style is ignored whenever a
// component passes its own `style` prop (almost every screen does), so it can't set a global
// font. Patching render injects the family AFTER the component's own style, so it applies
// everywhere while still respecting any explicit `fontFamily` a caller sets.
import React from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';

// Family name → bundled .ttf. Italics/variable files exist in assets too but the app never
// sets fontStyle:'italic', so the upright static weights are all we load.
export const satoshiFonts = {
  'Satoshi-Light': require('../../assets/Satoshi_font/fonts/Satoshi-Light.ttf'),
  'Satoshi-Regular': require('../../assets/Satoshi_font/fonts/Satoshi-Regular.ttf'),
  'Satoshi-Medium': require('../../assets/Satoshi_font/fonts/Satoshi-Medium.ttf'),
  'Satoshi-Bold': require('../../assets/Satoshi_font/fonts/Satoshi-Bold.ttf'),
  'Satoshi-Black': require('../../assets/Satoshi_font/fonts/Satoshi-Black.ttf'),
};

// Map a React Native fontWeight to the closest Satoshi file. Satoshi ships no SemiBold, so
// 600 (used for buttons/labels/section titles) maps to Medium to avoid over-bolding.
function familyForWeight(weight?: string | number): string {
  switch (String(weight ?? '400')) {
    case '100':
    case '200':
    case '300':
      return 'Satoshi-Light';
    case '500':
    case '600':
      return 'Satoshi-Medium';
    case '700':
    case '800':
    case 'bold':
      return 'Satoshi-Bold';
    case '900':
      return 'Satoshi-Black';
    default: // '400' | 'normal' | undefined
      return 'Satoshi-Regular';
  }
}

let patched = false;

/** Patch Text/TextInput once so every text node renders in the matching Satoshi weight. */
export function enableSatoshi(): void {
  if (patched) return;
  patched = true;

  for (const Comp of [Text, TextInput] as any[]) {
    const baseRender = Comp.render;
    if (typeof baseRender !== 'function') continue;

    Comp.render = function patchedRender(...args: any[]) {
      const element = baseRender.apply(this, args);
      const flat = StyleSheet.flatten(element.props.style) || {};
      // Respect any explicit family a caller chose (e.g. an icon font).
      if (flat.fontFamily) return element;
      const fontFamily = familyForWeight(flat.fontWeight);
      return React.cloneElement(element, {
        // Appended so it wins over the component's own style. fontWeight is reset to
        // 'normal' because the chosen file already encodes the weight — leaving the
        // numeric weight on would trigger faux-bold on top of a real bold face.
        style: [element.props.style, { fontFamily, fontWeight: 'normal' }],
      });
    };
  }
}
