/**
 * This script is used to generate the `registry.json` file.
 */
import path from 'node:path'
import fs from 'fs-extra'
import axios from 'axios'
import crypto from 'crypto'
import pc from 'picocolors'

import type { LocalEntry, RegistryData, RegistryEntry } from './_types'
import {
  PLUGINS_YAML_FILE,
  THEMES_YAML_FILE,
  REGISTRY_DIST,
  readYamlFile,
  GITHUB_API_HEADERS,
} from './_shared'

// Get npm package info
const fetchNpmPackageInfo = async (packageName: string) => {
  try {
    const response = await axios.get(`https://registry.npmjs.org/${packageName}`)
    return response.data
  } catch (error) {
    console.error(
      `${pc.red('[FAIL]')} ${pc.bold(packageName)} - Failed to fetch NPM: ${pc.red(String(error))}`,
    )
    return null
  }
}

// Get GitHub repo info
const fetchGithubRepoInfo = async (repo: string) => {
  try {
    const response = await axios.get(`https://api.github.com/repos/${repo}`, {
      headers: {
        ...GITHUB_API_HEADERS,
      },
    })
    return response.data
  } catch (error) {
    console.error(
      `${pc.red('[FAIL]')} ${pc.bold(repo)} - Failed to fetch GitHub repo: ${pc.red(
        String(error),
      )}`,
    )
    return null
  }
}

// Function to download the file from the URL using axios
const downloadFile = async (url: string): Promise<Buffer> => {
  const response = await axios.get(url, { responseType: 'arraybuffer' })
  return Buffer.from(response.data)
}

// Request document headers
const requestHead = async (url: string) => {
  const response = await axios.head(url)
  return response.headers
}

// Function to generate SRI hash
const generateSRI = (content: Buffer, algorithm: string = 'sha512'): string => {
  const hash = crypto.createHash(algorithm).update(content).digest('base64')
  return `${algorithm}-${hash}`
}

const generateSRIFromURL = async (url: string, algorithm: string = 'sha512'): Promise<string> => {
  try {
    const content = await downloadFile(url)
    return generateSRI(content, algorithm)
  } catch (error) {
    console.error(
      `${pc.red('[FAIL]')} ${pc.bold(url)} - Failed to generate SRI: ${pc.red(String(error))}`,
    )
    return ''
  }
}

const extractMinArtalkClientVersion = (pkgData: any): string => {
  if (!pkgData) return ''
  const minVersion = pkgData['peerDependencies']['artalk']
  if (!minVersion) return ''
  return minVersion.replace(/[^0-9.]/g, '')
}

const loadRegistryCache = () => {
  if (!fs.pathExistsSync(REGISTRY_DIST)) return null
  return fs.readJSONSync(REGISTRY_DIST)
}

let registryCache: RegistryData | null = loadRegistryCache()

// Build registry entry
const buildRegistryEntry = async (
  srcEntry: LocalEntry,
  type: 'plugin' | 'theme',
): Promise<RegistryEntry | null> => {
  const startTime = Date.now()

  const npmInfo = await fetchNpmPackageInfo(srcEntry.npm_package)
  if (!npmInfo) return null

  const cacheEntry = registryCache?.plugins.find((x) => x.id === srcEntry.id)
  const version = npmInfo['dist-tags']['latest']

  let distEntry: RegistryEntry = {
    type,
    id: srcEntry.id,
    name: srcEntry.name,
    description: srcEntry.description,
    author_name: srcEntry.author_name,
    author_link: srcEntry.author_link,
    donate_link: srcEntry.donate_link || '',
    repo_name: srcEntry.github_repo,
    repo_link: `https://github.com/${srcEntry.github_repo}`,
    npm_name: srcEntry.npm_package,
    verified: srcEntry.npm_package.startsWith('@artalk/'),

    version: cacheEntry?.version || '',
    source: cacheEntry?.source || '',
    integrity: cacheEntry?.integrity || '',
    options_schema: cacheEntry?.options_schema || '',
    updated_at: cacheEntry?.updated_at || '',
    min_artalk_version: cacheEntry?.min_artalk_version || '',
  }

  // Get source and integrity
  let cached = cacheEntry && cacheEntry.version === version
  if (!cached) {
    const githubInfo = await fetchGithubRepoInfo(srcEntry.github_repo)
    if (!githubInfo) return null

    // Update the entry with the latest version
    const npmPkgData = npmInfo['versions'][version]
    const mainFile = String(npmPkgData['main']).replace(/^(\.\/|\/)/, '')
    if (!mainFile) {
      console.error(
        `${pc.red('[FAIL]')} ${pc.bold(srcEntry.npm_package)} - No main file found in package.json`,
      )
      return null
    }

    const cdnBase = `https://cdn.jsdelivr.net/npm/${srcEntry.npm_package}@${version}`
    const source = `${cdnBase}/${mainFile}`
    const integrity = await generateSRIFromURL(source)
    if (!integrity) return null

    let optionsSchema = `${cdnBase}/${path.dirname(mainFile)}/artalk-plugin-options.schema.json`
    try {
      await requestHead(optionsSchema)
    } catch {
      optionsSchema = '' // unset if returns 404
    }

    distEntry = {
      ...distEntry,
      version,
      source,
      integrity,
      updated_at: npmInfo['time'][version],
      min_artalk_version: extractMinArtalkClientVersion(npmPkgData),
      options_schema: optionsSchema,
    }
  }

  const endTime = Date.now()
  const friendlyTime = `${((endTime - startTime) / 1000).toFixed(2)}s`
  console.log(
    `${pc.green(`[DONE]`)} ${pc.bold(distEntry.npm_name)} - v${distEntry.version}${
      cached ? ' ' + pc.blue('[Cached]') : ''
    } [⏱️ ${friendlyTime}]`,
  )

  return distEntry
}

// Generate registry
const generateRegistry = async () => {
  const plugins: LocalEntry[] = await readYamlFile(PLUGINS_YAML_FILE)
  const themes: LocalEntry[] = await readYamlFile(THEMES_YAML_FILE)

  const pluginEntries = await Promise.all(
    plugins.map((plugin) => buildRegistryEntry(plugin, 'plugin')),
  )
  const themeEntries = await Promise.all(themes.map((theme) => buildRegistryEntry(theme, 'theme')))

  const registry: RegistryData = {
    plugins: pluginEntries.filter((x) => !!x) as RegistryEntry[],
    themes: themeEntries.filter((x) => !!x) as RegistryEntry[],
  }

  await fs.outputJson(REGISTRY_DIST, registry, { spaces: 2 })

  console.log('')
}

// Run the script
generateRegistry()
  .then(() => {
    console.log(pc.green('🎉 Registry generated successfully!'))
  })
  .catch((error) => {
    console.error(pc.red('😢 Error generating registry:'), error)
  })
