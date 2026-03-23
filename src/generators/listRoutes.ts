import fs from "fs";
import path from "path";

interface RouteInfo {
  method: string;
  path: string;
  handler: string;
}

/**
 * Parse routes from server.ts file
 */
export function parseRoutes(serverPath: string): RouteInfo[] {
  const routes: RouteInfo[] = [];
  
  if (!fs.existsSync(serverPath)) {
    return routes;
  }

  const content = fs.readFileSync(serverPath, "utf-8");
  const lines = content.split("\n");

  for (const line of lines) {
    // Match app.METHOD("/path", handler)
    const routeMatch = line.match(/app\.(\w+)\s*\(\s*["']([^"']+)["']/);
    if (routeMatch) {
      const currentMethod = routeMatch[1].toLowerCase();
      const currentPath = routeMatch[2];
      
      let currentHandler = "";
      
      // Extract handler name - look for arrow function or identifier
      const arrowFuncMatch = line.match(/=>\s*\{/);
      if (arrowFuncMatch) {
        currentHandler = "<anonymous>";
      } else {
        const handlerMatch = line.match(/,\s*([^\s,)]+)/);
        if (handlerMatch) {
          currentHandler = handlerMatch[1].trim();
        } else {
          currentHandler = "<anonymous>";
        }
      }
      
      routes.push({
        method: currentMethod.toUpperCase(),
        path: currentPath,
        handler: currentHandler,
      });
    }
  }

  return routes;
}

/**
 * Format routes as a table
 */
export function formatRoutes(routes: RouteInfo[]): string {
  if (routes.length === 0) {
    return "No routes found.";
  }

  const headers = ["Method", "Path", "Handler"];
  const colWidths = [6, 20, 30];
  
  const formatRow = (cells: string[]) => {
    return cells.map((cell, i) => cell.padEnd(colWidths[i])).join(" | ");
  };

  const separator = colWidths.map(w => "-".repeat(w)).join("-+-");

  let output = "";
  output += formatRow(headers) + "\n";
  output += separator + "\n";

  for (const route of routes) {
    output += formatRow([
      route.method,
      route.path,
      route.handler,
    ]) + "\n";
  }

  return output;
}

/**
 * Get server.ts path from current directory
 */
export function getServerPath(cwd: string = process.cwd()): string {
  const possiblePaths = [
    path.join(cwd, "src", "server.ts"),
    path.join(cwd, "server.ts"),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  return possiblePaths[0];
}

/**
 * List all routes in the current project
 */
export function listRoutes(cwd: string = process.cwd()): void {
  const serverPath = getServerPath(cwd);
  const routes = parseRoutes(serverPath);
  
  console.log("\nDefined Routes:\n");
  console.log(formatRoutes(routes));
  
  if (routes.length === 0) {
    console.log("\nNo routes found. Add routes to src/server.ts");
  }
}
