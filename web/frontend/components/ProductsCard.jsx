import { useState } from "react";
import { Card, TextField } from "@shopify/polaris";


import { useAuthenticatedFetch } from "../hooks";
import { useEffect } from "react";

export function ProductsCard() {
  const fetch = useAuthenticatedFetch();

  const [isLoading, setIsLoading] = useState(false);
  // store id of product from inputbox
  const [ProductId, setProductId] = useState("");
  // store product variants
  const [Productvarients, setProductvarients] = useState(null);
  // store New generated Duplicate product id
  const [NewProductid, setNewProductid] = useState(null);

   // create duplicate  of product here
  const handlePopulate = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/products/duplicate", {
        method: "POST",
        body: JSON.stringify({ id: ProductId }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      // set all variants of product
      data.sucess &&
        setProductvarients(
          data.data.productDuplicate.newProduct.variants.nodes
        );
      // set newproduct(duplicat productid) id
      data.sucess &&
        setNewProductid({
          MainProductId: data.data.productDuplicate.newProduct.id,
        });
    } catch (error) {
      console.log(error);
    }
    setIsLoading(false);
  };

  // Update Variant & tags of product from here
  useEffect(() => {
    const updateVariants = async () => {
      try {
        await fetch("/api/products/updatevariants", {
          method: "POST",
          body: JSON.stringify({ data: Productvarients, ...NewProductid }),
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        console.log(error);
      }
    };

    updateVariants();
  }, [NewProductid]);

  return (
    <>
      <Card
        title="Product duplicate "
        sectioned
        primaryFooterAction={{
          content: "Duplicate Now",
          onAction: handlePopulate,
          loading: isLoading,
        }}
      >
        <TextField
          label="Product Id"
          value={ProductId}
          onChange={setProductId}
          autoComplete="off"
        />
      </Card>
    </>
  );
}
