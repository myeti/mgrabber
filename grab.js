const path = require('path')
const minimist = require('minimist')

const Api = require('./src/api/manga-eden')
const Grabber = require('./src/grabber')

const folder = path.resolve(__dirname, 'mangas')

const api = new Api(folder)
const grabber = new Grabber(api, folder)

const opts = minimist(process.argv.slice(2))
const name = opts._[0]

grabber.run(name, opts)
