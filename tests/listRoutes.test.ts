import fs from "fs";
import path from "path";
import { parseRoutes, formatRoutes, getServerPath } from "../src/generators/listRoutes";

describe("listRoutes", () => {
  describe("parseRoutes", () => {
    it("should parse simple routes", () => {
      const content = `
app.get("/", (req, res) => {
  res.render("index", { title: "Home" });
});

app.post("/users", UsersController.store);
`;

      const testPath = path.join(__dirname, "__fixtures__", "server_test.ts");
      fs.mkdirSync(path.dirname(testPath), { recursive: true });
      fs.writeFileSync(testPath, content);

      const routes = parseRoutes(testPath);

      expect(routes).toHaveLength(2);
      expect(routes[0]).toEqual({
        method: "GET",
        path: "/",
        handler: "<anonymous>",
      });
      expect(routes[1]).toEqual({
        method: "POST",
        path: "/users",
        handler: "UsersController.store",
      });

      fs.unlinkSync(testPath);
    });

    it("should handle controller method references", () => {
      const content = `
import * as PostController from "./controllers/PostController";

app.get("/posts", PostController.index);
app.get("/posts/:id", PostController.show);
`;

      const testPath = path.join(__dirname, "__fixtures__", "server_controllers.ts");
      fs.mkdirSync(path.dirname(testPath), { recursive: true });
      fs.writeFileSync(testPath, content);

      const routes = parseRoutes(testPath);

      expect(routes).toHaveLength(2);
      expect(routes[0].handler).toBe("PostController.index");
      expect(routes[1].handler).toBe("PostController.show");

      fs.unlinkSync(testPath);
    });

    it("should return empty array for non-existent file", () => {
      const routes = parseRoutes("/nonexistent/path/server.ts");
      expect(routes).toEqual([]);
    });
  });

  describe("formatRoutes", () => {
    it("should format routes as table", () => {
      const routes = [
        { method: "GET", path: "/", handler: "home" },
        { method: "POST", path: "/posts", handler: "store" },
      ];

      const output = formatRoutes(routes);

      expect(output).toContain("Method");
      expect(output).toContain("Path");
      expect(output).toContain("Handler");
      expect(output).toContain("GET");
      expect(output).toContain("/");
      expect(output).toContain("POST");
      expect(output).toContain("/posts");
    });

    it("should handle empty routes", () => {
      const output = formatRoutes([]);
      expect(output).toContain("No routes found");
    });
  });

  describe("getServerPath", () => {
    it("should find server.ts in src directory", () => {
      const testDir = path.join(__dirname, "__fixtures__", "project");
      const srcDir = path.join(testDir, "src");
      fs.mkdirSync(srcDir, { recursive: true });
      fs.writeFileSync(path.join(srcDir, "server.ts"), "// dummy");

      const serverPath = getServerPath(testDir);

      expect(serverPath).toBe(path.join(testDir, "src", "server.ts"));

      fs.unlinkSync(path.join(srcDir, "server.ts"));
      fs.rmdirSync(srcDir);
      fs.rmdirSync(testDir);
    });

    it("should return default path if no server.ts found", () => {
      const testDir = path.join(__dirname, "__fixtures__", "empty");
      fs.mkdirSync(testDir, { recursive: true });

      const serverPath = getServerPath(testDir);

      expect(serverPath).toBe(path.join(testDir, "src", "server.ts"));

      fs.rmdirSync(testDir);
    });
  });
});
