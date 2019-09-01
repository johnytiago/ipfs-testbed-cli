#!/usr/bin/env node
'use strict'

const ipfsClient = require('ipfs-http-client')
const k8sClient = require('../../lib/kubernetes-client')
const { request_frequency, duration } = require('../../config').tests

const cmd = {
  command: 'test <dataset>',
  desc: 'run the tests for refs in <dataset>',
  builder: (yargs) => {
    yargs.positional('dataset', {
      describe: 'name of the refs file in the refs folder',
      type: 'string'
    })
  },
  handler: async ({ dataset }) => {
    if (!dataset) return
    const refs = require(`../../../${dataset}`)
    const length = refs.length
    const nodes = await k8sClient.getNodeInfo()
    const intervals = []
    nodes.forEach((node) => {
      const ipfs = ipfsClient(node.hosts.ipfsAPI)
      const interval = setInterval(async () => {
        const hash = refs[Math.floor(Math.random()*length)]
        // Should I do block.get instead ?
        ipfs.get(hash, (err, data) => {
          if(err) return console.log(err)
          console.log(data)
          console.log(`${node.name}: Got block ${hash}`)
        })
      }, request_frequency)
      intervals.push(interval)
    })

    setTimeout(() => intervals.forEach(t => clearInterval(t)), duration)
  }
}

module.exports = cmd
