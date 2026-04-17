const MOBILE_UA_PATTERN =
  /\b(iPhone|iPod|Android.*Mobile|Windows Phone|IEMobile|BlackBerry|BB10|Opera Mini)\b/;

/**
 * Pure UA string classifier for a narrow-screen mobile device. Tablets
 * (iPad, Android without the `Mobile` token) are deliberately excluded —
 * their width typically exceeds 480 px and the scene layout holds up.
 */
export const isMobileUA = (userAgent: string): boolean => {
  if (!userAgent) return false;
  return MOBILE_UA_PATTERN.test(userAgent);
};
