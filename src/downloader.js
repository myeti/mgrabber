const Promise = require('bluebird')
const http = require('http')
const path = require('path')
const fs = require('fs')


class Downloader {


  /**
   * New Downloader
   */
  constructor(manga, folder, logger) {
    this.manga = manga
    this.folder = folder
    this.log = logger
  }



  /**
   * Start downloading mange
   */
  start(force) {

    let total = 0
    let done = 0

    // create manga folder
    const mangaFolder = this.manga.name.replace(/[:]/g, ' ').replace(/['?]/g, '')
    this.manga.path = path.resolve(this.folder, mangaFolder)
    if(!fs.existsSync(this.manga.path)) fs.mkdirSync(this.manga.path)

    let stack = []
    for(let chapter of this.manga.chapters) {

      // create chapter folder
      chapter.folder = chapter.number
      if(chapter.name && chapter.name != chapter.number) chapter.folder += ` - ${chapter.name}`
      chapter.folder = chapter.folder.toString().replace(/[:]/g, ' ').replace(/['?]/g, '')
      chapter.path = path.resolve(this.manga.path, chapter.folder)
      if(!fs.existsSync(chapter.path)) fs.mkdirSync(chapter.path)
      total += chapter.pages.length

      for(let page of chapter.pages) {

        // add page request to stack
        page.file = `${page.number}${path.extname(page.url)}`
        page.path = path.resolve(chapter.path, page.file)
        if(force || !fs.existsSync(page.path)) {
          stack.push(() => {
            return this.download(page)
              .then(() => {
                done++
                let progress = done * 100 / total
                this.log(`-> ${done}/${total} ${(progress).toFixed(2)}%`, true)
              })
          })
        }
        else total--
      }

    }

    // start executing stack
    return this.unstack(stack.reverse())
      .then(() => {
        if(done) this.log('')
        this.log('-> done')
      })
      .then(() => this.manga)
  }



  /**
   * Download one page
   */
  download(page) {
    return new Promise((resolve, reject) => {
      let file = fs.createWriteStream(page.path)
      http.get(page.url, response => {
        response.on('data', data => { file.write(data) })
        response.on('end', () => {
          file.end()
          resolve()
        })
      })
    })
  }



  /**
   * Execute request one per one
   */
  unstack(stack) {

    const next = stack.pop()
    if(!next) return Promise.resolve()

    return next()
      .then(() => this.unstack(stack))
  }


}

module.exports = Downloader
