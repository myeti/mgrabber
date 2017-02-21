const Promise = require('bluebird')
const PDFKit = require('pdfkit')
const sharp = require('sharp')
const path = require('path')
const _ = require('lodash')
const fs = require('fs')


class PDF {


  /**
   * Create new PDF file
   */
  constructor(manga, folder, logger) {

    this.WIDTH = 550

    this.manga = manga
    this.folder = folder
    this.log = logger

    this.stack = []
    this.total = 0
    this.done = 0

    this.stream = null
    this.pdf = null
  }



  /**
   * Build manga to pdf
   */
  build(chunk) {

    // reset stats
    this.stack = []
    this.total = 0
    this.done = 0

    // split chapters into volumes
    chunk = parseInt(chunk)
    if(!chunk) chunk = this.manga.chapters.length

    // sort chapter
    const sortedChapters = _.sortBy(this.manga.chapters, 'number')
    const volumes = _.chunk(sortedChapters, chunk)
    if(volumes.length > 1) {
      this.log(`-> ${volumes.length} volumes`)
    }

    // build volumes
    for(let i in volumes) {
      this.stack.unshift(() => {

        // resolve volume number
        const volume = (volumes.length == 1) ? null : parseInt(i) + 1

        // build volume
        const chapters = volumes[i]
        return this.buildVolume(chapters, volume)
      })
    }

    return this.unstack(this.stack)
      .then(() => { this.log('-> done') })
      .then(() => this.manga)
  }



  /**
   * Build volume doc
   */
  buildVolume(chapters, volume) {

    // resolve volume name and path
    const filename = volume ? `${this.manga.alias}-vol${volume}` : this.manga.alias
    const filepath = path.resolve(this.manga.path.pdfs, `${filename}.pdf`)

    // init stream and document
    this.stream = fs.createWriteStream(filepath)
    this.pdf = new PDFKit()
    this.pdf.pipe(this.stream)

    // reset stats
    this.total = chapters.length
    this.done = 0

    // add intro
    this.pdf.moveDown(20).fontSize(32).text(this.manga.name, {align: 'center'})
    if(volume) this.pdf.moveDown().fontSize(26).text(`Volume ${volume}`, {align: 'center'})

    // build chapters
    let stackChapters = []
    for(let chapter of chapters) {
      stackChapters.unshift(() => this.buildChapter(chapter, volume))
    }

    // save pdf
    return this.unstack(stackChapters)
      .then(() => this.save())
  }



  /**
   * Build full chapter into pdf
   */
  buildChapter(chapter, volume) {

    let stackPages = []

    // add chapter page
    stackPages.push(() => {
      this.pdf.addPage().moveDown(10).fontSize(26).text(chapter.folder, {align: 'center'})
    })

    // add pages
    const sortedPages = _.sortBy(chapter.pages, 'number')
    for(let page of sortedPages) {
      stackPages.unshift(() => this.buildPage(page.path))
    }

    // update progress
    return this.unstack(stackPages)
      .then(() => { this.logProgress(volume) })
  }



  /**
   * Resize and add image to pdf
   */
  buildPage(filepath) {
    return sharp(filepath).resize(this.WIDTH).toBuffer()
      .then(buffer => {
        this.pdf.addPage().image(buffer, 30, 0, {width: this.WIDTH})
      })
  }



  /**
   * Refresh progress %
   */
  logProgress(volume) {
    this.done++
    const progress = this.done * 100 / this.total
    const prefix = volume ? `volume ${volume}: ` : ''
    this.log(`-> ${prefix}${this.done}/${this.total} ${progress.toFixed(2)}%`, true)
  }



  /**
   * Terminate file
   */
  save() {

    this.log('')

    return new Promise(resolve => {
      this.stream.on('finish', () => this.stream.close(resolve))
      this.pdf.end()
    })
  }



  /**
   * Execute request one per one
   */
  unstack(stack) {

    const next = stack.pop()
    if(!next) return Promise.resolve()

    return Promise.try(next)
      .then(() => this.unstack(stack))
  }


}

module.exports = PDF
