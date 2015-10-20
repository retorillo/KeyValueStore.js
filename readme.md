# KeyValueStore.js

Provides huge storage for browser by using [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API).
Using IndexedDB is frustrated coding, You can save time and more easily save long Data URI into browser by using this library.

```javascript
new KeyValueStore("unique_dbname").open()
.read(['dataUri1', 'dataUri2', 'dataUri3'])
.success(function(pairs) {
  $('#img1').attr('src', pairs['dataUri1']);
  $('#img2').attr('src', pairs['dataUri2']);
  $('#img3').attr('src', pairs['dataUri3']);
})
.write([
	{ key: "lastRead", value: new Date().getTime() },
	{ key: "dataUri3", value: nextDataUri3 },
])
.success(function() { alert("Done!"); })
.close();
```

* Cookie and Web Storage cannnot store data a lot.
* IE > 10, Chrome > 24, Firefox > 16, Opera > 15, Safari > 7.1
* According to my testing, IE11 may be able to store about 50MB per domain. See [Browser storage limits and eviction criteria(MDN)](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Browser_storage_limits_and_eviction_criteria).
* Generally, IndexDB is only availble in http/https URI schema. (`window.indexDB` is `null` when file://~)


## Basic Methods

### read method

Reads key-value pairs from KeyValueStore asynchronously;

```javascript
store.read('key1', 'key2', 'key3' ... );
store.read(['key1', 'key2', 'key3' ... ]);
```

Use `success` and `error` methods to handle asynchronous result,
then you can use `write`/`read` methods to continue operation.
```javascript
  store.read('key1', 'value1')
    .error(function(e) { alert(e.Message) })
    .success(function(pairs) {
      // pairs is Array that contains key-value pairs
      for (var c = 0; c < pairs.length; c++){
        console.log([pairs[c].key, pairs[c].value].join(' = '));
      }
    })
    .write ...
    // this write will be execute after first read method is succeeded
```

### write method

Write key-value pairs into KeyValueStore asynchronously.

```javascript
store.write('key1', 'value1', 'key2', 'value2' ... );
store.write(['key1', 'value1'], ['key1', 'value2']);
store.write([
  { key: 'key1', value: 'value1' },
  { key: 'key2', value: 'value2' },
  ...]);
store.write(
  { key: 'key1', value: 'value1' },
  { key: 'key2', value: 'value2' },
  ...);
```

Use `success` and `error` methods to handle asynchronous result,
then you can use `write`/`read` methods to continue operation.
```javascript
  store.write('key1', 'value1')
    .error(function(e) { alert(e.Message) })
    .success(function() { alert('failure!') })
    .write ...
    // this write will be execute after first write method is succeeded
```

## The MIT License (MIT)

keyvaluestore.js and keyvaluestore.min.js are provided under the MIT license.

Copyright &copy; 2015 Retorillo
