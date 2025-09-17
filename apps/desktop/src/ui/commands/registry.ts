export interface Command {
  id: string;
  title: string;
  run: () => void;
}

class CommandRegistry {
  private commands: Map<string, Command> = new Map();

  register(cmd: Command) {
    this.commands.set(cmd.id, cmd);
  }

  getAll(): Command[] {
    return Array.from(this.commands.values());
  }
}

export const registry = new CommandRegistry();

