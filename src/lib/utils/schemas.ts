import * as v from 'valibot';

export const PortSchema = v.pipe(
	v.string(),
	v.transform(Number),
	v.number(),
	v.integer(),
	v.minValue(0),
	v.maxValue(65535)
);

export const OptionalBooleanSchema = v.optional(
	v.pipe(
		v.picklist(['true', 'false']),
		v.transform((value) => value === 'true')
	),
	'false'
);

export const OptionalStringSchema = v.optional(v.string());

export const OptionalNumberSchema = v.optional(v.number());

export const UrlSchema = v.pipe(
	v.string(),
	v.url(),
	v.transform((input) => new URL(input))
);

export const OptionalUrlSchema = v.optional(UrlSchema);

export const ApiSchema = v.object({ url: OptionalStringSchema, key: OptionalStringSchema });
