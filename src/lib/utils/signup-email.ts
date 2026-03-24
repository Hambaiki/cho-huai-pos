export function getSignUpEmailOptions(displayName: string) {
  const appName = process.env.APP_NAME?.trim() || "Cho Huai POS";
  const supportEmail = process.env.SUPPORT_EMAIL?.trim() || "support@example.com";
  const emailRedirectTo = process.env.EMAIL_CONFIRM_REDIRECT_URL?.trim();

  return {
    data: {
      display_name: displayName,
      app_name: appName,
      support_email: supportEmail,
    },
    ...(emailRedirectTo ? { emailRedirectTo } : {}),
  };
}
