(function() {
  function noop() {}

  // dispatch cordova events for testing purpose
  window.setOffline = function() {
    window.navigator.connection.type = window.Connection.NONE;
    document.dispatchEvent(new window.Event('offline'));
  };
  window.setOnline = function() {
    window.navigator.connection.type = window.Connection.WIFI;
    document.dispatchEvent(new window.Event('online'));
  };
  window.setBackground = function() {
    document.dispatchEvent(new window.Event('pause'));
  };
  window.setForeground = function() {
    document.dispatchEvent(new window.Event('resume'));
  };

  window.cordova = {};
  window.cordova.plugins = {};
  window.plugins = {};

  window.cordova.platformId = 'browser';

  // filesystem
  window.LocalFileSystem = {
    PERSISTENT: 0,
    TEMPORARY: 1
  };
  window.requestFileSystem = function() {
    return Promise.resolve();
  };

  // push
  function oneSignalInit() {
    return OneSignalConf;
  }
  var OneSignalConf = {
    handleNotificationOpened: oneSignalInit,
    handleNotificationReceived: oneSignalInit,
    inFocusDisplaying: oneSignalInit,
    endInit: oneSignalInit
  };

  window.plugins.OneSignal = {
    startInit: oneSignalInit,
    getIds: noop,
    enableSound: noop,
    enableVibrate: noop,
    setRequiresUserPrivacyConsent: noop,
    provideUserConsent(bool) {
      localStorage.setItem('__onesignalConsent', bool);
    },
    userProvidedPrivacyConsent(callback) {
      setTimeout(callback(JSON.parse(localStorage.getItem('__onesignalConsent'))));
    },
    OSInFocusDisplayOption: {
      None: 1
    }
  };

  // events
  document.addEventListener('DOMContentLoaded', function() {
    document.dispatchEvent(new window.Event('deviceready'));
  }, false);

  // backbutton emulation
  window.backbutton = function() {
    document.dispatchEvent(new window.Event('backbutton'));
  };

  // InAppBrowser
  window.cordova.InAppBrowser = {
    open: window.open
  }

  // keyboard
  window.cordova.plugins.Keyboard = {
    show: noop,
    close: noop,
    disableScroll: noop,
    hideKeyboardAccessoryBar: noop
  };

  // social sharing
  window.plugins.socialsharing = {
    share: function(message, subject, image, link) {
      if (message) console.log('Text share widget opened with text: ', message);
      if (link) console.log('Link share widget opened with link: ', link);
    }
  };

  // toast
  function mockToast() {
    console.log('Toast fired with args:', arguments);
  }
  window.plugins.toast = {
    show: mockToast,
    showShortTop: mockToast,
    showShortCenter: mockToast,
    showShortBottom: mockToast,
    showLongTop: mockToast,
    showLongCenter: mockToast,
    showLongBottom: mockToast
  };

  // insomnia
  window.plugins.insomnia = {};
  window.plugins.insomnia.allowSleepAgain = noop;
  window.plugins.insomnia.keepAwake = noop;

  // status bar
  window.StatusBar = {};
  window.StatusBar.show = noop;
  window.StatusBar.hide = noop;

  // fullscreen
  window.AndroidFullScreen = {};
  window.AndroidFullScreen.showSystemUI = noop;
  window.AndroidFullScreen.immersiveMode = noop;

  // device
  window.device = {
    cordova: 'browser',
    model: 'browser',
    platform: 'browser',
    uuid: 'browser',
    version: 'browser'
  };

  // network information
  window.Connection = {
    NONE: 'none',
    UNKNOWN: 'unknown',
    WIFI: 'wifi',
    ETHERNET: 'ethernet',
    CELL_2G: '2g',
    CELL_3G: '3g',
    CELL_4G: '4g',
    CELL: 'cellular'
  };
  window.navigator.connection = {
    type: window.Connection.WIFI
  };

  // notification
  window.navigator.notification = {};
  window.navigator.notification.alert = window.alert.bind(window);
  window.navigator.notification.confirm = function(message, callback) {
    if (window.confirm(message)) callback()
  }
  window.navigator.notification.prompt = window.prompt.bind(window);
  window.navigator.notification.beep = noop;

  // splashscreen
  window.navigator.splashscreen = {};
  window.navigator.splashscreen.hide = noop;

  // globalization
  window.navigator.globalization = {
    getPreferredLanguage: function(success) {
      success({
        value: 'en'
      });
    }
  };

  // universal/deep linking
  window.universalLinks = {
    subscribe: noop
  };

  // local notifications
  window.cordova.plugins.notification = {
    local: {
      schedule: function(opts) {
        console.log('Local notification triggered with opts:', opts)
      },
      cancelAll: function() {
        console.log('Local notifications canceled')
      },
      on: noop
    }
  }

  window.plugins.webViewChecker = {
    getCurrentWebViewPackageInfo: function() {
      return Promise.resolve({
        packageName: 'com.android.chrome',
        versionName: '69.0.3497.100',
        versionCode: 349710065,
      })
    },
    openGooglePlayPage: noop
  }

}());

