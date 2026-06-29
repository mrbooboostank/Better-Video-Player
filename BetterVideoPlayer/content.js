console.log( "[BetterVideoPlayer] Content script ran!" )



const parentVideo = document.body.children[ 0 ]
const pageType = parentVideo.tagName.toLowerCase()



function processItems( items ) {
	// Chrome's audiotrack property starts off at 0 incorrectly and doesn't properly initialize for an indeterminate amount of time
	function setAudioTrack( subVideo, index ) {
		//DEV onsole.log( "Trying to set audio track", index )
		
		// Chrome takes a bit to realize the video has audio tracks for some reason
		if ( subVideo.audioTracks.length == 0 ) {
			setTimeout(setAudioTrack, 0, subVideo, index);
		} else {
			subVideo.audioTracks[ index ].enabled = true
			console.log( "[BetterVideoPlayer] Successfully set audio track", index )
		}
	}
	
	function syncAutoPlay() {
		synced = true
		for ( const subVideo of document.getElementsByClassName( "subVideo" ) ) {
			if ( subVideo.readyState < 4 ) {
				synced = false
				break
			}
		}
		
		if ( synced ) {
			if ( items.doAutoPlay ) {
				parentVideo.play()
			}
		} else {
			setTimeout(syncAutoPlay, 0)
		}
	}
	
	function volumeCallback( event ) {
		//DEV onsole.log( "items.savedVolumes", items.savedVolumes )
		let volume = event.target.volume
		if ( event.target.muted ) { 
			volume = 0
		}
		items.savedVolumes[ event.target.id ] = volume
		chrome.storage.sync.set({
			savedVolumes: items.savedVolumes
		});
		//DEV onsole.log("The volume changed.")
	}
	
	function volumeBoxCallback( event ) {
		let volume = event.target.volume
		const volumeBox = event.target.volumeBox
		
		volumeBox.value = Math.round( volume * 100 )
		
		//DEV onsole.log("Updated linked volumeBox")
	}
	
	function applyVolume( video, volume ) {
		if ( volume === undefined ) { volume = 1 }
		video.volume = volume
		if ( volume <= 0 ) {
			video.muted = true
		}
	}
	
	function encapsulateVideo( video, zOrder ) {
		const container = document.createElement( "div" )
		container.style = "position: absolute; top: 0px; right: 0px; bottom: 0px; left: 0px; width:fit-content; height:fit-content; margin: auto; z-index: " + zOrder
		video.style = "max-height: 100%; max-width: 100%; display: block; position:static"
		const spacer = document.createElement( "div" )
		container.spacer = spacer
		container.append( spacer )
		container.append( video )
		document.body.append( container )
		return container
	}
	
	function positionContainer( container ) {
		let inputZoom
		if ( container.observerWidth > 1440) {
			inputZoom = 175 * container.trackOrder
			//DEV onsole.log( "container above 1440 width" )
		} else {
			inputZoom = 140 * container.trackOrder
			//DEV onsole.log( "container below 1440 width" )
		}
		container.spacer.style.height = inputZoom + "px"
	}

	function createSubVideos( parentVideo ) {
		//DEV onsole.log( "Trying to create sub videos" )

		// Apply a consistent offset to the background video
		// The built-in volume UI changes sizes slightly when the video element has a width of 1440 or less
		const observer = new ResizeObserver(entries => {
			//DEV onsole.log( "Repositioning containers via observer!" )
			for (let entry of entries) {
				//const browserZoom = window.devicePixelRatio
				const container = entry.target
				container.observerWidth = entry.contentBoxSize[0].inlineSize
				positionContainer( container )
			}
		});
		
		
		// Chrome takes a bit to realize the video has audio tracks for some reason
		if ( parentVideo.audioTracks.length == 0 ) {
			setTimeout( createSubVideos, 0 );
		} else {
			// Only spawn sub videos when the parent video has more than 1 audio track
			if ( parentVideo.audioTracks.length > 1 ) {
				const parentContainer = document.getElementById( "parentContainer" )
				parentContainer.style.zIndex = parentVideo.audioTracks.length
				
				const allVideosContainer = document.getElementById( "allVideosContainer" )
				for ( let i = 0; i < parentVideo.audioTracks.length - 1; i++ ) {
					const subVideo = parentVideo.cloneNode( true )
					//subVideo.style.zIndex = parentVideo.audioTracks.length - i - 1
					setAudioTrack( subVideo, i + 1 )
					//subVideo.audioTracks[ i + 1 ].enabled = true
					subVideo.classList.add( "subVideo" )
					subVideo.id = "subVideo" + ( i + 1 )

					const container = encapsulateVideo( subVideo, parentVideo.audioTracks.length - i - 1 )
					container.trackOrder = i + 1
					
					allVideosContainer.append( container )
					
					if ( items.showVolumeControls ) {
						createVolumeBox( subVideo )
					}
					
					//subVideo.load()
					
					if ( !items.showSubControls ) {
						subVideo.removeAttribute( "controls" )
					}
					
					if ( items.doLoop ) {
						subVideo.loop = true
					}
					
					if ( !items.showSubVideos ) {
						subVideo.style.display = "none"
					}
					
					subVideo.playbackRate = items.playbackSpeed

					observer.observe( container );
					
					if ( items.doVolumeSaving ) {
						subVideo.addEventListener( "volumechange", volumeCallback )
					}
					
					
					if ( items.showVolumeControls ) {
						subVideo.addEventListener( "volumechange", volumeBoxCallback )
					}
					
					if ( !items.doAutoPlay ) {
						subVideo.pause()
					}
					
					applyVolume( subVideo, items.savedVolumes[ subVideo.id ] )
				}
				console.log( "[BetterVideoPlayer] Successfully created sub videos" )
			}
			else {
				console.log( "[BetterVideoPlayer] Video has 1 audio track, skipping sub video creation" )
			}
			// Important for this statement to be down here to unpause videos that turned out to have only 1 audio track
			if ( items.doAutoPlay ) {
				syncAutoPlay()
			}
		}
	}
	
	function clamp(number, min, max) {
		return Math.min(Math.max(number, min), max);
	}
	
	function createVolumeBox( attachVideo ) {
		const volumeBox = document.createElement( 'input' );
		volumeBox.classList.add( "volumeBox" )
		volumeBox.type = "number"
		volumeBox.value = 100
		volumeBox.step = 1
		volumeBox.min = 0
		volumeBox.max = 100
		volumeBox.style = "width:38px;position: absolute; top:100%;left:100%; transform: translate(-580%, -280%)"

		volumeBox.addEventListener('change', function( event ) {
			 let volume = event.target.value
			 volume = clamp( volume, 0, 100 )
			 event.target.attachVideo.volume = volume / 100
		})
		
		attachVideo.volumeBox = volumeBox
		volumeBox.attachVideo = attachVideo
		attachVideo.parentElement.append( volumeBox )
		
		// Keeps the volumeBox hidden states synced for the subVideos that may spawn at a later point in the page loading
		volumeBox.hidden = document.getElementById( "buttonContainer" ).style.display == "none"
		
		return volumeBox
	}


	const buttonContainer = document.createElement( "div" )
	buttonContainer.id = "buttonContainer"
	buttonContainer.style = "display:flex;position: absolute; top:2%;left:50%; transform: translate(-50%, 0%)"
	
	const speedSlider = document.createElement( 'input' );
	speedSlider.id = "speedSlider"
	speedSlider.type = "range"
	speedSlider.value = 1
	speedSlider.step = items.speedIncrements
	speedSlider.min = items.sliderMinimum
	speedSlider.max = items.sliderMaximum
	//speedSlider.style = "width:49px"

	const speedBox = document.createElement( 'input' );
	speedBox.id = "speedBox"
	speedBox.type = "number"
	speedBox.value = 1
	speedBox.step = items.speedIncrements
	speedBox.min = 0
	speedBox.max = 16
	speedBox.style = "width:49px"
	speedBox.speedSlider = speedSlider
	speedSlider.speedBox = speedBox
	
	function updateAllVideoSpeeds( speed ) {
		parentVideo.playbackRate = speed
		for ( const subVideo of document.getElementsByClassName( "subVideo" ) ) {
			subVideo.playbackRate = speed
		}
		//DEV onsole.log('Playback speed changed:', speed);
	}
	
	function speedButtonClicked() {
		updateAllVideoSpeeds( this.speed )
		this.speedSlider.value = this.speed
		this.speedBox.value = this.speed
	}
	
	function setZoom( shouldLock ) {
		const zoomButton = document.getElementById( "zoomButton" )
		
		zoomButton.locked = shouldLock
		
		if ( zoomButton.locked ) {
			zoomButton.value = "Zoom: locked"
			for ( const video of document.getElementsByTagName( "video" ) ) {
				video.style.setProperty( "max-height", "100%" )
				video.style.setProperty( "max-width", "100%" )
			}
		} else {
			zoomButton.value = "Zoom: unlocked"
			for ( const video of document.getElementsByTagName( "video" ) ) {
				video.style.setProperty( "max-height", "9999%" )
				video.style.setProperty( "max-width", "9999%" )
			}
		}
	}
	
	function zoomButtonClicked() {
		setZoom( !this.locked )
	}

	const speedOneButton = document.createElement( 'input' );
	speedOneButton.id = "speedOneButton"
	speedOneButton.type = "button"
	speedOneButton.value = "1x"
	speedOneButton.speed = 1
	speedOneButton.speedBox = speedBox
	speedOneButton.speedSlider = speedSlider
	speedOneButton.onclick = speedButtonClicked

	const speedDefaultButton = document.createElement( 'input' );
	speedDefaultButton.id = "speedDefaultButton"
	speedDefaultButton.type = "button"
	speedDefaultButton.value = "Reset"
	speedDefaultButton.speed = items.playbackSpeed
	speedDefaultButton.speedBox = speedBox
	speedDefaultButton.speedSlider = speedSlider
	speedDefaultButton.onclick = speedButtonClicked

	const zoomButton = document.createElement( 'input' );
	zoomButton.id = "zoomButton"
	zoomButton.type = "button"
	zoomButton.value = "ERROR"
	zoomButton.onclick = zoomButtonClicked

	const framerateBox = document.createElement( 'input' );
	framerateBox.id = "framerateBox"
	framerateBox.type = "number"
	framerateBox.value = items.defaultFPS
	framerateBox.step = 1
	framerateBox.min = 1
	framerateBox.max = 180
	framerateBox.style = "width:38px"

	function seekClicked() {
		const framerateBox = document.getElementById( "framerateBox" )
		let unit = 1 / framerateBox.value
		if ( this.id == "seekLeftButton" ) {
			unit *= -1
		}
		const parentVideo = document.getElementById( "parentVideo" )
		parentVideo.pause() // Makes frame-seeking much easier
		parentVideo.currentTime += unit
		//DEV onsole.log( "Clicked seek button!" )
	}
	
	const seekLeftButton = document.createElement( 'input' );
	seekLeftButton.id = "seekLeftButton"
	seekLeftButton.type = "button"
	seekLeftButton.value = "<"
	seekLeftButton.onclick = seekClicked

	const seekRightButton = document.createElement( 'input' );
	seekRightButton.id = "seekRightButton"
	seekRightButton.type = "button"
	seekRightButton.value = ">"
	seekRightButton.onclick = seekClicked

	speedSlider.addEventListener('input', function( event ) {
		 updateAllVideoSpeeds( event.target.value )
		 event.target.speedBox.value = event.target.value
	});

	speedBox.addEventListener('change', function( event ) {
		 updateAllVideoSpeeds( event.target.value )
		 event.target.speedSlider.value = event.target.value
	});

	if ( items.doAudioTracks ) {
		if ( parentVideo.audioTracks === undefined ) {
			console.log( "[BetterVideoPlayer] Error! Failed to read this video's audio tracks! Ensure that \"Experimental Web Platform features\" are enabled in your browser's chrome://flags page and restart! " )
		} else {
			// Audio track autoplay syncing requires default browser autoplay to be disabled
			// ( via pausing the parentVideo ):
			parentVideo.pause()
			const audioId = setTimeout(createSubVideos, 0, parentVideo);
		}
	}


	buttonContainer.append( speedSlider );
	buttonContainer.append( speedBox );
	buttonContainer.append( speedOneButton );
	buttonContainer.append( speedDefaultButton );
	buttonContainer.append( zoomButton )
	buttonContainer.append( framerateBox )
	buttonContainer.append( seekLeftButton )
	buttonContainer.append( seekRightButton )
	
	if ( !items.showSpeedControls ) {
		speedSlider.hidden = true
		speedBox.hidden = true
		speedOneButton.hidden = true
		speedDefaultButton.hidden = true
	}
	
	if ( !items.showFrameControls ) {
		framerateBox.hidden = true
		seekLeftButton.hidden = true
		seekRightButton.hidden = true
	}
	
	//DEV onsole.log( "items", items )
	
	speedSlider.value = items.playbackSpeed
	speedBox.value = items.playbackSpeed
	parentVideo.playbackRate = items.playbackSpeed
	
	const parentContainer = encapsulateVideo( parentVideo, 0 )
	parentContainer.id = "parentContainer"
	
	parentContainer.append( buttonContainer )
	
	// Allow for the zoom option to work without having to press the button on page load
	setZoom( items.limitVideoZoom )
	
	if ( items.showVolumeControls ) {
		createVolumeBox( parentVideo )
	}

	// A mutationObserver wasn't working for syncing the "show all controls" property to subVideos, so that whole featureset was cancelled
	
	if ( !items.doAutoPlay ) {
		//parentVideo.autoplay = false
		parentVideo.pause()
	}
					
	if ( items.doLoop ) {
		parentVideo.loop = true
	}
	
	if ( !items.showControls ) {
		parentVideo.removeAttribute( "controls" )
	}
	
	parentVideo.addEventListener( "play", (event) => {
		//DEV onsole.log( "Playing parentvideo" )
		for ( const subVideo of document.getElementsByClassName( "subVideo" ) ) {
			subVideo.play()
		}
	})
	
	parentVideo.addEventListener( "pause", (event) => {
		//DEV onsole.log( "Pausing parentvideo" )
		for ( const subVideo of document.getElementsByClassName( "subVideo" ) ) {
			subVideo.pause()
		}
	})
	
	parentVideo.addEventListener( "seeking", (event) => {
		//DEV onsole.log( "Seeking parentvideo" )
		for ( const subVideo of document.getElementsByClassName( "subVideo" ) ) {
			subVideo.currentTime = parentVideo.currentTime
		}
	})
					
	if ( items.doVolumeSaving ) {
		parentVideo.addEventListener( "volumechange", volumeCallback )
	}
	
	if ( items.showVolumeControls ) {
		parentVideo.addEventListener( "volumechange", volumeBoxCallback )
	}

	parentVideo.id = "parentVideo"
	applyVolume( parentVideo, items.savedVolumes[ parentVideo.id ] )
	
	const allVideosContainer = document.createElement( "div" )
	allVideosContainer.id = "allVideosContainer"
	
	allVideosContainer.append( parentContainer )
	document.body.append( allVideosContainer )
	
	
	if ( items.hideCustomControls ) {
		allVideosContainer.addEventListener("mouseenter", function() {
			const buttonContainer = document.getElementById( "buttonContainer" )
			buttonContainer.style.display = "flex"
			for ( const volumeBox of document.getElementsByClassName( "volumeBox" ) ) {
				volumeBox.hidden = false
			}
		})
		
		function hideCustomControls() {
			const buttonContainer = document.getElementById( "buttonContainer" )
			buttonContainer.style.display = "none"
			for ( const volumeBox of document.getElementsByClassName( "volumeBox" ) ) {
				volumeBox.hidden = true
			}
		}

		allVideosContainer.addEventListener("mouseleave", hideCustomControls)
		
		// Auto-hide custom controls when the relevant option is enabled
		hideCustomControls()
	}
	
	// Register keyboard shortcuts
	document.addEventListener( 'keypress', function( event ) {
		let changeEvent
		//DEV onsole.log( event.key.toLowerCase(), "event.key.toLowerCase()" )
		switch ( event.key.toLowerCase() ) {
			case items.keyFrameBack.toLowerCase():
				seekLeftButton.click()
				break
			case items.keyFrameForward.toLowerCase():
				seekRightButton.click()
				break
			case items.keyToggleZoom.toLowerCase():
				zoomButton.click()
				break
			case items.keySpeedReset.toLowerCase():
				speedDefaultButton.click()
				break
			case items.keySpeed1x.toLowerCase():
				speedOneButton.click()
				break
			case items.keySpeedUp.toLowerCase():
				speedBox.stepUp()
				changeEvent = new Event('change', { bubbles: true });
				speedBox.dispatchEvent( changeEvent );
				break
			case items.keySpeedDown.toLowerCase():
				changeEvent = new Event('change', { bubbles: true });
				speedBox.dispatchEvent( changeEvent );
				speedBox.stepDown()
				break
			default:
			// Code to execute if no case matches
		}
	});
}



function main() {
	// This type + page length check detects the default video player
	// The reason this is used instead of pattern matching in manifest.json is because there's no case-insensitivity support,
	// so .mp4 and .MP4 aren't treated the same.
	// This would be hard-coded, except that .webm being 4 characters long would be very ridiculous to support every case possible
	if ( pageType != "video" || document.body.children.length > 1 ) {
		console.log( "[BetterVideoPlayer] Aborting content script, didn't find a video element!" )
		return
	}

	chrome.storage.sync.get( processItems )

	console.log( "[BetterVideoPlayer] Content script finished!" )
}



main()