const  find = require('find-process')
const  https = require('https')
const  axios = require('axios')
const { app, BrowserWindow } = require('electron')
const electronLocalshortcut = require('electron-localshortcut');

const getCmdValueByKey = (cmd, key) => {
  const fromIndex = cmd.indexOf(key) + key.length
  const value = cmd.substring(fromIndex)
  const toIndex = value.indexOf('"')

  return value.substring(-toIndex, toIndex)
}

const getSummoner = async () => {
  const [leagueProcess] = await find('name', 'LeagueClientUx.exe', true)

  if (!leagueProcess) throw new Error()

  const port = getCmdValueByKey(leagueProcess.cmd, '--riotclient-app-port=')
  const token = getCmdValueByKey(leagueProcess.cmd, '--riotclient-auth-token=')
  const region = getCmdValueByKey(leagueProcess.cmd, '--region=')
  const parsedToken = Buffer.from(`riot:${token}`).toString('base64')

  const { data } = await axios.get(`https://127.0.0.1:${port}/chat/v5/participants/champ-select`, {
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${parsedToken}`
    }
  })

  if (data.participants.length === 0) throw new Error()

  return { teammates: data.participants, region }
}

const loadSummonerPage = (win) => {
  win.loadFile('load.html')
  getSummoner().then(({ teammates, region }) => {
    win.loadURL(`https://porofessor.gg/pregame/${region.toLowerCase()}/${teammates.map(teammate => teammate.name).join(',')}`)
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