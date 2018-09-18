const electron = require('electron')
const { app, BrowserWindow, ipcMain } = electron
const path = require('path')
const windowStateKeeper = require('electron-window-state')

if (process.platform !== "win32")
    app.disableHardwareAcceleration()

app.on('ready', () => setTimeout(() => {
    let mainWindowState = windowStateKeeper({
        defaultWidth: 300,
        defaultHeight: 500
      });

    let win = new BrowserWindow({
        transparent: true,
        frame: false,
        width: mainWindowState.width,
        height: mainWindowState.height,
        x: mainWindowState.x,
        y: mainWindowState.y,
        alwaysOnTop: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload', 'main.js')
        }
    })

    win.loadFile('main.html')
    win.setAlwaysOnTop(true)
    //win.toggleDevTools()

    mainWindowState.manage(win);
    
    let td_win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload', 'td_win.js'),
            nodeIntegration: false
        }
    })

    td_win.loadURL('https://tweetdeck.twitter.com/')
    td_win.minimize();

    win.on('closed', function () {
        win = null
        app.quit();
    })
    td_win.on('closed', function () {
        win = null
        app.quit();
    })


    ipcMain.on('home_timeline', (evt, twt_obj) => {
        win.send('home_timeline', twt_obj);
    });

    ipcMain.on('ignoreMouseEvents', (evt, b) => {
        win.setIgnoreMouseEvents(b);
    });

}))

app.on('window-all-closed', () => app.quit())
