import path from 'path'
import fs from 'fs-extra'
import yaml from 'yaml'
import type { LocalEntry } from './_types'

export const REGISTRY_DIST = path.resolve(__dirname, '../dist/registry.json')
export const PLUGINS_YAML_FILE = path.resolve(__dirname, '../plugins.yaml')
export const THEMES_YAML_FILE = path.resolve(__dirname, '../themes.yaml')

export const GITHUB_TOKEN_HEADERS = {
  Authorization: process.env.GITHUB_TOKEN ? `Bearer ${process.env.GITHUB_TOKEN}` : '',
}
export const GITHUB_API_HEADERS = {
  ...GITHUB_TOKEN_HEADERS,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
}

// Read YAML file
export const readYamlFile = async (filePath: string): Promise<LocalEntry[]> => {
  const fileContent = await fs.readFile(filePath, 'utf8')
  return yaml.parse(fileContent) || []
}

export const LocalEntryDefault: LocalEntry = {
  id: '',
  name: '',
  description: '',
  github_repo: '',
  npm_package: '',
  author_name: '',
  author_link: '',
}
