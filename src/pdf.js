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
    this.manga = manga
    this.folder = folder
    this.log = logger
  }



  /**
   * Build manga to pdf
   */
  build(chunk) {

    // resolve chunk number
    chunk = parseInt(chunk)
    const onefile = !chunk
    if(!chunk) chunk = this.manga.chapters.length
    const parts = _.chunk(this.manga.chapters, chunk).reverse()

    // stack all docs for synchronous writing
    let stack = []
    for(let i in parts) {
      i = parseInt(i)
      stack.push(() => {

        const chapters = parts[i].reverse()
        if(!onefile) {
          this.log(`-> volume ${i+1}`)
        }

        // create pdf document
        const docname = onefile ? this.manga.alias : `${this.manga.alias}-vol${i+1}`
        const filename = path.resolve(this.folder, `${docname}.pdf`)
        let stream = fs.createWriteStream(filename)
        let doc = new PDFKit()
        doc.pipe(stream)

        // init progress
        const total = chapters.length
        let done = 0

        // add intro
        doc.moveDown(20).fontSize(32).text(this.manga.name, {align: 'center'})
        if(!onefile) {
          doc.moveDown().text(i+1, {align: 'center'})
        }

        let stackChapters = []
        for(let chapter of chapters) {
          stackChapters.push(() => {

            // add pages
            let stackPages = []
            for(let page of chapter.pages) {
              stackPages.push(() => this.page(doc, page.path))
            }

            // add chapter
            stackPages.push(() => this.chapter(doc, chapter.folder))

            // update progress
            return this.unstack(stackPages)
              .then(() => {
                done++
                const progress = done * 100 / total
                this.log(`-> ${done}/${total} ${progress.toFixed(2)}%`, true)
              })
          })
        }

        // save doc
        return this.unstack(stackChapters.reverse())
          .then(() => { this.log('') })
          .then(() => this.save(stream, doc))
      })
    }

    return this.unstack(stack.reverse())
      .then(() => {
        this.log('-> done'))
      })
      .then(() => this.manga)
  }



  /**
   * Add chapter page
   */
  chapter(doc, name) {
    doc.addPage().fontSize(26).text(name, {align: 'center'})
    return Promise.resolve()
  }



  /**
   * Add page
   */
  page(doc, img) {
    return sharp(img).resize(550).toBuffer()
      .then(buffer => {
        doc.addPage().image(buffer, 30, 0, {width: 550})
      })
  }



  /**
   * Terminate file
   */
  save(stream, doc) {
    return new Promise((resolve, reject) => {
      stream.on('finish', () => stream.close(resolve))
      doc.end()
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