if (!window.Stockfish) {
  // cordova-stockfish-plugin interface
  var stockfishWorker;
  window.Stockfish = {
    init: function() {
      return new Promise(function(resolve) {
        if (stockfishWorker) {
          setTimeout(resolve);
        } else {
          stockfishWorker = new Worker('../stockfish.js');
          setTimeout(resolve, 10);
        }
      });
    },
    cmd: function(cmd) {
      return new Promise(function(resolve) {
        if (stockfishWorker) stockfishWorker.postMessage(cmd);
        setTimeout(resolve, 1);
      });
    },
    output: function(callback) {
      if (stockfishWorker) {
        stockfishWorker.onmessage = msg => {
          callback(msg.data);
        };
      }
    },
    exit: function() {
      return new Promise(function(resolve) {
        if (stockfishWorker) {
          stockfishWorker.terminate();
          stockfishWorker = null;
        }
        setTimeout(resolve, 1);
      });
    }
  };
}

/**
 * https://github.com/floatinghotpot/cordova-plugin-lowlatencyaudio polyfill
 *
 * Created by liming on 14-7-18.
 */
(function() {

  var hotjs = {};

  var html5_audio = {
    // id -> obj mapping
    res_cache: {},

    preloadFX: function(id, assetPath, success, fail) {
      var res = new Audio();
      res.addEventListener('canplaythrough', success, false);
      res.onerror = fail;
      res.setAttribute('src', assetPath);
      res.load();
      this.res_cache[id] = res;
    },

    preloadAudio: function(id, assetPath, volume, voices, success, fail) {
      var res = new Audio();
      res.addEventListener('canplaythrough', success, false);
      res.onerror = fail;
      res.setAttribute('src', assetPath);
      res.load();
      res.volume = volume;
      this.res_cache[id] = res;
    },

    play: function(id, success, fail) {
      var res = this.res_cache[id];
      if (typeof res === 'object') {
        res.play();
        if (typeof success === 'function') success();
      } else {
        if (typeof fail === 'function') fail();
      }
    },

    mute: function(ismute, success) {
      for (var id in this.res_cache) {
        var res = this.res_cache[id];
        if (typeof res === 'object') res.muted = ismute;
      }
      if (typeof success === 'function') success();
    },

    loop: function(id, success, fail) {
      var res = this.res_cache[id];
      if (typeof res === 'object') {
        res.loop = true;
        res.play();
        if (typeof success === 'function') success();
      } else {
        if (typeof fail === 'function') fail();
      }
    },
    stop: function(id, success, fail) {
      var res = this.res_cache[id];
      if (typeof res === 'object') {
        res.pause();
        if (res.currentTime) res.currentTime = 0;
        if (typeof success === 'function') success();
      } else {
        if (typeof fail === 'function') fail();
      }
    },
    unload: function(id, success, fail) {
      var res = this.res_cache[id];
      if (typeof res === 'object') {
        delete this.res_cache[id];
        if (typeof success === 'function') success();
      } else {
        if (typeof fail === 'function') fail();
      }
    }
  };

  hotjs.Audio = hotjs.Audio || {};

  var initHotjsAudio = function() {
    if (window.plugins && window.plugins.LowLatencyAudio) {
      hotjs.Audio = window.plugins.LowLatencyAudio;
      if (typeof hotjs.Audio.mute !== 'function') {
        hotjs.Audio.mute = function() {};
      }
    } else {
      hotjs.Audio = html5_audio;
    }

    hotjs.Audio.preloadFXBatch = function(fx_mapping) {
      for (var k in fx_mapping) {
        this.preloadFX(k, fx_mapping[k]);
      }
    };
    hotjs.Audio.unloadFXBatch = function(fx_mapping) {
      for (var k in fx_mapping) {
        this.unload(k);
      }
    };

    hotjs.Audio.init = initHotjsAudio;
  };

  hotjs.Audio.init = initHotjsAudio;

  window.hotjs = hotjs;

})();
