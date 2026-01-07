#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Add shebang to CLI file
const cliPath = path.join(__dirname, "../dist/cli.js");
if (fs.existsSync(cliPath)) {
  const content = fs.readFileSync(cliPath, "utf-8");
  if (!content.startsWith("#!")) {
    fs.writeFileSync(cliPath, "#!/usr/bin/env node\n" + content);
  }
  // Make executable
  fs.chmodSync(cliPath, "755");
}

console.log("CLI build complete");
