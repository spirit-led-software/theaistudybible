import { authConfig } from "@core/configs";
import {
  BadRequestResponse,
  InternalServerErrorResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { validApiHandlerSession } from "@services/session";
import { updateUser } from "@services/user";
import * as bcrypt from "bcryptjs";
import { ApiHandler } from "sst/node/api";
import { verifyPassword } from "../../../auth";

export const handler = ApiHandler(async (event) => {
  console.log("Received change password event:", event);

  const { previousPassword, newPassword } = JSON.parse(event.body ?? "{}");
  if (!previousPassword || !newPassword) {
    return BadRequestResponse("Missing previousPassword or newPassword");
  }

  try {
    const { isValid, userWithRoles } = await validApiHandlerSession();

    if (!isValid) {
      return UnauthorizedResponse();
    }

    if (!bcrypt.compareSync(previousPassword, userWithRoles.passwordHash!)) {
      return UnauthorizedResponse("Previous password is incorrect.");
    }

    if (previousPassword === newPassword) {
      return BadRequestResponse(
        "New password cannot be the same as the previous password"
      );
    }

    if (!verifyPassword(newPassword)) {
      return BadRequestResponse(
        "Password must be at least 8 characters long and contain at least 1 uppercase letter, 1 number, and 1 symbol."
      );
    }

    await updateUser(userWithRoles.id, {
      passwordHash: bcrypt.hashSync(newPassword, authConfig.bcrypt.saltRounds),
    });

    return OkResponse({
      message: "Password updated successfully",
    });
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
});
