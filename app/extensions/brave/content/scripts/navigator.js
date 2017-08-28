// disable experimental navigator.credentials
if (typeof navigator !== 'undefined' && typeof chrome !== 'undefined') {
  if (typeof navigator.credentials !== 'undefined') {
    chrome.webFrame.setGlobal("navigator.credentials.get", function () {
      return new Promise((resolve, reject) => { resolve(false) })
    })

    chrome.webFrame.setGlobal("navigator.credentials.store", function () {
      return new Promise((resolve, reject) => { resolve(false) })
    })

    if (chrome.contentSettings.doNotTrack == 'allow') {
      executeScript("window.Navigator.prototype.__defineGetter__('doNotTrack', () => { return 1 })")
    }
  }

  if (typeof navigator.getBattery !== 'undefined') {
    // disable battery status API
    chrome.webFrame.setGlobal("navigator.getBattery", function () {
      return new Promise((resolve, reject) => { reject(new Error('navigator.getBattery not supported.')) })
    })
  }
}

if (chrome.contentSettings.ads == 'block') {
  chrome.webFrame.setGlobal("window.google_onload_fired", true)
}
