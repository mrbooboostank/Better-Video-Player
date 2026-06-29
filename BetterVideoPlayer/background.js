//https://stackoverflow.com/a/2401788

chrome.runtime.onInstalled.addListener((details) => {
	const currentVersion = chrome.runtime.getManifest().version
	const previousVersion = details.previousVersion
	const reason = details.reason

	console.log(`Previous Version: ${previousVersion }`)
	console.log(`Current Version: ${currentVersion }`)

	switch (reason) {
		case 'install':
			console.log('New User installed the extension.')
			chrome.storage.sync.set({
				doAutoPlay: true,
				doAudioTracks: true,
				doLoop: false,
				showControls: true,
				showFrameControls: true,
				showVolumeControls: true,
				playbackSpeed: 1,
				speedIncrements: 0.25,
				sliderMinimum: 0.25,
				sliderMaximum: 16,
				defaultFPS: 60,
				showSubControls: true,
				showSubVideos: true,
				showSpeedControls: true,
				doVolumeSaving: false,
				limitVideoZoom: true,
				hideCustomControls: true,
				keyFrameBack: ",",
				keyFrameForward: ".",
				keyToggleZoom: "z",
				keySpeedUp: "w",
				keySpeedDown: "s",
				keySpeedReset: "d",
				keySpeed1x: "a",
				savedVolumes: {}
			})
			break;
		case 'update':
			console.log('User has updated their extension.')
			break;
		case 'chrome_update':
		case 'shared_module_update':
		default:
			console.log('Other install events within the browser')
			break;
	}
})