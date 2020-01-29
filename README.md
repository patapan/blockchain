# Cryptocurrency & Blockchain
A proof of concept 

(Under development)

This project has been undertaken as part of a course instructed by Lauri Hartikka.


Currently functions as generic block chain. WebSockets are used for p2p communication and a HTTP protocol is used for user control. Final product will include a Wallet UI and a tool to visualise the state of the blockchain.


##### Get blockchain
```
curl http://localhost:3001/blocks
```

##### Create block
```
curl -H "Content-type:application/json" --data '{"data" : "Some data to the first block"}' http://localhost:3001/mineBlock
``` 

##### Add peer
```
curl -H "Content-type:application/json" --data '{"peer" : "ws://localhost:6001"}' http://localhost:3001/addPeer
```
#### Query connected peers
```
curl http://localhost:3001/peers
```