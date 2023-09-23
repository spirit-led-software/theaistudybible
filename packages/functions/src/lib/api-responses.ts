import type { APIGatewayProxyStructuredResultV2 } from "aws-lambda";

export const OkResponse = (data?: any): APIGatewayProxyStructuredResultV2 => {
  return {
    statusCode: 200,
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

export const CreatedResponse = (
  data?: any
): APIGatewayProxyStructuredResultV2 => {
  return {
    statusCode: 201,
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

export const DeletedResponse = (
  identifier?: string
): APIGatewayProxyStructuredResultV2 => {
  const message = identifier
    ? `Deleted ${identifier} successfully`
    : "Deleted successfully";
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
    }),
  };
};

export const TooManyRequestsResponse = (
  message?: string
): APIGatewayProxyStructuredResultV2 => {
  return {
    statusCode: 429,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      error: message ?? "Too many requests",
    }),
  };
};

export const BadRequestResponse = (
  message?: string
): APIGatewayProxyStructuredResultV2 => {
  return {
    statusCode: 400,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      error: message ?? "Bad request",
    }),
  };
};

export const UnauthorizedResponse = (
  message?: string
): APIGatewayProxyStructuredResultV2 => {
  return {
    statusCode: 401,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      error: message ?? "Unauthorized",
    }),
  };
};

export const ForbiddenResponse = (
  message?: string
): APIGatewayProxyStructuredResultV2 => {
  return {
    statusCode: 403,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      error: message ?? "Forbidden",
    }),
  };
};

export const NotFoundResponse = (
  message?: string
): APIGatewayProxyStructuredResultV2 => {
  return {
    statusCode: 404,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      error: message ?? "Not found",
    }),
  };
};

export const ObjectNotFoundResponse = (
  identifier: string
): APIGatewayProxyStructuredResultV2 => {
  return {
    statusCode: 404,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      error: `Object ${identifier} not found`,
    }),
  };
};

export const InternalServerErrorResponse = (
  message?: string
): APIGatewayProxyStructuredResultV2 => {
  return {
    statusCode: 500,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      error: message ?? "Internal server error",
    }),
  };
};

export const RedirectResponse = (
  url: string
): APIGatewayProxyStructuredResultV2 => {
  return {
    statusCode: 302,
    headers: {
      Location: url,
    },
  };
};
