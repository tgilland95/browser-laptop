/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')
const Immutable = require('immutable')

// Components
const ReduxComponent = require('../reduxComponent')
const Favicon = require('./content/favIcon')
const AudioTabIcon = require('./content/audioTabIcon')
const NewSessionIcon = require('./content/newSessionIcon')
const PrivateIcon = require('./content/privateIcon')
const TabTitle = require('./content/tabTitle')
const CloseTabIcon = require('./content/closeTabIcon')
const {NotificationBarCaret} = require('../main/notificationBar')

// Actions
const appActions = require('../../../../js/actions/appActions')
const windowActions = require('../../../../js/actions/windowActions')

// Store
const windowStore = require('../../../../js/stores/windowStore')

// State helpers
const privateState = require('../../../common/state/tabContentState/privateState')
const audioState = require('../../../common/state/tabContentState/audioState')
const tabUIState = require('../../../common/state/tabUIState')
const tabState = require('../../../common/state/tabState')

// Constants
const dragTypes = require('../../../../js/constants/dragTypes')

// Styles
const globalStyles = require('../styles/global')
const {theme} = require('../styles/theme')

// Utils
const cx = require('../../../../js/lib/classSet')
const {getTextColorForBackground} = require('../../../../js/lib/color')
const {isIntermediateAboutPage} = require('../../../../js/lib/appUrlUtil')
const contextMenus = require('../../../../js/contextMenus')
const dnd = require('../../../../js/dnd')
const frameStateUtil = require('../../../../js/state/frameStateUtil')
const {hasTabAsRelatedTarget} = require('../../lib/tabUtil')
const isWindows = require('../../../common/lib/platformUtil').isWindows()
const {getCurrentWindowId} = require('../../currentWindow')
const {setObserver} = require('../../lib/observerUtil')
const UrlUtil = require('../../../../js/lib/urlutil')

class Tab extends React.Component {
  constructor (props) {
    super(props)
    this.onMouseMove = this.onMouseMove.bind(this)
    this.onMouseEnter = this.onMouseEnter.bind(this)
    this.onMouseLeave = this.onMouseLeave.bind(this)
    this.onDragStart = this.onDragStart.bind(this)
    this.onDragEnd = this.onDragEnd.bind(this)
    this.onDragOver = this.onDragOver.bind(this)
    this.onClickTab = this.onClickTab.bind(this)
    this.onObserve = this.onObserve.bind(this)
    this.tabNode = null
  }

  get frame () {
    return windowStore.getFrame(this.props.frameKey)
  }

  get draggingOverData () {
    const draggingOverData = this.props.dragData && this.props.dragData.get('dragOverData')
    if (!draggingOverData ||
        draggingOverData.get('draggingOverKey') !== this.props.tabId ||
        draggingOverData.get('draggingOverWindowId') !== getCurrentWindowId()) {
      return
    }

    const sourceDragData = dnd.getInterBraveDragData()
    if (!sourceDragData) {
      return
    }
    const location = sourceDragData.get('location')
    const tabId = draggingOverData.get('draggingOverKey')
    const draggingOverFrame = windowStore.getFrameByTabId(tabId)
    if ((location === 'about:blank' || location === 'about:newtab' || isIntermediateAboutPage(location)) &&
        (draggingOverFrame && draggingOverFrame.get('pinnedLocation'))) {
      return
    }

    return draggingOverData
  }

  get isDragging () {
    const sourceDragData = dnd.getInterBraveDragData()
    return sourceDragData &&
      sourceDragData.get('tabId') === this.props.tabId &&
      sourceDragData.get('draggingOverWindowId') === getCurrentWindowId()
  }

  get isDraggingOverSelf () {
    const draggingOverData = this.props.dragData && this.props.dragData.get('dragOverData')
    const sourceDragData = dnd.getInterBraveDragData()
    if (!draggingOverData || !sourceDragData) {
      return false
    }
    return draggingOverData.get('draggingOverKey') === sourceDragData.get('tabId')
  }

  get isDraggingOverLeft () {
    if (!this.draggingOverData) {
      return false
    }
    return this.draggingOverData.get('draggingOverLeftHalf')
  }

  get isDraggingOverRight () {
    if (!this.draggingOverData) {
      return false
    }
    return this.draggingOverData.get('draggingOverRightHalf')
  }

  onDragStart (e) {
    dnd.onDragStart(dragTypes.TAB, this.frame, e)
  }

  onDragEnd (e) {
    dnd.onDragEnd(dragTypes.TAB, this.frame, e)
  }

  onDragOver (e) {
    dnd.onDragOver(dragTypes.TAB, this.tabNode.getBoundingClientRect(), this.props.tabId, this.draggingOverData, e)
  }

  onMouseLeave (e) {
    // mouseleave will keep the previewMode
    // as long as the related target is another tab
    windowActions.setTabHoverState(this.props.frameKey, false, hasTabAsRelatedTarget(e))
  }

