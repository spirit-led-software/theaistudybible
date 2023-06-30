export function validateResponse(response: Response) {
  let error = undefined;
  if (!response.ok) {
    error = new Error(response.statusText);
  }
  return {
    error,
  };
}
