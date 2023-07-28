// @ts-check
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";

import shopify from "./shopify.js";
import GDPRWebhookHandlers from "./gdpr.js";


const PORT = parseInt(
  process.env.BACKEND_PORT || process.env.PORT || "3000",
  10
);

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

const app = express();

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: GDPRWebhookHandlers })
);

// If you are adding routes outside of the /api path, remember to
// also add a proxy rule for them in web/frontend/vite.config.js

app.use("/api/*", shopify.validateAuthenticatedSession());

app.use(express.json());

app.get("/api/products/count", async (_req, res) => {
  const countData = await shopify.api.rest.Product.count({
    session: res.locals.shopify.session,
  });
  res.status(200).send(countData);
});


// Duplicate part start here 
// Duplicate product Api

app.post("/api/products/duplicate", async (_req, res) => {

  let session = res.locals.shopify.session;
  const client = new shopify.api.clients.Graphql({ session });
 
  // fro catch response
  let response;
  try {
    response = await client.query({
      data: {
        query: `mutation DuplicateProduct($productId: ID!,
      $newTitle: String!,
      $includeImages: Boolean,
      $newStatus: ProductStatus,
) {
      productDuplicate(productId: $productId,
        newTitle: $newTitle,
        includeImages: $includeImages,
        newStatus: $newStatus,
        ), 
       {
        newProduct {
          id
          title
          tags
          vendor
          productType
          variants(first: 3) {
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
          productId: `gid://shopify/Product/${_req.body.id}`,
          newTitle: "free",
          includeImages: true,
          newStatus: "ACTIVE",
        },
      },
    })
    res.status(201).send({ ...response?.body, sucess:true });
  } catch (error) {
    console.log("app error" + error);
    res.status(401).send({ error, sucess:false });
  }

});

// update Varients

app.post("/api/products/updatevariants", async (_req, res) => {
  let session = res.locals.shopify.session;

  const d = _req.body.data.map(({ id }) => {
    return { id: id, price: 0 };
  });

  const client = new shopify.api.clients.Graphql({ session });
  let response;
  try {
    (response = await client.query({
      data: {
        query: `mutation addTags($id: ID!, $tags: [String!]!) {
  tagsAdd(id: $id, tags: $tags) {
    node {
      id
    }
    userErrors {
      message
    }
  }
}
`,
        variables: {
          id: _req.body.MainProductId,
          tags: "get Free",
        },
      },
    })),
      (response = await client.query({
        data: {
          query: `mutation productVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkUpdate(productId: $productId, variants: $variants) {
      product {
        id
      }
      productVariants {
        id
        price
      }
      userErrors {
        field
        message
      }
    }
  }
  `,
          variables: {
            productId: _req.body.MainProductId,
            variants: d,
          },
        },
      }));

    res.status(201).send(response);
  } catch (error) {
    res.status(401).send(error);
    console.log("app error" + error);
  }
});

// shopify config
app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(readFileSync(join(STATIC_PATH, "index.html")));
});

app.listen(PORT);
