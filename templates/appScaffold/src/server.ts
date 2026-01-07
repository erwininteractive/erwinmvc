import { createMvcApp, startServer } from "@erwininteractive/mvc";

async function main() {
  const { app } = await createMvcApp({
    viewsPath: "src/views",
    publicPath: "public",
  });

  // Root route - displays welcome page
  app.get("/", (req, res) => {
    res.render("index", { title: "Welcome" });
  });

  // Add your routes here
  // Example: app.get("/users", UsersController.index);

  // Start server
  startServer(app);
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
