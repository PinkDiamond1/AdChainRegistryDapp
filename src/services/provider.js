import Eth from 'ethjs'
import { network } from '../models/network'

export const getProviderUrl = () => {
  if (network === 'testrpc') {
    return 'http://localhost:8545'
  } else {
    return `https://${network}.infura.io:443`
  }
}

export const getProvider = () => {
  if (typeof window.web3 !== 'undefined' && typeof window.web3.currentProvider !== 'undefined') {
    return window.web3.currentProvider
  } else {
    return new Eth.HttpProvider(getProviderUrl())
  }
}

export const getWebsocketProvider = () => {
  // https://github.com/ethereum/web3.js/issues/1119
  if (!window.Web3.providers.WebsocketProvider.prototype.sendAsync) {
    window.Web3.providers.WebsocketProvider.prototype.sendAsync = window.Web3.providers.WebsocketProvider.prototype.send
  }

  return new window.Web3.providers.WebsocketProvider(`wss://${network}.infura.io/_ws`)
}
