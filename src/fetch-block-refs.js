'use strict'

const ipfsClient = require('ipfs-http-client')
const fs = require('fs').promises

async function fetchLocalBlockRefs()  {
  const ipfs = ipfsClient({port: 5002})
  const refs = await ipfs.refs.local()
  fs.writeFile('refs.json', JSON.stringify(refs.map(({Ref}) => Ref), null, 2)) 
}

fetchLocalBlockRefs()
