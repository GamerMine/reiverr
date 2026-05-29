import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { FilteringProfilesEntity } from '$lib/entities/FilteringProfiles.server';
import { CustomFormatsEntity } from '$lib/entities/CustomFormats.server';

@Entity({ name: 'qualityProfiles' })
export class QualityProfilesEntity extends BaseEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@ManyToOne(() => FilteringProfilesEntity, (profile) => profile.id)
	filteringProfile: FilteringProfilesEntity;

	@ManyToOne(() => CustomFormatsEntity, (format) => format.id)
	customFormat: CustomFormatsEntity;

	@Column('integer', { nullable: true })
	radarrId: number | undefined;

	@Column('integer', { nullable: true })
	sonarrId: number | undefined;

	public static async createProfile(
		customFormat: CustomFormatsEntity,
		radarrId: number | undefined,
		sonarrId: number | undefined,
		filteringProfile: FilteringProfilesEntity
	) {
		const profile = new QualityProfilesEntity();
		profile.customFormat = customFormat;
		profile.radarrId = radarrId;
		profile.sonarrId = sonarrId;
		profile.filteringProfile = filteringProfile;

		await profile.save();
	}

	public static async profileExists(filteringProfileId: number, lang: string) {
		return !!(await this.findOne({
			where: { filteringProfile: { id: filteringProfileId }, customFormat: { lang: lang } }
		}));
	}
}
