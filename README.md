# extended-inquiry-response

Bluetooth EIR encoder and decoder.

    npm install extended-inquiry-response

## Usage

Most of the properties have corresponding values defined in the Bluetooth specification. The service array accepts 128-bit, 32-bit and 16-bit UUIDs, which can either be buffers or strings with optional dashes.

```javascript
var eir = require('extended-inquiry-response')

var buffer = eir.encode({
  flags: {
    leLimitedDiscoverableMode: true,
    leGeneralDiscoverableMode: true,
    bredrNotSupported: true,
    simultaneousLeAndBredrController: true,
    simultaneousLeAndBredrHost: true
  },
  service: [
    '13333333-3333-3333-3333-333333330001',   // 128-bit UUID as string
    '33330001',                               // 32-bit UUID as string
    Buffer.from('3a01', 'hex')                // 16-bit UUID as buffer
  ],
  serviceUuid128bitComplete: true,
  serviceUuid32bitComplete: true,
  serviceUuid16bitComplete: true,
  localName: 'test name',
  txPowerLevel: 55,
  manufacturerSpecificData: Buffer.from('hello world')
})

var obj = eir.decode(buffer)
```
