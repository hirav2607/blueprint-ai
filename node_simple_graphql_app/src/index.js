const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { graphqlHTTP } = require("express-graphql");

const connectDB = require("./config/db");
const schema = require("./graphql/schema");
const root = require("./graphql/resolvers");

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use(
    "/graphql",
    graphqlHTTP({
        schema,
        rootValue: root,
        graphiql: true // enables GraphiQL UI
    })
);

app.get("/", (req, res) => res.send("✅ GraphQL API running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
