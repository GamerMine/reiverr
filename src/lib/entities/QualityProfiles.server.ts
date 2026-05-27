import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { FilteringProfilesEntity } from '$lib/entities/FilteringProfiles.server';

@Entity({ name: 'qualityProfiles' })
export class QualityProfilesEntity extends BaseEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@ManyToOne(() => FilteringProfilesEntity, (profile) => profile.id)
	filteringProfile: FilteringProfilesEntity;

	@Column('text')
	lang: string;

	@Column('integer', { nullable: true })
	radarrId: number | undefined;

	@Column('integer', { nullable: true })
	sonarrId: number | undefined;

	public static async createProfile(
		lang: string,
		radarrId: number | undefined,
		sonarrId: number | undefined
	) {
		const profile = new QualityProfilesEntity();
		profile.lang = lang;
		profile.radarrId = radarrId;
		profile.sonarrId = sonarrId;
	}

	public static async profileExists(filteringProfileId: number, lang: string) {
		return !!(await this.findOne({
			where: { filteringProfile: { id: filteringProfileId }, lang: lang }
		}));
	}
}
