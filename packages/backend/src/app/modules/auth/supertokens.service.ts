import { AuthConfig, GeneralConfig } from '@configs/types';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import supertokens from 'supertokens-node';
import Dashboard from 'supertokens-node/recipe/dashboard';
import Session from 'supertokens-node/recipe/session';
import ThirdPartyEmailPassword from 'supertokens-node/recipe/thirdpartyemailpassword';
import UserRoles from 'supertokens-node/recipe/userroles';

@Injectable()
export class SupertokensService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(private readonly configService: ConfigService) {
    const authConfig: AuthConfig = this.configService.get('auth');
    const generalConfig: GeneralConfig = this.configService.get('general');
    supertokens.init({
      appInfo: {
        appName: authConfig.appName,
        apiDomain: generalConfig.apiUrl,
        apiBasePath: `${generalConfig.apiBasePath}/auth`,
        websiteDomain: generalConfig.websiteUrl,
        websiteBasePath: '/auth',
      },
      supertokens: {
        connectionURI: authConfig.connectionURI,
        apiKey: authConfig.apiKey,
      },
      framework: 'express',
      recipeList: [
        ThirdPartyEmailPassword.init({
          override: {
            apis: (originalImplementation) => {
              return {
                ...originalImplementation,
              };
            },
          },
          signUpFeature: {
            formFields: [
              {
                id: 'firstName',
                optional: false,
                validate: async (value) => {
                  if (value.length < 3) {
                    throw new Error(
                      'First name must be at least 3 letters long',
                    );
                  }
                  return value;
                },
              },
              {
                id: 'lastName',
                optional: true,
              },
            ],
          },
          providers: [
            ThirdPartyEmailPassword.Google({
              clientId: authConfig.google.clientId,
              clientSecret: authConfig.google.clientSecret,
            }),
          ],
        }),
        Dashboard.init(),
        Session.init(),
        UserRoles.init(),
      ],
    });
    this.logger.log('Initialized Supertokens');
    this.createInitialUserData(authConfig.adminEmail, authConfig.adminPassword);
    this.logger.log('Created initial user data');
  }

  async createInitialUserData(adminEmail: string, adminPassword: string) {
    const roles = await UserRoles.getAllRoles();
    if (roles.status !== 'OK') {
      this.logger.error('Unable to get roles');
      return;
    }

    let createAdminUser = true;
    if (!roles.roles.includes('admin')) {
      let createAdminRoleResponse =
        await UserRoles.createNewRoleOrAddPermissions('admin', [
          'read:all',
          'delete:all',
          'update:all',
          'create:all',
        ]);
      if (createAdminRoleResponse.status !== 'OK') {
        this.logger.error('Unable to create admin role');
        createAdminUser = false;
      }
    } else {
      this.logger.log('Admin role already exists');
    }

    if (createAdminUser) {
      await this.createAdminUser(adminEmail, adminPassword);
    }

    if (!roles.roles.includes('user')) {
      const createUserRoleResponse =
        await UserRoles.createNewRoleOrAddPermissions('user', [
          'read:own',
          'delete:own',
          'update:own',
          'create:own',
        ]);

      if (createUserRoleResponse.status !== 'OK') {
        this.logger.error('Unable to create user role');
      }
    } else {
      this.logger.log('User role already exists');
    }
  }

  async createAdminUser(username: string, password: string) {
    const users = await ThirdPartyEmailPassword.getUsersByEmail(username);
    if (users.length > 0) {
      this.logger.log('Admin user already exists');
      return;
    }

    const createUserResponse =
      await ThirdPartyEmailPassword.emailPasswordSignUp(username, password);
    if (createUserResponse.status !== 'OK') {
      this.logger.error(
        `Unable to create admin user ${username} ${createUserResponse.status}`,
      );
      return;
    }

    const addRoleResponse = await UserRoles.addRoleToUser(
      createUserResponse.user.id,
      'admin',
    );
    if (addRoleResponse.status !== 'OK') {
      this.logger.error('Unable to add admin role to admin user');
    }
  }
}
