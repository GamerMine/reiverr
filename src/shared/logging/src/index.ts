export enum LogLevel {
	DEBUG = 'DEBUG',
	INFO = 'INFO',
	WARNING = 'WARNING',
	ERROR = 'ERROR'
}

const style: Map<LogLevel, string> = new Map([
	[LogLevel.DEBUG, '\x1b[90m'],
	[LogLevel.INFO, '\x1b[96m'],
	[LogLevel.WARNING, '\x1b[33m'],
	[LogLevel.ERROR, '\x1b[101m']
]);
const reset = '\x1b[0m';
const bold = '\x1b[1m';

class Logger {
	private static loggerInstances: Map<string, Logger> = new Map();

	private readonly name: string;

	private constructor(loggerName: string) {
		this.name = loggerName;
	}

	public static getLogger(loggerName: string) {
		if (!Logger.loggerInstances.has(loggerName)) {
			const instance = new Logger(loggerName);
			Logger.loggerInstances.set(loggerName, instance);
			return instance;
		}

		return Logger.loggerInstances.get(loggerName);
	}

	public log(level: LogLevel, message: string) {
		const datetime = new Date().toLocaleString();

		console.log(
			`${datetime} ${bold}[${this.name}]${reset} ${style.get(level)}${level}${reset}: ${message}`
		);
	}
}

export default Logger;
