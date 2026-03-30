<script lang="ts">
    import Button from '$lib/components/common/inputs/buttons/Button.svelte';
    import {ArrowRight, ArrowLeft, Update} from 'svelte-radix';
    import {onMount} from 'svelte';
    import {animateBackground} from '$lib/utils/animation';
    import {_} from 'svelte-i18n';
    import Input from '$lib/components/common/inputs/forms/Input.svelte';
    import {enhance} from '$app/forms';
    import {setTmpLanguage} from '$lib/utils';
    import notificationStore from "$lib/stores/notification.store";

    let mainDiv: HTMLDivElement | undefined = $state();

    let enableJellyfinConfigForm: boolean = $state(false);
    let jellyfinForm: HTMLFormElement | undefined = $state();
    let jellyfinFormBaseURL: string = $state('');
    let jellyfinFormAPIKey: string = $state('');

    let isTransitioning: boolean = $state(false);
    let disableNext: boolean = $state(false);
    let isInputDisabled: boolean = $state(false);

    let page: number = $state(0);
    let needValidation: boolean = $state(false);
    let nextBtnType: 'button' | 'submit' = $state('button');
    let nextBtnForm: string | undefined = $state();
    let pageTitle: string = $state('');
    let pageDesc: string = $state('');
    let pageInstr: string = $state('');
    let errorMessage: string | undefined = $state();
    let nextButtonText: string = $state($_('settings.misc.next'));
    let nextButtonAction: () => void = $state(defaultNextAction);

    function gotoNextPage() {
        isTransitioning = true;
        setTimeout(() => {
            page++;
            setupPage(page);
            isTransitioning = false;
        }, 310);
    }

    function gotoPrevPage() {
        isTransitioning = true;
        setTimeout(() => {
            page--;
            setupPage(page);
            isTransitioning = false;
        }, 310);
    }

    function setupPage(pageNumber: number) {
        switch (pageNumber) {
            case 1: {
                enableJellyfinConfigForm = true;
                disableNext = true;
                nextBtnType = 'submit';
                nextBtnForm = 'jellyfinForm';
                needValidation = true;
                nextButtonAction = defaultNextAction;
                break;
            }
            case 2: {
                enableJellyfinConfigForm = false;
                disableNext = false;
                nextBtnType = 'button';
                nextBtnForm = undefined;
                needValidation = false;
                errorMessage = undefined;
                nextButtonText = $_('settings.misc.finish');
                nextButtonAction = () => (window.location.href = '/login');
                break;
            }
            default: {
                if (jellyfinForm) {
                    jellyfinForm.className = 'opacity-0 invisible absolute';
                }
                enableJellyfinConfigForm = false;
                disableNext = false;
                nextBtnType = 'button';
                nextBtnForm = undefined;
                needValidation = false;
                errorMessage = undefined;
                nextButtonAction = defaultNextAction;
            }
        }
    }

    function defaultNextAction(): void {
        if (needValidation) {
            return;
        }
        gotoNextPage();
    }

    function onJellyfinInputChange() {
        disableNext =
            !(jellyfinFormBaseURL.startsWith('http://') || jellyfinFormBaseURL.startsWith('https://')) ||
            jellyfinFormAPIKey.length === 0;
        errorMessage = undefined;
    }

    $effect(() => {
        switch (page) {
            case 0: {
                pageTitle = $_('setup.welcomeOnReiverr');
                pageDesc = $_('setup.page1_1');
                pageInstr = $_('setup.page1_2');
                break;
            }
            case 1: {
                pageTitle = $_('setup.configureJellyfin');
                pageDesc = $_('setup.page2_1');
                pageInstr = $_('setup.page2_2');
                break;
            }
            case 2: {
                pageTitle = $_('setup.configurationFinished');
                pageDesc = $_('setup.page3_1');
                pageInstr = $_('setup.page3_2');
            }
        }

        if (errorMessage) {
            notificationStore.createError($_('setup.errors.unableConnect'), errorMessage);
        }
    });

    onMount(() => {
        if (mainDiv) {
            animateBackground(mainDiv);
            setTimeout(() => {
                if (mainDiv) {
                    animateBackground(mainDiv);
                }
            }, 2000);
            setTimeout(() => {
                if (mainDiv) {
                    animateBackground(mainDiv);
                }
            }, 5000);
        }
        if (jellyfinForm) {
            jellyfinForm.className = 'opacity-0 invisible absolute';
        }
        setTmpLanguage(navigator.language);
    });
