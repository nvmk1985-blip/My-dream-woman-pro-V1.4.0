import { useColorScheme } from "react-native";

import colors from "@/constants/colors";

/**
 * Returns the shared design tokens.
 *
 * Both system schemes intentionally use the same fixed brand palette. The
 * returned object also exposes spacing, typography, gradients, and effects
 * for later screen-by-screen migration without creating another token source.
 */
export function useColors() {
  const scheme = useColorScheme();
  const palette = scheme === "dark" ? colors.dark : colors.light;

  return {
    ...palette,
    radius: colors.radius,
    spacing: colors.spacing,
    typography: colors.typography,
    gradients: colors.gradients,
    effects: colors.effects,
  };
}
