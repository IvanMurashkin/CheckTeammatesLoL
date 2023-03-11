const  find = require('find-process')
const  https = require('https')
const  axios = require('axios')
const { app, BrowserWindow } = require('electron')
const electronLocalshortcut = require('electron-localshortcut');

const findSubstring = (str, from, to) => {
  const fromIndex = str.indexOf(from) + from.length
  const toIndex = str.indexOf(to)

  return str.substring(fromIndex, toIndex)
}

const regionMap = {
  'eu1': 'euw',
  'ru1': 'ru'
}

const getSummoner = async () => {
  const [leagueProcess] = await find('name', 'LeagueClientUx.exe', true)

  if (!leagueProcess) throw new Error()

  const port = findSubstring(leagueProcess.cmd, '--riotclient-app-port=', '" "--no-rads')
  const token = findSubstring(leagueProcess.cmd, '--riotclient-auth-token=', '""--riotclient-app-port')
  const parsedToken = Buffer.from(`riot:${token}`).toString('base64')

  const { data } = await axios.get(`https://127.0.0.1:${port}/chat/v5/participants/champ-select`, {
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${parsedToken}`
    }
  })

  if (data.participants.length === 0) throw new Error()

  return data.participants
}

const loadSummonerPage = (win) => {
  win.loadFile('load.html')
  getSummoner().then(teammates => {
    const summonerRegion = teammates[0].region
    win.loadURL(`https://porofessor.gg/pregame/${regionMap[summonerRegion]}/${teammates.map(teammate => teammate.name).join(',')}`)
  }).catch(() => {
    win.loadFile('error.html')
  })
}

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1240,
    height: 600,
    title: "Check teammates"
  })

  win.removeMenu()

  loadSummonerPage(win)

  electronLocalshortcut.register(win, ['Ctrl+R', 'F5'], () => {
    loadSummonerPage(win)
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})