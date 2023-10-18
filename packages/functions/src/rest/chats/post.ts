import {
  CreatedResponse,
  InternalServerErrorResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { createChat } from "@services/chat";
import { validApiHandlerSession } from "@services/session";
import { getChatMemoryVectorStore } from "@services/vector-db";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  const data = JSON.parse(event.body ?? "{}");
  try {
    const { isValid, userWithRoles } = await validApiHandlerSession();
    if (!isValid) {
      return UnauthorizedResponse("You must be logged in");
    }
    const chat = await createChat({
      ...data,
      userId: userWithRoles.id,
    });
    const memoryVectorStore = await getChatMemoryVectorStore(chat.id);
    await memoryVectorStore.ensureTableInDatabase();
    return CreatedResponse(chat);
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
});
