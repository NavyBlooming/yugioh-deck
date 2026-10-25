art_crypto.py の `new_meta("test-pass", 1000)` で meta.json を作り、その鍵で sample.webp（Pillow で作った 16x16）を
`encrypt` して sample.bin にした。JS 側の復号テスト（tests/js/art.test.js）の見本。
