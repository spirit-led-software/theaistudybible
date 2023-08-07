export const OkResponse = (data?: any) => {
  return {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(
      data ?? {
        message: "Ok",
      }
    ),
  };
};

export const CreatedResponse = (data?: any) => {
  return {
    status: 201,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(
      data ?? {
        message: "Created successfully",
      }
    ),
  };
};

export const DeletedResponse = (identifier?: string) => {
  const message = identifier
    ? `Deleted ${identifier} successfully`
    : "Deleted successfully";
  return {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
    }),
  };
};

export const TooManyRequestsResponse = (message?: string) => {
  return {
    status: 429,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      error: message ?? "Too many requests",
    }),
  };
};

export const BadRequestResponse = (message?: string) => {
  return {
    status: 400,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      error: message ?? "Bad request",
    }),
  };
};

export const UnauthorizedResponse = (message?: string) => {
  return {
    status: 401,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      error: message ?? "Unauthorized",
    }),
  };
};

export const NotFoundResponse = (message?: string) => {
  return {
    status: 404,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      error: message ?? "Not found",
    }),
  };
};

export const ObjectNotFoundResponse = (identifier: string) => {
  return {
    status: 404,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      error: `Object ${identifier} not found`,
    }),
  };
};

export const InternalServerErrorResponse = (message?: string) => {
  return {
    status: 500,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      error: message ?? "Internal server error",
    }),
  };
};
