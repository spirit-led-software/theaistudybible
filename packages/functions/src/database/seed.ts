import { createInitialRoles } from "@core/services/role";
import { createInitialAdminUser } from "@core/services/user";
import { getVectorStore } from "@core/services/vector-db";
import { Handler } from "aws-lambda";

export const handler: Handler = async () => {
  try {
    console.log("Creating initial roles");
    await createInitialRoles();
    await createInitialAdminUser();

    console.log("Creating vector store");
    const vectorDb = await getVectorStore(true);
    await vectorDb.ensureTableInDatabase();

    console.log("Database seeding complete");
  } catch (e) {
    console.log(e);
    throw e;
  }
};
