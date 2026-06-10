export function isAdminUser() {
  const role = localStorage.getItem("fined_role") || localStorage.getItem("role");
  const roles = localStorage.getItem("fined_roles") || localStorage.getItem("roles");
  return role === "Admin" || roles?.includes("Admin");
}
