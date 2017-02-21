# MGrabber

## Installation

```
npm install
```


## Usage

Fetch manga list (mandatory before any download)
```
node grab.js --fetch
```

Download manga scans
```
node grab.js beelzebub
```

Download manga scans and build it into pdf
```
node grab.js beelzebub --pdf
```

Download manga scans and build it into multiple pdf (here: 10 chapters per volume)
```
node grab.js beelzebub --pdf=10
```
