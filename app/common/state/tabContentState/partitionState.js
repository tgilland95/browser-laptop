/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// State helpers
const tabUIState = require('../tabUIState')
const frameStateUtil = require('../../../../js/state/frameStateUtil')

// Constants
const {tabs} = require('../../../../js/constants/config')

module.exports.isPartitionTab = (state, frameKey) => {
  const frame = frameStateUtil.getFrameByKey(state, frameKey)

  if (frame == null) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Unable to find frame for isPartitionTab method')
    }
    return false
  }

  return !!frame.get('partitionNumber')
}

module.exports.getPartitionNumber = (state, frameKey) => {
  const frame = frameStateUtil.getFrameByKey(state, frameKey)

  if (frame == null) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Unable to find frame for getPartitionNumber method')
    }
    return 0
  }
  const partitionNumber = frame.get('partitionNumber')
  if (typeof partitionNumber === 'string') {
    return partitionNumber.replace(/^partition-/i, '')
  }
  return partitionNumber
}

module.exports.getMaxAllowedPartitionNumber = (state, frameKey) => {
  const frame = frameStateUtil.getFrameByKey(state, frameKey)

  if (frame == null) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Unable to find frame for getMaxAllowedPartitionNumber method')
    }
    return 0
  }

  const partitionNumber = module.exports.getPartitionNumber(state, frameKey)

  if (partitionNumber > tabs.maxAllowedNewSessions) {
    return tabs.maxAllowedNewSessions
  }
  return partitionNumber
}

module.exports.showPartitionIcon = (state, frameKey) => {
  const frame = frameStateUtil.getFrameByKey(state, frameKey)

  if (frame == null) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Unable to find frame for showPartitionIcon method')
    }
    return false
  }

  return (
    module.exports.isPartitionTab(state, frameKey) &&
    tabUIState.showTabEndIcon(state, frameKey)
  )
}
