import { apiConfig } from "@/configs";
import { Devo } from "@/types";
import { BaseClient } from "./base";

export class DevoClient extends BaseClient {
  getDevo = async (id: string): Promise<Devo> => {
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
    this.validateResponse(response);
    const data = await response.json();
    return data;
  };

  getDevos = async () => {
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
    this.validateResponse(response);
    const data = await response.json();
    let devos: Devo[] = data.entities;
    devos = devos.sort((a, b) => {
      return a.created > b.created ? -1 : 1;
    });
    return devos;
  };
}
