import SvgIcons from "@/constants/SvgIcons";
import { COLORS } from "@/constants/theme";
import React, { useEffect } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

export default function TabBarButton({
  onPress,
  onLongPress,
  isFocused,
  label,
  routeName,
}) {
  const icon = {
    index: (props) => (
      <SvgIcons name="home" size={24} stroke={1.5} {...props} />
    ),
    transactions: (props) => (
      <SvgIcons name="exchange" stroke={1.5} size={24} {...props} />
    ),
    categories: (props) => (
      <SvgIcons name="squares" stroke={1.5} size={24} {...props} />
    ),
    statics: (props) => (
      <SvgIcons name="pie-chart" stroke={1.5} size={24} {...props} />
    ),
    settings: (props) => (
      <SvgIcons name="settings" stroke={1.5} size={24} {...props} />
    ),
  };

  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(
      typeof isFocused === "boolean" ? (isFocused ? 1 : 0) : isFocused,
      { duration: 350 }
    );
  }, [scale, isFocused]);

  const animationTextStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scale.value, [0, 1], [1, 0]);
    return { opacity };
  });

  const animatedIconStyle = useAnimatedStyle(() => {
    const scaleValue = interpolate(scale.value, [0, 1], [1, 1.2]);

    const top = interpolate(scale.value, [0, 1], [0, 9]);

    return {
      transform: [
        {
          scale: scaleValue,
        },
      ],
      top,
    };
  });

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabbarItem}
    >
      <Animated.View style={animatedIconStyle}>
        {icon[routeName]({
          color: isFocused ? COLORS.white : "#969696",
        })}
      </Animated.View>
      <Animated.Text
        style={[
          styles.tabbarLabel,
          animationTextStyle,
          { color: isFocused ? COLORS.primary : "#969696" },
        ]}
      >
        {label}
      </Animated.Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabbarItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },
  tabbarLabel: {
    fontFamily: "poppins-medium",
    fontSize: 10,
  },
});
