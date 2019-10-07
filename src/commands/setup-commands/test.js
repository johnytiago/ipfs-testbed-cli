#!/usr/bin/env node
'use strict'

const random = require('random')
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
    yargs.option('t', {
      alias: 'threshold',
      describe: 'startrail cache threshold',
      type: 'number'
    })
    yargs.option('w', {
      alias: 'window_size',
      describe: 'startrail cache window size',
      type: 'number'
    })
    yargs.option('s', {
      alias: 'sample_duration',
      describe: 'startrail window duration',
      type: 'number'
    })
    yargs.option('d', {
      alias: 'duration_opt',
      describe: 'test duration in ms',
      type: 'number'
    })
    yargs.option('f', {
      alias: 'frequency_opt',
      describe: 'test frequency in ms',
      type: 'number'
    })
    yargs.option('p', {
      alias: 'pareto',
      describe: 'use pareto algorithm for random',
      type: 'boolean'
    })
  },
  handler: async ({ dataset, threshold, duration_opt, frequency_opt, window_size, sample_duration, pareto }) => {
    if (!dataset) return

    const DURATION = duration_opt || duration
    const FREQUENCY = frequency_opt || request_frequency

    const refs = require(`../../../refs/${dataset}`)
    const length = refs.length
    const nodes = await k8sClient.getNodeInfo()

    if (threshold || window_size || sample_duration) {
      const options = {}
      if (threshold) options.cacheThreshold = threshold
      if (window_size) options.windowSize = window_size
      if (sample_duration) options.sampleDuration = sample_duration
      await Promise.all(
        nodes.map(node => {
          const ipfs = ipfsClient(node.hosts.ipfsAPI)
          return ipfs.config.set( 'Startrail.popularityManager', options)
        })
      )
    }

    function getRandom() {
      if (pareto) {
        return refs[Math.floor(random.pareto(0.3)() % refs.length)]
      }
      return refs[Math.floor(Math.random()*length)]
    }

    let num_requests = 0
    const intervals = nodes.map( node => {
      return setInterval(async () => {
        try {
          const ipfs = ipfsClient(node.hosts.ipfsAPI)
          const hash = getRandom()
          const data = await ipfs.get(hash)
          num_requests++ 
        } catch(e) {} // Do nothing 
      }, FREQUENCY)
    })

    await new Promise( res => setTimeout(() => {
      intervals.forEach(clearInterval);

      const inputs = {
        num_nodes: nodes.length,
        num_requests,
        dataset,
        frequency: FREQUENCY,
        duration: DURATION
      };
      console.log('Input Variables');
      console.log(inputs)

      res();
    }, DURATION));

    process.exit(0)
  }
}

module.exports = cmd
