import { Command } from "commander";
import { add } from "./commands/add.js";
import { configure } from "./commands/configure.js";
import { init } from "./commands/init.js";
import { remove } from "./commands/remove.js";

const VERSION = process.env.VERSION ?? "0.0.1";

process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));

const program = new Command()
  .name("ui-grab")
  .description("add UI Grab to your project")
  .version(VERSION, "-v, --version", "display the version number");

program.addCommand(init);
program.addCommand(add);
program.addCommand(remove);
program.addCommand(configure);

const main = async () => {
  await program.parseAsync();
};

main();
