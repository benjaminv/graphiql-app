import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import $monacoEditorPlugin from 'vite-plugin-monaco-editor'
import path from 'path'

const monacoEditorPlugin = $monacoEditorPlugin.default ?? $monacoEditorPlugin

export default defineConfig({
    plugins: [
        react(),
        monacoEditorPlugin({
            languageWorkers: ['editorWorkerService', 'json'],
            customWorkers: [
                {
                    label: 'graphql',
                    entry: 'monaco-graphql/esm/graphql.worker.js',
                },
            ],
        }),
        electron([
            {
                entry: 'electron/main.ts',
                vite: {
                    build: {
                        outDir: 'dist-electron',
                        rollupOptions: {
                            external: ['electron']
                        }
                    }
                }
            },
            {
                entry: 'electron/preload.ts',
                onstart(options) {
                    options.reload()
                },
                vite: {
                    build: {
                        outDir: 'dist-electron',
                        rollupOptions: {
                            external: ['electron']
                        }
                    }
                }
            }
        ]),
        renderer()
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    },
    build: {
        outDir: 'dist'
    }
})
