import { GraphqlQueryError } from "@shopify/shopify-api";
import shopify from "./shopify.js";

const ADJECTIVES = [
  "autumn",
  "hidden",
  "bitter",
  "misty",
  "silent",
  "empty",
  "dry",
  "dark",
  "summer",
  "icy",
  "delicate",
  "quiet",
  "white",
  "cool",
  "spring",
  "winter",
  "patient",
  "twilight",
  "dawn",
  "crimson",
  "wispy",
  "weathered",
  "blue",
  "billowing",
  "broken",
  "cold",
  "damp",
  "falling",
  "frosty",
  "green",
  "long",
];

const NOUNS = [
  "waterfall",
  "river",
  "breeze",
  "moon",
  "rain",
  "wind",
  "sea",
  "morning",
  "snow",
  "lake",
  "sunset",
  "pine",
  "shadow",
  "leaf",
  "dawn",
  "glitter",
  "forest",
  "hill",
  "cloud",
  "meadow",
  "sun",
  "glade",
  "bird",
  "brook",
  "butterfly",
  "bush",
  "dew",
  "dust",
  "field",
  "fire",
  "flower",
];

export const DEFAULT_PRODUCTS_COUNT = 5;
const CREATE_PRODUCTS_MUTATION = `
  mutation populateProduct($input: ProductInput!) {
    productCreate(input: $input) {
      product {
        id
      }
    }
  }
`;

export default async function duplicateProduct( session,id) {
  const client = new shopify.api.clients.Graphql({ session });

  try {
      await client.query({
        data: {
          query: `mutation DuplicateProduct($productId: ID!,
      $newTitle: String!,
      $includeImages: Boolean,
      $newStatus: ProductStatus) {
      productDuplicate(productId: $productId,
        newTitle: $newTitle,
        includeImages: $includeImages,
        newStatus: $newStatus) {
        newProduct {
          id
          title
          vendor
          productType
          variants(first: 1) {
            nodes {
              id
              title
            }
          }
        }
        imageJob {
          id
          done
        }
        userErrors {
          field
          message
        }
      }
    }`,
          variables: {
            productId: `gid://shopify/Product/${id}`,
            newTitle: {title},
            includeImages: true,
            newStatus: "ACTIVE",
          },
        },
      });
  } catch (error) {
    if (error instanceof GraphqlQueryError) {
      throw new Error(
        `${error.message}\n${JSON.stringify(error.response, null, 2)}`
      );
    } else {
      throw error;
    }
  }
}

