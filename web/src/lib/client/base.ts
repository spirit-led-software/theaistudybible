export function validateResponse(
  response: Response,
  acceptableStatusCodes: number[] = [200]
) {
  let error = undefined;
  if (!acceptableStatusCodes.includes(response.status)) {
    error = new Error(response.statusText);
  }
  return {
    error,
  };
}
