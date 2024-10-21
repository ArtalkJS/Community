import axios from 'axios'
import fs from 'fs-extra'
import path from 'path'
import { execSync } from 'child_process'
import { GITHUB_API_HEADERS, GITHUB_TOKEN_HEADERS } from './_shared'

const SRC_JSON = path.resolve(__dirname, '../dist/registry.json')
const TMP_JSON = path.resolve(__dirname, '../.tmp/registry.json')

const checkDiff = async (): Promise<boolean> => {
  try {
    const releaseResponse = await axios.get(
      'https://api.github.com/repos/ArtalkJS/Community/releases/latest',
      {
        headers: {
          ...GITHUB_API_HEADERS,
        },
      },
    )

    const assets = releaseResponse.data.assets
    const registryAsset = assets.find((asset: any) => asset.name === 'registry.json')

    if (!registryAsset) {
      console.log('No registry.json found in the latest release assets.')
      return true
    }

    const downloadUrl = registryAsset.browser_download_url

    // Fetch the registry.json file
    const downloadResponse = await axios.get(downloadUrl, {
      responseType: 'arraybuffer',
      headers: {
        ...GITHUB_TOKEN_HEADERS,
      },
    })

    // Write the downloaded file to a temporary location
    await fs.ensureDir(path.dirname(TMP_JSON))
    await fs.writeFile(TMP_JSON, downloadResponse.data)

    // Compare the two JSON files
    if (fs.existsSync(SRC_JSON)) {
      try {
        execSync(`diff ${SRC_JSON} ${TMP_JSON}`)
        return false // no diff found
      } catch (error) {
        return true // diff found, command return exit:1
      }
    } else {
      console.log('Source registry.json does not exist.')
      return true
    }
  } catch (error) {
    // Check if the release was found
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      console.log('No GitHub release found. Api returned 404.')
      return true
    }

    if (axios.isAxiosError(error)) {
      console.error(`Axios error: ${error.message}`)
    } else {
      console.error(`Unexpected error: ${error}`)
    }
    process.exit(1)
  }
}

checkDiff().then((isDiff) => {
  console.log(`::set-output name=is_diff::${isDiff ? 1 : 0}`)
})
