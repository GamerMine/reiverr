const SEEN_KEY = 'notificationsSeenErrors';

function loadSeen(): string[] {
	if (typeof localStorage === 'undefined') return [];
	try {
		return JSON.parse(localStorage.getItem(SEEN_KEY) || '[]');
	} catch {
		return [];
	}
}

class TasksMenu {
	visible = $state(false);
	expanded = $state(false);
	/** True when a failed task has not been seen yet (drives the "!" badges). */
	unseenError = $state(false);
	seenErrors: string[] = loadSeen();

	open(expand = true) {
		this.visible = true;
		if (expand) this.expanded = true;
	}

	close() {
		this.visible = false;
		this.expanded = false;
	}

	toggleExpanded() {
		this.expanded = !this.expanded;
	}

	markErrorsSeen(uuids: string[]) {
		this.seenErrors = uuids;
		localStorage.setItem(SEEN_KEY, JSON.stringify(uuids));
		this.unseenError = false;
	}
}

export const tasksMenu = new TasksMenu();
