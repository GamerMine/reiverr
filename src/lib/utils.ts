import { locale } from 'svelte-i18n';

export function formatMinutesToTime(minutes: number) {
	const days = Math.floor(minutes / 60 / 24);
	const hours = Math.floor((minutes / 60) % 24);
	const minutesLeft = Math.floor(minutes % 60);

	return `${days > 0 ? days + 'd ' : ''}${hours > 0 ? hours + 'h ' : ''}${
		days > 0 ? '' : minutesLeft + 'min'
	}`;
}

export function formatSize(size: number) {
	const gbs = size / 1024 / 1024 / 1024;
	const mbs = size / 1024 / 1024;

	if (gbs >= 1) {
		return `${gbs.toFixed(2)} GB`;
	} else {
		return `${mbs.toFixed(2)} MB`;
	}
}

export function formatDateToYearMonthDay(date: Date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');

	return `${year}-${month}-${day}`;
}

export function capitalize(str: string) {
	const strings = str.split(' ');
	return strings.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
}

export function tmdbDataFormat(str: string): string {
	return str.replace('& ', '').replace(' ', '_').replace('-', '_').toLowerCase();
}

export function arrayToQuery(key: string, array: Array<string>): string {
	let ret = '';

	array.forEach((elt) => (ret += key + '=' + elt + '&'));
	ret.slice(0, ret.length - 1);

	return ret;
}

export function setTmpLanguage(language: string) {
	locale.set(language);
}

export function portal(node: HTMLElement) {
	document.body.appendChild(node);

	return {
		destroy() {
			if (node.parentNode) {
				node.parentNode.removeChild(node);
			}
		}
	};
}