import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import type { FilteringProfile } from '../types';

@Entity({ name: 'filteringProfiles' })
export class FilteringProfilesEntity extends BaseEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column('text')
	name: string;

	@Column('simple-array')
	qualities: string[];

	@Column('boolean')
	isDefault: boolean;

	public static async getAll(server: boolean = false): Promise<FilteringProfile[]> {
		const profiles: FilteringProfile[] = [];
		const entities = await this.find();

		if (server) {
			return entities;
		}

		for (const profile of entities) {
			profiles.push({
				id: profile.id,
				name: profile.name,
				qualities: profile.qualities,
				isDefault: profile.isDefault
			});
		}

		return profiles;
	}

	public static async getDefaultProfile() {
		return await this.findOne({ where: { isDefault: true } });
	}

	public static async createFilteringProfile(newProfile: FilteringProfile) {
		const profile = new FilteringProfilesEntity();
		return await this.setProfile(profile, newProfile);
	}

	public static async editFilteringProfile(newProfile: FilteringProfile) {
		const profile = await this.findOne({ where: { id: newProfile.id } });

		if (!profile) throw 'Cannot edit an inexistent Filtering Profile';

		return await this.setProfile(profile, newProfile);
	}

	public static async deleteFilteringProfile(id: number) {
		await this.delete({ id: id });
	}

	private static async setProfile(
		profile: FilteringProfilesEntity,
		newProfile: FilteringProfile
	) {
		profile.name = newProfile.name;
		profile.qualities = newProfile.qualities;
		profile.isDefault = newProfile.isDefault;

		if (newProfile.isDefault) {
			await this.update({ isDefault: true }, { isDefault: false });
		}

		await profile.save();

		return profile;
	}
}
