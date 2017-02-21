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
      .then(manga => this.download(manga, opts.force))
      .then(manga => {
        if(opts.pdf) return this.pdf(manga, opts.pdf)
        return manga
      })
      .then(manga => this.open(manga))
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

    this.log(`Search manga "${name}"`)

    return this.api.getManga(name)
      .catch(() => { this.log('** no manga found') })
  }



  /**
   * Download manga images
   */
  download(manga, force) {

    this.log(`Download scans`)
    const downloader = new Downloader(manga, this.folder, this.log)

    return downloader.start(force)
  }



  /**
   * Build manga images into pdf
   */
  pdf(manga, chunk) {

    this.log(`Build pdf`)
    const pdf = new PDF(manga, this.folder, this.log)

    return pdf.build(chunk)
  }



  /**
   * Open explorer to manga folder
   */
  open(manga) {
    require('child_process').exec(`start "" "${manga.path.base}"`)
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
