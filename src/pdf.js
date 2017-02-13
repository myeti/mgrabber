const PDFKit = require('pdfkit')
const fs = require('fs')

class PDF {


  /**
   * Create new PDF file
   */
  constructor(manga, folder, logger) {

    this.log = logger

    // create file
    const filename = path.resolve(folder, `${manga.alias}.pdf`)
    this.stream = fs.createWriteStream(filename)
    this.file = new PDFKit()
    this.file.pipe(this.stream)

    // add intro page
    this.file.fontSize(32).text(manga.name, {align: 'center'})
  }



  /**
   * Build manga to pdf
   */
  build(manga) {

    const total = manga.chapters.length
    let done = 0

    for(let chapter of manga.chapters) {

      this.chapter(chapter.folder)
      for(let page of chapter.pages) {
        this.page(page.path)
      }

      this.log(`-> ${done}/${total} ${done*100/total}%`, true)
    }

    this.log()
    return this.save()
  }



  /**
   * Add chapter page
   */
  chapter(name) {
    this.file.addPage().fontSize(26).text(name, {align: 'center'})
  }



  /**
   * Add page
   */
  page(img) {
    this.file.addPage().image(img, 30, 0, {width: 550})
  }



  /**
   * Terminate file
   */
  save() {
    return new Promise((resolve, reject) => {
      this.stream.on('finish', () => this.stream.close(resolve))
      this.file.end()
    })
  }


}

module.exports = PDF
