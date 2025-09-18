import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts } from "expo-font";
import { Stack, usePathname, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import "react-native-reanimated";

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();

  const [loaded, error] = useFonts({
    "poppins-regular": require("../assets/fonts/Poppins-Regular.ttf"),
    "poppins-medium": require("../assets/fonts/Poppins-Medium.ttf"),
    "poppins-bold": require("../assets/fonts/Poppins-Bold.ttf"),
    "poppins-black": require("../assets/fonts/Poppins-Black.ttf"),
    "poppins-light": require("../assets/fonts/Poppins-Light.ttf"),
  });

  const [session, setSession] = useState(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [isFirstTime, setIsFirstTime] = useState(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsSessionLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Check if it's first time app launch and onboarding completion
  useEffect(() => {
    const checkAppState = async () => {
      try {
        const firstTime = await AsyncStorage.getItem("isFirstTime");
        const onboardingCompleted = await AsyncStorage.getItem(
          "hasCompletedOnboarding"
        );

        setIsFirstTime(firstTime === null); // null means first time
        setHasCompletedOnboarding(onboardingCompleted === "true");
      } catch (error) {
        console.error("Error checking app state:", error);
        // Default to first time if there's an error
        setIsFirstTime(true);
        setHasCompletedOnboarding(false);
      }
    };

    checkAppState();
  }, []);

  const isOnAuth = useMemo(() => {
    const current = pathname ?? "";
    return current.startsWith("/signin") || current.startsWith("/signup");
  }, [pathname]);

  const isOnWelcome = useMemo(() => {
    const current = pathname ?? "";
    return current === "/welcome";
  }, [pathname]);

  const isOnOnboarding = useMemo(() => {
    const current = pathname ?? "";
    return current === "/onboarding";
  }, [pathname]);

  useEffect(() => {
    if (
      isSessionLoading ||
      isFirstTime === null ||
      hasCompletedOnboarding === null
    )
      return;

    // If the user IS authenticated and currently on an auth screen, move them to the app
    if (session && isOnAuth) {
      router.replace("/(tabs)");
      return;
    }

    // If the user is NOT authenticated, handle first-time flow
    if (!session) {
      // First time user - show welcome page
      if (isFirstTime && !isOnWelcome && !isOnOnboarding) {
        router.replace("/welcome");
        return;
      }

      // User has seen welcome but not completed onboarding
      if (
        !isFirstTime &&
        !hasCompletedOnboarding &&
        !isOnOnboarding &&
        !isOnWelcome
      ) {
        router.replace("/onboarding");
        return;
      }

      // User has completed onboarding or is returning - send to login
      if ((!isFirstTime && hasCompletedOnboarding) || isOnAuth) {
        if (!isOnAuth) {
          router.replace("/signin");
        }
        return;
      }
    }
  }, [
    session,
    isOnAuth,
    isOnWelcome,
    isOnOnboarding,
    isSessionLoading,
    isFirstTime,
    hasCompletedOnboarding,
    router,
  ]);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  const shouldRenderUI = loaded || error;

  return (
    <>
      {shouldRenderUI ? (
        <>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="signin" options={{ headerShown: false }} />
            <Stack.Screen name="signup" options={{ headerShown: false }} />
            <Stack.Screen name="welcome" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="auto" />
        </>
      ) : null}
    </>
  );
}
