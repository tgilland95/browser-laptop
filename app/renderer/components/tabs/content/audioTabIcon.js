/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ReduxComponent = require('../../reduxComponent')
const TabIcon = require('./tabIcon')

// State helpers
const audioState = require('../../../../common/state/tabContentState/audioState')
const frameStateUtil = require('../../../../../js/state/frameStateUtil')
const tabState = require('../../../../common/state/tabState')

// Actions
const windowActions = require('../../../../../js/actions/windowActions')

// Styles
const globalStyles = require('../../styles/global')
const {theme} = require('../../styles/theme')

class AudioTabIcon extends React.Component {
  constructor (props) {
    super(props)
    this.toggleMute = this.toggleMute.bind(this)
  }

  get audioIcon () {
    return this.props.audioPlaying
      ? globalStyles.appIcons.volumeOn
      : globalStyles.appIcons.volumeOff
  }

  toggleMute (event) {
    event.stopPropagation()
    windowActions
      .setAudioMuted(this.props.frameKey, this.props.tabId, this.props.audioPlaying)
  }

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const tabId = ownProps.tabId
    const frameKey = frameStateUtil.getFrameKeyByTabId(currentWindow, tabId)

    const props = {}
    props.frameKey = frameKey
    props.showAudioIcon = audioState.showAudioIcon(currentWindow, frameKey)
    props.audioPlaying = !audioState.isAudioMuted(currentWindow, frameKey)
    props.canPlayAudio = audioState.canPlayAudio(currentWindow, frameKey)
    props.isPinned = tabState.isTabPinned(state, tabId)
    props.tabId = tabId

    return props
  }

  render () {
    if (this.props.isPinned || !this.props.showAudioIcon) {
      return null
    }

    return <TabIcon
      data-test-id={this.audioIcon}
      className={css(styles.audio__tabIcon)}
      symbol={this.audioIcon}
      onClick={this.toggleMute}
    />
  }
}

const styles = StyleSheet.create({
  audio__tabIcon: {
    margin: '0 -2px 0 2px',
    color: theme.tab.content.icon.audio.color,
    fontSize: '13px',
    height: globalStyles.spacing.iconSize,
    backgroundSize: globalStyles.spacing.iconSize,
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    display: 'flex',
    alignSelf: 'center',
    position: 'relative',
    textAlign: 'center',
    justifyContent: 'center'
  }
})

module.exports = ReduxComponent.connect(AudioTabIcon)
