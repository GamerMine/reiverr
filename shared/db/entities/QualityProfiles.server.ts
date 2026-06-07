import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { FilteringProfilesEntity } from '@reiverr/db/entities';
import { CustomFormatsEntity } from '@reiverr/db/entities';

@Entity({ name: 'qualityProfiles' })
@Unique(['filteringProfile', 'customFormat'])
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
}
