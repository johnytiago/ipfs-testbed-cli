#!/usr/bin/env node
'use strict'

const ipfsClient = require('ipfs-http-client')

const { getRandomElement } = require('../../lib/utils')
const k8sClient = require('../../lib/kubernetes-client')

const cmd = {
  command: 'cat cid [node-id]',
  desc: 'execute a cat from [node-id] or a random node',
  builder: (yargs) => {
    yargs.positional('node-id', {
      describe: 'node to execute the command at',
      type: 'string'
    }).positional('cid', {
      describe: 'cid of the content to cat',
      type: 'string'
    })
  },
  handler: async ({ cid, nodeId }) => {
    console.log(cid, nodeId)
    const res = await k8sClient.getNodeInfo({ nodeId })
    const node = getRandomElement(res)
    if (!node) return
    const ipfs = ipfsClient(node.hosts.ipfsAPI)
    console.log({ name: node.name, id: node.id })
    const cat = await ipfs.cat(cid)
    console.log(cat.toString())
  }
}

module.exports = cmd
