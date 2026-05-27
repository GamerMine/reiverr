import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { GlobalSettingsEntity } from '$lib/entities/GlobalSettings.server';

@Entity({ name: 'customFormats' })
export class CustomFormatsEntity extends BaseEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@ManyToOne(() => GlobalSettingsEntity, (entity) => entity.downloadLanguages)
	globalSettings: GlobalSettingsEntity;

	@Column('text')
	lang: string;

	@Column('integer', { nullable: true })
	sonarrId: number | undefined;

	@Column('integer', { nullable: true })
	radarrId: number | undefined;

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

	public static async createFormat(
		lang: string,
		radarrId: number | undefined,
		sonarrId: number | undefined
	) {
		const globalSettings = await GlobalSettingsEntity.getDefault();
		if (!globalSettings) throw 'Global settings must exists before creating a format';
		const customFormat = new CustomFormatsEntity();
		customFormat.lang = lang;
		customFormat.radarrId = radarrId;
		customFormat.sonarrId = sonarrId;
		customFormat.globalSettings = globalSettings;

		await customFormat.save();
	}

	public static async deleteFormat(id: number) {
		await this.delete({ id: id });
	}
}
