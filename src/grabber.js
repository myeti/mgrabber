const path = require('path')

const Downloader = require('./downloader')
const PDF = require('./pdf')

class Grabber {


  /**
   * New Manga Grabber
   */
  constructor(api, folder) {
    this.api = api
    this.folder = folder
    this.log(`= MANGA GRABBER =`)
  }



  /**
   * Run grabbing
   */
  run(name, opts) {

    if(!name) {

      // refresh catalog
      if(opts.fetch) return this.fetch()

      // display all options
      this.log('Hello :)')
      this.log('node grab.js --fetch : fetch manga list')
      this.log('node grab.js beelzebub : download manga images, ignore if image already exists')
      this.log('node grab.js beelzebub --pdf : download and build images into one pdf volume')
      this.log('node grab.js beelzebub --pdf=10 : download and build images into 10 pdf volumes')
      return;
    }

    return this.find(name)
      .then(manga => this.download(manga))
      .then(manga => {
        if(opts.pdf) return this.pdf(manga, opts.pdf)
      })
  }



  /**
   * fetch manga catalog
   */
  fetch() {

    this.log('Fetch manga list')

    return this.api.getMangas()
  }



  /**
   * Fetch manga data
   */
  find(name) {

    this.log(`Search manga "${name}"...`)

    return this.api.getManga(name)
  }



  /**
   * Download manga images
   */
  download(manga) {

    this.log(`Downloading images`)
    const downloader = new Downloader(manga, this.folder, this.log)

    return downloader.start()
  }



  /**
   * Build manga images into pdf
   */
  pdf(manga, chunk) {

    this.log(`Building PDF`)
    const pdf = new PDF(manga, this.folder, this.log)

    return pdf.build(chunk)
  }



  /**
   * Reset and write message in console
   */
  log(message, reset) {
    if(reset) {
      process.stdout.clearLine()
      process.stdout.cursorTo(0)
      process.stdout.write(message)
    }
    else console.log(message)
  }

}

module.exports = Grabber
