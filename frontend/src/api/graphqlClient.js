const GRAPHQL_URL = "http://localhost:5000/graphql";

export async function graphqlRequest(query, variables = {}) {
    const res = await fetch(GRAPHQL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables }),
    });

    const json = await res.json();

    if (json.errors?.length) {
        // Show backend error message
        throw new Error(json.errors[0].message);
    }

    return json.data;
}
