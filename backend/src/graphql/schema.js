const { gql } = require("graphql-tag");

module.exports = gql`
  type Diagram {
    id: ID!
    title: String
    description: String
    d2Code: String
    svg: String
    createdAt: String
    updatedAt: String

    diagramType: String
    direction: String
    detailLevel: String
    withIcons: Boolean
    withContainers: Boolean
    layout: String
  }

  input DiagramOptionsInput {
    diagramType: String
    direction: String
    detailLevel: String
    withIcons: Boolean
    withContainers: Boolean
    layout: String
  }

  type Query {
    diagrams: [Diagram!]!
    diagram(id: ID!): Diagram
  }

  type Mutation {
    generateDiagram(description: String!, options: DiagramOptionsInput): Diagram!
  }
`;
