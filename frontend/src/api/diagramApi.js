import { graphqlRequest } from "./graphqlClient";

export async function generateDiagram(description) {
    const query = `
    mutation GenerateDiagram($description: String!) {
      generateDiagram(description: $description) {
        id
        title
        description
        d2Code
        svg
        createdAt
      }
    }
  `;
    const data = await graphqlRequest(query, { description });
    return data.generateDiagram;
}

export async function getDiagrams() {
    const query = `
    query GetDiagrams {
      getDiagrams {
        id
        title
        description
        svg
        createdAt
      }
    }
  `;
    const data = await graphqlRequest(query);
    return data.getDiagrams;
}
