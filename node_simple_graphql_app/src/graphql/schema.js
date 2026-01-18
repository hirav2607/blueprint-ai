const { buildSchema } = require("graphql");

const schema = buildSchema(`
  type Diagram {
    id: ID!
    title: String!
    description: String!
    d2Code: String
    svg: String
    createdAt: String
    updatedAt: String
  }

  type Query {
    getDiagrams: [Diagram]
    getDiagram(id: ID!): Diagram
  }

  type Mutation {
    createDiagram(title: String!, description: String!): Diagram
    updateDiagram(id: ID!, title: String, description: String, d2Code: String, svg: String): Diagram
    deleteDiagram(id: ID!): String
  }
`);

module.exports = schema;
