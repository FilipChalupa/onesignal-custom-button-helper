declare global {
	interface Window {
		OneSignal?: any
	}
}

const OneSignal = window.OneSignal || []

export type OnesignalCustomButtonState =
	| 'loading'
	| 'not-supported'
	| 'subscribed'
	| 'not-subscribed'

export function onesignalCustomButtonHelper(
	stateUpdateCallback: (state: OnesignalCustomButtonState) => void
) {
	let state: OnesignalCustomButtonState

	const triggerAction = async () => {
		if (state !== 'subscribed' && state !== 'not-subscribed') {
			console.warn(
				'Action ignored. Component OneSignal is not ready to perform any action right now.'
			)
		} else {
			updateState('loading')
			const subscriptionState = await getSubscriptionState()
			if (subscriptionState.isPushEnabled) {
				OneSignal.setSubscription(false)
			} else if (subscriptionState.isOptedOut) {
				OneSignal.setSubscription(true)
			} else {
				OneSignal.registerForPushNotifications()
			}
		}
	}

	const updateState = (newState: OnesignalCustomButtonState) => {
		state = newState
		stateUpdateCallback(state)
	}

	updateState('loading')

	const getSubscriptionState = async () => {
		const isPushEnabledPromise = OneSignal.isPushNotificationsEnabled()
		const isOptedOutPromise = OneSignal.isOptedOut()

		const isPushEnabled = await isPushEnabledPromise
		const isOptedOut = await isOptedOutPromise

		return {
			isPushEnabled,
			isOptedOut,
		}
	}

	const refresh = async () => {
		updateState('loading')

		const subscriptionState = await getSubscriptionState()
		const isSubscribed =
			subscriptionState.isPushEnabled && !subscriptionState.isOptedOut

		updateState(isSubscribed ? 'subscribed' : 'not-subscribed')
	}

	OneSignal.push(() => {
		if (!OneSignal.isPushNotificationsSupported()) {
			updateState('not-supported')
			return
		}

		refresh()

		OneSignal.on('subscriptionChange', refresh)
	})
	return triggerAction
}
