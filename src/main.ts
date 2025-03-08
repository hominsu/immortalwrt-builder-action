import * as path from 'path'
import * as core from '@actions/core'
import * as io from '@actions/io'
import * as actionsToolkit from '@docker/actions-toolkit'
import { Context } from '@docker/actions-toolkit/lib/context'
import { Docker } from '@docker/actions-toolkit/lib/docker/docker'
import { GitHub } from '@docker/actions-toolkit/lib/github'
import { ConfigFile } from '@docker/actions-toolkit/lib/types/docker/docker'

import { getContext, getInputs, Inputs } from './context'
import { Command, Meta } from './meta'

actionsToolkit.run(async () => {
  const inputs: Inputs = getInputs()
  const context = await getContext(inputs.context)

  await core.group(`Context info`, async () => {
    core.info(`eventName: ${context.eventName}`)
    core.info(`sha: ${context.sha}`)
    core.info(`ref: ${context.ref}`)
    core.info(`workflow: ${context.workflow}`)
    core.info(`action: ${context.action}`)
    core.info(`actor: ${context.actor}`)
    core.info(`runNumber: ${context.runNumber}`)
    core.info(`runId: ${context.runId}`)
  })

  if (core.isDebug()) {
    await core.group(`Webhook payload`, async () => {
      core.info(JSON.stringify(context.payload, null, 2))
    })
  }

  const meta: Meta = new Meta(inputs, context)

  await core.group(`GitHub Actions runtime token ACs`, async () => {
    try {
      await GitHub.printActionsRuntimeTokenACs()
    } catch (e) {
      core.warning(e.message)
    }
  })

  await core.group(`Docker info`, async () => {
    try {
      await Docker.printVersion()
      await Docker.printInfo()
    } catch (e) {
      core.info(e.message)
    }
  })

  await core.group(`Proxy configuration`, async () => {
    let dockerConfig: ConfigFile | undefined
    let dockerConfigMalformed = false
    try {
      dockerConfig = await Docker.configFile()
    } catch (e) {
      dockerConfigMalformed = true
      core.warning(
        `Unable to parse config file ${path.join(Docker.configDir, 'config.json')}: ${e}`
      )
    }
    if (dockerConfig && dockerConfig.proxies) {
      for (const host in dockerConfig.proxies) {
        let prefix = ''
        if (Object.keys(dockerConfig.proxies).length > 1) {
          prefix = '  '
          core.info(host)
        }
        for (const key in dockerConfig.proxies[host]) {
          core.info(`${prefix}${key}: ${dockerConfig.proxies[host][key]}`)
        }
      }
    } else if (!dockerConfigMalformed) {
      core.info('No proxy configuration found')
    }
  })

  core.saveState('tmpDir', Context.tmpDir())

  await core.group(`Pull ImmortalWrt image builder`, async () => {
    try {
      await Docker.pull(inputs.image)
    } catch (e) {
      core.error(e.message)
      throw e
    }
  })

  await io.mkdirP(inputs.outdir)

  const buildEnv = Object.assign({}, process.env) as {
    [key: string]: string
  }

  const cmds: Array<Command> = meta.getCompileCommands()
  await core.group('Build ImmortalWrt image', async () => {
    for (const cmd of cmds) {
      await Docker.getExecOutput(
        [
          'run',
          '--rm',
          ...['-v', `"${inputs.outdir}:/home/build/immortalwrt/bin"`],
          ...['-v', `"${inputs.config}:/home/build/immortalwrt/.config"`],
          inputs.image,
          ...[cmd.exec, ...cmd.args]
        ],
        {
          cwd: inputs.workdir,
          env: buildEnv,
          ignoreReturnCode: true
        }
      ).then((res) => {
        if (res.stderr.length > 0 && res.exitCode != 0) {
          throw Error(res.stderr)
        }
      })
    }
  })
})
