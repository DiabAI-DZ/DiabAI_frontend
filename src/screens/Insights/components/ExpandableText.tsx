import React, { useState } from 'react';
import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';

interface ExpandableTextProps {
  text: string;
  /** Lines shown while collapsed. */
  collapsedLines: number;
  textStyle?: StyleProp<TextStyle>;
  /** Color for the "Show more / Show less" link. */
  linkColor: string;
}

/**
 * Tappable description that expands to its full text. A "Show more / Show less" link is shown
 * only when the text is actually longer than `collapsedLines` (measured on first layout).
 */
const ExpandableText: React.FC<ExpandableTextProps> = ({ text, collapsedLines, textStyle, linkColor }) => {
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const [measured, setMeasured] = useState(false);

  const toggle = () => setExpanded((v) => !v);

  return (
    <>
      <Text
        style={textStyle}
        // First pass renders unclamped so we can measure the true line count, then clamps.
        numberOfLines={measured && !expanded ? collapsedLines : undefined}
        onTextLayout={(e) => {
          if (!measured) {
            setCanExpand(e.nativeEvent.lines.length > collapsedLines);
            setMeasured(true);
          }
        }}
        onPress={canExpand ? toggle : undefined}
      >
        {text}
      </Text>
      {canExpand && (
        <Text onPress={toggle} style={[styles.link, { color: linkColor }]} suppressHighlighting>
          {expanded ? 'Show less' : 'Show more'}
        </Text>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  link: { fontSize: 12, fontWeight: '700', marginTop: 3 },
});

export default ExpandableText;
