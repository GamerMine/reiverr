export type TitleType = 'movie' | 'tv' | 'person';
export type TitleId = {
	id: number;
	provider: 'tmdb' | 'tvdb';
	type: TitleType;
};
