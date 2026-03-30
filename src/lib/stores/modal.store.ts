import type {TitleId} from '$lib/types';
import TitlePageModal from '../components/TitlePageLayout/TitlePageModal.svelte';
import type {Component} from 'svelte';

type ModalItem = {
    id: symbol;
    group: symbol;
    component: Component<any, any, any>;
    props: Record<string, any>;
};

class ModalStore {
    _stack: ModalItem[] = $state([])
    _top: ModalItem | undefined = $state(undefined)
    _lastTitle: symbol | undefined = $state(undefined)

    get stack() {
        return this._stack;
    }

    get top() {
        return this._top;
    }

    get lastTitle() {
        return this._lastTitle;
    }

    create(
        component: Component<any, any, any>,
        props: Record<string, any>,
        group: symbol | undefined = undefined
    ) {
        const id = Symbol();
        const item = {id, component, props, group: group || id};
        this._stack.push(item);
        this._top = item;

        return id;
    }

    createTitle(titleId: TitleId) {
        if (this._lastTitle) {
            this.close(this._lastTitle);
        }
        this._lastTitle = this.create(TitlePageModal, {
            titleId
        });
    }

    close(symbol: symbol) {
        this._stack = this._stack.filter((item) => item.id !== symbol);
        this._top = this._stack[this._stack.length - 1];
    }

    closeGroup(group: symbol) {
        this._stack = this._stack.filter((item) => item.group !== group);
        this._top = this._stack[this._stack.length - 1];
    }

    reset() {
        this._stack = []
        this._top = undefined;
        this._lastTitle = undefined;
    }
}

const modalStore = new ModalStore();
export default modalStore;
