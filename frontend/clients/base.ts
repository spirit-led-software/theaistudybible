export class BaseClient {
  validateResponse = (response: Response) => {
    if (!response.ok) {
      throw new Error(response.statusText);
    }
  };
}
