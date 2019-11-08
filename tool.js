const { Universal: Ae, Node, MemoryAccount, Crypto, Contract} = require('@aeternity/aepp-sdk')
const contractSource = `contract Resolver = 
  record state = {domains : map(string, string)}
  entrypoint init() : state = {domains = {["fdsa.test"] = "1.1.1.1"}}
  entrypoint read(domain : string) : string = state.domains[domain]
  entrypoint listdomains() : list((string*string)) = Map.to_list(state.domains)
  stateful function update(domain: string, pointer: string) = put(state{domains[domain] = pointer})
  stateful function del(domain: string) = put(state{domains=Map.delete(domain, state.domains)})
`

const main = async () => {
    const node1 = await Node({url: 'http://localhost:3013', internalUrl: 'http://localhost:3013'})
    var pkBytes = Crypto.hexStringToByte(process.env.INTEGRATION_TEST_RECEIVER_PRIVATE_KEY.trim())
    var kp = Crypto.generateKeyPairFromSecret(pkBytes)
    keypair = {secretKey: Buffer.from(kp.secretKey).toString('hex'), publicKey: Crypto.aeEncodeKey(kp.publicKey)}
    const acc1 = MemoryAccount({keypair: keypair})
    
    const client = await Ae({
        nodes: [{name: 'someNode', instance: node1}],
        accounts: [acc1],
        compilerUrl: 'http://localhost:3080'
    })
    
    const contractIns = await client.getContractInstance(contractSource)
    const deployment = await contractIns.deploy([])
    console.log(deployment)

    const staticCallResult = await contractIns.call('listdomains', [])
    console.log("HELLO WHY NOTHING HERE", staticCallResult)
}

main()