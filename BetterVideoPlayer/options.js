function getElem( string ) {
	return document.getElementById(string);
}

function saveCallback() {
	const settingsObject = {}
	if ( this.type == "checkbox" ) {
		settingsObject[ this.name ] = this.checked
	} else {
		settingsObject[ this.name ] = this.value
	}
	chrome.storage.sync.set( settingsObject )
}

function createOption( name ) {
	const elem = getElem( name )
	elem.addEventListener( "change", saveCallback )
	return elem
}





//----------------------\/OPTION ELEMENTS\/----------------------
const doAutoPlay = createOption( "doAutoPlay" )
const doAudioTracks = createOption( "doAudioTracks" )
const doLoop = createOption( "doLoop" )
const showControls = createOption( "showControls" )
const showVolumeControls = createOption( "showVolumeControls" )
const playbackSpeed = createOption( "playbackSpeed" )
const speedIncrements = createOption( "speedIncrements" )
const sliderMinimum = createOption( "sliderMinimum" )
const sliderMaximum = createOption( "sliderMaximum" )

const showSubControls = createOption( "showSubControls" )
const showSubVideos = createOption( "showSubVideos" )
const showSpeedControls = createOption( "showSpeedControls" )
const doVolumeSaving = createOption( "doVolumeSaving" )

const limitVideoZoom = createOption( "limitVideoZoom" )
const defaultFPS = createOption( "defaultFPS" )

const showFrameControls = createOption( "showFrameControls" )

const hideCustomControls = createOption( "hideCustomControls" )

const keyFrameBack = createOption( "keyFrameBack" )
const keyFrameForward = createOption( "keyFrameForward" )
const keyToggleZoom = createOption( "keyToggleZoom" )
const keySpeedUp = createOption( "keySpeedUp" )
const keySpeedDown = createOption( "keySpeedDown" )
const keySpeedReset = createOption( "keySpeedReset" )
const keySpeed1x = createOption( "keySpeed1x" )
//----------------------/\OPTION ELEMENTS/\----------------------





const resetVolumesButton = getElem( "resetVolumesButton" )

function resetVolumeClicked() {
	chrome.storage.sync.set({ savedVolumes: {} })
	console.log( "Reset audio track volumes!" )
}

resetVolumesButton.onclick = resetVolumeClicked





// Load values into option elements
chrome.storage.sync.get( function( items ){
	for ( const optionElement of document.getElementsByTagName( "input" ) ) {
		// Exclude the resetVolumesButton
		if ( optionElement.type == "button" ) { continue }
		
		if ( optionElement.type == "checkbox" ) {
			optionElement.checked = items[ optionElement.name ]
		} else {
			optionElement.value = items[ optionElement.name ]
		}
	}
});

console.log( "BetterVideoPlayer options script loaded!" )