import { createInitialRoles } from "@core/services/role";
import { createInitialAdminUser } from "@core/services/user";
import { Handler } from "aws-lambda";

export const handler: Handler = async (event, _) => {
  try {
    await createInitialRoles();
    await createInitialAdminUser();
  } catch (e) {
    console.log(e);
    throw e;
  }
};
