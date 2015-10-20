var databaseName = 'db_3m5qu97k';
var store = null;
var literals = {}
literals.en = {
	appDescription: 'KeyValueStore.js provides huge stroage by using IndexedDB. Storing long DataURI is one of optimal usage. You can try to read/write data into your browser in this demo.',
	gotoGithub: 'Download codes from Github',
	writeTitle: 'Write pair',
	writeDescription: 'Write key-value pair into your browser. Written data will be kept even if browser is closed.',
	writeButton: 'Write',
	readTitle: 'Read pair',
	readDescription: 'Read key-value pair by specifying single key or comma separated multiple keys.',
	readButton: 'Read',
	deleteTitle: 'Remove to exit demo',
	deleteDescription: 'All written data are removed to exit demo.',
	deleteButton: 'Remove',
	allKeysTitle: 'All Keys',
	allKeysDescription: 'The following list represents all keys written.',
	readCompleted: 'Pairs were read from your browser',
	writeCompleted: 'Pair was written into your browser',
	deleteCompleted: 'Database was removed from your browser. Thanks a lot for trying.',
}
literals.ja = {
	appDescription: 'KeyValueStore.jsはIndexedDBを利用し大容量のストレージを提供します。CookieやWebStorageでは格納しきれないDataURIの格納に最適です。このデモではブラウザへのデーター読み書きの機能がお試しいただけます。',
	gotoGithub: 'Githubからコードをダウンロード',
	writeTitle: 'ペアを書き込む',
	writeDescription: 'ブラウザにキーと値のペアを書き込みます。書き込んだ情報はブラウザを閉じても維持されます',
	writeButton: '書き込む',
	readTitle: 'ペアを読み込む',
	readDescription: 'キーを指定するか、カンマで区切った複数のキーを指定してペアを読み込みます',
	readButton: '読み込む',
	deleteTitle: '削除して終了する',
	deleteDescription: 'ブラウザから書き込んだデーターを完全に削除してアプリを終了します',
	deleteButton: '削除する',
	allKeysTitle: 'すべてのキー',
	allKeysDescription: '以下にブラウザに書き込まれたすべてのキーが列挙さまれす',
	readCompleted: '読み込みは完了しました',
	writeCompleted: '書き込みは完了しました',
	deleteCompleted: 'データーベースは削除されました。お試しいただき有り難うございました',
}
literals.now = null;
literals.update = function (l) {
	$('*[data-literal]').each(function(){
		var e = $(this);
		e.text(l[e.data('literal')]);
	});
	literals.now = l;
}

$(function () {

	if (/ja/i.test(window.navigator.userLanguage || window.navigator.language))
		literals.update(literals.ja);
	else
		literals.update(literals.en);

	$('#lang-ja').click(function () {
		literals.update(literals.ja);
	})
	$('#lang-en').click(function () {
		literals.update(literals.en);
	})

	$('#alert').slideUp(0);
	$('.form *').attr('disabled', 'disabled');
	store = new KeyValueStore(databaseName);
	store.open()
		.success(function () {
			$('.form *').removeAttr('disabled');
			$('#read-btn').click(onreadbtnclick);
			$('#write-btn').click(onwritebtnclick);
			$('#deldb-btn').click(ondeldbbtnclick);
			updateAllKeys();
		});

	applyBootstrap();
});
function onreadbtnclick() {
	$('#read-form *').attr('disabled', 'disabled');
	var searchKeys = $('#read-key').val().split(',');
	searchKeys.forEach(function (key, index) {
		searchKeys[index] = key.trim()
	});
	store.read(searchKeys)
		.success(function (value) {
			$('#read-value').val(value.toString());		
			appalert(literals.now.readCompleted);
		})
		.action(function () {
			$('#read-form *').removeAttr('disabled')
		});
}
function onwritebtnclick() {
	$('#write-form *').attr('disabled', 'disabled');
	store.write($('#write-key').val(), $('#write-value').val())
		.success( function() {
			updateAllKeys();
			$('#write-key, #write-value').val('');
			$('#write-form *').removeAttr('disabled');
			appalert(literals.now.writeCompleted);
		});
}
function ondeldbbtnclick() {
	$('.form *').attr('disabled', 'disabled');
	$('input, textarea').val('');
	store.delete().success(function () {
		appalert(literals.now.deleteCompleted, true);
		store = null;
		updateAllKeys();
	});
}
function appalert(msg, error) {
	var a = $('#alert').text(msg).slideDown(250);
	var timer = a.data('timer');
	if (timer) clearTimeout(timer);
	if (!error) {
		a.data('timer', setTimeout(function () {
			a.slideUp(1000);
		}, 3000));
	}	
}
function onstoreerror(msg) {
	appalert(msg, 'danger');
}
function applyBootstrap() {
	var root = $('.form');
	root.find('input, textarea').each(function () {
		var e = $(this);
		e.addClass('form-control');
		$('<label clas="control-label">').text(e.data('label')).insertBefore(e);
		e.wrap($('<div class="form-group">'));
	});
	root.find('button').each(function () {
		$(this).addClass('btn btn-primary').wrap($('<div class="form-group">'));
	});
}
function updateAllKeys() {
	var all = $('#all');
	all.empty();
	if (store == null) return;
	store.readAllKeys()
		.success(function (keys) {
			keys.forEach(function (key) {
				all.append($('<li>').text(key));
			});
		});
}