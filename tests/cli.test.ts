import fs from "fs";
import path from "path";

describe("CLI", () => {
  it("should have cli entry point", () => {
    const cliPath = path.resolve(__dirname, "../src/cli.ts");
    expect(fs.existsSync(cliPath)).toBe(true);
  });

  it("should have shebang in cli.ts", () => {
    const cliPath = path.resolve(__dirname, "../src/cli.ts");
    const content = fs.readFileSync(cliPath, "utf-8");
    expect(content.startsWith("#!/usr/bin/env node")).toBe(true);
  });

  it("should import all generators", () => {
    const cliPath = path.resolve(__dirname, "../src/cli.ts");
    const content = fs.readFileSync(cliPath, "utf-8");

    expect(content).toContain("initApp");
    expect(content).toContain("generateModel");
    expect(content).toContain("generateController");
    expect(content).toContain("generateResource");
  });

  it("should define init command", () => {
    const cliPath = path.resolve(__dirname, "../src/cli.ts");
    const content = fs.readFileSync(cliPath, "utf-8");

    expect(content).toContain('command("init');
  });

  it("should define generate command", () => {
    const cliPath = path.resolve(__dirname, "../src/cli.ts");
    const content = fs.readFileSync(cliPath, "utf-8");

    expect(content).toContain('command("generate")');
    expect(content).toContain('command("model');
    expect(content).toContain('command("controller');
    expect(content).toContain('command("resource');
  });
});
