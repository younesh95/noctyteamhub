function isJitsi(url) {
  try {
    return new URL(url).origin === "https://meet.jit.si";
  } catch {
    return false;
  }
}
function allowedCallPermission(permission, url, active) {
  return (
    active &&
    isJitsi(url) &&
    ["media", "display-capture", "fullscreen"].includes(permission)
  );
}
module.exports = { isJitsi, allowedCallPermission };
