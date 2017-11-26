# extended-inquiry-response

Bluetooth EIR encoder and decoder.

    npm install extended-inquiry-response

## Usage

```javascript
var eir = require('extended-inquiry-response')

var buffer = eir.encode({
  flags: {
    leGeneralDiscoverableMode: true,
    bredrNotSupported: true
  },
  service: [
    '13333333-3333-3333-3333-333333330001'
  ],
  localName: 'test-name',
  txPowerLevel: 55,
  manufacturerSpecificData: Buffer.from('hello')
})
```
