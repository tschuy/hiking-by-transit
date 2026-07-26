import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execFileSync } from 'node:child_process'
import path from 'node:path'

function generatedContentPlugin() {
  const contentRoot = `${path.resolve('content')}${path.sep}`
  const generate = () => execFileSync('python3', ['scripts/generate-content.py'], { stdio: 'inherit' })
  return {
    name: 'generated-content',
    apply: 'serve' as const,
    buildStart: generate,
    configureServer(server: { watcher: { add(path: string): void; on(event: string, callback: (event: string, file: string) => void): void } }) {
      server.watcher.add(contentRoot)
      server.watcher.on('all', (event, file) => {
        if (['add', 'change', 'unlink'].includes(event) && file.startsWith(contentRoot) && file.endsWith('.md')) generate()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), generatedContentPlugin()],
})
