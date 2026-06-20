import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

/** Figma Make exports import paths with pinned versions (pnpm aliases). */
function figmaPackageResolver() {
  const versionedImport = /^((?:@[^/]+\/)?[^@/]+)@\d+\.\d+\.\d+(?:\.\d+)?$/
  return {
    name: 'figma-package-resolver',
    async resolveId(id, importer, options) {
      const match = id.match(versionedImport)
      if (!match) return null
      return this.resolve(match[1], importer, { ...options, skipSelf: true })
    },
  }
}

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/Exxat-One-Site-with-Calendar/' : '/',
  server: {
    port: 5176,
    strictPort: true,
  },
  plugins: [
    figmaPackageResolver(),
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/app'),
    },
  },
})
