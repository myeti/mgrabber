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
  run(name, opt) {
    if(!name) return this.api.getMangas()
    else {
      return this.find(name)
        .then(manga => {
          return this.download(manga)
            .then(() => {
              if(opt == '-pdf') {
                return this.pdf(manga)
              }
            })
            .then(() => this.open(manga))
        })
    }
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
  pdf(manga) {

    this.log(`Building PDF`)
    const pdf = new PDF(manga, this.folder, this.log)

    return pdf.build()
  }



  /**
   * Open explorer
   */
  open(manga) {
    let folder = path.resolve(this.folder, manga.name).replace(/ /g, '\ ')
    require('child_process').exec(`start "" "${folder}"`)
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