</script>

<div bind:this={mainDiv} class="relative overflow-hidden h-screen">
    <div class="flex z-10 gap-2 rounded-xs items-center justify-center pt-20">
        <div class="rounded-full bg-amber-300 h-11 w-11"></div>
        <h1 class="font-display uppercase font-semibold tracking-wider text-5xl">Reiverr</h1>
    </div>
    <h1
            class="flex z-10 font-display font-semibold text-4xl items-center justify-center pt-10 w-screen"
    >
        {$_('setup.welcome')}
    </h1>
    <div
            class="absolute z-10 items-center top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-zinc-900/60 p-6 rounded-xl"
    >
        <div
                class="transition duration-300 ease-in-out {isTransitioning
				? 'opacity-0 invisible'
				: 'opacity-100 visible'}"
        >
            <h1 class="flex justify-center text-3xl pb-5">{pageTitle}</h1>
            <p class="text-justify pb-5">
                {pageDesc}
            </p>
            <p class="text-justify">
                {pageInstr}
            </p>
        </div>
        <form
                bind:this={jellyfinForm}
                id="jellyfinForm"
                class="flex justify-center pt-8 transition duration-300 ease-in-out {isTransitioning ||
			!enableJellyfinConfigForm
				? 'opacity-0 invisible'
				: 'delay-100 opacity-100 visible'}"
                method="POST"
                use:enhance={() => {
				isInputDisabled = true;
				return async ({ result }) => {
					if (result.type !== 'success') {
						isInputDisabled = false;
						if (result.data?.code === 1) {
							errorMessage = $_('setup.errors.invalidURL');
						} else if (result.data?.code === 2) {
							errorMessage = $_('setup.errors.invalidAPIKey');
						} else {
							errorMessage = $_('login.errors.unknownError');
						}
					} else {
						isInputDisabled = false;
						gotoNextPage();
					}
				};
			}}
        >
            <div class="flex-wrap space-y-5">
                <div class="flex-wrap">
                    <label for="baseURL">{$_('setup.jellyfinURLInput')}</label>
                    <Input
                            placeholder="http://localhost:8096"
                            type="text"
                            name="baseURL"
                            disabled={isInputDisabled}
                            onchange={(e) => {
							jellyfinFormBaseURL = e;
							onJellyfinInputChange();
						}}
                    ></Input>
                </div>
                <div class="flex-wrap">
                    <label for="apiKey">{$_('setup.apiKeyInput')}</label>
                    <Input
                            placeholder="6d75582d1c874c97bd73fbef278df8c7"
                            type="password"
                            name="apiKey"
                            disabled={isInputDisabled}
                            onchange={(e) => {
							jellyfinFormAPIKey = e;
							onJellyfinInputChange();
						}}
                    ></Input>
                </div>
            </div>
        </form>
        <div class="flex justify-between pt-10">
            <div>
                <Button
                        variant="tertiary"
                        disabled={page === 0 || isTransitioning || isInputDisabled}
                        onclick={() => gotoPrevPage()}
                >
                    <ArrowLeft size="20"/>
                    <span class="mr-1">{$_('settings.misc.back')}</span>
                </Button>
            </div>
            <div>
                <Button
                        type={nextBtnType}
                        form={nextBtnForm}
                        variant="secondary"
                        disabled={isTransitioning || disableNext || isInputDisabled}
                        onclick={nextButtonAction}
                >
                    <span class="mr-1">{nextButtonText}</span>
                    {#if isInputDisabled}
                        <Update class="animate-spin" size="20"/>
                    {:else}
                        <ArrowRight size="20"/>
                    {/if}
                </Button>
            </div>
        </div>
    </div>
</div>
