/*! KeyValueStore.js / The MIT License / (C) 2015 Retorillo */
var KeyValueStore = function (undefined){
	function KeyValueStore(databaseName) {
		var _storeName = 'keyvalue';
		var _nop = function () { };
		var _self = this;
		var _db = null;
		Object.defineProperty(this, 'database', {
			get: function () {
				return _db;
			}
		});
		this.delete = function () {
			var chain = new KeyValueStoreChain(this);
			_db.close();
			var req = indexedDB.deleteDatabase(databaseName);
			req.onerror = function (e) {
				chain.execute({ name: 'error', args: [e.error] });
			};
			req.onsuccess = function () {
				chain.execute({ name: 'success', args: [] });
			};
			return chain;
		};
		this.open = function () {
			var chain = new KeyValueStoreChain(this);
			var req = window.indexedDB.open(databaseName, 10);
			req.onerror = function (e) {
				chain.execute({ name: 'error', args: [e.error], });
			};
			req.onsuccess = function () {
				_db = req.result;
				chain.execute({ name: 'success', args: [req.result], });
			};
			req.onupgradeneeded = function () {
				_db = req.result;
				if (_db.objectStoreNames.contains(_storeName)) _db.deleteObjectStore(_storeName);
				var os = _db.createObjectStore(_storeName, {
					keyPath: 'key'
				});
				os.createIndex('value', 'value', {
					unique: false
				});
			};
			return chain;
		};
		this.read = function () {
			var args = arguments, keys;
			if (args.length == 1 && args[0] instanceof Array) {
				// read([key1, key2, key3 ...]);
				keys = args[0];
			}
			else {
				// read(key1, key2, key3 ...)
				keys = args;
			}
			var chain = new KeyValueStoreChain(this);
			var os = _db.transaction(_storeName, 'readonly')
			    .objectStore(_storeName);
			var result = new Array();
			result.toString = function () {
				var sb = new Array();
				this.forEach(function (pair) {
					sb.push([pair.key, ' : ', pair.value, ''].join(''));
				});
				return sb.join(', ');
			};
			os.transaction.oncomplete = function () {
				chain.execute({ name: 'success', args: [result], });
			};
			os.transaction.onerror = function (e) {
				chain.execute({ name: 'error', args: [e.error], });
			};
			os.transaction.onabort = function () {
				chain.execute({ name: 'error', args: [e.error], });
			};
			keys.forEach(function (key) {
				var req = os.get(key);
				req.onsuccess = function () {
					var pair = req.result;
					if (!pair) return;
					result.push(pair);
					Object.defineProperty(result, pair.key, {
						get: function () {
							return pair.value
						}
					});
				};
			});
			return chain;
		};
		this.readAllKeys = function () {
			var chain = new KeyValueStoreChain(this);
			var os = _db.transaction(_storeName, 'readonly')
			    .objectStore(_storeName);
			var keys = [];
			os.transaction.oncomplete = function () {
				chain.execute({ name: 'success', args: [keys] });
			};
			os.transaction.onerror = function () {
				chain.execute({ name: 'error', args: [e.error], });
			};
			os.transaction.onabort = function () {
				chain.execute({ name: 'error', args: [e.error], });
			};
			var req = os.openCursor();
			req.onsuccess = function () {
				var cursor = req.result;
				if (!cursor) return;
				keys.push(cursor.key);
				cursor.continue();
			};
			return chain;
		}
		this.write = function () {
			var args = arguments, pairs = [];
			if (args.length >= 2 && args.length % 2 == 0
				&& check_all(args, function (a, i) { return i % 2 == 1 || typeof (a) == 'string'; })) {
				// write(key, value)
				// write(k1, v1, k2, v2, k3, v3, ...)
				for (var c = 0; c < args.length; c += 2)
					pairs.push({ key: args[c], value: args[c + 1] });
			}
			else if (args.length == 1 && args[0] instanceof Array) {
				// write([{ key: k1, value: v1 }, { key: k2, value: v2 }])
				pairs = args[0];
			}
			else if (args.length >= 2 && check_all(args, function (a) { return a instanceof Array; })) {
				// write([k1, v1], [k2, v2], ...)
				for (var c = 0; c < args.length; c++)
					pairs.push({ key: args[c][0], value: args[c][1] });
			}
			else {
				// write({ key: k1, value: v1 }, { key: k1, value: v2 });
				pairs = args;
			}
			var chain = new KeyValueStoreChain(this);
			var os = _db.transaction(_storeName, 'readwrite')
			    .objectStore(_storeName);
			os.transaction.oncomplete = function () {
				chain.execute({ name: 'success' });
			};
			os.transaction.onerror = function () {
				chain.execute({ name: 'error', args: [e.error], });
			};
			os.transaction.onabort = function (e) {
				chain.execute({ name: 'error', args: [e.error], });
			};
			pairs.forEach(function (pair) {
				os.put({
					key: pair.key,
					value: pair.value
				});
			});
			return chain;
		}
	}
	function KeyValueStoreChain(store) {
		var queue = new Array();
		this.readAllKeys = function () {
			this.enqueue({ fn: store.readAllKeys, args: arguments, async: true });
			return this;
		}
		this.read = function () {
			this.enqueue({ fn: store.read, args: arguments, async: true });
			return this;
		}
		this.write = function () {
			this.enqueue({ fn: store.write, args: arguments, async: true });
			return this;
		}
		this.action = function (fn) {
			this.enqueue({ name: 'action', fn: fn, args: [], async: false });
			return this;
		}
		this.success = function (fn) {
			this.enqueue({ condition: 'success', fn: fn, args: [], async: false });
			return this;
		}
		this.error = function (fn) {
			this.enqueue({ condition: 'error', fn: fn, args: [], async: false });
			return this;
		}
		// enqueue, dequeue and execute are internal use only
		this.enqueue = function (d) {
			queue.push(d);
		}
		this.dequeue = function () {
			return queue.splice(0, 1)[0];
		}
		this.execute = function (condition) {
			var preventNextChain = condition.name == 'error';
			while (queue.length > 0) {
				var d = this.dequeue();
				if (d.async) {
					if (!preventNextChain) {
						var nextchain = d.fn.apply(store, d.args);
						for (var c = 0; c < queue.length; c++)
							nextchain.enqueue(queue[c]);
					}
					return;
				}
				else {
					var skip = false;
					var args = null;
					if (d.condition) {
						skip = d.condition != condition.name;
						args = condition.args;
					}
					if (!skip)
						d.fn.apply(store, args);
				}
			}
		}
	}
	function check_all(array, evaluator) {
		for (var c = 0; c < array.length; c++)
			if (!evaluator.apply(array, [array[c]], c))
				return false;
		return true;
	}
	return KeyValueStore;
}();

