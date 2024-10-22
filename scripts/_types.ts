export interface LocalEntry {
  id: string
  name: string
  description: string
  github_repo: string
  npm_package: string
  author_name: string
  author_link: string
  donate_link?: string
}

export interface RegistryEntry {
  id: string
  name: string
  description: string
  author_name: string
  author_link: string
  donate_link: string
  repo_name: string
  repo_link: string
  npm_name: string
  source: string
  integrity: string
  options_schema: string
  verified: boolean
  version: string
  updated_at: string
  min_artalk_version: string
  type: 'plugin' | 'theme'
}

export interface RegistryData {
  plugins: RegistryEntry[]
  themes: RegistryEntry[]
}
