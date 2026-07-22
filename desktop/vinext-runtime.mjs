export async function loadVinextProdServer() {
  const prodServerUrl = import.meta.resolve("vinext/server/prod-server");

  if (process.platform === "win32") {
    const cacheModuleUrl = new URL("./static-file-cache.js", prodServerUrl);
    const { StaticFileCache } = await import(cacheModuleUrl.href);
    if (!StaticFileCache.prototype.__fafWindowsPathFix) {
      const originalLookup = StaticFileCache.prototype.lookup;
      StaticFileCache.prototype.lookup = function lookupWindowsPath(pathname) {
        const directMatch = originalLookup.call(this, pathname);
        if (directMatch || !pathname.startsWith("/")) return directMatch;
        const windowsPathname = `/${pathname.slice(1).replaceAll("/", "\\")}`;
        return originalLookup.call(this, windowsPathname);
      };
      Object.defineProperty(StaticFileCache.prototype, "__fafWindowsPathFix", { value: true });
    }
  }

  return import(prodServerUrl);
}
