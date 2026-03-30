import Notification from '$lib/components/common/misc/notification/Notification.svelte';
import type {Component} from 'svelte';

export type NotificationItem = {
    id: symbol;
    component: Component<any, any, any>;
    props: Record<string, any>;
    timeout: NodeJS.Timeout | undefined;
    duration: number;
    height: number;
};

class NotificationStore {
    _stack: NotificationItem[] = $state([])

    get stack() {
        return this._stack
    }

    create(
        component: Component<any, any, any>,
        props: Record<string, any>,
        duration = 5000
    ) {
        const id = Symbol();
        const item: NotificationItem = {
            id,
            component,
            props,
            timeout: undefined,
            duration,
            height: 0
        };

        if (duration > 0) {
            item.timeout = setTimeout(() => {
                this.close(id);
            }, duration);
        }

        this._stack.push(item);

        return id;
    }

    createError(title: string, details: string, type = 'error') {
        return this.create(Notification, {
            type,
            title,
            description: details
        });
    }

    createInfo(title: string, details: string, type = 'info') {
        return this.create(Notification, {
            type,
            title,
            description: details
        })
    }

    createSuccess(title: string, details: string, type = 'success') {
        return this.create(Notification, {
            type,
            title,
            description: details
        })
    }

    close(id: symbol) {
        clearTimeout(this._stack.find((i) => i.id === id)?.timeout);
        this._stack = this._stack.filter((i) => i.id !== id);
    }
}

const notificationStore = new NotificationStore();
export default notificationStore;
