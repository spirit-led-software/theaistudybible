import { createInitialRoles, createStripeRoles } from "@services/role";
import { createInitialAdminUser } from "@services/user";
import { getDocumentVectorStore } from "@services/vector-db";
import { Handler } from "aws-lambda";

export const handler: Handler = async () => {
  try {
    console.log("Creating initial roles and users");
    await createInitialRoles();
    await createStripeRoles();
    await createInitialAdminUser();

    console.log("Creating vector store");
    const vectorDb = await getDocumentVectorStore(true);
    await vectorDb.ensureTableInDatabase();

    console.log("Database seeding complete");
  } catch (e) {
    console.log(e);
    throw e;
  }
};
