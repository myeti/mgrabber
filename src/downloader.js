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

    this.stack = []
    this.total = 0
    this.done = 0

  }



  /**
   * Start downloading mange
   */
  start(force) {

    // reset stats
    this.stack = []
    this.total = 0
    this.done = 0

    // create manga folder
    const mangapath = path.resolve(this.folder, this.manga.alias)
    this.manga.path = {
      base: mangapath,
      scans: path.resolve(mangapath, 'scans'),
      pdfs: path.resolve(mangapath, 'pdfs'),
    }
    if(!fs.existsSync(this.manga.path.base)) fs.mkdirSync(this.manga.path.base)
    if(!fs.existsSync(this.manga.path.scans)) fs.mkdirSync(this.manga.path.scans)
    if(!fs.existsSync(this.manga.path.pdfs)) fs.mkdirSync(this.manga.path.pdfs)

    // stack chapters requests
    for(let chapter of this.manga.chapters) {
      this.stackChapter(chapter, force)
    }

    // start executing stack
    return this.unstack(this.stack.reverse())
      .then(() => {
        if(this.done) this.log('')
        this.log('-> done')
      })
      .then(() => this.manga)
  }



  /**
   * Stack chapter request
   */
  stackChapter(chapter, force) {

    // resolve chapter name and path
    chapter.folder = chapter.number
    if(chapter.name && chapter.name != chapter.number) chapter.folder += ` - ${chapter.name}`
    chapter.folder = chapter.folder.toString().replace(/[:]/g, ' ').replace(/['?]/g, '')
    chapter.path = path.resolve(this.manga.path.scans, chapter.folder)

    // create chapter folder
    if(!fs.existsSync(chapter.path)) fs.mkdirSync(chapter.path)

    // stack pages
    for(let page of chapter.pages) {
      this.stackPage(page, chapter, force)
    }
  }



  /**
   * Stack page request
   */
  stackPage(page, chapter, force) {

    // resolve page path
    page.file = `${page.number}${path.extname(page.url)}`
    page.path = path.resolve(chapter.path, page.file)

    // image already exists
    if(!force && fs.existsSync(page.path)) return;
    this.total++

    // add page request to stack
    this.stack.push(() => this.download(page))
  }



  /**
   * Download one page
   */
  download(page) {

    return new Promise(resolve => {

      // execute download
      let file = fs.createWriteStream(page.path)
      http.get(page.url, response => {

        // fill stream
        response.on('data', data => { file.write(data) })

        // terminate download
        response.on('end', () => {
          file.end()
          this.logProgress() // update progress %
          resolve()
        })
      })
    })

  }



  /**
   * Calculate progress
   */
  logProgress() {
    this.done++
    const progress = this.done * 100 / this.total
    this.log(`-> ${this.done}/${this.total} ${(progress).toFixed(2)}%`, true)
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
