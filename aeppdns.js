const { Universal: Ae, Node, MemoryAccount, Crypto, Contract} = require('@aeternity/aepp-sdk')
const contractSource = `contract Resolver = 
  record state = {domains : map(string, string)}
  entrypoint init() : state = {domains = {["fdsa.test"] = "1.1.1.1"}}
  entrypoint read(domain : string) : string = state.domains[domain]
  entrypoint listdomains() : list((string*string)) = Map.to_list(state.domains)
  stateful entrypoint update(domain: string, pointer: string) = put(state{domains[domain] = pointer})
  stateful entrypoint del(domain: string) = put(state{domains=Map.delete(domain, state.domains)})
`

let contractInstance
let client

const setupAccountConnection = async () => {
  const node1 = await Node({url: 'http://localhost:3013', internalUrl: 'http://localhost:3013'})
  var pkBytes = Crypto.hexStringToByte(process.env.INTEGRATION_TEST_RECEIVER_PRIVATE_KEY.trim())
  var kp = Crypto.generateKeyPairFromSecret(pkBytes)
  keypair = {secretKey: Buffer.from(kp.secretKey).toString('hex'), publicKey: Crypto.aeEncodeKey(kp.publicKey)}
  const acc1 = MemoryAccount({keypair: keypair})
  
  client = await Ae({
      nodes: [{name: 'someNode', instance: node1}],
      accounts: [acc1],
      compilerUrl: 'http://localhost:3080'
  })
}

const getExistingContract = async(ct) => {
  await setupAccountConnection()
  const cInst = await client.getContractInstance(contractSource, {"contractAddress": ct})
  return cInst
}

const deploy = async () => {
  await setupAccountConnection()
  contractInstance = await client.getContractInstance(contractSource)
  const deployment = await contractInstance.deploy([])
  return deployment
}

const listDomains = async(ct) => {
  contractInstance = await getExistingContract(ct)
  const staticCallResult = await contractInstance.call('listdomains', [])
  return staticCallResult
}

const readDomain = async(ct, domain) => {
  contractInstance = await getExistingContract(ct)
  const staticCallResult = await contractInstance.call('read', [domain])
  return staticCallResult
}

const putDomain = async(ct, domain, newPointer) => {
  contractInstance = await getExistingContract(ct)
  const callResult = await contractInstance.call('update', [domain, newPointer])
  return callResult
}

const deleteDomain = async(ct, domain) => {
  contractInstance = await getExistingContract(ct)
  const callResult = await contractInstance.call('del', [domain])
  return callResult
}

const main = async() => {
  let result
  var args = process.argv.slice(2)
  // console.log("args", process.argv)

  switch(args[0]) {
    case "deploy":
      console.log("Inside deploy")
      result = await deploy()
      break
    case "list":
      console.log("Inside list")
      result = await listDomains(args[1])
      break
    case "read":
      console.log("Inside read")
      result = await readDomain(args[1], args[2])
      break
    case "put":
      console.log("Inside put")
      result = await putDomain(args[1], args[2], args[3])
      break
    case "delete":
      console.log("Inside delete")
      result = await deleteDomain(args[1], args[2])
      break
    default:
      console.log("Usage: deploy/read/list/put/delete ct_.... domain namePointer")
  }
  // const result = await deploy()
  // const result = await readDomain("ct_NaQPW17oXRw5NQ982cRTiyLmHWxFYKBtF3icq4gxH12YS6NTd", 'fdsa.test')
  // const result = await putDomain("ct_NaQPW17oXRw5NQ982cRTiyLmHWxFYKBtF3icq4gxH12YS6NTd", 'fdsa.test', '2.2.2.2')
  // const result = await deleteDomain("ct_NaQPW17oXRw5NQ982cRTiyLmHWxFYKBtF3icq4gxH12YS6NTd", 'fdsa.test')
  console.log(result)
}
main()
