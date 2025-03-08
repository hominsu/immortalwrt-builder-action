import * as core from '@actions/core'
import { parse } from 'csv-parse/sync'

export class CompileArg {
  public profile?: string
  public attrs: Record<string, string | null>

  constructor() {
    this.attrs = {}
  }

  public get Args(): Array<string> {
    return [
      ...(this.profile ? [`PROFILE=${this.profile}`] : []),
      ...Object.entries(this.attrs).map(([key, value]) => (value ? `${key}=${value}` : `${key}`))
    ]
  }

  public toString(): string {
    return this.Args.join(' ')
  }
}

export function Transform(input: string[]): CompileArg[] {
  const args: CompileArg[] = []

  for (const arg of input) {
    args.push(Parse(arg))
  }

  core.startGroup(`Processing compile args input`)
  for (const arg of args) {
    core.info(arg.toString())
  }
  core.endGroup()

  return args
}

export function Parse(s: string): CompileArg {
  const fields = parse(s, {
    quote: `'`,
    relaxColumnCount: true,
    skipEmptyLines: true
  })[0]

  const arg = new CompileArg()
  for (const field of fields) {
    const parts = field
      .toString()
      .split(/(?<=^[^=]+?)=/)
      .map((item) => item.trim())

    const key = parts[0]

    if (parts.length == 1) {
      arg.attrs[key] = null
    } else {
      const value = parts[1]
      switch (key) {
        case 'PROFILE': {
          arg.profile = value
          break
        }
        default: {
          arg.attrs[key] = value
          break
        }
      }
    }
  }

  return arg
}
