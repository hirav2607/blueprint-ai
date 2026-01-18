const API_URL =
  import.meta.env.VITE_GRAPHQL_URL || "http://localhost:5000/graphql";

export async function gqlRequest(query, variables = {}) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();

  if (json.errors?.length) {
    throw new Error(json.errors[0].message);
  }

  return json.data;
}

export async function generateDiagram(description, options = {}) {
  const query = `
    mutation GenerateDiagram($description: String!, $options: DiagramOptionsInput) {
      generateDiagram(description: $description, options: $options) {
        id
        title
        description
        d2Code
        svg
        createdAt
        diagramType
        direction
        detailLevel
        withIcons
        withContainers
        layout
      }
    }
  `;

  const data = await gqlRequest(query, { description, options });
  return data.generateDiagram;
}

export async function getDiagrams() {
  const query = `
    query GetDiagrams {
      diagrams {
        id
        title
        description
        d2Code
        svg
        createdAt
        diagramType
        direction
        detailLevel
        withIcons
        withContainers
        layout
      }
    }
  `;

  const data = await gqlRequest(query);
  return data.diagrams;
}

// ✅ THIS is required for share link route
export async function getDiagramById(id) {
  const query = `
    query Diagram($id: ID!) {
      diagram(id: $id) {
        id
        title
        description
        d2Code
        svg
        createdAt
        diagramType
        direction
        detailLevel
        withIcons
        withContainers
        layout
      }
    }
  `;

  const data = await gqlRequest(query, { id });
  return data.diagram;
}
