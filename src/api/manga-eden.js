const request = require('request-promise')
const Promise = require('bluebird')
const path = require('path')
const fs = require('fs')

const AbstractApi = require('./abstract-api')


class MangaEden extends AbstractApi {


  /**
   * New MangaEden Api
   */
  constructor(storage) {

    super()

    this.dbfile = path.resolve(storage, 'manga-eden.json')
    this.url = {
      api: 'https://www.mangaeden.com/api',
      cdn: 'http://cdn.mangaeden.com/mangasimg'
    }

    // load db
    this.mangas = fs.existsSync(this.dbfile)
      ? JSON.parse(fs.readFileSync(this.dbfile))
      : {}
  }



  /**
   * Get all mangas
   */
  getMangas() {
    return request.get(`${this.url.api}/list/0/`)
      .catch(err => { console.error('Error: getMangas()') })
      .then(json => {

        const parsed = JSON.parse(json)
        for(let raw of parsed.manga) {
          this.mangas[raw.a] = {
            id: raw.i,
            name: raw.t,
            alias: raw.a,
            image: raw.im,
            status: raw.s,
            category: raw.c,
            chapters: []
          }
        }

        fs.writeFileSync(this.dbfile, JSON.stringify(this.mangas))
        return this.mangas
      })
  }



  /**
   * Get manga by name
   */
  getManga(name) {
    return this.mangas[name]
      ? this.getChapters(this.mangas[name])
      : Promise.reject()
  }



  /**
   * Get manga chapters
   */
  getChapters(manga) {
    console.log(`-> found ${manga.name}`)
    return request.get(`${this.url.api}/manga/${manga.id}`)
      .catch(err => { console.error('Error: getChapters()', manga) })
      .then(json => {

        let bulk = []
        const parsed = JSON.parse(json)
        for(let raw of parsed.chapters) {

          let chapter = {
            id: raw[3],
            number: raw[0],
            name: raw[2],
            date: raw[1],
            pages: []
          }

          manga.chapters.push(chapter)
          bulk.push(this.getPages(chapter))
        }

        return Promise.all(bulk)
      })
      .then(() => {
        console.log(`-> ${manga.chapters.length} chapters`)
        return manga
      })
  }



  /**
   * Get chapter pages
   */
  getPages(chapter) {
    return request.get(`${this.url.api}/chapter/${chapter.id}`)
      .catch(err => { console.error('Error: getPages()', chapter) })
      .then(json => {

        const parsed = JSON.parse(json)
        for(let raw of parsed.images) {
          chapter.pages.push({
            number: raw[0],
            url: `${this.url.cdn}/${raw[1]}`
          })
        }

        return chapter
      })
  }


}

module.exports = MangaEden