  onMouseEnter (e) {
    // if mouse entered a tab we only trigger a new preview
    // if user is in previewMode, which is defined by mouse move
    windowActions.setTabHoverState(this.props.frameKey, true, this.props.previewMode)
  }

  onMouseMove () {
    // dispatch a message to the store so it can delay
    // and preview the tab based on mouse idle time
    windowActions.onTabMouseMove(this.props.frameKey)
  }

  onAuxClick (e) {
    this.onClickTab(e)
  }

  onTabClosedWithMouse (event) {
    event.stopPropagation()
    const frame = this.frame

    if (frame && !frame.isEmpty()) {
      const tabWidth = this.fixTabWidth
      windowActions.onTabClosedWithMouse({
        fixTabWidth: tabWidth
      })
      appActions.tabCloseRequested(this.props.tabId)
    }
  }

  onClickTab (e) {
    switch (e.button) {
      case 2:
        // Ignore right click
        return
      case 1:
        // Close tab with middle click
        // This is ignored for pinned tabs
        // TODO: @cezaraugusto remove conditional
        // when #4063 is resolved
        if (!this.props.isPinnedTab) {
          this.onTabClosedWithMouse(e)
        }
        break
      default:
        e.stopPropagation()
        appActions.tabActivateRequested(this.props.tabId)
    }
  }

  componentDidMount () {
    // do not observe pinned tabs
    if (this.props.isPinned) {
      this.observer.unobserve(this.tabSentinel)
    }
    const threshold = Object.values(globalStyles.intersection)
    // At this moment Chrome can't handle unitless zeroes for rootMargin
    // see https://github.com/w3c/IntersectionObserver/issues/244
    const margin = '0px'
    this.observer = setObserver(this.tabSentinel, threshold, margin, this.onObserve)
    this.observer.observe(this.tabSentinel)

    this.tabNode.addEventListener('auxclick', this.onAuxClick.bind(this))
  }

  componentDidUpdate (prevProps) {
    // if a tab was just pinned, unobserve its intersection
    // this gives us some more performance boost
    if (prevProps.isPinnedTab !== this.props.isPinnedTab) {
      this.observer.unobserve(this.tabSentinel)
    }
  }

  componentWillUnmount () {
    this.observer.unobserve(this.tabSentinel)
  }

  onObserve (entries) {
    // avoid observing pinned tabs
    if (this.props.isPinnedTab) {
      return
    }
    // we only have one entry
    const entry = entries[0]
    windowActions.setTabIntersectionState(this.props.frameKey, entry.intersectionRatio)
  }

  get fixTabWidth () {
    if (!this.tabNode) {
      return 0
    }

    const rect = this.tabNode.parentNode.getBoundingClientRect()
    return rect && rect.width
  }

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const frame = frameStateUtil.getFrameByKey(currentWindow, ownProps.frameKey) || Immutable.Map()
    const frameKey = ownProps.frameKey
    const tabId = frame.get('tabId', tabState.TAB_ID_NONE)
    const isPinned = tabState.isTabPinned(state, tabId)

    // TODO: this should have its own method
    const notifications = state.get('notifications')
    const notificationOrigins = notifications ? notifications.map(bar => bar.get('frameOrigin')) : false
    const notificationBarActive = frame.get('location') && notificationOrigins &&
      notificationOrigins.includes(UrlUtil.getUrlOrigin(frame.get('location')))

    const props = {}
    // used in renderer
    props.frameKey = ownProps.frameKey
    props.isPrivateTab = frame.get('isPrivate')
    props.notificationBarActive = notificationBarActive

    // used in renderer
    props.frameKey = frameKey
    props.isPinnedTab = isPinned
    props.isPrivateTab = privateState.isPrivateTab(currentWindow, frameKey)
    props.isActive = frameStateUtil.isFrameKeyActive(currentWindow, props.frameKey)
    props.tabWidth = currentWindow.getIn(['ui', 'tabs', 'fixTabWidth'])
    props.themeColor = tabUIState.getThemeColor(currentWindow, frameKey)
    props.title = frame.get('title')
    props.partOfFullPageSet = ownProps.partOfFullPageSet
    props.showAudioTopBorder = audioState.showAudioTopBorder(currentWindow, frameKey, isPinned)
    props.centralizeTabIcons = tabUIState.centralizeTabIcons(currentWindow, frameKey, isPinned)

    // used in other functions
    props.totalTabs = state.get('tabs').size
    props.dragData = state.getIn(['dragData', 'type']) === dragTypes.TAB && state.get('dragData')
    props.tabId = tabId
    props.previewMode = currentWindow.getIn(['ui', 'tabs', 'previewMode'])

