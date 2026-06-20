/** Vite `base` — always ends with `/` (e.g. `/` or `/exxat-calendar-2.0/`). */
export function getAppBasePath(): string {
  const base = import.meta.env.BASE_URL
  return base.endsWith("/") ? base : `${base}/`
}

/** Strip deploy base from a browser pathname → app route (e.g. `/schedules/list`). */
export function stripAppBasePath(pathname: string): string {
  const base = getAppBasePath()
  if (base === "/") return pathname || "/"

  const baseNoSlash = base.slice(0, -1)
  if (pathname === baseNoSlash || pathname === `${baseNoSlash}/`) return "/"
  if (pathname.startsWith(`${baseNoSlash}/`)) {
    const rest = pathname.slice(baseNoSlash.length)
    return rest || "/"
  }
  return pathname
}

/** Join an app route with the deploy base for `history` APIs and links. */
export function withAppBasePath(appPath: string): string {
  const base = getAppBasePath()
  const clean = appPath.startsWith("/") ? appPath : `/${appPath}`

  if (base === "/") return clean
  if (clean === "/") return baseNoTrailing(base)

  return `${baseNoTrailing(base)}${clean}`
}

function baseNoTrailing(base: string): string {
  return base.endsWith("/") ? base.slice(0, -1) : base
}

/** Static assets under `public/` (respects GitHub Pages subpath). */
export function publicAssetUrl(relativePath: string): string {
  const clean = relativePath.replace(/^\//, "")
  return `${getAppBasePath()}${clean}`
}

/** Current app route from `window.location` (without deploy base). */
export function currentAppPath(): string {
  if (typeof window === "undefined") return "/"
  return stripAppBasePath(window.location.pathname)
}
