import fs from "fs";
import path from "path";
import os from "os";

describe("Generators", () => {
  let tempDir: string;

  beforeEach(() => {
    // Create a temporary directory for each test
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "erwinmvc-test-"));
  });

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  describe("initApp", () => {
    it("should have app scaffold templates available", () => {
      const scaffoldDir = path.resolve(__dirname, "../templates/appScaffold");
      expect(fs.existsSync(scaffoldDir)).toBe(true);
    });

    it("should have required scaffold files", () => {
      const scaffoldDir = path.resolve(__dirname, "../templates/appScaffold");
      const requiredFiles = [
        "package.json",
        "tsconfig.json",
        "src/server.ts",
        "src/views/index.ejs",
      ];

      for (const file of requiredFiles) {
        const filePath = path.join(scaffoldDir, file);
        expect(fs.existsSync(filePath)).toBe(true);
      }
    });
  });

  describe("generateModel template", () => {
    it("should have model template available", () => {
      const templatePath = path.resolve(__dirname, "../templates/model.prisma.ejs");
      expect(fs.existsSync(templatePath)).toBe(true);
    });

    it("should contain required model fields", () => {
      const templatePath = path.resolve(__dirname, "../templates/model.prisma.ejs");
      const content = fs.readFileSync(templatePath, "utf-8");

      expect(content).toContain("id");
      expect(content).toContain("@id");
      expect(content).toContain("createdAt");
      expect(content).toContain("updatedAt");
      expect(content).toContain("@@map");
    });
  });

  describe("generateController template", () => {
    it("should have controller template available", () => {
      const templatePath = path.resolve(__dirname, "../templates/controller.ts.ejs");
      expect(fs.existsSync(templatePath)).toBe(true);
    });

    it("should contain CRUD actions", () => {
      const templatePath = path.resolve(__dirname, "../templates/controller.ts.ejs");
      const content = fs.readFileSync(templatePath, "utf-8");

      expect(content).toContain("index");
      expect(content).toContain("show");
      expect(content).toContain("store");
      expect(content).toContain("update");
      expect(content).toContain("destroy");
    });

    it("should import from framework", () => {
      const templatePath = path.resolve(__dirname, "../templates/controller.ts.ejs");
      const content = fs.readFileSync(templatePath, "utf-8");

      expect(content).toContain("@erwininteractive/mvc");
      expect(content).toContain("getPrismaClient");
    });
  });
});
