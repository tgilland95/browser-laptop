/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

 /**
  * Includes color options for theming
  * This should be used as a boilerplate for all
  * future theming, including darkUI.
  * Note: If an element is not color-related, it should go into global.js
  */
  module.exports.theme = {
    tab: {
      // mimics chrome hover effect
      transition: `
        background-color 200ms cubic-bezier(0.26, 0.63, 0.39, 0.65),
        color 200ms linear
      `,
      background: '#ddd',
      borderColor: '#bbb',
      color: '#000',
      hover: {
        background: 'rgba(255, 255, 255, 0.4)'
      },
      forWindows: {
        color: '#555'
      },
      active: {
        background: 'rgba(255, 255, 255, 0.8)',
        private: {
          background: '#4b3c6e',
          color: '#fff'
        }
      },
      private: {
        background: 'rgba(75, 60, 110, 0.2)',
        color: '#4b3c6e'
      },
      content: {
        icon: {
          default: {
            primary: '#fff',
            secondary: 'rgb(101, 101, 101)'
          },
          private: {
            background: {
              active: '#fff',
              notActive: '#000'
            }
          },
          audio: {
            color: 'lightskyblue'
          },
          close: {
            filter: 'invert(100%) grayscale(1) contrast(0.5) brightness(160%)'
          }
        }
      }
    }
  }
