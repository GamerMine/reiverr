import { defineEnvVars } from '@sveltejs/kit/env';
import * as v from 'valibot';
import {
	OptionalBooleanSchema,
	OptionalStringSchema,
	OptionalUrlSchema,
	PortSchema,
	UrlSchema
} from '#lib/utils/schemas';

export const variables = defineEnvVars({
	DB_TYPE: {
		schema: v.picklist([
			'postgres',
			'aurora-postgres',
			'cockroachdb',
			'mariadb',
			'mysql',
			'aurora-mysql'
		])
	},
	APP_URL: { schema: UrlSchema, public: true },
	DB_HOST: { schema: v.string() },
	DB_PORT: { schema: PortSchema },
	DB_USERNAME: { schema: v.string() },
	DB_PASSWORD: { schema: v.string() },
	DB_DATABASE: { schema: v.string() },
	OIDC_ENABLED: { schema: OptionalBooleanSchema },
	OIDC_ONLY: { schema: OptionalBooleanSchema },
	OIDC_LABEL: { schema: OptionalStringSchema },
	OIDC_ISSUER: { schema: OptionalUrlSchema },
	OIDC_CLIENT_ID: { schema: OptionalStringSchema },
	OIDC_CLIENT_SECRET: { schema: OptionalStringSchema },
	OIDC_SCOPE: { schema: OptionalStringSchema },
	OIDC_GROUPS_CLAIM: { schema: OptionalStringSchema },
	OIDC_ADMINS_GROUP: { schema: OptionalStringSchema }
});
