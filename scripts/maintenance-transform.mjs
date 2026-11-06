// Compute transformations in memory. Python enforces paths and size before writing.
import { readFileSync } from "node:fs";
import { ESLint } from "eslint";
import * as prettier from "prettier";

const eslint = new ESLint({ fix: true, fixTypes: ["layout"] });
const options = JSON.parse(readFileSync(".prettierrc.json", "utf8"));
// Consume the pipe through EOF, including payloads delivered in multiple chunks.
process.stdin.setEncoding("utf8");
let input = "";
for await (const chunk of process.stdin) input += chunk;
const inputs = JSON.parse(input);
const changes = [];
for (const { path, content } of inputs) {
  const [result] = await eslint.lintText(content, { filePath: path });
  if (!result || result.errorCount) {
    throw new Error(`Source failed lint: ${path}\n${JSON.stringify(result?.messages)}`);
  }
  const formatted = await prettier.format(result.output ?? content, {
    ...options,
    filepath: path,
  });
  // Require a stable fixed point to avoid formatter/linter ping-pong.
  const [verified] = await eslint.lintText(formatted, { filePath: path });
  if (verified.errorCount || (verified.output && verified.output !== formatted)) {
    throw new Error(`Formatter conflicts with lint configuration: ${path}\n${JSON.stringify(verified.messages)}`);
  }
  if (formatted !== content) changes.push({ path, content: formatted });
}
process.stdout.write(JSON.stringify(changes));