    return props
  }

  render () {
    // we don't want themeColor if tab is private
    const perPageStyles = !this.props.isPrivateTab && StyleSheet.create({
      tab_themeColor: {
        color: this.props.themeColor ? getTextColorForBackground(this.props.themeColor) : 'inherit',
        background: this.props.themeColor ? this.props.themeColor : 'inherit',
        ':hover': {
          color: this.props.themeColor ? getTextColorForBackground(this.props.themeColor) : 'inherit',
          background: this.props.themeColor ? this.props.themeColor : 'inherit'
        }
      }
    })
    return <div
      data-tab-area
      className={cx({
        tabArea: true,
        draggingOverLeft: this.isDraggingOverLeft && !this.isDraggingOverSelf,
        draggingOverRight: this.isDraggingOverRight && !this.isDraggingOverSelf,
        isDragging: this.isDragging,
        isPinned: this.props.isPinnedTab,
        partOfFullPageSet: this.props.partOfFullPageSet || !!this.props.tabWidth
      })}
      style={this.props.tabWidth ? { flex: `0 0 ${this.props.tabWidth}px` } : {}}
      onMouseMove={this.onMouseMove}
      onMouseEnter={this.onMouseEnter}
      onMouseLeave={this.onMouseLeave}
      data-test-id='tab-area'
      data-frame-key={this.props.frameKey}>
      {
        this.props.isActive && this.props.notificationBarActive
          ? <NotificationBarCaret />
          : null
      }
      <div
        data-tab
        ref={(node) => { this.tabNode = node }}
        className={css(
          styles.tab,
          // Windows specific style
          isWindows && styles.tab_forWindows,
          this.props.isPinnedTab && styles.tab_pinned,
          this.props.isActive && styles.tab_active,
          this.props.showAudioTopBorder && styles.tab_audioTopBorder,
          this.props.isActive && this.props.themeColor && perPageStyles.tab_themeColor,
          // Private color should override themeColor
          this.props.isPrivateTab && styles.tab_private,
          this.props.isActive && this.props.isPrivateTab && styles.tab_active_private,
          this.props.centralizeTabIcons && styles.tab__content_centered
        )}
        data-test-id='tab'
        data-frame-key={this.props.frameKey}
        draggable
        title={this.props.title}
        onDragStart={this.onDragStart}
        onDragEnd={this.onDragEnd}
        onDragOver={this.onDragOver}
        onClick={this.onClickTab}
        onContextMenu={contextMenus.onTabContextMenu.bind(this, this.frame)}
      >
        <div
          ref={(node) => { this.tabSentinel = node }}
          className={css(styles.tab__sentinel)}
        />
        <div className={css(
          styles.tab__identity,
          this.props.centralizeTabIcons && styles.tab__content_centered
          )}>
          <Favicon tabId={this.props.tabId} />
          <AudioTabIcon tabId={this.props.tabId} />
          <TabTitle tabId={this.props.tabId} />
        </div>
        <PrivateIcon tabId={this.props.tabId} />
        <NewSessionIcon tabId={this.props.tabId} />
        <CloseTabIcon tabId={this.props.tabId} fixTabWidth={this.fixTabWidth} />
      </div>
    </div>
  }
}

const styles = StyleSheet.create({
  tab: {
    borderWidth: '0 1px 0 0',
    borderStyle: 'solid',
    borderColor: '#bbb',
    boxSizing: 'border-box',
    color: theme.tab.color,
    display: 'flex',
    marginTop: '0',
    transition: theme.tab.transition,
    left: '0',
    opacity: '1',
    height: '-webkit-fill-available',
    width: '-webkit-fill-available',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 0,
    position: 'relative',

    ':hover': {
      background: theme.tab.hover.background
    }
  },

  // Windows specific style
  tab_forWindows: {
    color: theme.tab.forWindows.color
  },

  tab_active: {
    background: theme.tab.active.background,

    ':hover': {
      background: theme.tab.active.background
    }
  },

  // The sentinel is responsible to respond to tabs
  // intersection state. This is an empty hidden element
  // which `width` value shouldn't be changed unless the intersection
  // point needs to be edited.
  tab__sentinel: {
    position: 'absolute',
    left: 0,
    height: '1px',
    background: 'transparent',
    width: globalStyles.spacing.sentinelSize
  },

  tab_audioTopBorder: {
    '::before': {
      content: `''`,
      display: 'block',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '2px',
      background: 'lightskyblue'
    }
  },

  tab__identity: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    display: 'flex',
    flex: '1',
    minWidth: '0', // @see https://bugzilla.mozilla.org/show_bug.cgi?id=1108514#c5
    marginLeft: globalStyles.spacing.defaultTabMargin
  },

  tab__content_centered: {
    justifyContent: 'center',
    flex: 'auto',
    padding: 0,
    margin: 0
  },

  tab_pinned: {
    padding: 0,
    width: '28px',
    justifyContent: 'center'
  },

  tab_active_private: {
    background: theme.tab.active.private.background,
    color: theme.tab.active.private.color,

    ':hover': {
      background: theme.tab.active.private.background
    }
  },

  tab_private: {
    background: theme.tab.private.background,

    ':hover': {
      color: theme.tab.active.private.color,
      background: theme.tab.active.private.background
    }
  }
})

module.exports = ReduxComponent.connect(Tab)
