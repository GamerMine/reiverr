import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'oidcIdentity' })
export class OidcIdentityEntity extends BaseEntity {
	@PrimaryColumn('text')
	userId: string;

	@Column('text')
	sub: string;

	public static async get(sub: string) {
		return await this.findOne({ where: { sub } });
	}
}
