import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ONBOARDING_DATA } from "../constants/onboarding-data";
import { COLORS } from "../constants/theme";

const { width: screenWidth } = Dimensions.get("window");

export default function Onboarding() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderSlide = ({ item }) => (
    <View style={styles.slide}>
      <View style={styles.imageContainer}>
        <Image source={item.image} style={styles.img} resizeMode="contain" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    </View>
  );

  const renderDots = () => {
    return (
      <View style={styles.dotsContainer}>
        {ONBOARDING_DATA.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor:
                  index === currentIndex ? COLORS.primary : COLORS.accent1,
                width: index === currentIndex ? 20 : 8,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  const handleGetStarted = async () => {
    try {
      // Mark that user has completed onboarding
      await AsyncStorage.setItem("hasCompletedOnboarding", "true");
      router.push("/(auth)/signin");
    } catch (error) {
      console.error("Error saving onboarding state:", error);
      // Still navigate even if there's an error
      router.push("/(auth)/signin");
    }
  };

  const renderButton = () => {
    return (
      <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    );
  };

  const isLastSlide = currentIndex === ONBOARDING_DATA.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <FlatList
        ref={flatListRef}
        data={ONBOARDING_DATA}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        style={styles.flatList}
      />

      <View style={styles.bottomContainer}>
        {isLastSlide ? renderButton() : renderDots()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  flatList: {
    flex: 1,
  },
  slide: {
    width: screenWidth,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  imageContainer: {
    width: 200,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  img: {
    height: 150,
  },
  textContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.black,
    textAlign: "center",
    marginBottom: 16,
    fontFamily: "Poppins-Bold",
  },
  description: {
    fontSize: 16,
    color: COLORS.black,
    textAlign: "center",
    lineHeight: 24,
    fontFamily: "Poppins-Regular",
  },
  bottomContainer: {
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 25,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    fontFamily: "Poppins-Bold",
  },
});
