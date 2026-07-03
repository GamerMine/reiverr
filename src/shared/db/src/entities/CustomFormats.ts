import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { GlobalSettingsEntity } from '../entities.js';

@Entity({ name: 'customFormats' })
export class CustomFormatsEntity extends BaseEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@ManyToOne(() => GlobalSettingsEntity, (entity) => entity.downloadLanguages)
	globalSettings: GlobalSettingsEntity;

	@Column('text', { unique: true })
	lang: string;

	@Column('integer', { nullable: true })
	sonarrId: number | null;

	@Column('integer', { nullable: true })
	radarrId: number | null;

	/**
	 * Get all custom formats entries as a map keyed by lang
	 */
	public static async getAll() {
		const profiles = new Map<string, CustomFormatsEntity>();

		for (const profile of await this.find()) {
			profiles.set(profile.lang, profile);
		}

		return profiles;
	}

	public static async upsertFormats(langs: string[]) {
		const globalSettings = await GlobalSettingsEntity.getDefault();
		if (!globalSettings) throw 'Global settings must exists before creating a format';
		return await this.upsert(
			langs.map((lang) => ({ lang, globalSettings })),
			{
				conflictPaths: ['lang'],
				skipUpdateIfNoValuesChanged: true
			}
		);
	}
}
