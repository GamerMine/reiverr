import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';
import { defaultUserSettings, type UserSettings } from '$lib/entities/Types';

@Entity({ name: 'userSettings' })
export class UserSettingsEntity extends BaseEntity {
	@PrimaryColumn('text')
	userId: string;

	// Interface
	@Column('boolean', { default: defaultUserSettings.interface.autoplayTrailers })
	autoplayTrailers: boolean;

	@Column('text', { default: defaultUserSettings.interface.language })
	language: string;

	@Column('integer', { default: defaultUserSettings.interface.animationDuration })
	animationDuration: number;

	// Discover
	@Column('text', { default: defaultUserSettings.discover.region })
	discoverRegion: string;

	@Column('boolean', { default: defaultUserSettings.discover.excludeLibraryItems })
	discoverExcludeLibraryItems: boolean;

	@Column('text', { default: defaultUserSettings.discover.includedLanguages })
	discoverIncludedLanguages: string;

	// Radarr
	@Column('text', {
		nullable: true,
		default: defaultUserSettings.radarr.defaultQualityProfileId
	})
	radarrQualityProfileId: string | undefined;

	public static async getUserSettings(userId: string) {
		const userSettings = await this.findOne({ where: { userId } });

		if (!userSettings) {
			const defaultUserSettings = new UserSettingsEntity();
			defaultUserSettings.userId = userId;
			await defaultUserSettings.save();

			return this.get(defaultUserSettings);
		}

		return this.get(userSettings);
	}

	static get(userSettingsEntity: UserSettingsEntity): UserSettings {
		return {
			interface: {
				autoplayTrailers: userSettingsEntity.autoplayTrailers,
				animationDuration: userSettingsEntity.animationDuration,
				language: userSettingsEntity.language
			},
			discover: {
				region: userSettingsEntity.discoverRegion,
				excludeLibraryItems: userSettingsEntity.discoverExcludeLibraryItems,
				includedLanguages: userSettingsEntity.discoverIncludedLanguages
			},
			radarr: {
				defaultQualityProfileId: userSettingsEntity.radarrQualityProfileId
			}
		};
	}

	public static async setUserSettings(userId: string, newUserSettings: UserSettings) {
		const userSettings = await this.findOne({ where: { userId } });

		if (!userSettings) {
			return false;
		}

		this.set(userSettings, newUserSettings);
		await userSettings.save();
	}

	static set(userSettingsEntity: UserSettingsEntity, newUserSettings: UserSettings) {
		userSettingsEntity.language = newUserSettings.interface.language;
		userSettingsEntity.autoplayTrailers = newUserSettings.interface.autoplayTrailers;
		userSettingsEntity.animationDuration = newUserSettings.interface.animationDuration;

		userSettingsEntity.discoverRegion = newUserSettings.discover.region;
		userSettingsEntity.discoverIncludedLanguages = newUserSettings.discover.includedLanguages;
		userSettingsEntity.discoverExcludeLibraryItems = newUserSettings.discover.excludeLibraryItems;

		userSettingsEntity.radarrQualityProfileId = newUserSettings.radarr.defaultQualityProfileId;
	}
}
