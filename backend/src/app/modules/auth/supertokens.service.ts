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
    this.createRoles();
    this.createAdminUser()
  }

  async createRoles() {
    UserRoles.createNewRoleOrAddPermissions('admin', [
      'read:all',
      'delete:all',
      'update:all',
      'create:all',
    ]);

    UserRoles.createNewRoleOrAddPermissions('user', [
      'read:own',
      'delete:own',
      'update:own',
      'create:own',
    ]);
  }

  async createAdminUser() {
    const response = await ThirdPartyEmailPassword.emailPasswordSignUp(
      'admin@chatesv.com',
      'admin',
    );
    if (response.status === 'OK') {
      await UserRoles.addRoleToUser(response.user.id, 'admin');
    }
  }
}
