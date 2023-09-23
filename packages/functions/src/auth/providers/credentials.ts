import { BadRequestResponse } from "@lib/api-responses";
import { getUserByEmail } from "@services/user";
import type {
  APIGatewayProxyEventQueryStringParameters,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";
import { createSigner, createVerifier } from "fast-jwt";
import { useBody, useDomainName, usePath, useQueryParams } from "sst/node/api";
import { createAdapter, getPrivateKey, getPublicKey } from "sst/node/auth";
import isEmail from "validator/lib/isEmail";
import { verifyPassword } from "..";

interface EmailPasswordConfig {
  onRegister: (
    link: string,
    claims: {
      email: string;
      password: string;
    }
  ) => Promise<APIGatewayProxyStructuredResultV2>;
  onRegisterCallback: (
    email: string,
    password: string
  ) => Promise<APIGatewayProxyStructuredResultV2>;
  onLogin: (claims: {
    email: string;
    password: string;
  }) => Promise<APIGatewayProxyStructuredResultV2>;
  onForgotPassword: (
    link: string,
    claims: APIGatewayProxyEventQueryStringParameters
  ) => Promise<APIGatewayProxyStructuredResultV2>;
  onForgotPasswordCallback: (
    token: string
  ) => Promise<APIGatewayProxyStructuredResultV2>;
  onResetPassword: (
    email: string,
    password: string
  ) => Promise<APIGatewayProxyStructuredResultV2>;
  onError: (error: any) => Promise<APIGatewayProxyStructuredResultV2>;
}

export const CredentialsAdapter = createAdapter(
  (config: EmailPasswordConfig) => {
    return async function () {
      const [step] = usePath().slice(-1);
      if (step === "register") {
        try {
          const signer = createSigner({
            expiresIn: 1000 * 60 * 10,
            key: getPrivateKey(),
            algorithm: "RS512",
          });
          const registerCallback =
            "https://" +
            [
              useDomainName(),
              ...usePath().slice(0, -1),
              "register-callback",
            ].join("/");
          const claims: {
            email: string;
            password: string;
          } = JSON.parse(useBody() || "{}");
          if (!claims.email) {
            return BadRequestResponse("Email is required");
          }
          const user = await getUserByEmail(claims.email);
          if (user) {
            return BadRequestResponse("A user already exists with this email");
          }
          if (!isEmail(claims.email)) {
            return BadRequestResponse("Invalid email provided");
          }
          if (!claims.password) {
            return BadRequestResponse("Password is required");
          }
          if (!verifyPassword(claims.password)) {
            return BadRequestResponse(
              "Password must be at least 8 characters long and contain at least 1 uppercase letter, 1 number, and 1 symbol"
            );
          }
          const url = new URL(registerCallback);
          url.searchParams.append("token", signer(claims));
          return config.onRegister(url.toString(), claims);
        } catch (error: any) {
          return config.onError(error);
        }
      } else if (step === "register-callback") {
        const verifier = createVerifier({
          algorithms: ["RS512"],
          key: getPublicKey(),
        });
        const claims = useQueryParams();
        if (!claims.token) {
          return BadRequestResponse("Token is required");
        }
        const jwt = verifier(claims.token);
        if (!jwt) {
          return BadRequestResponse("Invalid token");
        }
        const email = jwt.email;
        if (!email) {
          return BadRequestResponse("Email is required");
        }
        if (!isEmail(email)) {
          return BadRequestResponse("Invalid email provided");
        }
        const password = jwt.password;
        if (!password) {
          return BadRequestResponse("Password is required");
        }
        if (!verifyPassword(password)) {
          return BadRequestResponse(
            "Password must be at least 8 characters long and contain at least 1 uppercase letter, 1 number, and 1 symbol"
          );
        }
        return config.onRegisterCallback(email, password);
      } else if (step === "login") {
        try {
          const claims: {
            email: string;
            password: string;
          } = JSON.parse(useBody() || "{}");
          return config.onLogin(claims);
        } catch (error: any) {
          return config.onError(error);
        }
      } else if (step === "forgot-password") {
        try {
          const signer = createSigner({
            expiresIn: 1000 * 60 * 10,
            key: getPrivateKey(),
            algorithm: "RS512",
          });
          const forgotPasswordCallback =
            "https://" +
            [
              useDomainName(),
              ...usePath().slice(0, -1),
              "forgot-password-callback",
            ].join("/");
          const url = new URL(forgotPasswordCallback);
          const claims = useQueryParams();
          const email = claims.email;
          if (!email) {
            return BadRequestResponse("Email is required");
          }
          const user = await getUserByEmail(email);
          if (!user) {
            return BadRequestResponse("User not found");
          }
          url.searchParams.append("token", signer(claims));
          return config.onForgotPassword(url.toString(), claims);
        } catch (error: any) {
          return config.onError(error);
        }
      } else if (step === "forgot-password-callback") {
        try {
          const verifier = createVerifier({
            algorithms: ["RS512"],
            key: getPublicKey(),
          });
          const claims = useQueryParams();
          const token = claims.token;
          if (!token) {
            return BadRequestResponse("Token is required");
          }
          const jwt = verifier(token);
          if (!jwt) {
            return BadRequestResponse("Invalid token");
          }
          const email = jwt.email;
          if (!email) {
            return BadRequestResponse("Email is required");
          }
          return config.onForgotPasswordCallback(token);
        } catch (error: any) {
          return config.onError(error);
        }
      } else if (step === "reset-password") {
        try {
          const verifier = createVerifier({
            algorithms: ["RS512"],
            key: getPublicKey(),
          });
          const claims: {
            token: string;
            password: string;
          } = JSON.parse(useBody() || "{}");
          if (!claims.token) {
            return BadRequestResponse("Token is required");
          }
          if (!claims.password) {
            return BadRequestResponse("Password is required");
          }
          if (!verifyPassword(claims.password)) {
            return BadRequestResponse("Password is not strong enough");
          }
          const jwt = verifier(claims.token);
          if (!jwt) {
            return BadRequestResponse("Invalid token");
          }
          const email = jwt.email;
          if (!email) {
            return BadRequestResponse("Email is required");
          }
          return config.onResetPassword(email, claims.password);
        } catch (error: any) {
          return config.onError(error);
        }
      } else {
        return BadRequestResponse("Invalid step");
      }
    };
  }
);
