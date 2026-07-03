import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { RadarrMovieAdd } from '../../src/tasksWorker/tasks/radarrMovieAdd.server.ts';
import type { MovieAdd } from '../../src/tasksWorker/types.ts';
import {
	FilteringProfilesEntity,
	GlobalSettingsEntity,
	QualityProfilesEntity
} from '@reiverr/db/entities';

const { postMovieMock } = vi.hoisted(() => ({
	postMovieMock: vi.fn().mockResolvedValue({ response: { ok: true } })
}));
let radarrMovieAddTask: RadarrMovieAdd;
let validInput: MovieAdd = {
	tmdbId: 1084244,
	name: 'Toy Story 5',
	language: 'french',
	userId: ''
};

beforeEach(() => {
	radarrMovieAddTask = new RadarrMovieAdd();
});

afterEach(() => {
	vi.restoreAllMocks();
});

// @ts-ignore
vi.mock(import('@reiverr/connectors'), () => {
	return {
		default: {
			getInstance: vi.fn().mockResolvedValue({
				radarrConnector: {
					postMovie: postMovieMock
				}
			})
		}
	};
});
// @ts-ignore
vi.mock(import('@reiverr/db/entities'), () => ({
	GlobalSettingsEntity: {
		getDefault: vi.fn().mockResolvedValue({ radarrRootFolderPath: '/movies' })
	},
	FilteringProfilesEntity: {
		getDefaultProfile: vi.fn().mockResolvedValue(() => ({
			id: 1,
			name: '1080p',
			qualities: ['1080p'],
			isDefault: true
		}))
	},
	QualityProfilesEntity: {
		findOne: vi.fn().mockResolvedValue({ id: 1, radarrId: 42 })
	}
}));

it('should add the movie successfully', async () => {
	const res = await radarrMovieAddTask.execute(validInput);

	expect(res).toBeUndefined();
	expect(postMovieMock).toHaveBeenCalledExactlyOnceWith({
		qualityProfileId: 42,
		monitored: true,
		tmdbId: 1084244,
		rootFolderPath: '/movies',
		addOptions: {
			monitor: 'movieOnly',
			searchForMovie: true,
			addMethod: 'manual'
		}
	});
});

it('should throw when input is invalid', async () => {
	await expect(radarrMovieAddTask.execute('test')).rejects.toThrow(
		'Invalid type: Expected Object but received "test"'
	);
});

it('should return if radarrRootFolderPath is not set', async () => {
	vi.mocked(GlobalSettingsEntity.getDefault, { partial: true }).mockResolvedValueOnce({
		radarrRootFolderPath: null
	});
	await expect(radarrMovieAddTask.execute(validInput)).resolves.toHaveProperty('id');
});

it('should return if not default filtering profile found', async () => {
	vi.mocked(FilteringProfilesEntity.getDefaultProfile).mockResolvedValueOnce(null);
	await expect(radarrMovieAddTask.execute(validInput)).resolves.toHaveProperty('id');
});

it('should return if not quality profile entity found', async () => {
	vi.mocked(QualityProfilesEntity.findOne).mockResolvedValueOnce(null);
	await expect(radarrMovieAddTask.execute(validInput)).resolves.toHaveProperty('id');
});

it('should return if a quality profile has been found but no radarrId is associated with it', async () => {
	vi.mocked(QualityProfilesEntity.findOne, { partial: true }).mockResolvedValueOnce({
		id: 1,
		radarrId: null
	} as unknown as QualityProfilesEntity);
	await expect(radarrMovieAddTask.execute(validInput)).resolves.toHaveProperty('id');
});

it('should return if postMovie result is not ok', async () => {
	postMovieMock.mockResolvedValueOnce({ response: { ok: false } });
	await expect(radarrMovieAddTask.execute(validInput)).resolves.toHaveProperty('id');
});
