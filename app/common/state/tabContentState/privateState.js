/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// State helpers
const frameStateUtil = require('../../../../js/state/frameStateUtil')

module.exports.isPrivateTab = (state, frameKey) => {
  const frame = frameStateUtil.getFrameByKey(state, frameKey)

  if (frame == null) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Unable to find frame for isPrivateTab method')
    }
    return false
  }

  return !!frame.get('isPrivate')
}
