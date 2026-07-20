export function isAdminUser(user) {
  if (!user) return false;
  const roles = user["https://fined.com/roles"] || user["https://myfined.com/roles"] || [];
  return roles.includes("Admin");
}
