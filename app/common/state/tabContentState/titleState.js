/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const locale = require('../../../../js/l10n')

// State helpers
const partitionState = require('../tabContentState/partitionState')
const privateState = require('../tabContentState/privateState')
const frameStateUtil = require('../../../../js/state/frameStateUtil')

// Utils
const {isEntryIntersected} = require('../../../../app/renderer/lib/observerUtil')

// Styles
const {intersection} = require('../../../renderer/components/styles/global')

module.exports.showTabTitle = (state, frameKey) => {
  const frame = frameStateUtil.getFrameByKey(state, frameKey)

  if (frame == null) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Unable to find frame for showTabTite method')
    }
    return false
  }

  const isNewTabPage = frameStateUtil.frameLocationMatch(frame, 'about:newtab')
  const isActive = frameStateUtil.isFrameKeyActive(state, frameKey)
  const isPartition = partitionState.isPartitionTab(state, frameKey)
  const isPrivate = privateState.isPrivateTab(state, frameKey)
  const secondaryIconVisible = !isNewTabPage && (isPartition || isPrivate || isActive)

  // If title is being intersected by ~half with other icons visible
  // such as closeTab (activeTab) or session icons, do not show it
  if (isEntryIntersected(state, 'tabs', intersection.at45) && secondaryIconVisible) {
    return false
  }

  // title should never show at such intersection point
  return !isEntryIntersected(state, 'tabs', intersection.at40)
}

module.exports.getDisplayTitle = (state, frameKey) => {
  const frame = frameStateUtil.getFrameByKey(state, frameKey)

  if (frame == null) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Unable to find frame for getDisplayTitle method')
    }
    return ''
  }

  const isNewTabPage = frameStateUtil.frameLocationMatch(frame, 'about:newtab')
  const isAboutBlankPage = frameStateUtil.frameLocationMatch(frame, 'about:blank')
  // For renderer initiated navigation, make sure we show Untitled
  // until we know what we're loading.  We should probably do this for
  // all about: pages that we already know the title for so we don't have
  // to wait for the title to be parsed.
  if (isAboutBlankPage) {
    return locale.translation('aboutBlankTitle')
  } else if (isNewTabPage) {
    return locale.translation('newTab')
  }

  // YouTube tries to change the title to add a play icon when
  // there is audio. Since we have our own audio indicator we get
  // rid of it.
  return (frame.get('title') || frame.get('location') || '').replace('▶ ', '')
}
