import { Context } from '@actions/github/lib/context'

import * as tcl from './compile-arg'
import { Inputs } from './context'

export interface Command {
  exec: string
  args: Array<string>
}

export class Meta {
  private readonly context: Context
  private readonly args: tcl.CompileArg[]

  constructor(inputs: Inputs, context: Context) {
    this.context = context
    this.args = tcl.Transform(inputs.args)
  }

  public getCompileCommands(): Array<Command> {
    const cmds: Array<Command> = []
    for (const arg of this.args) {
      const cmd = {
        exec: 'make',
        args: ['image', ...arg.Args]
      } as Command
      cmds.push(cmd)
    }
    return cmds
  }
}
