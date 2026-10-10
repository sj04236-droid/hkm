export function isUnlimitedAdmin(email: string, configuredEmails?: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !configuredEmails) return false;
  return configuredEmails
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
    .includes(normalized);
}
