import pc from 'picocolors'
import YAML from 'yaml'
import fs from 'fs-extra'
import type { LocalEntry } from './_types'
import { LocalEntryDefault, PLUGINS_YAML_FILE, THEMES_YAML_FILE } from './_shared'

function validateFields(entry: any) {
  if (!entry || typeof entry !== 'object') return []

  const invalidFields: { field: string; message: string }[] = []
  const invalid = (field: string, message: string) => invalidFields.push({ field, message })

  Object.entries<string>(entry).forEach(([field, value]) => {
    // ---------------------------------------------------------------------------------
    //  Add validation rules here
    // ---------------------------------------------------------------------------------
    if (field.endsWith('_link') && !/^https?:\/\//.test(String(value)))
      invalid(field, 'is not a valid URL.')

    if (typeof value === 'string' && (value.startsWith(' ') || value.endsWith(' ')))
      invalid(field, 'should not start or end with a space.')
  })

  return invalidFields
}

const keysOfLocalEntry = Object.keys(LocalEntryDefault)

function getMissingFields(entry: any): string[] {
  if (!entry || typeof entry !== 'object') return keysOfLocalEntry
  return keysOfLocalEntry.filter((key) => !(key in entry) || String(entry[key]).trim() === '')
}

const validateYAMLFile = async (filePath: string) => {
  const lineCounter = new YAML.LineCounter()
  const fileContent = await fs.readFile(filePath, 'utf8')
  const entriesRaw = YAML.parseDocument(fileContent, { lineCounter }).contents as YAML.YAMLSeq<any>

  // Track invalid entries with index, id, and missing fields
  interface ValidatedEntry {
    entry: LocalEntry
    index: number
    id: string
    linePos: { line: number; col: number }
    missingFields: string[]
    invalidFields: { field: string; message: string }[]
  }

  if (!entriesRaw) {
    console.log(`${pc.yellow(`[WARN]`)} No entries found in "${filePath}".`)
    return true
  }

  const entries = entriesRaw.items.map((item) => ({
    entry: item.toJSON?.(),
    linePos:
      item.range && item.range.length > 0
        ? lineCounter.linePos(item.range[0])
        : { line: 0, col: 0 },
  }))

  const invalidEntries = entries
    .map<ValidatedEntry>(({ entry, linePos }, index) => ({
      entry,
      index,
      linePos,
      id: (entry ? entry.id : '') || '(unknown id)',
      missingFields: getMissingFields(entry),
      invalidFields: validateFields(entry),
    }))
    .filter((x) => x.missingFields.length > 0 || x.invalidFields.length > 0)

  if (invalidEntries.length > 0) {
    invalidEntries.forEach(({ linePos, id, missingFields, invalidFields }) => {
      console.log(
        `\n${pc.red(`[FAIL]`)} 😢 Invalid entry "${pc.bold(pc.red(id))}" in "${filePath}:${linePos.line}:${linePos.col}".\n`,
      )

      if (missingFields.length > 0) {
        console.log(`    ${pc.red('Missing fields:')}\n`)
        console.log(`      [${missingFields.map((x) => `"${x}"`).join(', ')}]\n`)
      }

      if (invalidFields.length > 0) {
        console.log(`    ${pc.red('Invalid fields:')}\n`)
        console.log(
          `${invalidFields.map((x) => `      - "${pc.red(x.field)}" ${x.message}`).join('\n')}\n`,
        )
      }
    })
    return false
  } else {
    console.log(`${pc.green('[PASS]')} 🎉 All entries in "${filePath}" are valid.`)
    return true
  }
}

const validate = () =>
  Promise.all([validateYAMLFile(PLUGINS_YAML_FILE), validateYAMLFile(THEMES_YAML_FILE)])

console.log(`Validating Artalk Community YAML files...`)
validate().then((results) => {
  console.log('')
  if (!results.every((x) => x)) process.exit(1)
})
