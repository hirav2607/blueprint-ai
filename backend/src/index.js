const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@as-integrations/express5");

const connectDB = require("./config/db");
const typeDefs = require("./graphql/schema");
const resolvers = require("./graphql/resolvers");

dotenv.config();
connectDB();

async function startServer() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  
  console.log("✅ Using schema file:", require.resolve("./graphql/schema"));

  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await server.start();

  // ✅ Apollo middleware
  app.use("/graphql", expressMiddleware(server));

  app.get("/", (req, res) => {
    res.send("✅ Apollo GraphQL API running");
  });

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

startServer();
