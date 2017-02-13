const path = require('path')

const Api = require('./src/api/manga-eden')
const Grabber = require('./src/grabber')

const folder = path.resolve(__dirname, 'mangas')

const api = new Api(folder)
const grabber = new Grabber(api, folder)

grabber.run(process.argv[2], process.argv[3])
