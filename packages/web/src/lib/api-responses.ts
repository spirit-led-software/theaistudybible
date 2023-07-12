import { NextResponse } from "next/server";

export const OkResponse = (data?: any) => {
  return NextResponse.json(
    data ?? {
      message: "Success",
    },
    {
      status: 200,
    }
  );
};

export const CreatedResponse = (data?: any) => {
  return NextResponse.json(
    data ?? {
      message: "Created",
    },
    {
      status: 201,
    }
  );
};

export const DeletedResponse = (identifier?: string) => {
  const message = identifier
    ? `Deleted ${identifier} successfully`
    : "Deleted successfully";
  return NextResponse.json(
    {
      message,
    },
    {
      status: 200,
    }
  );
};

export const BadRequestResponse = (message?: string) => {
  return NextResponse.json(
    {
      error: message ?? "Bad request",
    },
    {
      status: 400,
    }
  );
};

export const UnauthorizedResponse = (message?: string) => {
  return NextResponse.json(
    {
      error: message ?? "Unauthorized",
    },
    {
      status: 401,
    }
  );
};

export const NotFoundResponse = (message?: string) => {
  return NextResponse.json(
    {
      error: message ?? "Not found",
    },
    {
      status: 404,
    }
  );
};

export const ObjectNotFoundResponse = (identifier: string) => {
  return NextResponse.json(
    {
      error: `Object '${identifier}' not found.`,
    },
    {
      status: 404,
    }
  );
};

export const InternalServerErrorResponse = (message?: string) => {
  return NextResponse.json(
    {
      error: message ?? "Internal server error",
    },
    {
      status: 500,
    }
  );
};
