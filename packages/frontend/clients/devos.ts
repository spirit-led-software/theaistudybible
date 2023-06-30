import { apiConfig } from "@/configs";
import { Devo } from "@/types";
import { validateResponse } from "./base";

export async function getDevo(id: string) {
  let error = undefined;
  const response = await fetch(
    `${apiConfig.apiUrl}${apiConfig.apiBasePath}/devotionals/${id}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    }
  );
  const { error: valError } = validateResponse(response);
  error = valError;
  const data: Devo = await response.json();
  return {
    devo: data,
    error,
  };
}

export async function getDevos() {
  let error = undefined;
  const response = await fetch(
    `${apiConfig.apiUrl}${apiConfig.apiBasePath}/devotionals`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    }
  );
  const { error: valError } = validateResponse(response);
  error = valError;

  const data = await response.json();
  let devos: Devo[] = data.entities;
  devos = devos.sort((a, b) => {
    return a.created > b.created ? -1 : 1;
  });
  return { devos, error };
}
