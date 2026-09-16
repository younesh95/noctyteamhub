const paths = [
  /^\/players\?nickname=[^&]{1,100}$/,
  /^\/players\/[\w-]+$/,
  /^\/players\/[\w-]+\/stats\/cs2$/,
  /^\/players\/[\w-]+\/history\?game=cs2&offset=\d{1,5}&limit=(?:[1-9]|[1-9]\d|100)$/,
  /^\/teams\/[\w-]+$/,
  /^\/teams\/[\w-]+\/stats\/cs2$/,
  /^\/matches\/[\w-]+(?:\/stats)?$/,
];
function allowedPath(path) {
  return (
    typeof path === "string" &&
    path.length < 300 &&
    paths.some((re) => re.test(path))
  );
}
function errorMessage(status) {
  return (
    {
      401: "Clé FACEIT invalide.",
      403: "Accès FACEIT refusé pour cette clé.",
      404: "Aucune donnée FACEIT trouvée.",
      429: "Limite FACEIT atteinte. Réessayez dans une minute.",
    }[status] || "Service FACEIT indisponible (" + status + ")."
  );
}
module.exports = { allowedPath, errorMessage };
