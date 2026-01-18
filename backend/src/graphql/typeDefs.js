const typeDefs = `#graphql

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

  type Mutation {
    createDiagram(title: String!, description: String!): Diagram
    updateDiagram(id: ID!, title: String, description: String, d2Code: String, svg: String): Diagram
    deleteDiagram(id: ID!): String

    generateDiagram(description: String!): Diagram
 }
`;

module.exports = typeDefs;
