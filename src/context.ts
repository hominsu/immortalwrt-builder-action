import * as core from '@actions/core'
import { Context } from '@actions/github/lib/context'
import { Git } from '@docker/actions-toolkit/lib/git'
import { GitHub } from '@docker/actions-toolkit/lib/github'
import { Util } from '@docker/actions-toolkit/lib/util'

export interface Inputs {
  context: ContextSource
  image: string
  workdir: string
  outdir: string
  config: string
  files: string
  args: string[]
  githubToken: string
}

export function getInputs(): Inputs {
  return {
    context: (core.getInput('context') || ContextSource.workflow) as ContextSource,
    image: core.getInput('image'),
    workdir: core.getInput('workdir') || '.',
    outdir: core.getInput('outdir') || './bin',
    config: core.getInput('config') || '.config',
    files: core.getInput('files'),
    args: Util.getInputList('args', { ignoreComma: true, comment: '#' }),
    githubToken: core.getInput('github-token')
  }
}

export enum ContextSource {
  workflow = 'workflow',
  git = 'git'
}

export async function getContext(source: ContextSource): Promise<Context> {
  switch (source) {
    case ContextSource.workflow:
      return await getContextFromWorkflow()
    case ContextSource.git:
      return await getContextFromGit()
    default:
      throw new Error(`Invalid context source: ${source}`)
  }
}

async function getContextFromWorkflow(): Promise<Context> {
  const context = GitHub.context

  return context as Context
}

async function getContextFromGit(): Promise<Context> {
  const ctx = await Git.context()

  return ctx as Context
}
