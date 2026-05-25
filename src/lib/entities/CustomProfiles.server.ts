import {BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {GlobalSettingsEntity} from "$lib/entities/GlobalSettings.server";

@Entity({name: 'customProfiles'})
export class CustomProfilesEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => GlobalSettingsEntity, (entity) => entity.downloadLanguages)
    globalSettings: GlobalSettingsEntity;

    @Column('text')
    lang: string;

    @Column('integer')
    sonarrId: number;

    @Column('integer')
    radarrId: number;
}