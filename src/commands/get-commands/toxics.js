#!/usr/bin/env node
'use strict'

const k8sClient = require('../../lib/kubernetes-client')
const toxiproxyClient = require('../../lib/toxiproxy-client')

const cmd = {
  command: ['toxics [toxic] <node-id>', 'toxic [toxic] <node-id>'],
  desc: 'lists or gets a toxic from <node-id>',
  builder: (yargs) => {
    yargs.positional('toxic', {
      describe: 'specific toxic to get',
      type: 'string'
    }).positional('node-id', {
      describe: 'node to get the resource from',
      type: 'string'
    })
  },
  handler: async ({ nodeId, toxic }) => {
    const res = await k8sClient.getNodeInfo({ nodeId: nodeId })
    const toxics = await toxiproxyClient.getToxics(res[0].hosts.toxiproxyAPI, { toxic })
    console.log(toxics)
  }
}

module.exports = cmd
