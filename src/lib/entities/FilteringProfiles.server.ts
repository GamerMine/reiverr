import {BaseEntity, Column, Entity, PrimaryGeneratedColumn} from "typeorm";
import type {FilteringProfile} from "$lib/entities/Types";

@Entity({name: "filteringProfiles"})
export class FilteringProfilesEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('text')
    name: string;

    @Column('text')
    language: string;

    @Column('simple-array')
    qualities: string[];

    public static async getAll(): Promise<FilteringProfile[]> {
        let profiles: FilteringProfile[] = [];

        for (const profile of (await this.find())) {
            profiles.push({
                name: profile.name,
                language: profile.language,
                qualities: profile.qualities,
            });
        }

        return profiles;
    }

    public static async createFilteringProfile(newProfile: FilteringProfile) {
        const profile = new FilteringProfilesEntity();
        profile.name = newProfile.name;
        profile.language = newProfile.language;
        profile.qualities = newProfile.qualities;

        await profile.save();
    }
}